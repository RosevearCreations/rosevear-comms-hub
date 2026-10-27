/**
 * QL-239 four-company synthetic credential rollover proof.
 * Importing the isolated QL-238 harness never creates a network listener,
 * uses real keys, reads the environment or contacts a business application.
 */
import { createQl238IsolatedHandshake } from './ql238-integration-handshake-sandbox.mjs';

export const QL239_ROTATION_RELEASE = 'ql239-ephemeral-credential-rotation-nondispatch-test-v1';
const companies = Object.freeze({
  rosiedazzlers: null, devilndove: null,
  icamp: 'demo-icamp-tenant', yw: 'demo-yw-tenant'
});

export function runQl239SyntheticRotation(company, now = 1_790_000_000_000) {
  if (!Object.hasOwn(companies, company)) throw new TypeError('Unknown fictional business.');
  const tenant = companies[company];
  const harness = createQl238IsolatedHandshake();
  const inspect = (envelope, override = {}) => harness.inspect({
    expectedBusiness: company, expectedTenant: tenant,
    expectedEnvironment: 'disabled-preview', envelope, now, ...override
  });
  const signed = (kind, nonce) => harness.makeSignedFixture(company, kind, nonce, now);

  const previous = signed('health', 'mock-old-pending');
  const before = inspect(signed('health', 'mock-old-health'));
  const oldCapability = signed('capabilities', 'mock-old-cap');
  const beforeCapability = inspect(oldCapability);
  const rotated = harness.rotateTestKey(company);
  const oldKeyDenied = inspect(previous);
  const oldCapabilityDenied = inspect(oldCapability);
  const capabilityBeforeRenewedHealth = inspect(signed('capabilities', 'mock-new-early'));
  const renewedHealth = inspect(signed('health', 'mock-new-health'));
  const renewedCapabilities = inspect(signed('capabilities', 'mock-new-caps'));
  const replayDenied = inspect(signed('capabilities', 'mock-new-caps'));
  const crossTenantDenied = inspect(signed('health', 'mock-new-cross-tenant'), {
    expectedTenant: tenant ? 'demo-foreign-tenant' : 'demo-unexpected-tenant'
  });
  const writeDenied = harness.requestCommand({ kind: 'send_sms' });
  const capturedBeforeRevocation = signed('health', 'mock-pre-revocation');
  const revoked = harness.revokeTestKey(company);
  const revokedKeyDenied = inspect(capturedBeforeRevocation);
  const report = {
    release: QL239_ROTATION_RELEASE, company, tenantScope: tenant ? 'TENANT_SCOPED' : 'BUSINESS_SCOPED',
    rotated, revoked,
    previousHealthHeld: before.status === 'SIMULATED_RESPONSE_HELD',
    previousCapabilitiesHeld: beforeCapability.status === 'SIMULATED_RESPONSE_HELD',
    oldKeyDenied: oldKeyDenied.status === 'DENIED_KEY' && oldCapabilityDenied.status === 'DENIED_KEY',
    requiresFreshHealth: capabilityBeforeRenewedHealth.status === 'DENIED_SEQUENCE',
    newKeyHeld: renewedHealth.status === 'SIMULATED_RESPONSE_HELD' && renewedCapabilities.status === 'SIMULATED_RESPONSE_HELD',
    replayDenied: replayDenied.status === 'DENIED_REPLAY',
    crossTenantDenied: crossTenantDenied.status === 'DENIED_TENANT',
    revocationDenied: revokedKeyDenied.status === 'DENIED_KEY',
    commandsDenied: writeDenied.status === 'DENIED_COMMAND',
    actualConnection: 'DISCONNECTED', keyMaterialExported: false, remoteRequests: 0,
    remoteWrites: 0, liveCalls: 0, liveSms: 0, providerDispatch: 0,
    ownerApproval: false, realPilotHolds: 12
  };
  return Object.freeze(report);
}
