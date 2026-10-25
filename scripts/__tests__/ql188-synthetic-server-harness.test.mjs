import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createQl188IsolatedHarness, QL188_MAX_SKEW_MS, QL188_SERVER_VERSION }
  from '../ql188-synthetic-server-harness.mjs';

const NOW = 1_800_000_000_000;
const text = '{"sample":"fictional inbound event","no_real_recipients":true}';
const brands = ['rosiedazzlers', 'devilndove'];
const fixture = (harness, brand, id = 'mock-event-1', at = NOW, rawBody = text) =>
  harness.makeSignedFixture({ brandId: brand, eventId: id, occurredAt: at, rawBody });
const review = (harness, brand, token, envelope, now = NOW) =>
  harness.runMockReview({ sessionToken: token, expectedBrand: brand, envelope, now });

describe('QL-188 server-side synthetic crypto/auth/replay contract', () => {
  test('version and no import of network listener, provider or Supabase clients', () => {
    assert.equal(QL188_SERVER_VERSION, 'ql188-server-auth-webhook-replay-harness-v1');
    const source = readFileSync(new URL('../ql188-synthetic-server-harness.mjs', import.meta.url), 'utf8');
    for (const banned of ['createServer(', '.listen(', 'fetch(', 'createClient(', 'service_role', 'process.env.', 'https.request('])
      assert.ok(!source.includes(banned), `forbidden live operation: ${banned}`);
  });

  for (const brand of brands) {
    for (const role of ['owner', 'admin']) {
      test(`${brand} ${role}: accepts a valid freshly signed fictional event once but never dispatches`, () => {
        const h = createQl188IsolatedHarness();
        const token = h.issueTestSession(brand, role, NOW - 1000);
        const envelope = fixture(h, brand);
        const result = review(h, brand, token, envelope);
        assert.equal(result.disposition, 'ACCEPTED_MOCK');
        assert.deepEqual({ mockSession: result.mockSessionValidated, mockSignature: result.mockSignatureValidated },
          { mockSession: true, mockSignature: true });
        assert.equal(result.realServerIdentityVerified, false);
        assert.equal(result.realProviderAuthenticated, false);
        assert.equal(result.dispatchAllowed, false);
        assert.equal(result.livePilotAuthorized, false);
        assert.equal(result.heldPrerequisites, 12);
        for (const value of ['httpListeners', 'externalWrites', 'supabaseWrites', 'messagesSent', 'callsPlaced', 'ownerApprovals'])
          assert.equal(result[value], 0, value);
        assert.equal(review(h, brand, token, envelope).disposition, 'DENIED_REPLAY');
      });
    }

    test(`${brand}: rejects absent, guessed, expired and future-dated mock sessions`, () => {
      const h = createQl188IsolatedHarness();
      const envelope = fixture(h, brand);
      for (const token of ['', 'unknown', null])
        assert.notEqual(review(h, brand, token, envelope).disposition, 'ACCEPTED_MOCK');
      const old = h.issueTestSession(brand, 'owner', NOW - 181_000);
      assert.equal(review(h, brand, old, envelope).disposition, 'DENIED_SESSION');
      const future = h.issueTestSession(brand, 'owner', NOW + 1);
      assert.equal(review(h, brand, future, envelope).disposition, 'DENIED_SESSION');
    });

    test(`${brand}: a read-only role cannot perform even the fictional review`, () => {
      const h = createQl188IsolatedHarness();
      const token = h.issueTestSession(brand, 'staff_readonly', NOW);
      assert.equal(review(h, brand, token, fixture(h, brand)).disposition, 'DENIED_ROLE');
    });

    test(`${brand}: rejects altered body, event ID, timestamp and hexadecimal signature`, () => {
      const h = createQl188IsolatedHarness();
      const token = h.issueTestSession(brand, 'owner', NOW);
      const base = fixture(h, brand);
      for (const changed of [
        { ...base, rawBody: base.rawBody + ' altered' },
        { ...base, eventId: 'mock-else' },
        { ...base, occurredAt: NOW + 1 },
        { ...base, signature: '0'.repeat(64) }
      ]) assert.equal(review(h, brand, token, changed).disposition, 'DENIED_SIGNATURE');
      // Failed signatures did not consume the idempotency key.
      assert.equal(review(h, brand, token, base).disposition, 'ACCEPTED_MOCK');
    });

    test(`${brand}: rejects stale and future signatures past the freshness limit`, () => {
      const h = createQl188IsolatedHarness();
      const token = h.issueTestSession(brand, 'admin', NOW);
      for (const at of [NOW - QL188_MAX_SKEW_MS - 1, NOW + QL188_MAX_SKEW_MS + 1])
        assert.equal(review(h, brand, token, fixture(h, brand, 'mock-stale', at)).disposition, 'DENIED_TIME');
      const atBoundary = NOW - QL188_MAX_SKEW_MS;
      assert.equal(review(h, brand, token, fixture(h, brand, 'mock-boundary', atBoundary)).disposition, 'ACCEPTED_MOCK');
    });

    test(`${brand}: duplicate ID fails even with a newly valid signature and changed body`, () => {
      const h = createQl188IsolatedHarness();
      const token = h.issueTestSession(brand, 'admin', NOW);
      assert.equal(review(h, brand, token, fixture(h, brand)).disposition, 'ACCEPTED_MOCK');
      assert.equal(review(h, brand, token, fixture(h, brand, 'mock-event-1', NOW, text + ' valid but different'))
        .disposition, 'DENIED_REPLAY');
      assert.equal(review(h, brand, token, fixture(h, brand, 'mock-event-2')).disposition, 'ACCEPTED_MOCK');
    });

    test(`${brand}: malformed, oversized, mis-keyed and extra-property payloads fail closed`, () => {
      const h = createQl188IsolatedHarness();
      const token = h.issueTestSession(brand, 'owner', NOW);
      const base = fixture(h, brand);
      for (const altered of [
        null, [], Object.create(base), { ...base, signature: '' },
        { ...base, signature: 'not-hex' },
        { ...base, rawBody: '' },
        { ...base, rawBody: 'x'.repeat(8193) },
        { ...base, ownerApproved: true },
        { ...base, eventId: '__proto__' },
        { ...base, occurredAt: Infinity }
      ]) assert.equal(review(h, brand, token, altered).disposition, 'DENIED_PAYLOAD');
      assert.equal(review(h, brand, token, base).disposition, 'ACCEPTED_MOCK');
    });
  }

  test('wrong-brand session, envelope and brand signing keys never cross business lines', () => {
    const h = createQl188IsolatedHarness();
    const rosie = h.issueTestSession('rosiedazzlers', 'admin', NOW);
    const devil = h.issueTestSession('devilndove', 'owner', NOW);
    const rosieEnvelope = fixture(h, 'rosiedazzlers');
    const devilEnvelope = fixture(h, 'devilndove');
    assert.equal(review(h, 'devilndove', rosie, devilEnvelope).disposition, 'DENIED_SCOPE');
    assert.equal(review(h, 'rosiedazzlers', devil, rosieEnvelope).disposition, 'DENIED_SCOPE');
    assert.equal(review(h, 'rosiedazzlers', rosie, devilEnvelope).disposition, 'DENIED_SCOPE');
    assert.equal(review(h, 'devilndove', devil, rosieEnvelope).disposition, 'DENIED_SCOPE');
    assert.equal(review(h, 'rosiedazzlers', rosie, { ...rosieEnvelope, signature: devilEnvelope.signature }).disposition, 'DENIED_SIGNATURE');
  });

  test('different harness instances cannot share sessions, HMAC secrets or replay state', () => {
    const a = createQl188IsolatedHarness();
    const b = createQl188IsolatedHarness();
    const ta = a.issueTestSession('rosiedazzlers', 'owner', NOW);
    const tb = b.issueTestSession('rosiedazzlers', 'owner', NOW);
    const event = fixture(a, 'rosiedazzlers');
    assert.equal(review(b, 'rosiedazzlers', ta, event).disposition, 'DENIED_SESSION');
    assert.equal(review(b, 'rosiedazzlers', tb, event).disposition, 'DENIED_SIGNATURE');
    assert.equal(review(a, 'rosiedazzlers', ta, event).disposition, 'ACCEPTED_MOCK');
  });

  test('fixture/session factory rejects unauthorized brands and malformed issue parameters', () => {
    const h = createQl188IsolatedHarness();
    assert.throws(() => h.issueTestSession('personal', 'owner', NOW));
    assert.throws(() => h.issueTestSession('rosiedazzlers', 'root', NOW));
    assert.throws(() => h.issueTestSession('rosiedazzlers', 'admin', NaN));
    assert.throws(() => fixture(h, 'personal'));
    assert.throws(() => fixture(h, 'rosiedazzlers', '../etc/passwd'));
    assert.throws(() => fixture(h, 'rosiedazzlers', 'mock-too-big', NOW, 'x'.repeat(8193)));
  });

  test('malformed trusted route/clock fails before any payload receipt', () => {
    const h = createQl188IsolatedHarness();
    const token = h.issueTestSession('rosiedazzlers', 'owner', NOW);
    assert.equal(h.runMockReview(null).disposition, 'DENIED_SCOPE');
    assert.equal(h.runMockReview({}).disposition, 'DENIED_SCOPE');
    assert.equal(h.runMockReview({ sessionToken: token, expectedBrand: 'rosiedazzlers',
      envelope: fixture(h, 'rosiedazzlers'), now: NOW, ownerApproved: true }).disposition, 'DENIED_SCOPE');
    for (const [brand, now] of [['unknown', NOW], ['rosiedazzlers', NaN], ['rosiedazzlers', -1]])
      assert.equal(review(h, brand, token, fixture(h, 'rosiedazzlers'), now).disposition, 'DENIED_SCOPE');
  });
});
