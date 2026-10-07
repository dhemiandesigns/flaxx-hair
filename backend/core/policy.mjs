const releaseRequirements = [
  'specificationApproved',
  'supplierQualified',
  'resaleRightConfirmed',
  'claimEvidenceCurrent',
  'inspectionPassed',
  'unitChecksComplete',
  'complianceConfirmed',
  'economicsConfirmed',
  'brandedPackoutApproved',
  'remedyCapacityFunded'
];

export const collections = new Set([
  'products','skus','specifications','suppliers','relationships','contracts','evidence','claims','samples','batches',
  'inspections','releases','inventory','content','markUses','customers','consents','orders','shipments','cases',
  'remedies','transactions','accountEntries','riverAllocations','decisions','stops','incidents','correctiveActions',
  'documents','tasks','gates','signals'
]);

export function permissionsFor(actor, data) {
  const roles = data.roles.filter(role => actor.roleIds.includes(role.id));
  return new Set(roles.flatMap(role => role.permissions));
}

export function requirePermission(actor, data, permission) {
  const permissions = permissionsFor(actor, data);
  if (!permissions.has(permission)) throw problem(403, 'permission_denied', `The ${permission} permission is required.`);
}

export function unresolvedStops(data, scopeIds = []) {
  return data.stops.filter(stop => stop.state !== 'resolved' && (stop.scope === 'entity' || scopeIds.includes(stop.scopeId)));
}

export function evaluateRelease(data, candidate) {
  const missing = releaseRequirements.filter(key => candidate.checks?.[key] !== true);
  const stops = unresolvedStops(data, [candidate.productId, candidate.skuId, candidate.batchId]);
  const approvals = candidate.approvals || {};
  if (!approvals.productQuality) missing.push('productQualityConfirmation');
  if (!approvals.compliance) missing.push('complianceConfirmation');
  if (candidate.conflictOfInterest && !approvals.qualifiedSecondReviewer) missing.push('qualifiedSecondReviewer');
  return {
    pass: missing.length === 0 && stops.length === 0,
    missing: [...new Set(missing)],
    stops: stops.map(stop => ({ id: stop.id, reason: stop.reason }))
  };
}

export function evaluateClaim(data, candidate) {
  const evidence = data.evidence.filter(item => candidate.evidenceIds?.includes(item.id));
  const missing = [];
  if (!candidate.productId && !candidate.batchId) missing.push('productOrBatchScope');
  if (!evidence.length) missing.push('linkedEvidence');
  if (evidence.some(item => item.state !== 'current')) missing.push('currentEvidenceOnly');
  if (!candidate.approvals?.productQuality) missing.push('productQualityConfirmation');
  if (!candidate.approvals?.compliance) missing.push('complianceConfirmation');
  if (!candidate.expiryTrigger) missing.push('expiryTrigger');
  return { pass: missing.length === 0, missing: [...new Set(missing)] };
}

export function evaluateMarkUse(data, candidate) {
  const claimCheck = evaluateClaim(data, candidate);
  const missing = [...claimCheck.missing];
  if (!candidate.approvals?.creator) missing.push('creatorConfirmation');
  if (!candidate.approvals?.productQuality) missing.push('productQualityConfirmation');
  if (!candidate.approvals?.compliance) missing.push('complianceConfirmation');
  return { pass: missing.length === 0, missing: [...new Set(missing)] };
}

export function evaluateOwnership(candidate) {
  const creatorPercent = Number(candidate.creatorPercent);
  return {
    pass: Number.isFinite(creatorPercent) && creatorPercent >= 51,
    missing: Number.isFinite(creatorPercent) && creatorPercent >= 51 ? [] : ['creatorOwnershipAtLeast51Percent']
  };
}

export function problem(status, code, message, details = {}) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  error.details = details;
  return error;
}
