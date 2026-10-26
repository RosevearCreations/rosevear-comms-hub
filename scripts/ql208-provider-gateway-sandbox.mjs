/**
 * QL-208: in-process synthetic provider gateway, NOT an HTTP endpoint.
 * The test signature format and randomly generated keys are not vendor-compatible.
 * There are no configured provider credentials, network calls or message transports.
 */
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export const QL208_VERSION = 'ql208-secure-provider-webhook-gateway-sandbox-mock-v1';
const MAX_BODY_BYTES = 2_048;
const MAX_AGE_MS = 300_000;
const fixtureScopes = Object.freeze({
  rosiedazzlers: { 'rosie-demo-quote-1': [null, null], 'rosie-demo-booking-1': [null, null] },
  devilndove: { 'dnd-demo-commission-1': [null, null], 'dnd-demo-custom-1': [null, null] },
  icamp: { 'camp-demo-reservation-1': ['camp-rosevear-demo', null], 'camp-demo-guest-1': ['camp-rosevear-demo', null] },
  yw: { 'yw-demo-snow': ['yard-rosevear-demo', 'yw-village-demo'],
    'yw-demo-septic': ['yard-rosevear-demo', 'yw-farm-road-demo'],
    'yw-demo-garbage': ['yard-rosevear-demo', 'yw-farm-road-demo'],
    'yw-demo-lawn': ['yard-rosevear-demo', 'yw-village-demo'] }
});
const organizations = Object.keys(fixtureScopes);
const exact = (value, keys) => value !== null && typeof value === 'object' && !Array.isArray(value)
  && [Object.prototype, null].includes(Object.getPrototypeOf(value))
  && Object.keys(value).length === keys.length && Object.keys(value).every((key) => keys.includes(key));
const validId = (value) => typeof value === 'string' && /^mock-[a-z0-9-]{1,48}$/.test(value);
const validClock = (value) => Number.isSafeInteger(value) && value >= 0;
const scopeKey = (value) => value === null || (typeof value === 'string' && /^[a-z0-9-]{1,64}$/.test(value));

function verdict(status, explanation, extras = {}) {
  return Object.freeze({ status, explanation, ...extras, liveProviderVerified: false,
    realIdentityVerified: false, realWebhookReceived: false, externalWrites: 0,
    outboundAllowed: false, messagesSent: 0, callsPlaced: 0, reviewOnly: true });
}

export function createQl208IsolatedGateway() {
  const keys = new Map(organizations.map((id) => [id, randomBytes(32)]));
  const consumed = new Set();
  const receipts = [];

  function signFields(envelope) {
    return createHmac('sha256', keys.get(envelope.organizationId))
      .update([QL208_VERSION, envelope.organizationId, envelope.eventId,
        envelope.occurredAt, envelope.tenantId ?? '-', envelope.propertyId ?? '-', envelope.rawBody].join('\n'), 'utf8')
      .digest('hex');
  }

  /** Test fixture factory only. In production, provider signatures cannot be self-issued. */
  function makeSignedFixture(organizationId, fixtureId, eventId, occurredAt) {
    const scope = fixtureScopes[organizationId]?.[fixtureId];
    if (!scope || !validId(eventId) || !validClock(occurredAt)) throw new TypeError('Unknown fictional gateway fixture');
    const envelope = { organizationId, eventId, occurredAt,
      tenantId: scope[0], propertyId: scope[1],
      rawBody: JSON.stringify({ kind: 'inbound_notice', fixtureId }) };
    return Object.freeze({ ...envelope, signature: signFields(envelope) });
  }

  /** No listener, receiver URL, provider adapter, database or message dispatch exists. */
  function receive(request) {
    if (!exact(request, ['expectedOrganizationId', 'expectedTenantId', 'expectedPropertyId', 'envelope', 'now'])
      || !organizations.includes(request.expectedOrganizationId)
      || !scopeKey(request.expectedTenantId) || !scopeKey(request.expectedPropertyId) || !validClock(request.now)) {
      return verdict('DENIED_ROUTE', 'Missing or malformed synthetic route context.');
    }
    const { envelope, expectedOrganizationId, expectedTenantId, expectedPropertyId, now } = request;
    if (!exact(envelope, ['organizationId', 'eventId', 'occurredAt', 'tenantId', 'propertyId', 'rawBody', 'signature'])
      || !organizations.includes(envelope.organizationId) || !validId(envelope.eventId)
      || !validClock(envelope.occurredAt) || !scopeKey(envelope.tenantId) || !scopeKey(envelope.propertyId)
      || typeof envelope.rawBody !== 'string' || Buffer.byteLength(envelope.rawBody, 'utf8') === 0
      || Buffer.byteLength(envelope.rawBody, 'utf8') > MAX_BODY_BYTES
      || typeof envelope.signature !== 'string' || !/^[0-9a-f]{64}$/.test(envelope.signature)) {
      return verdict('DENIED_PAYLOAD', 'Malformed synthetic signed envelope or oversized body.');
    }
    if (envelope.organizationId !== expectedOrganizationId) {
      return verdict('DENIED_COMPANY', 'The incoming event cannot cross an organization route.');
    }
    if (envelope.tenantId !== expectedTenantId) {
      return verdict('DENIED_TENANT', 'The fictional campground or company tenant does not match the route.');
    }
    if (envelope.propertyId !== expectedPropertyId) {
      return verdict('DENIED_PROPERTY', 'The fictional property does not match the route.');
    }
    if (Math.abs(now - envelope.occurredAt) > MAX_AGE_MS) {
      return verdict('DENIED_TIME', 'The test nonce timestamp is expired or far in the future.');
    }
    const supplied = Buffer.from(envelope.signature, 'hex');
    const expected = Buffer.from(signFields(envelope), 'hex');
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
      return verdict('DENIED_SIGNATURE', 'Invented test HMAC did not verify against the exact synthetic envelope.');
    }
    let body;
    try { body = JSON.parse(envelope.rawBody); } catch { return verdict('DENIED_BODY', 'Not a JSON object.'); }
    if (!exact(body, ['kind', 'fixtureId']) || body.kind !== 'inbound_notice'
      || typeof body.fixtureId !== 'string') {
      return verdict('DENIED_BODY', 'Only an exact minimal inbound fixture reference is accepted.');
    }
    const fixtureScope = fixtureScopes[expectedOrganizationId][body.fixtureId];
    if (!fixtureScope || fixtureScope[0] !== expectedTenantId || fixtureScope[1] !== expectedPropertyId) {
      return verdict('DENIED_SOURCE', 'Unrecognized, held or incorrectly scoped fictional source.');
    }
    const idempotencyKey = `${expectedOrganizationId}:${envelope.eventId}`;
    if (consumed.has(idempotencyKey)) {
      return verdict('DENIED_REPLAY', 'This test event ID has already been received.');
    }
    consumed.add(idempotencyKey);
    const receipt = Object.freeze({ organizationId: expectedOrganizationId, tenantId: expectedTenantId,
      propertyId: expectedPropertyId, eventId: envelope.eventId, fixtureId: body.fixtureId,
      state: 'HELD_FOR_HUMAN_REVIEW', sampleOnly: true });
    receipts.push(receipt);
    return verdict('ACCEPTED_MOCK', 'Verified invented HMAC; held a minimal reference in memory for review.', { receipt });
  }

  /** No outgoing queue even in the sandbox; a request always produces a hold. */
  function requestOutbound() {
    return verdict('DENIED_OUTBOUND', 'Outbound SMS, calls, provider API requests and automated replies remain disabled.');
  }

  function visibleReceipts(organizationId, tenantId, propertyId) {
    return Object.freeze(receipts.filter((entry) => entry.organizationId === organizationId
      && entry.tenantId === tenantId && entry.propertyId === propertyId));
  }
  return Object.freeze({ makeSignedFixture, receive, requestOutbound, visibleReceipts });
}
