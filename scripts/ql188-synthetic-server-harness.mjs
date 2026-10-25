/**
 * QL-188: isolated, in-process Node test harness. NOT a server or provider adapter.
 * Signature format is invented for testing. NEVER use it as Twilio/Telnyx/VoIP.ms verification.
 * No port, request listener, credentials, persistence, Supabase or outbound transport exists.
 */
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export const QL188_SERVER_VERSION = 'ql188-server-auth-webhook-replay-harness-v1';
export const QL188_MAX_SKEW_MS = 300_000;
export const QL188_MAX_BODY_BYTES = 8_192;
const BRANDS = ['rosiedazzlers', 'devilndove'];
const ROLES = ['owner', 'admin', 'staff_readonly'];
const ALLOWED_KEYS = ['brandId', 'eventId', 'occurredAt', 'rawBody', 'signature'];
const REVIEW_KEYS = ['sessionToken', 'expectedBrand', 'envelope', 'now'];
const SESSION_AGE_MS = 180_000;

const plain = value => value && typeof value === 'object' && !Array.isArray(value) &&
  [Object.prototype, null].includes(Object.getPrototypeOf(value));
const exact = (value, keys) => plain(value) && Object.keys(value).length === keys.length &&
  Object.keys(value).every(key => keys.includes(key));
const brandOk = value => BRANDS.includes(value);
const validEventId = id => typeof id === 'string' && /^mock-[a-z0-9-]{1,48}$/.test(id);
const validClock = clock => Number.isSafeInteger(clock) && clock >= 0;

const result = (disposition, detail, mockSession = false, mockSignature = false) => Object.freeze({
  version: QL188_SERVER_VERSION, disposition, detail,
  mockSessionValidated: mockSession, mockSignatureValidated: mockSignature,
  realServerIdentityVerified: false, realProviderAuthenticated: false,
  mockEventAccepted: disposition === 'ACCEPTED_MOCK',
  dispatchAllowed: false, livePilotAuthorized: false, heldPrerequisites: 12,
  httpListeners: 0, externalWrites: 0, supabaseWrites: 0,
  messagesSent: 0, callsPlaced: 0, ownerApprovals: 0
});

/** An ephemeral secret per brand; never a checked-in fixture key or live provider secret. */
export function createQl188IsolatedHarness() {
  const keys = new Map(BRANDS.map(brand => [brand, randomBytes(32)]));
  const sessions = new Map();
  const consumed = new Set();

  function signFixture(brandId, eventId, occurredAt, rawBody) {
    const key = keys.get(brandId);
    return createHmac('sha256', key).update(`${QL188_SERVER_VERSION}\n${brandId}\n${eventId}\n${occurredAt}\n`, 'utf8')
      .update(rawBody, 'utf8').digest('hex');
  }

  /** Test-only fixture creation: a real provider must never be allowed to sign its own input here. */
  function makeSignedFixture({ brandId, eventId, occurredAt, rawBody }) {
    if (!brandOk(brandId) || !validEventId(eventId) || !validClock(occurredAt) ||
        typeof rawBody !== 'string' || Buffer.byteLength(rawBody, 'utf8') > QL188_MAX_BODY_BYTES)
      throw new TypeError('Invalid mock fixture');
    return Object.freeze({ brandId, eventId, occurredAt, rawBody,
      signature: signFixture(brandId, eventId, occurredAt, rawBody) });
  }

  /** Test-only session issuance; no Supabase JWT or real identity is inferred. */
  function issueTestSession(brandId, role, issuedAt) {
    if (!brandOk(brandId) || !ROLES.includes(role) || !validClock(issuedAt))
      throw new TypeError('Invalid synthetic session');
    const token = randomBytes(32).toString('hex');
    sessions.set(token, { brandId, role, issuedAt });
    return token;
  }

  /** No HTTP listener; exact in-memory preview entrypoint only. */
  function runMockReview(input) {
    if (!exact(input, REVIEW_KEYS))
      return result('DENIED_SCOPE', 'Malformed synthetic route and session parameters.');
    const { sessionToken, expectedBrand, envelope, now } = input;
    if (!brandOk(expectedBrand) || !validClock(now) || typeof sessionToken !== 'string')
      return result('DENIED_SCOPE', 'Invalid expected brand or clock.');
    const session = sessions.get(sessionToken);
    if (!session || now < session.issuedAt || now - session.issuedAt > SESSION_AGE_MS)
      return result('DENIED_SESSION', 'No valid in-memory synthetic operator session.');
    if (session.brandId !== expectedBrand)
      return result('DENIED_SCOPE', 'A synthetic session cannot cross a business boundary.');
    if (!['owner', 'admin'].includes(session.role))
      return result('DENIED_ROLE', 'Read-only synthetic role has no mock review capability.');
    if (!exact(envelope, ALLOWED_KEYS) || !brandOk(envelope.brandId) ||
        !validEventId(envelope.eventId) || !validClock(envelope.occurredAt) ||
        typeof envelope.rawBody !== 'string' || !Buffer.byteLength(envelope.rawBody, 'utf8') ||
        Buffer.byteLength(envelope.rawBody, 'utf8') > QL188_MAX_BODY_BYTES ||
        typeof envelope.signature !== 'string' || !/^[a-f0-9]{64}$/.test(envelope.signature))
      return result('DENIED_PAYLOAD', 'Malformed or oversized mock event.', true);
    if (envelope.brandId !== expectedBrand)
      return result('DENIED_SCOPE', 'Mock webhook brand does not match trusted session scope.', true);
    if (Math.abs(envelope.occurredAt - now) > QL188_MAX_SKEW_MS)
      return result('DENIED_TIME', 'Mock timestamp outside allowed freshness window.', true);

    const expected = Buffer.from(signFixture(expectedBrand, envelope.eventId, envelope.occurredAt, envelope.rawBody), 'hex');
    const received = Buffer.from(envelope.signature, 'hex');
    if (received.length !== expected.length || !timingSafeEqual(expected, received))
      return result('DENIED_SIGNATURE', 'Synthetic HMAC is missing, invalid or not bound to exact raw body.', true);

    const replayKey = `${expectedBrand}:${envelope.eventId}`;
    if (consumed.has(replayKey))
      return result('DENIED_REPLAY', 'Previously accepted mock event ID: no second handling.', true, true);
    consumed.add(replayKey); // memory-only; an actual backend needs atomic durable idempotency.
    return result('ACCEPTED_MOCK', 'Signed test event accepted in memory for review only; no dispatch.', true, true);
  }

  return Object.freeze({ issueTestSession, makeSignedFixture, runMockReview });
}
