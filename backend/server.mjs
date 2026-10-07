import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JsonStore, makeId } from './core/store.mjs';
import {
  collections,
  evaluateClaim,
  evaluateMarkUse,
  evaluateOwnership,
  evaluateRelease,
  permissionsFor,
  problem,
  requirePermission,
  unresolvedStops
} from './core/policy.mjs';

const backendRoot = fileURLToPath(new URL('.', import.meta.url));
const projectRoot = normalize(join(backendRoot, '..'));
const publicRoot = join(projectRoot, 'dist');
const store = new JsonStore(
  process.env.FLAXX_DATA_PATH || join(backendRoot, 'runtime', 'store.json'),
  join(backendRoot, 'data', 'seed.json')
);
await store.init();

const port = Number(process.env.PORT || 4174);
const maxBodyBytes = 1_000_000;
const mime = {
  '.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8',
  '.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg',
  '.jpeg':'image/jpeg','.ttf':'font/ttf','.woff2':'font/woff2'
};

const tokenRoles = [
  ['FLAXX_CREATOR_TOKEN','creator'],['FLAXX_STEWARD_TOKEN','managing-steward'],
  ['FLAXX_QUALITY_TOKEN','product-quality'],['FLAXX_COMPLIANCE_TOKEN','compliance'],
  ['FLAXX_FINANCE_TOKEN','finance'],['FLAXX_CUSTOMER_OPS_TOKEN','customer-operations'],
  ['FLAXX_SYSTEMS_TOKEN','systems']
];

function authenticate(request) {
  const token = (request.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const matched = tokenRoles.find(([key]) => process.env[key] && process.env[key] === token);
  if (matched) return { id:`token:${matched[1]}`, name:matched[1], roleIds:[matched[1]] };
  if (process.env.FLAXX_DEV_MODE === '1') {
    const role = request.headers['x-flaxx-role'];
    if (typeof role === 'string') return { id:`development:${role}`, name:`Development ${role}`, roleIds:[role] };
  }
  throw problem(401, 'authentication_required', 'An entity-controlled operator credential is required.');
}

function requireAnyPermission(actor, data, required) {
  const permissions = permissionsFor(actor, data);
  if (!required.some(permission => permissions.has(permission))) throw problem(403, 'permission_denied', `One of these permissions is required: ${required.join(', ')}.`);
}

async function body(request) {
  let raw = '';
  for await (const chunk of request) {
    raw += chunk;
    if (Buffer.byteLength(raw) > maxBodyBytes) throw problem(413, 'body_too_large', 'Request body exceeds the prototype limit.');
  }
  if (!raw) return {};
  try { return JSON.parse(raw); }
  catch { throw problem(400, 'invalid_json', 'Request body must be valid JSON.'); }
}

function send(response, status, payload, headers = {}) {
  response.writeHead(status, { 'content-type':'application/json; charset=utf-8', 'cache-control':'no-store', ...headers });
  response.end(`${JSON.stringify(payload)}\n`);
}

function publicProducts(data) {
  if (!data.meta.commerceEnabled) return [];
  return data.products.filter(product => product.public && product.state === 'released').map(product => {
    const skus = data.skus.filter(sku => product.currentSkuIds.includes(sku.id) && sku.state === 'released');
    return {
      id: product.id,
      name: product.name,
      limitations: product.limitations,
      skus: skus.map(sku => ({
        id: sku.id,
        variant: sku.variant,
        price: sku.price,
        inventoryAvailable: data.inventory.filter(item => item.skuId === sku.id && item.state === 'sellable').reduce((sum,item) => sum + Number(item.quantity || 0), 0),
        claims: data.claims.filter(claim => product.allowedClaimIds.includes(claim.id) && claim.state === 'active').map(claim => ({ wording:claim.wording, limitation:claim.limitation }))
      }))
    };
  }).filter(product => product.skus.some(sku => sku.inventoryAvailable > 0));
}

async function api(request, response, url) {
  if (request.method === 'GET' && url.pathname === '/api/health') {
    const data = await store.read();
    return send(response, 200, { ok:true, environment:data.meta.environment, schemaVersion:data.meta.schemaVersion, commerceEnabled:data.meta.commerceEnabled });
  }
  if (request.method === 'GET' && url.pathname === '/api/public/products') {
    return send(response, 200, { products: publicProducts(await store.read()) });
  }
  if (request.method === 'POST' && url.pathname === '/api/public/orders') {
    const data = await store.read();
    if (!data.meta.commerceEnabled) throw problem(409, 'commerce_blocked', data.meta.reasonCommerceBlocked);
    throw problem(501, 'payment_not_connected', 'Order creation remains blocked until Stripe, tax, fulfilment, consent, and remedy integrations pass Formation.');
  }

  const actor = authenticate(request);
  const data = await store.read();
  requirePermission(actor, data, 'office:read');

  if (request.method === 'GET' && url.pathname === '/api/office/summary') {
    const openStops = unresolvedStops(data);
    const quarantined = data.inventory.filter(item => item.state === 'quarantined').reduce((sum,item) => sum + Number(item.quantity || 0), 0);
    return send(response, 200, {
      entity:data.meta,
      gates:data.gates,
      counts:{products:data.products.length,skus:data.skus.length,batches:data.batches.length,evidence:data.evidence.length,openStops:openStops.length,openCases:data.cases.filter(item=>item.state!=='closed').length,quarantined},
      openStops,
      currentPrinciples:data.principles
    });
  }

  const collectionMatch = url.pathname.match(/^\/api\/office\/records\/([a-zA-Z]+)$/);
  if (collectionMatch && request.method === 'GET') {
    const name = collectionMatch[1];
    if (!collections.has(name)) throw problem(404, 'unknown_collection', 'Unknown governed record collection.');
    return send(response, 200, { records:data[name] });
  }
  if (collectionMatch && request.method === 'POST') {
    const name = collectionMatch[1];
    if (!collections.has(name)) throw problem(404, 'unknown_collection', 'Unknown governed record collection.');
    const specialized = {
      evidence:['evidence:write'], inspections:['inspection:write'], releases:['release:propose','release:confirm'],
      claims:['claim:technical'], stops:['compliance:stop'], cases:['case:write'], remedies:['remedy:execute'],
      transactions:['finance:write'], accountEntries:['finance:write'], riverAllocations:['finance:write'],
      decisions:['decision:propose','reserved:decide']
    };
    requireAnyPermission(actor, data, ['office:write', ...(specialized[name] || [])]);
    const input = await body(request);
    const record = { ...input, id:input.id || makeId(name.slice(0,-1) || 'record'), state:input.state || 'draft', createdAt:new Date().toISOString(), createdBy:actor.id, approvals:{} };
    const result = await store.mutate(actor, `${name}:create`, record.id, current => { current[name].push(record); return { record }; });
    return send(response, 201, result);
  }

  const approvalMatch = url.pathname.match(/^\/api\/office\/(releases|claims|markUses|decisions)\/([^/]+)\/approval$/);
  if (approvalMatch && request.method === 'POST') {
    const [,name,id] = approvalMatch;
    const input = await body(request);
    const allowed = {
      releases:{productQuality:'release:confirm',compliance:'claim:compliance',qualifiedSecondReviewer:'release:confirm'},
      claims:{productQuality:'claim:technical',compliance:'claim:compliance'},
      markUses:{creator:'mark:approve',productQuality:'mark:quality',compliance:'mark:compliance'},
      decisions:{creator:'reserved:decide'}
    };
    const permission = allowed[name]?.[input.kind];
    if (!permission) throw problem(400, 'invalid_approval_kind', 'Approval type is not valid for this record.');
    requirePermission(actor, data, permission);
    const result = await store.mutate(actor, `${name}:approve:${input.kind}`, id, current => {
      const record = current[name].find(item => item.id === id);
      if (!record) throw problem(404, 'record_not_found', 'Governed record not found.');
      record.approvals ||= {};
      record.approvals[input.kind] = { actorId:actor.id, at:new Date().toISOString(), note:input.note || '' };
      return { record };
    });
    return send(response, 200, result);
  }

  const evaluateMatch = url.pathname.match(/^\/api\/office\/(releases|claims|markUses)\/([^/]+)\/evaluate$/);
  if (evaluateMatch && request.method === 'POST') {
    const [,name,id] = evaluateMatch;
    const result = await store.mutate(actor, `${name}:evaluate`, id, current => {
      const record = current[name].find(item => item.id === id);
      if (!record) throw problem(404, 'record_not_found', 'Governed record not found.');
      const check = name === 'releases' ? evaluateRelease(current, record) : name === 'claims' ? evaluateClaim(current, record) : evaluateMarkUse(current, record);
      record.lastEvaluation = { ...check, at:new Date().toISOString() };
      record.state = check.pass ? (name === 'releases' ? 'released' : 'active') : 'blocked';
      if (name === 'releases' && check.pass) {
        current.inventory.filter(item => item.batchId === record.batchId && item.state === 'quarantined').forEach(item => { item.state = 'sellable'; item.releaseId = record.id; });
      }
      return { record, check, auditResult:check.pass ? 'passed' : 'blocked' };
    });
    return send(response, 200, result);
  }

  if (request.method === 'POST' && url.pathname === '/api/office/ownership/evaluate') {
    requirePermission(actor, data, 'reserved:decide');
    return send(response, 200, evaluateOwnership(await body(request)));
  }

  const stopResolve = url.pathname.match(/^\/api\/office\/stops\/([^/]+)\/resolve$/);
  if (stopResolve && request.method === 'POST') {
    requirePermission(actor, data, 'compliance:resolve');
    const input = await body(request);
    if (!input.resolutionEvidenceId) throw problem(400, 'resolution_evidence_required', 'A stop is lifted only by evidence that its triggering condition is resolved.');
    const result = await store.mutate(actor, 'stop:resolve', stopResolve[1], current => {
      const stop = current.stops.find(item => item.id === stopResolve[1]);
      if (!stop) throw problem(404, 'record_not_found', 'Stop record not found.');
      stop.state = 'resolved'; stop.resolutionEvidenceId = input.resolutionEvidenceId; stop.resolvedAt = new Date().toISOString(); stop.resolvedBy = actor.id;
      return { stop };
    });
    return send(response, 200, result);
  }

  if (request.method === 'GET' && url.pathname === '/api/office/audit') {
    requirePermission(actor, data, 'audit:read');
    return send(response, 200, { events:data.audit });
  }
  throw problem(404, 'not_found', 'No governed route matches this request.');
}

async function staticFile(request, response, url) {
  if (!['GET','HEAD'].includes(request.method)) throw problem(405, 'method_not_allowed', 'Method not allowed.');
  const requested = url.pathname === '/' ? '/index.html' : url.pathname;
  const candidate = normalize(join(publicRoot, decodeURIComponent(requested)));
  if (!candidate.startsWith(publicRoot)) throw problem(403, 'path_denied', 'Path is outside the public application.');
  let path = candidate;
  try { if ((await stat(path)).isDirectory()) path = join(path, 'index.html'); }
  catch { throw problem(404, 'not_found', 'File not found.'); }
  const bytes = await readFile(path);
  response.writeHead(200, { 'content-type':mime[extname(path)] || 'application/octet-stream', 'x-content-type-options':'nosniff' });
  if (request.method === 'HEAD') return response.end();
  response.end(bytes);
}

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
    if (url.pathname.startsWith('/api/')) await api(request, response, url);
    else await staticFile(request, response, url);
  } catch (error) {
    send(response, error.status || 500, { error:error.code || 'internal_error', message:error.status ? error.message : 'The governed service encountered an unexpected error.', details:error.details || {} });
  }
});

server.listen(port, () => {
  console.log(`Flaxx governed Garden available at http://127.0.0.1:${port}`);
});
