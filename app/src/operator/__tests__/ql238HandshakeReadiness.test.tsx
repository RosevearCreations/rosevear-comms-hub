// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OperatorShell } from '../OperatorShell';
import { QL181_PREREQUISITES } from '../ql181PrivacyPilotGate';
import { operatorOrganizations, type OrganizationId } from '../ql191Organizations';
import { QL238_RELEASE, QL238_PREVIEW_ENV,
  ql238RequestFixture, ql238ReadCapabilities, inspectQl238Fixture,
  ql238Portfolio, recordQl238Evidence, acknowledgeQl238Evidence, prepareQl238HeldPacket,
  resetQl238Company, ql238EvidenceReady, type Ql238Ledger } from '../ql238HandshakeReadiness';

const now = new Date('2026-10-27T14:00:00.000Z');

describe('QL-238 four-company health/capabilities handoff — session-only', () => {
  it('keeps all 12 actual QL-181 gates unchanged and allows only read capabilities', () => {
    expect(QL181_PREREQUISITES).toHaveLength(12);
    expect(QL181_PREREQUISITES.every((x) => x.state === 'HELD_UNVERIFIED')).toBe(true);
    for (const org of operatorOrganizations) {
      expect(ql238ReadCapabilities(org.id).length).toBeGreaterThan(0);
      expect(ql238ReadCapabilities(org.id).every((x) => x.startsWith('read_'))).toBe(true);
    }
  });

  for (const org of operatorOrganizations) {
    it('holds a ' + org.id + ' synthetic health then capabilities handshake with no network authority', () => {
      const used = new Set<string>();
      const caps = ql238RequestFixture(org.id, 'capabilities', 'mock-caps', now);
      expect(inspectQl238Fixture(caps, org.id, used, now).disposition).toBe('DENIED_SEQUENCE');
      const health = ql238RequestFixture(org.id, 'health', 'mock-health', now);
      const first = inspectQl238Fixture(health, org.id, used, now);
      expect(first).toMatchObject({
        disposition: 'HELD_UNVERIFIED', actualConnection: 'DISCONNECTED',
        signedServerRequestVerified: false, realIdentityVerified: false, ownerApproval: false,
        sentRequests: 0, externalWrites: 0, liveCalls: 0, liveSms: 0, actualPilotHolds: 12
      });
      expect(first.response?.connection_status).toBe('HOLD');
      expect(first.response).not.toHaveProperty('capabilities');
      expect(inspectQl238Fixture(health, org.id, used, now).disposition).toBe('DENIED_REPLAY');
      const second = inspectQl238Fixture(caps, org.id, used, now);
      expect(second.disposition).toBe('HELD_UNVERIFIED');
      expect(second.response?.capabilities).toEqual(ql238ReadCapabilities(org.id));
      expect(second.response?.environment).toBe(QL238_PREVIEW_ENV);
      expect(second.response).not.toHaveProperty('customer');
    });
  }

  it('rejects cross-company, campground/company tenant and direct routes without consuming a mock nonce', () => {
    const seen = new Set<string>();
    const fixture = ql238RequestFixture('icamp', 'health', 'mock-camp', now);
    expect(inspectQl238Fixture({ ...fixture, application_id: 'devilndove' }, 'icamp', seen, now).disposition).toBe('DENIED_BUSINESS');
    expect(inspectQl238Fixture({ ...fixture, business_id: 'yw' }, 'icamp', seen, now).disposition).toBe('DENIED_BUSINESS');
    expect(inspectQl238Fixture({ ...fixture, tenant_id: null }, 'icamp', seen, now).disposition).toBe('DENIED_TENANT');
    expect(inspectQl238Fixture({ ...fixture, tenant_id: 'demo-foreign' }, 'icamp', seen, now).disposition).toBe('DENIED_TENANT');
    expect(inspectQl238Fixture({ ...fixture, gateway_id: 'rosevear-comms-hub' as typeof fixture.gateway_id }, 'icamp', seen, now).disposition).toBe('DENIED_ROUTE');
    expect(seen.size).toBe(0);
    expect(inspectQl238Fixture(fixture, 'icamp', seen, now).disposition).toBe('HELD_UNVERIFIED');
    const yw = ql238RequestFixture('yw', 'health', 'mock-yw', now);
    expect(inspectQl238Fixture({ ...yw, tenant_id: 'demo-other-company' }, 'yw', seen, now).disposition).toBe('DENIED_TENANT');
    const rosie = ql238RequestFixture('rosiedazzlers', 'health', 'mock-rosie', now);
    expect(inspectQl238Fixture({ ...rosie, tenant_id: 'demo-tenant' }, 'rosiedazzlers', seen, now).disposition).toBe('DENIED_TENANT');
  });

  it('fails closed on production, POST, bad schema, invalid time, unknown/write capability and extra private fields', () => {
    const seen = new Set<string>();
    const health = ql238RequestFixture('devilndove', 'health', 'mock-health', now);
    expect(inspectQl238Fixture({ ...health, environment: 'production' as typeof QL238_PREVIEW_ENV }, 'devilndove', seen, now).disposition).toBe('DENIED_ENVIRONMENT');
    expect(inspectQl238Fixture({ ...health, method: 'POST' as 'GET' }, 'devilndove', seen, now).disposition).toBe('DENIED_SCHEMA');
    expect(inspectQl238Fixture({ ...health, schema_version: 'unexpected' as typeof health.schema_version }, 'devilndove', seen, now).disposition).toBe('DENIED_SCHEMA');
    expect(inspectQl238Fixture({ ...health, issued_at: '2020-01-01T00:00:00Z' }, 'devilndove', seen, now).disposition).toBe('DENIED_TIME');
    expect(inspectQl238Fixture({ ...health, requested_capabilities: ['send_sms'] }, 'devilndove', seen, now).disposition).toBe('DENIED_CAPABILITY');
    expect(inspectQl238Fixture({ ...health, customerPhone: 'not-allowed' } as typeof health, 'devilndove', seen, now).disposition).toBe('DENIED_SCHEMA');
    expect(inspectQl238Fixture(health, 'devilndove', seen, now).disposition).toBe('HELD_UNVERIFIED');
    const caps = ql238RequestFixture('devilndove', 'capabilities', 'mock-caps', now);
    expect(inspectQl238Fixture({ ...caps, requested_capabilities: [...caps.requested_capabilities, 'create_handoff_preview'] }, 'devilndove', seen, now).disposition).toBe('DENIED_CAPABILITY');
    expect(inspectQl238Fixture(caps, 'devilndove', seen, now).disposition).toBe('HELD_UNVERIFIED');
  });

  it('requires both current local checks and renewed acknowledgement to prepare a non-authorizing packet', () => {
    let ledger: Ql238Ledger = {};
    const seen = new Set<string>();
    const health = inspectQl238Fixture(ql238RequestFixture('devilndove', 'health', 'mock-h', now), 'devilndove', seen, now);
    ledger = recordQl238Evidence(ledger, health);
    expect(ql238EvidenceReady(ledger.devilndove)).toBe(false);
    expect(prepareQl238HeldPacket(ledger, 'devilndove')).toBe(ledger);
    const caps = inspectQl238Fixture(ql238RequestFixture('devilndove', 'capabilities', 'mock-c', now), 'devilndove', seen, now);
    ledger = recordQl238Evidence(ledger, caps);
    expect(ql238EvidenceReady(ledger.devilndove)).toBe(true);
    expect(prepareQl238HeldPacket(ledger, 'devilndove')).toBe(ledger);
    ledger = acknowledgeQl238Evidence(ledger, 'devilndove');
    expect(ledger.devilndove?.acknowledgement).toBe('ACKNOWLEDGED_UNVERIFIED');
    ledger = prepareQl238HeldPacket(ledger, 'devilndove');
    expect(ledger.devilndove?.phase).toBe('LOCAL_PACKET_PREPARED_HELD');
    expect(ql238Portfolio(ledger).find(x => x.company === 'devilndove')).toMatchObject({
      actualConnection: 'DISCONNECTED', realPilotHolds: 12
    });
    const freshHealth = inspectQl238Fixture(ql238RequestFixture('devilndove', 'health', 'mock-new', now), 'devilndove', seen, now);
    ledger = recordQl238Evidence(ledger, freshHealth);
    expect(ledger.devilndove?.phase).toBe('REVIEW_ONLY');
    expect(ledger.devilndove?.acknowledgement).toBe('NOT_REVIEWED');
    expect(ledger.devilndove?.capabilities).toBeNull();
    expect(ql238EvidenceReady(ledger.devilndove)).toBe(false);
  });

  it('isolates ledger updates and company-only reset from other fictional businesses', () => {
    const seen = new Set<string>();
    const rosie = inspectQl238Fixture(ql238RequestFixture('rosiedazzlers', 'health', 'mock-one', now), 'rosiedazzlers', seen, now);
    const camp = inspectQl238Fixture(ql238RequestFixture('icamp', 'health', 'mock-two', now), 'icamp', seen, now);
    let ledger = recordQl238Evidence({}, rosie);
    ledger = recordQl238Evidence(ledger, camp);
    const campEvidence = ledger.icamp;
    ledger = resetQl238Company(ledger, 'rosiedazzlers');
    expect(ledger.rosiedazzlers).toBeUndefined();
    expect(ledger.icamp).toBe(campEvidence);
    expect(ql238Portfolio(ledger)).toHaveLength(4);
  });
});

let host: HTMLDivElement;
let root: Root;
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
  await act(async () => root.render(<OperatorShell />));
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.restoreAllMocks(); });

async function click(label: string, selector = 'button') {
  const button = [...host.querySelectorAll<HTMLButtonElement>(selector)].find((item) => item.textContent?.includes(label));
  if (!button) throw new Error('Missing: ' + label);
  await act(async () => button.click());
}
async function endpoint(value: string) {
  const select = host.querySelector<HTMLSelectElement>('#ql238-kind');
  if (!select) throw new Error('Missing endpoint selection');
  await act(async () => { select.value = value; select.dispatchEvent(new Event('change', { bubbles: true })); });
}

describe('QL-238 operator handshake and evidence gate', () => {
  it('shows all four businesses, actual disconnected state and the help/boundary message', async () => {
    await click('Gateway handshake & tenant gate', '.ql172-nav-button');
    const screen = host.querySelector<HTMLElement>('[data-ql238-release]');
    expect(screen?.getAttribute('data-ql238-release')).toBe(QL238_RELEASE);
    expect(screen?.querySelectorAll('table tbody tr')).toHaveLength(4);
    expect(screen?.textContent).toContain('ALL ACTUAL CONNECTIONS DISCONNECTED');
    expect(screen?.textContent).toContain('12/12 HELD');
    expect(screen?.textContent).toContain('No health test recorded');
    await click('Handshake help');
    expect(screen?.textContent).toContain('separate Node-only CI harness');
    expect(screen?.textContent).toContain('has no listener');
  });

  it('rehearses both GETs in order, blocks replay, then prepares only an unverified local packet', async () => {
    const net = vi.spyOn(globalThis, 'fetch');
    const storage = vi.spyOn(Storage.prototype, 'setItem');
    await click('Gateway handshake & tenant gate', '.ql172-nav-button');
    await endpoint('capabilities');
    await click('Inspect fictional GET');
    expect(host.querySelector('.ql238-result')?.textContent).toContain('DENIED_SEQUENCE');
    await endpoint('health');
    await click('Inspect fictional GET');
    expect(host.querySelector('.ql238-result')?.textContent).toContain('HELD_UNVERIFIED');
    await click('Replay nonce');
    expect(host.querySelector('.ql238-result')?.textContent).toContain('DENIED_REPLAY');
    await click('Inspect fictional GET');
    await endpoint('capabilities');
    await click('Inspect fictional GET');
    expect(host.querySelector('.ql238-result')?.textContent).toContain('HELD_UNVERIFIED');
    await click('Acknowledge locally');
    await click('Prepare local packet');
    expect(host.textContent).toContain('LOCAL PACKET PREPARED · STILL HELD');
    expect(host.textContent).toContain('real gateway connection: DISCONNECTED');
    expect(net).not.toHaveBeenCalled();
    expect(storage).not.toHaveBeenCalled();
  });

  it('rejects mock wrong-tenant/wrong-company and does not leak a stored packet when switching companies', async () => {
    await click('Gateway handshake & tenant gate', '.ql172-nav-button');
    await click('Inspect fictional GET');
    expect(host.querySelector('.ql238-result')?.textContent).toContain('HELD_UNVERIFIED');
    await click('iCamp', '.ql172-brand');
    expect(host.querySelector('[data-ql238-release]')?.getAttribute('data-company')).toBe('icamp');
    expect(host.querySelector('.ql238-result')?.textContent).toContain('No health test recorded');
    const rosieRow = [...host.querySelectorAll('table tbody tr')].find(row => row.textContent?.includes('Rosie Dazzlers'));
    expect(rosieRow?.textContent).toContain('HELD_UNVERIFIED');
    await click('Wrong business · deny');
    expect(host.querySelector('.ql238-result')?.textContent).toContain('DENIED_BUSINESS');
    await click('Wrong tenant · deny');
    expect(host.querySelector('.ql238-result')?.textContent).toContain('DENIED_TENANT');
    await click('Direct route · deny');
    expect(host.querySelector('.ql238-result')?.textContent).toContain('DENIED_ROUTE');
    await click('Reset this business');
    expect(host.querySelector('.ql238-result')?.textContent).toContain('No health test recorded');
    expect(rosieRow?.textContent).toContain('HELD_UNVERIFIED');
  });

  it('retains visible focus and mobile styles for accessibility', () => {
    const css = readFileSync('src/operator/ql238-handshake-readiness.css', 'utf8');
    expect(css).toContain(':focus-visible');
    expect(css).toContain('@media (max-width: 650px)');
    expect(css).toContain('@media (forced-colors: active)');
  });
});
