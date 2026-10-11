import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { canReadCollection, canWriteCollection, visibleRecords } from '../core/access.mjs';

const data = JSON.parse(await readFile(new URL('../data/seed.json', import.meta.url), 'utf8'));
const actor = roleId => ({ id:`test:${roleId}`, roleIds:[roleId] });

test('finance can use financial records without receiving marketing write authority', () => {
  assert.equal(canReadCollection(actor('finance'), data, 'transactions'), true);
  assert.equal(canWriteCollection(actor('finance'), data, 'transactions'), true);
  assert.equal(canWriteCollection(actor('finance'), data, 'campaigns'), false);
});

test('community sees community payment status but not entity accounts', () => {
  assert.equal(canReadCollection(actor('community'), data, 'communityMemberships'), true);
  assert.equal(canReadCollection(actor('community'), data, 'transactions'), false);
  assert.equal(canReadCollection(actor('community'), data, 'accountEntries'), false);
});

test('Market and Brand can create demand but cannot release a product or set a price', () => {
  assert.equal(canWriteCollection(actor('market-brand'), data, 'campaigns'), true);
  assert.equal(canWriteCollection(actor('market-brand'), data, 'demandSignals'), true);
  assert.equal(canWriteCollection(actor('market-brand'), data, 'releases'), false);
  assert.equal(canWriteCollection(actor('market-brand'), data, 'prices'), false);
});

test('department-scoped work is invisible outside the responsible roles', () => {
  const communityTasks = visibleRecords(actor('community'), data, 'tasks');
  const operatorTasks = visibleRecords(actor('managing-steward'), data, 'tasks');
  assert.equal(communityTasks.length, 0);
  assert.ok(operatorTasks.some(item => item.id === 'task-supplier-quotes'));
});

test('systems can operate infrastructure without reading customer or finance records', () => {
  assert.equal(canReadCollection(actor('systems'), data, 'integrations'), true);
  assert.equal(canReadCollection(actor('systems'), data, 'customers'), false);
  assert.equal(canReadCollection(actor('systems'), data, 'payments'), false);
});
