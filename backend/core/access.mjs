import { permissionsFor, problem } from './policy.mjs';

export const collectionReadPermissions = {
  departments:['people:read'], teams:['people:read'], appointments:['people:read'], accessGrants:['access:read'], dashboards:['core:read'],
  products:['catalogue:read'], skus:['catalogue:read'], specifications:['catalogue:read'], prices:['pricing:read'], productMedia:['catalogue:read'], merchandisingCollections:['catalogue:read'], fitProfiles:['customer:read'], fitRecommendations:['catalogue:read'],
  suppliers:['source:read'], relationships:['source:read'], contracts:['contract:read'], evidence:['evidence:read'], claims:['claim:read'], samples:['quality:read'],
  batches:['batch:read'], inspections:['quality:read'], releases:['release:read'], inventory:['inventory:read'], packEvents:['fulfilment:read'],
  content:['content:read'], pages:['content:read'], navigation:['content:read'], markUses:['mark:read'], promotions:['promotion:read'],
  campaigns:['campaign:read'], demandSignals:['demand:read'], customers:['customer:read'], consents:['consent:read'], favourites:['customer:read'],
  carts:['order:read'], waitlists:['community:read'], communityMemberships:['community:read'], reviews:['review:read'], orders:['order:read'],
  payments:['payment:read'], refunds:['refund:read'], shipments:['fulfilment:read'], cases:['case:read'], remedies:['remedy:read'],
  transactions:['finance:read'], accountEntries:['finance:read'], riverAllocations:['finance:read'], decisions:['decision:read'], stops:['stop:read'],
  incidents:['incident:read'], correctiveActions:['incident:read'], documents:['document:read'], tasks:['task:read'], taskUpdates:['task:read'],
  channels:['chat:read'], channelMembers:['chat:read'], messages:['chat:read'], notifications:['notification:read'], integrations:['system:read'],
  gates:['gate:read'], signals:['signal:read']
};

export const collectionWritePermissions = {
  products:['catalogue:write'], skus:['catalogue:write'], specifications:['catalogue:write'], prices:['pricing:write'], productMedia:['catalogue:write'], merchandisingCollections:['catalogue:write'], fitProfiles:['customer:write'], fitRecommendations:['catalogue:write'],
  suppliers:['source:write'], relationships:['source:write'], contracts:['contract:write'], evidence:['evidence:write'], claims:['claim:technical'],
  samples:['quality:write'], batches:['batch:write'], inspections:['inspection:write'], releases:['release:propose','release:confirm'],
  inventory:['inventory:write'], packEvents:['fulfilment:write'], content:['content:write'], pages:['content:write'], navigation:['content:write'],
  markUses:['mark:quality','mark:compliance'], promotions:['promotion:propose'], campaigns:['campaign:write'], demandSignals:['demand:write'],
  customers:['customer:write'], consents:['consent:write'], favourites:['customer:write'], carts:['order:write'], waitlists:['community:write'],
  communityMemberships:['community:write'], reviews:['review:moderate'], orders:['order:write'], payments:['payment:write'], refunds:['refund:write'],
  shipments:['fulfilment:write'], cases:['case:write'], remedies:['remedy:execute'], transactions:['finance:write'], accountEntries:['finance:write'],
  riverAllocations:['finance:write'], decisions:['decision:propose','reserved:decide'], stops:['compliance:stop'], incidents:['incident:write'],
  correctiveActions:['incident:write'], documents:['document:write'], tasks:['task:write'], taskUpdates:['task:write'], channels:['chat:write'],
  channelMembers:['chat:admin'], messages:['chat:write'], notifications:['notification:write'], integrations:['system:operate'], gates:['gate:write'],
  signals:['signal:write'], departments:['people:write'], teams:['people:write'], appointments:['people:write'], accessGrants:['access:admin'], dashboards:['system:operate']
};

export function departmentsFor(actor, data) {
  const roleDepartments = data.roles.filter(role => actor.roleIds.includes(role.id)).flatMap(role => role.departmentIds || []);
  return new Set([...(actor.departmentIds || []), ...roleDepartments]);
}

export function requireAnyPermission(actor, data, required) {
  const permissions = permissionsFor(actor, data);
  if (!permissions.has('*') && !required.some(permission => permissions.has(permission))) {
    throw problem(403, 'permission_denied', `One of these permissions is required: ${required.join(', ')}.`);
  }
}

export function canReadCollection(actor, data, name) {
  const permissions = permissionsFor(actor, data);
  const required = collectionReadPermissions[name] || [];
  return permissions.has('*') || required.some(permission => permissions.has(permission));
}

export function canWriteCollection(actor, data, name) {
  const permissions = permissionsFor(actor, data);
  const required = collectionWritePermissions[name] || [];
  return permissions.has('*') || required.some(permission => permissions.has(permission));
}

export function visibleRecords(actor, data, name) {
  if (!canReadCollection(actor, data, name)) throw problem(403, 'collection_denied', `This role cannot read ${name}.`);
  const permissions = permissionsFor(actor, data);
  if (permissions.has('*') || permissions.has('scope:entity')) return data[name];
  const departments = departmentsFor(actor, data);
  return data[name].filter(record => {
    const visibility = record.visibility || {};
    if (visibility.entityWide === true) return true;
    if ((visibility.roleIds || []).some(roleId => actor.roleIds.includes(roleId))) return true;
    if ((visibility.departmentIds || []).some(departmentId => departments.has(departmentId))) return true;
    if (record.departmentId && departments.has(record.departmentId)) return true;
    if ((record.departmentIds || []).some(departmentId => departments.has(departmentId))) return true;
    if ((record.assignedRoleIds || []).some(roleId => actor.roleIds.includes(roleId))) return true;
    if (record.createdBy === actor.id || record.ownerActorId === actor.id || record.assigneeActorId === actor.id) return true;
    return !record.visibility && !record.departmentId && !record.departmentIds && !record.assignedRoleIds;
  });
}
