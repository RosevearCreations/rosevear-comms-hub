/**
 * QL-189 — IN-PROCESS, SYNTHETIC safety drills only.
 * This is NOT an HTTP gateway, rate limiter for actual traffic, provider adapter,
 * billing system, operator authorization service or production kill switch.
 * No persistent storage, network requests, credentials, calls or SMS.
 */
export const QL189_VERSION = 'ql189-synthetic-operations-safety-controls-v1';
export const QL189_RATE_WINDOW_MS = 60_000;
export const QL189_COST_WINDOW_MS = 86_400_000;
export const QL189_MAX_MOCK_EVENTS_PER_MINUTE = 3;
export const QL189_MAX_MOCK_EVENT_CENTS = 250;
export const QL189_MOCK_DAILY_CAP_CENTS = 500;
export const QL189_MAX_AUDIT_ROWS = 32;

const BRANDS = ['rosiedazzlers', 'devilndove'];
const REVIEW_KEYS = ['brandId', 'operatorBrand', 'role', 'operationId', 'now', 'estimatedCents'];
const INCIDENT_KEYS = ['brandId', 'operatorBrand', 'role', 'action', 'reasonCode', 'now'];
const READ_KEYS = ['brandId', 'operatorBrand', 'role'];
const VALID_ROLES = ['owner', 'admin', 'staff_readonly'];
const REASONS = ['MOCK_DRILL', 'MOCK_ABORT'];
const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value) &&
  [Object.prototype, null].includes(Object.getPrototypeOf(value));
const exact = (value, keys) => plain(value) && Object.keys(value).length === keys.length &&
  Object.keys(value).every(key => keys.includes(key));
const clockOk = n => Number.isSafeInteger(n) && n >= 0;
const mockIdOk = id => typeof id === 'string' && /^mock-[a-z0-9-]{1,48}$/.test(id);

function outcome(disposition, detail, brandId = null) {
  return Object.freeze({
    version: QL189_VERSION, disposition, detail, brandId,
    syntheticOnly: true, operationalEnforcementInstalled: false,
    realRateLimiterInstalled: false, actualProviderSpendCents: 0,
    realIncidentStopInstalled: false, livePilotAuthorized: false,
    heldPrerequisites: 12, networkListeners: 0, externalWrites: 0,
    supabaseWrites: 0, messagesSent: 0, callsPlaced: 0, ownerApprovals: 0
  });
}

/** Creates an isolated mock state machine; nothing escapes this Node process. */
export function createQl189SyntheticOperationsHarness() {
  const states = new Map(BRANDS.map(brand => [brand, {
    stopped: false, lastClock: null, rateTimes: [], charges: [], acceptedIds: new Set(), audit: []
  }]));

  function record(state, brandId, disposition, now) {
    // Only fixed enum values and coarse time buckets. No contact, message, URL, event ID or raw body.
    state.audit.push(Object.freeze({ brandId, disposition, minuteBucket: Math.floor(now / 60_000) }));
    if (state.audit.length > QL189_MAX_AUDIT_ROWS) state.audit.shift();
  }

  function scopeOk(input) {
    return BRANDS.includes(input.brandId) && BRANDS.includes(input.operatorBrand) &&
      VALID_ROLES.includes(input.role) && input.operatorBrand === input.brandId;
  }

  function evaluateMockOperation(input) {
    if (!exact(input, REVIEW_KEYS) || !scopeOk(input) || !clockOk(input.now) ||
        !mockIdOk(input.operationId) || !Number.isSafeInteger(input.estimatedCents) ||
        input.estimatedCents <= 0)
      return outcome('DENIED_INPUT_OR_SCOPE', 'Invalid mock input or cross-brand scope.');
    const state = states.get(input.brandId);
    if (input.role === 'staff_readonly')
      return outcome('DENIED_ROLE', 'Mock read-only role cannot simulate an operation.', input.brandId);
    if (state.lastClock !== null && input.now < state.lastClock)
      return outcome('DENIED_CLOCK', 'Synthetic clock rollback rejected.', input.brandId);
    state.lastClock = input.now;
    if (state.stopped) {
      record(state, input.brandId, 'HALTED_MOCK', input.now);
      return outcome('HALTED_MOCK', 'Mock incident stop applies before cost or rate checks.', input.brandId);
    }
    if (state.acceptedIds.has(input.operationId)) {
      record(state, input.brandId, 'DENIED_DUPLICATE', input.now);
      return outcome('DENIED_DUPLICATE', 'Idempotent synthetic operation ID cannot be charged twice.', input.brandId);
    }
    state.rateTimes = state.rateTimes.filter(t => t > input.now - QL189_RATE_WINDOW_MS);
    state.charges = state.charges.filter(row => row.at > input.now - QL189_COST_WINDOW_MS);
    if (state.rateTimes.length >= QL189_MAX_MOCK_EVENTS_PER_MINUTE) {
      record(state, input.brandId, 'RATE_BLOCKED', input.now);
      return outcome('RATE_BLOCKED', 'Three mock operations already reviewed this minute.', input.brandId);
    }
    const windowCents = state.charges.reduce((sum, row) => sum + row.cents, 0);
    if (input.estimatedCents > QL189_MAX_MOCK_EVENT_CENTS ||
        windowCents + input.estimatedCents > QL189_MOCK_DAILY_CAP_CENTS) {
      record(state, input.brandId, 'COST_BLOCKED', input.now);
      return outcome('COST_BLOCKED', 'Test-only per-operation or rolling 24-hour cap exceeded.', input.brandId);
    }
    state.acceptedIds.add(input.operationId);
    state.rateTimes.push(input.now);
    state.charges.push({ at: input.now, cents: input.estimatedCents });
    record(state, input.brandId, 'WOULD_PASS_MOCK', input.now);
    return outcome('WOULD_PASS_MOCK', 'In-memory safety drill passed; no dispatch or charge.', input.brandId);
  }

  function simulateIncidentSwitch(input) {
    if (!exact(input, INCIDENT_KEYS) || !scopeOk(input) || input.role !== 'owner' ||
        !clockOk(input.now) || !['STOP', 'RESUME'].includes(input.action) ||
        !REASONS.includes(input.reasonCode))
      return outcome('DENIED_INCIDENT_AUTH', 'Only a same-brand fictional owner may operate the mock switch.');
    const state = states.get(input.brandId);
    if (state.lastClock !== null && input.now < state.lastClock)
      return outcome('DENIED_CLOCK', 'Synthetic incident clock rollback rejected.', input.brandId);
    state.lastClock = input.now;
    if (input.action === 'STOP') {
      state.stopped = true;
      record(state, input.brandId, 'STOPPED_MOCK', input.now);
      return outcome('STOPPED_MOCK', 'Mock intake halted; this does not stop a real provider.', input.brandId);
    }
    if (!state.stopped)
      return outcome('DENIED_NOT_STOPPED', 'No synthetic incident to resume.', input.brandId);
    state.stopped = false;
    record(state, input.brandId, 'RESUMED_MOCK', input.now);
    return outcome('RESUMED_MOCK', 'In-memory mock resumed; budget and replay history are NOT reset.', input.brandId);
  }

  function readMockTelemetry(input) {
    if (!exact(input, READ_KEYS) || !scopeOk(input))
      return Object.freeze({ disposition: 'DENIED_SCOPE', entries: Object.freeze([]), brandId: null });
    const state = states.get(input.brandId);
    return Object.freeze({ disposition: 'REDACTED_MOCK_ONLY', brandId: input.brandId,
      entries: Object.freeze([...state.audit]), stopped: state.stopped,
      projectedRollingCents: state.charges.reduce((sum, row) => sum + row.cents, 0),
      realBillingConnected: false, dataRetentionConfigured: false, monitoringDeployed: false });
  }

  return Object.freeze({ evaluateMockOperation, simulateIncidentSwitch, readMockTelemetry });
}
