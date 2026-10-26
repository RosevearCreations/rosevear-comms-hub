import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createQl208IsolatedGateway, QL208_VERSION } from '../ql208-provider-gateway-sandbox.mjs';

const now = 1_750_000_000_000;
const cases = [
  ['rosiedazzlers', 'rosie-demo-quote-1', null, null],
  ['devilndove', 'dnd-demo-commission-1', null, null],
  ['icamp', 'camp-demo-reservation-1', 'camp-rosevear-demo', null],
  ['yw', 'yw-demo-septic', 'yard-rosevear-demo', 'yw-farm-road-demo']
];

function request(organizationId, fixtureId, tenantId, propertyId, eventId = 'mock-event-1', occurredAt = now) {
  const gateway = createQl208IsolatedGateway();
  const envelope = gateway.makeSignedFixture(organizationId, fixtureId, eventId, occurredAt);
  return { gateway, input: { expectedOrganizationId: organizationId, expectedTenantId: tenantId,
    expectedPropertyId: propertyId, envelope, now } };
}

describe('QL-208 isolated provider webhook and messaging gateway', () => {
  it('verifies ephemeral HMAC, routes all four fictional companies and retains only narrow in-memory receipts', () => {
    assert.match(QL208_VERSION, /^ql208-/);
    for (const [organizationId, fixtureId, tenantId, propertyId] of cases) {
      const { gateway, input } = request(organizationId, fixtureId, tenantId, propertyId);
      const result = gateway.receive(input);
      assert.equal(result.status, 'ACCEPTED_MOCK');
      assert.equal(result.receipt.fixtureId, fixtureId);
      assert.equal(result.realWebhookReceived, false);
      assert.equal(result.outboundAllowed, false);
      assert.equal(result.messagesSent, 0);
      assert.deepEqual(gateway.visibleReceipts(organizationId, tenantId, propertyId), [result.receipt]);
      assert.deepEqual(gateway.visibleReceipts(organizationId, 'isolated-tenant', propertyId), []);
    }
  });

  it('suppresses exact retries and event-id collisions even when the second fixture carries a valid new signature', () => {
    const { gateway, input } = request('yw', 'yw-demo-septic', 'yard-rosevear-demo', 'yw-farm-road-demo');
    assert.equal(gateway.receive(input).status, 'ACCEPTED_MOCK');
    assert.equal(gateway.receive(input).status, 'DENIED_REPLAY');
    const second = gateway.makeSignedFixture('yw', 'yw-demo-garbage', 'mock-event-1', now);
    assert.equal(gateway.receive({ ...input, envelope: second }).status, 'DENIED_REPLAY');
    assert.equal(gateway.visibleReceipts('yw', 'yard-rosevear-demo', 'yw-farm-road-demo').length, 1);
  });

  it('rejects cross-organization, cross-campground and wrong-property route context', () => {
    const { gateway, input } = request('icamp', 'camp-demo-reservation-1', 'camp-rosevear-demo', null);
    assert.equal(gateway.receive({ ...input, expectedOrganizationId: 'devilndove' }).status, 'DENIED_COMPANY');
    assert.equal(gateway.receive({ ...input, expectedTenantId: 'camp-isolated-demo' }).status, 'DENIED_TENANT');
    assert.equal(gateway.receive(input).status, 'ACCEPTED_MOCK');
    const yw = request('yw', 'yw-demo-septic', 'yard-rosevear-demo', 'yw-farm-road-demo');
    assert.equal(yw.gateway.receive({ ...yw.input, expectedPropertyId: 'yw-village-demo' }).status, 'DENIED_PROPERTY');
    assert.equal(yw.gateway.receive({ ...yw.input, expectedTenantId: 'yard-isolated-demo' }).status, 'DENIED_TENANT');
    assert.equal(yw.gateway.visibleReceipts('yw', 'yard-rosevear-demo', 'yw-village-demo').length, 0);
  });

  it('fails closed on changed bodies, signatures, timestamps, injected fields and malformed payloads', () => {
    const { gateway, input } = request('rosiedazzlers', 'rosie-demo-quote-1', null, null);
    assert.equal(gateway.receive({ ...input, envelope: { ...input.envelope, rawBody: '{"kind":"inbound_notice","fixtureId":"other"}' } }).status, 'DENIED_SIGNATURE');
    assert.equal(gateway.receive({ ...input, envelope: { ...input.envelope, signature: '0'.repeat(64) } }).status, 'DENIED_SIGNATURE');
    assert.equal(gateway.receive({ ...input, envelope: { ...input.envelope, occurredAt: now - 1 } }).status, 'DENIED_SIGNATURE');
    assert.equal(gateway.receive({ ...input, now: now + 300_001 }).status, 'DENIED_TIME');
    assert.equal(gateway.receive({ ...input, envelope: { ...input.envelope, phone: '+10000000000' } }).status, 'DENIED_PAYLOAD');
    assert.equal(gateway.receive({ ...input, envelope: { ...input.envelope, rawBody: 'x'.repeat(2_049) } }).status, 'DENIED_PAYLOAD');
    assert.equal(gateway.receive({ ...input, envelope: { ...input.envelope, eventId: 'wrong' } }).status, 'DENIED_PAYLOAD');
    assert.equal(gateway.receive({ ...input, extra: true }).status, 'DENIED_ROUTE');
    assert.equal(gateway.visibleReceipts('rosiedazzlers', null, null).length, 0);
  });

  it('refuses unknown and intentionally held sources at fixture construction', () => {
    const gateway = createQl208IsolatedGateway();
    assert.throws(() => gateway.makeSignedFixture('yw', 'yw-demo-tree-held', 'mock-tree', now), TypeError);
    assert.throws(() => gateway.makeSignedFixture('icamp', 'camp-isolated-demo', 'mock-foreign', now), TypeError);
    assert.throws(() => gateway.makeSignedFixture('rosiedazzlers', 'rosie-demo-quote-1', 'bad-id', now), TypeError);
  });

  it('always denies outgoing messages, calls and automatic responses', () => {
    const gateway = createQl208IsolatedGateway();
    for (const type of ['sms', 'call', 'auto_reply', 'email']) {
      const result = gateway.requestOutbound({ type, to: 'some-number', text: 'unapproved' });
      assert.equal(result.status, 'DENIED_OUTBOUND');
      assert.equal(result.outboundAllowed, false);
      assert.equal(result.externalWrites, 0);
      assert.equal(result.messagesSent, 0);
    }
  });
});
