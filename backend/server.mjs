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
  evaluatePromotion,
  evaluateRelease,
  permissionsFor,
  problem,
  requirePermission,
  unresolvedStops
} from './core/policy.mjs';
import {
  canReadCollection,
  canWriteCollection,
  collectionWritePermissions,
  departmentsFor,
  requireAnyPermission,
  visibleRecords
} from './core/access.mjs';

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
  ['FLAXX_MARKET_TOKEN','market-brand'],['FLAXX_COMMUNITY_TOKEN','community'],
  ['FLAXX_FULFILMENT_TOKEN','fulfilment'],['FLAXX_SYSTEMS_TOKEN','systems']
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
      tags: product.tags || [],
      media: data.productMedia.filter(item => item.productId === product.id && item.public && item.state === 'approved').map(item => ({ id:item.id, type:item.type, url:item.url, alt:item.alt, colour:item.colour || null })),
      skus: skus.map(sku => ({
        id: sku.id,
        variant: sku.variant,
        price: data.prices.find(price => price.skuId === sku.id && price.state === 'active') || null,
        inventoryAvailable: data.inventory.filter(item => item.skuId === sku.id && item.state === 'sellable').reduce((sum,item) => sum + Number(item.quantity || 0), 0),
        claims: data.claims.filter(claim => product.allowedClaimIds.includes(claim.id) && claim.state === 'active').map(claim => ({ wording:claim.wording, limitation:claim.limitation })),
        verification: data.releases.filter(release => release.skuId === sku.id && release.state === 'released').map(release => ({ id:release.id, batchId:release.batchId, grade:release.grade || null, releasedAt:release.releasedAt || release.createdAt }))
      }))
    };
  }).filter(product => product.skus.some(sku => sku.inventoryAvailable > 0));
}

const coreModules = [
  {id:'catalogue',name:'Products & catalogue',description:'Products, variants, specifications, media, care, prices and lifecycle.',permissions:['catalogue:read']},
  {id:'source',name:'Source & relationships',description:'Suppliers, rights, contracts, obligations, conflicts and exit.',permissions:['source:read']},
  {id:'quality',name:'Evidence & release',description:'Samples, claims, batches, inspections, quarantine and governed release.',permissions:['quality:read','evidence:read','release:read']},
  {id:'inventory',name:'Inventory & fulfilment',description:'Custody, units, batch traceability, branded packout, shipment and returns.',permissions:['inventory:read','fulfilment:read']},
  {id:'content',name:'Garden content',description:'Pages, navigation, product media, approved wording and content expiry.',permissions:['content:read']},
  {id:'campaigns',name:'Market & demand',description:'Campaigns, approved offers, acquisition limits and actual-demand signals.',permissions:['campaign:read','demand:read']},
  {id:'community',name:'Flaxx Garden community',description:'Waitlist, membership, participation, community offers and relevant payment status.',permissions:['community:read']},
  {id:'customers',name:'Customers & consent',description:'Purpose-limited identity, consent, preferences, access and deletion.',permissions:['customer:read']},
  {id:'orders',name:'Orders & service',description:'Cart, order, payment status, fulfilment, questions, mismatch and remedy.',permissions:['order:read','case:read']},
  {id:'finance',name:'Finance & River',description:'Accounts, obligations, reserves, economics and four-head allocation.',permissions:['finance:read']},
  {id:'people',name:'People & access',description:'Person-forms, appointments, departments, permissions, handover and exit.',permissions:['people:read','access:read']},
  {id:'work',name:'Work & follow-up',description:'Tasks, ownership, dependencies, updates, notifications and review.',permissions:['task:read']},
  {id:'chat',name:'Team communication',description:'Department and cross-functional channels with retained accountability.',permissions:['chat:read']},
  {id:'decisions',name:'Decisions & signals',description:'Authority, stops, thresholds, exceptions and response.',permissions:['decision:read','signal:read']},
  {id:'systems',name:'Systems & recovery',description:'Integrations, access, audit, backups, incidents and recovery evidence.',permissions:['system:read','audit:read']}
];

function actorContext(actor, data) {
  const permissions = permissionsFor(actor, data);
  const departments = departmentsFor(actor, data);
  return {
    actor,
    roles:data.roles.filter(role => actor.roleIds.includes(role.id)).map(({id,name}) => ({id,name})),
    departments:data.departments.filter(department => departments.has(department.id)),
    modules:coreModules.filter(module => module.permissions.some(permission => permissions.has(permission) || permissions.has('*'))),
    permissions:[...permissions].sort()
  };
}

function dashboardFor(actor, data) {
  const context = actorContext(actor, data);
  const can = name => canReadCollection(actor, data, name);
  const read = name => can(name) ? visibleRecords(actor, data, name) : [];
  const tasks = read('tasks').filter(task => !['done','cancelled'].includes(task.state));
  const channels = read('channels');
  const metrics = [];
  if (can('inventory')) metrics.push({id:'sellable',label:'Sellable units',value:read('inventory').filter(item => item.state === 'sellable').reduce((sum,item) => sum + Number(item.quantity || 0),0)});
  if (can('orders')) metrics.push({id:'open-orders',label:'Open orders',value:read('orders').filter(item => !['completed','cancelled','refunded'].includes(item.state)).length});
  if (can('cases')) metrics.push({id:'open-cases',label:'Open cases',value:read('cases').filter(item => item.state !== 'closed').length});
  if (can('communityMemberships')) metrics.push({id:'community-members',label:'Community members',value:read('communityMemberships').filter(item => item.state === 'active').length});
  if (can('campaigns')) metrics.push({id:'active-campaigns',label:'Active campaigns',value:read('campaigns').filter(item => item.state === 'active').length});
  if (can('payments')) metrics.push({id:'unreconciled-payments',label:'Payments to reconcile',value:read('payments').filter(item => item.state === 'received' && !item.reconciledAt).length});
  metrics.push({id:'my-work',label:'Open work',value:tasks.length});
  return { ...context, entity:data.meta, gates:data.gates, metrics, tasks:tasks.slice(0,12), channels };
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

  if (request.method === 'GET' && url.pathname === '/api/core/context') {
    return send(response, 200, actorContext(actor, data));
  }

  if (request.method === 'GET' && url.pathname === '/api/core/dashboard') {
    return send(response, 200, dashboardFor(actor, data));
  }

  if (request.method === 'GET' && ['/api/office/summary','/api/core/summary'].includes(url.pathname)) {
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

  const collectionMatch = url.pathname.match(/^\/api\/(?:office|core)\/records\/([a-zA-Z]+)$/);
  if (collectionMatch && request.method === 'GET') {
    const name = collectionMatch[1];
    if (!collections.has(name)) throw problem(404, 'unknown_collection', 'Unknown governed record collection.');
    return send(response, 200, { records:visibleRecords(actor, data, name) });
  }
  if (collectionMatch && request.method === 'POST') {
    const name = collectionMatch[1];
    if (!collections.has(name)) throw problem(404, 'unknown_collection', 'Unknown governed record collection.');
    if (!canWriteCollection(actor, data, name)) requireAnyPermission(actor, data, collectionWritePermissions[name] || []);
    const input = await body(request);
    const record = { ...input, id:input.id || makeId(name.slice(0,-1) || 'record'), state:input.state || 'draft', createdAt:new Date().toISOString(), createdBy:actor.id, approvals:{} };
    const result = await store.mutate(actor, `${name}:create`, record.id, current => { current[name].push(record); return { record }; });
    return send(response, 201, result);
  }

  const taskStateMatch = url.pathname.match(/^\/api\/core\/tasks\/([^/]+)\/state$/);
  if (taskStateMatch && request.method === 'POST') {
    requirePermission(actor, data, 'task:write');
    const input = await body(request);
    if (!['not-started','in-progress','blocked','review','done','cancelled'].includes(input.state)) throw problem(400, 'invalid_task_state', 'Task state is not valid.');
    const readableTask = visibleRecords(actor, data, 'tasks').find(item => item.id === taskStateMatch[1]);
    if (!readableTask) throw problem(404, 'record_not_found', 'Task not found in this role scope.');
    const result = await store.mutate(actor, 'task:state', taskStateMatch[1], current => {
      const task = current.tasks.find(item => item.id === taskStateMatch[1]);
      task.state = input.state;
      task.updatedAt = new Date().toISOString();
      current.taskUpdates.push({ id:makeId('taskUpdate'), taskId:task.id, state:input.state, note:input.note || '', createdAt:task.updatedAt, createdBy:actor.id, visibility:task.visibility || {} });
      return { task };
    });
    return send(response, 200, result);
  }

  const channelMessagesMatch = url.pathname.match(/^\/api\/core\/channels\/([^/]+)\/messages$/);
  if (channelMessagesMatch && request.method === 'GET') {
    requirePermission(actor, data, 'chat:read');
    const channel = visibleRecords(actor, data, 'channels').find(item => item.id === channelMessagesMatch[1]);
    if (!channel) throw problem(404, 'channel_not_found', 'Channel not found in this role scope.');
    const messages = visibleRecords(actor, data, 'messages').filter(item => item.channelId === channel.id);
    return send(response, 200, { channel, messages });
  }
  if (channelMessagesMatch && request.method === 'POST') {
    requirePermission(actor, data, 'chat:write');
    const channel = visibleRecords(actor, data, 'channels').find(item => item.id === channelMessagesMatch[1]);
    if (!channel) throw problem(404, 'channel_not_found', 'Channel not found in this role scope.');
    const input = await body(request);
    if (!String(input.text || '').trim()) throw problem(400, 'message_required', 'Message text is required.');
    const message = { id:makeId('message'), channelId:channel.id, text:String(input.text).trim(), createdAt:new Date().toISOString(), createdBy:actor.id, visibility:channel.visibility || {} };
    const result = await store.mutate(actor, 'message:create', message.id, current => { current.messages.push(message); return { message }; });
    return send(response, 201, result);
  }

  const approvalMatch = url.pathname.match(/^\/api\/(?:office|core)\/(releases|claims|markUses|decisions|promotions)\/([^/]+)\/approval$/);
  if (approvalMatch && request.method === 'POST') {
    const [,name,id] = approvalMatch;
    const input = await body(request);
    const allowed = {
      releases:{productQuality:'release:confirm',compliance:'claim:compliance',qualifiedSecondReviewer:'release:confirm'},
      claims:{productQuality:'claim:technical',compliance:'claim:compliance'},
      markUses:{creator:'mark:approve',productQuality:'mark:quality',compliance:'mark:compliance'},
      decisions:{creator:'reserved:decide'},
      promotions:{managingSteward:'promotion:approve'}
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

  const evaluateMatch = url.pathname.match(/^\/api\/(?:office|core)\/(releases|claims|markUses)\/([^/]+)\/evaluate$/);
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

  const promotionEvaluate = url.pathname.match(/^\/api\/core\/promotions\/([^/]+)\/evaluate$/);
  if (promotionEvaluate && request.method === 'POST') {
    requirePermission(actor, data, 'promotion:approve');
    const result = await store.mutate(actor, 'promotions:evaluate', promotionEvaluate[1], current => {
      const record = current.promotions.find(item => item.id === promotionEvaluate[1]);
      if (!record) throw problem(404, 'record_not_found', 'Promotion not found.');
      const check = evaluatePromotion(record);
      record.lastEvaluation = { ...check, at:new Date().toISOString() };
      record.state = check.pass ? 'approved' : 'blocked';
      return { record, check, auditResult:check.pass ? 'passed' : 'blocked' };
    });
    return send(response, 200, result);
  }

  if (request.method === 'POST' && ['/api/office/ownership/evaluate','/api/core/ownership/evaluate'].includes(url.pathname)) {
    requirePermission(actor, data, 'reserved:decide');
    return send(response, 200, evaluateOwnership(await body(request)));
  }

  const stopResolve = url.pathname.match(/^\/api\/(?:office|core)\/stops\/([^/]+)\/resolve$/);
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

  if (request.method === 'GET' && ['/api/office/audit','/api/core/audit'].includes(url.pathname)) {
    requirePermission(actor, data, 'audit:read');
    return send(response, 200, { events:data.audit });
  }
  throw problem(404, 'not_found', 'No governed route matches this request.');
}

async function staticFile(request, response, url) {
  if (!['GET','HEAD'].includes(request.method)) throw problem(405, 'method_not_allowed', 'Method not allowed.');
  if (url.pathname === '/office' || url.pathname === '/office/') {
    response.writeHead(302, { location:'/core/', 'cache-control':'no-store' });
    return response.end();
  }
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
