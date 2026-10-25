import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createQl189SyntheticOperationsHarness, QL189_VERSION, QL189_RATE_WINDOW_MS,
  QL189_COST_WINDOW_MS, QL189_MAX_AUDIT_ROWS
} from '../ql189-operations-safety-harness.mjs';

const op = (operationId, now = 0, estimatedCents = 100, brandId = 'rosiedazzlers', role = 'admin') =>
  ({ brandId, operatorBrand: brandId, role, operationId: `mock-${operationId}`, now, estimatedCents });
const incident = (action, now = 0, brandId = 'rosiedazzlers', role = 'owner') =>
  ({ brandId, operatorBrand: brandId, role, action, reasonCode: 'MOCK_DRILL', now });
const telemetry = (brandId = 'rosiedazzlers', role = 'staff_readonly') =>
  ({ brandId, operatorBrand: brandId, role });

test('a mock acceptance never implies a real call, charge, write, identity, provider or pilot', () => {
  const h = createQl189SyntheticOperationsHarness();
  assert.deepEqual(h.evaluateMockOperation(op('one')), {
    version: QL189_VERSION, disposition: 'WOULD_PASS_MOCK', brandId: 'rosiedazzlers',
    detail: 'In-memory safety drill passed; no dispatch or charge.', syntheticOnly: true,
    operationalEnforcementInstalled: false, realRateLimiterInstalled: false,
    actualProviderSpendCents: 0, realIncidentStopInstalled: false,
    livePilotAuthorized: false, heldPrerequisites: 12, networkListeners: 0,
    externalWrites: 0, supabaseWrites: 0, messagesSent: 0, callsPlaced: 0, ownerApprovals: 0
  });
});

test('minute quota is exactly three and resets at boundary; blocked item never dispatches', () => {
  const h = createQl189SyntheticOperationsHarness();
  for (let i = 0; i < 3; i++) assert.equal(h.evaluateMockOperation(op(`r${i}`, i, 100)).disposition, 'WOULD_PASS_MOCK');
  assert.equal(h.evaluateMockOperation(op('r3', 3, 100)).disposition, 'RATE_BLOCKED');
  assert.equal(h.evaluateMockOperation(op('r3', QL189_RATE_WINDOW_MS, 100)).disposition, 'WOULD_PASS_MOCK');
});

test('per-message projected cost ceiling blocks an oversized invented estimate', () => {
  const h = createQl189SyntheticOperationsHarness();
  assert.equal(h.evaluateMockOperation(op('large', 0, 251)).disposition, 'COST_BLOCKED');
  assert.equal(h.evaluateMockOperation(op('large', 1, 250)).disposition, 'WOULD_PASS_MOCK');
});

test('rolling 24h synthetic budget blocks overrun then expires exact oldest boundary', () => {
  const h = createQl189SyntheticOperationsHarness();
  assert.equal(h.evaluateMockOperation(op('a', 0, 250)).disposition, 'WOULD_PASS_MOCK');
  assert.equal(h.evaluateMockOperation(op('b', 1, 250)).disposition, 'WOULD_PASS_MOCK');
  assert.equal(h.evaluateMockOperation(op('c', 2, 1)).disposition, 'COST_BLOCKED');
  assert.equal(h.evaluateMockOperation(op('c', QL189_COST_WINDOW_MS, 1)).disposition, 'WOULD_PASS_MOCK');
});

test('rate denial cannot consume a projected charge or an idempotency slot', () => {
  const h = createQl189SyntheticOperationsHarness();
  for (let i = 0; i < 3; i++) h.evaluateMockOperation(op(`a${i}`, i, 1));
  assert.equal(h.evaluateMockOperation(op('later', 3, 10)).disposition, 'RATE_BLOCKED');
  assert.equal(h.evaluateMockOperation(op('later', 60_000, 10)).disposition, 'WOULD_PASS_MOCK');
  assert.equal(h.readMockTelemetry(telemetry()).projectedRollingCents, 13);
});

test('duplicate accepted mock ID cannot reserve again even with changed estimate', () => {
  const h = createQl189SyntheticOperationsHarness();
  assert.equal(h.evaluateMockOperation(op('same', 0, 200)).disposition, 'WOULD_PASS_MOCK');
  assert.equal(h.evaluateMockOperation(op('same', 1, 1)).disposition, 'DENIED_DUPLICATE');
  assert.equal(h.readMockTelemetry(telemetry()).projectedRollingCents, 200);
});

test('a brand has isolated rates, budgets and dedupe IDs', () => {
  const h = createQl189SyntheticOperationsHarness();
  for (let i = 0; i < 3; i++) h.evaluateMockOperation(op(`shared-${i}`, i, 100));
  assert.equal(h.evaluateMockOperation(op('next', 3)).disposition, 'RATE_BLOCKED');
  assert.equal(h.evaluateMockOperation(op('shared-0', 3, 100, 'devilndove')).disposition, 'WOULD_PASS_MOCK');
  assert.equal(h.readMockTelemetry(telemetry('rosiedazzlers')).projectedRollingCents, 300);
  assert.equal(h.readMockTelemetry(telemetry('devilndove')).projectedRollingCents, 100);
});

test('cross-brand or unknown-scoped attempts fail closed', () => {
  const h = createQl189SyntheticOperationsHarness();
  assert.equal(h.evaluateMockOperation({ ...op('cross'), operatorBrand: 'devilndove' }).disposition, 'DENIED_INPUT_OR_SCOPE');
  assert.equal(h.evaluateMockOperation({ ...op('weird'), brandId: 'other' }).disposition, 'DENIED_INPUT_OR_SCOPE');
  assert.equal(h.evaluateMockOperation({ ...op('role'), role: 'superuser' }).disposition, 'DENIED_INPUT_OR_SCOPE');
  assert.equal(h.readMockTelemetry(telemetry()).entries.length, 0);
});

test('read-only mock role is denied even when scoped correctly', () => {
  assert.equal(createQl189SyntheticOperationsHarness().evaluateMockOperation(op('one', 0, 10, 'rosiedazzlers', 'staff_readonly')).disposition, 'DENIED_ROLE');
});

test('unknown operations, free-text values and injected keys fail the exact schema', () => {
  const h = createQl189SyntheticOperationsHarness();
  for (const input of [null, {}, { ...op('one'), rawBody: 'phone' },
    { ...op('one'), operationId: '+15195550000' },
    { ...op('one'), estimatedCents: 1.5 },
    { ...op('one'), estimatedCents: Number.MAX_SAFE_INTEGER + 1 },
    { ...op('one'), estimatedCents: 0 },
    { ...op('one'), now: -1 },
    { ...op('one'), now: NaN },
    { ...op('one'), operationId: { toString: () => 'mock-one' } }])
    assert.equal(h.evaluateMockOperation(input).disposition, 'DENIED_INPUT_OR_SCOPE');
});

test('mock time rewind cannot release quota or budget guards', () => {
  const h = createQl189SyntheticOperationsHarness();
  h.evaluateMockOperation(op('first', 10, 100));
  assert.equal(h.evaluateMockOperation(op('back', 9, 100)).disposition, 'DENIED_CLOCK');
  assert.equal(h.readMockTelemetry(telemetry()).projectedRollingCents, 100);
});

test('synthetic owner stop blocks further mock reviews without consuming budget', () => {
  const h = createQl189SyntheticOperationsHarness();
  assert.equal(h.simulateIncidentSwitch(incident('STOP', 0)).disposition, 'STOPPED_MOCK');
  assert.equal(h.evaluateMockOperation(op('one', 1, 100)).disposition, 'HALTED_MOCK');
  assert.equal(h.readMockTelemetry(telemetry()).projectedRollingCents, 0);
  assert.equal(h.readMockTelemetry(telemetry()).stopped, true);
});

test('incident stop is tenant-local: other brand remains independent', () => {
  const h = createQl189SyntheticOperationsHarness();
  h.simulateIncidentSwitch(incident('STOP'));
  assert.equal(h.evaluateMockOperation(op('a', 1)).disposition, 'HALTED_MOCK');
  assert.equal(h.evaluateMockOperation(op('a', 1, 100, 'devilndove')).disposition, 'WOULD_PASS_MOCK');
});

test('mock resumption is owner-only and preserves dedupe and projected spending', () => {
  const h = createQl189SyntheticOperationsHarness();
  h.evaluateMockOperation(op('existing', 0, 250));
  h.simulateIncidentSwitch(incident('STOP', 1));
  assert.equal(h.simulateIncidentSwitch(incident('RESUME', 2, 'rosiedazzlers', 'admin')).disposition, 'DENIED_INCIDENT_AUTH');
  assert.equal(h.evaluateMockOperation(op('after', 3)).disposition, 'HALTED_MOCK');
  assert.equal(h.simulateIncidentSwitch(incident('RESUME', 4)).disposition, 'RESUMED_MOCK');
  assert.equal(h.evaluateMockOperation(op('existing', 5, 1)).disposition, 'DENIED_DUPLICATE');
  assert.equal(h.readMockTelemetry(telemetry()).projectedRollingCents, 250);
});

test('mock RESUME without STOP fails and cannot claim real restoration', () => {
  const h = createQl189SyntheticOperationsHarness();
  assert.equal(h.simulateIncidentSwitch(incident('RESUME', 0)).disposition, 'DENIED_NOT_STOPPED');
});

test('incident action rejects foreign owner, unknown reason, injected payload or backward time', () => {
  const h = createQl189SyntheticOperationsHarness();
  for (const input of [
    { ...incident('STOP'), operatorBrand: 'devilndove' },
    { ...incident('STOP'), reasonCode: 'customer complaint: +15195550000' },
    { ...incident('DELETE') },
    { ...incident('STOP'), providerKey: 'test' },
    { ...incident('STOP'), role: 'staff_readonly' }
  ]) assert.equal(h.simulateIncidentSwitch(input).disposition, 'DENIED_INCIDENT_AUTH');
  assert.equal(h.simulateIncidentSwitch(incident('STOP', 10)).disposition, 'STOPPED_MOCK');
  assert.equal(h.simulateIncidentSwitch(incident('RESUME', 9)).disposition, 'DENIED_CLOCK');
});

test('telemetry is redacted and constrained to fixed metadata fields', () => {
  const h = createQl189SyntheticOperationsHarness();
  h.evaluateMockOperation(op('safe-event', 0, 100));
  h.simulateIncidentSwitch(incident('STOP', 1));
  const view = h.readMockTelemetry(telemetry());
  assert.equal(view.disposition, 'REDACTED_MOCK_ONLY');
  assert.deepEqual(view.entries.map(x => Object.keys(x).sort()), [
    ['brandId', 'disposition', 'minuteBucket'], ['brandId', 'disposition', 'minuteBucket']
  ]);
  const raw = JSON.stringify(view);
  for (const forbidden of ['safe-event', 'operationId', 'sessionToken', 'rawBody', 'phoneNumber', 'providerSecret'])
    assert.equal(raw.includes(forbidden), false);
  assert.equal(view.realBillingConnected, false);
  assert.equal(view.monitoringDeployed, false);
});

test('audit is bounded and immutable copies cannot poison future telemetry', () => {
  const h = createQl189SyntheticOperationsHarness();
  for (let i = 0; i < QL189_MAX_AUDIT_ROWS + 10; i++) h.evaluateMockOperation(op(`x${i}`, i, 1));
  const view = h.readMockTelemetry(telemetry());
  assert.equal(view.entries.length, QL189_MAX_AUDIT_ROWS);
  assert.throws(() => view.entries.push({}));
  assert.throws(() => { view.entries[0].disposition = 'FAKE'; });
});

test('read-only telemetry access stays strictly within the selected brand', () => {
  const h = createQl189SyntheticOperationsHarness();
  h.evaluateMockOperation(op('one'));
  assert.equal(h.readMockTelemetry({ ...telemetry(), operatorBrand: 'devilndove' }).disposition, 'DENIED_SCOPE');
  assert.equal(h.readMockTelemetry({ ...telemetry(), person: 'someone' }).disposition, 'DENIED_SCOPE');
  assert.equal(h.readMockTelemetry(telemetry('devilndove')).entries.length, 0);
});

test('separate instances share neither synthetic budgets nor stop controls', () => {
  const a = createQl189SyntheticOperationsHarness();
  const b = createQl189SyntheticOperationsHarness();
  a.evaluateMockOperation(op('same'));
  a.simulateIncidentSwitch(incident('STOP', 1));
  assert.equal(b.evaluateMockOperation(op('same')).disposition, 'WOULD_PASS_MOCK');
  assert.equal(b.readMockTelemetry(telemetry()).stopped, false);
});
