import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateClaim, evaluateMarkUse, evaluateOwnership, evaluateRelease } from '../core/policy.mjs';

const base = { stops:[], evidence:[{id:'ev_1',state:'current'}] };

test('release remains blocked when any documented gate is absent', () => {
  const result = evaluateRelease(base, { approvals:{ productQuality:true, compliance:true }, checks:{} });
  assert.equal(result.pass, false);
  assert.ok(result.missing.includes('specificationApproved'));
});

test('release passes only with every gate and required reviewers', () => {
  const checks = Object.fromEntries([
    'specificationApproved','supplierQualified','resaleRightConfirmed','claimEvidenceCurrent','inspectionPassed',
    'unitChecksComplete','complianceConfirmed','economicsConfirmed','brandedPackoutApproved','remedyCapacityFunded'
  ].map(key => [key,true]));
  const result = evaluateRelease(base, { checks, approvals:{ productQuality:true, compliance:true } });
  assert.equal(result.pass, true);
});

test('an open compliance stop blocks an otherwise passing release', () => {
  const checks = Object.fromEntries([
    'specificationApproved','supplierQualified','resaleRightConfirmed','claimEvidenceCurrent','inspectionPassed',
    'unitChecksComplete','complianceConfirmed','economicsConfirmed','brandedPackoutApproved','remedyCapacityFunded'
  ].map(key => [key,true]));
  const result = evaluateRelease({ ...base, stops:[{id:'stop_1',state:'open',scope:'entity',reason:'Licence missing'}] }, { checks, approvals:{ productQuality:true, compliance:true } });
  assert.equal(result.pass, false);
  assert.equal(result.stops[0].id, 'stop_1');
});

test('claim activation requires scoped current evidence and dual confirmation', () => {
  assert.equal(evaluateClaim(base, { productId:'product_1', evidenceIds:['ev_1'], expiryTrigger:'source change', approvals:{productQuality:true,compliance:true} }).pass, true);
  assert.equal(evaluateClaim(base, { productId:'product_1', evidenceIds:['ev_1'], approvals:{productQuality:true} }).pass, false);
});

test('FH-P12 mark use requires creator, quality and compliance', () => {
  const candidate = { productId:'product_1', evidenceIds:['ev_1'], expiryTrigger:'evidence change', approvals:{creator:true,productQuality:true,compliance:true} };
  assert.equal(evaluateMarkUse(base, candidate).pass, true);
  delete candidate.approvals.creator;
  assert.equal(evaluateMarkUse(base, candidate).pass, false);
});

test('FH-P10 blocks ownership below 51 percent', () => {
  assert.equal(evaluateOwnership({creatorPercent:51}).pass, true);
  assert.equal(evaluateOwnership({creatorPercent:50.99}).pass, false);
});
