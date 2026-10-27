// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { OperatorShell } from '../OperatorShell';
import { operatorOrganizations, type OrganizationId } from '../ql191Organizations';
import { QL237_COMPANY_CONTRACTS, QL237_OPTIONS, QL237_RELEASE, ROSEVEAR_INTEGRATION_CONTRACT,
  ql237Fixture, inspectQl237Event } from '../ql237IntegrationReadiness';

describe('QL-237 shared integration contract v1 — no-live preview', () => {
  it('has a distinct, allowlisted event/reference and tenant policy for each of four companies', () => {
    expect(Object.keys(QL237_COMPANY_CONTRACTS).sort()).toEqual(['devilndove', 'icamp', 'rosiedazzlers', 'yw']);
    const entities = Object.values(QL237_COMPANY_CONTRACTS).map((entry) => entry.reference);
    expect(new Set(entities).size).toBe(4);
    expect(QL237_COMPANY_CONTRACTS.icamp.tenantRequired).toBe(true);
    expect(QL237_COMPANY_CONTRACTS.yw.tenantRequired).toBe(true);
    expect(QL237_COMPANY_CONTRACTS.devilndove.events).toContain('listing.updated');
    expect(QL237_OPTIONS.every((option) => option.source.startsWith('https://'))).toBe(true);
    expect(QL237_OPTIONS.find((option) => option.id === 'twilio-trial')?.costClass).toBe('limited-free-trial');
  });

  for (const organization of operatorOrganizations) {
    it('keeps a correctly scoped ' + organization.id + ' fixture held even when local checks match', () => {
      const seen = new Set<string>();
      const now = new Date('2026-10-27T12:00:00.000Z');
      const fixture = ql237Fixture(organization.id, organization.id, now);
      expect(fixture.schema_version).toBe(ROSEVEAR_INTEGRATION_CONTRACT);
      expect(fixture.destination_system).toBe('ai-data-platform');
      const receipt = inspectQl237Event(fixture, organization.id, seen, now);
      expect(receipt.disposition).toBe('HELD_UNVERIFIED');
      expect(receipt).toMatchObject({ business: organization.id, providerDispatch: 0, liveCalls: 0,
        liveSms: 0, remoteWrites: 0, realApproval: false, realPilotHolds: 12 });
      expect(inspectQl237Event(fixture, organization.id, seen, now).disposition).toBe('REJECT_REPLAY');
    });
  }

  it('rejects mismatched business identity and direct app-to-app transfers', () => {
    const now = new Date('2026-10-27T12:00:00.000Z');
    const original = ql237Fixture('devilndove', 'cross', now);
    expect(inspectQl237Event({ ...original, business_id: 'icamp' }, 'devilndove', new Set(), now).disposition).toBe('REJECT_CROSS_BUSINESS');
    expect(inspectQl237Event({ ...original, source_system: 'icamp' }, 'devilndove', new Set(), now).disposition).toBe('REJECT_CROSS_BUSINESS');
    expect(inspectQl237Event({ ...original, destination_system: 'rosevear-comms-hub' }, 'devilndove', new Set(), now).disposition).toBe('REJECT_DIRECT_ROUTE');
  });

  it('rejects missing, mismatched or unexpected company/campground tenant IDs', () => {
    const now = new Date('2026-10-27T12:00:00.000Z');
    for (const id of ['yw', 'icamp'] as OrganizationId[]) {
      const fixture = ql237Fixture(id, id, now);
      expect(inspectQl237Event({ ...fixture, tenant_id: null }, id, new Set(), now).disposition).toBe('REJECT_TENANT_SCOPE');
      expect(inspectQl237Event({ ...fixture, tenant_id: 'demo-wrong-tenant' }, id, new Set(), now).disposition).toBe('REJECT_TENANT_SCOPE');
    }
    const rosie = ql237Fixture('rosiedazzlers', 'test', now);
    expect(inspectQl237Event({ ...rosie, tenant_id: 'demo-campground' }, 'rosiedazzlers', new Set(), now).disposition).toBe('REJECT_TENANT_SCOPE');
  });

  it('rejects stale timestamps, invalid schema, unauthorized commands and foreign references', () => {
    const now = new Date('2026-10-27T12:00:00.000Z');
    const fixture = ql237Fixture('devilndove', 'command', now);
    const seen = new Set<string>();
    expect(inspectQl237Event({ ...fixture, occurred_at: '2020-01-01T00:00:00Z' }, 'devilndove', seen, now).disposition).toBe('REJECT_STALE_TIMESTAMP');
    expect(inspectQl237Event({ ...fixture, schema_version: 'bad' as typeof ROSEVEAR_INTEGRATION_CONTRACT }, 'devilndove', seen, now).disposition).toBe('REJECT_SCHEMA');
    expect(inspectQl237Event({ ...fixture, event_type: 'product.update_command' }, 'devilndove', seen, now).disposition).toBe('REJECT_CAPABILITY');
    expect(inspectQl237Event({ ...fixture, payload: { reference: 'demo-other-product' } }, 'devilndove', seen, now).disposition).toBe('REJECT_CAPABILITY');
    expect(seen.size).toBe(0);
  });
});

let root: Root;
let host: HTMLDivElement;
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
  await act(async () => root.render(<OperatorShell />));
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.restoreAllMocks(); });

async function clickContaining(text: string, selector = 'button') {
  const button = [...host.querySelectorAll<HTMLButtonElement>(selector)].find((item) => item.textContent?.includes(text));
  if (!button) throw new Error('Missing button ' + text);
  await act(async () => button.click());
}

describe('QL-237 operator integration options', () => {
  it('makes free options, copyable handoff and visible unchanged hold accessible from the shell', async () => {
    await clickContaining('Free phone options & integration v1', '.ql172-nav-button');
    const section = host.querySelector<HTMLElement>('[data-ql237-release]');
    expect(section?.getAttribute('data-ql237-release')).toBe(QL237_RELEASE);
    expect(section?.textContent).toContain('DISABLED PREVIEW');
    expect(section?.textContent).toContain('Cloudflare form + incoming email');
    expect(section?.textContent).toContain('Twilio trial');
    expect(section?.textContent).toContain('Asterisk / FreePBX');
    expect(section?.textContent).toContain('AI Data Platform');
    expect(section?.textContent).toContain('Devil n Dove');
    expect(section?.textContent).toContain('12 real QL-181 pilot prerequisites');
    expect(section?.querySelector<HTMLTextAreaElement>('textarea[readonly]')?.value).toContain('/api/integration/v1/health');
    expect(section?.querySelectorAll('table tbody tr')).toHaveLength(4);
    expect(section?.querySelectorAll('a[href^="https://"]')).toHaveLength(QL237_OPTIONS.length);
  });

  it('holds positive preview, denies replay, cross-business, wrong tenant, remote route and command without network', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    const storageMock = vi.spyOn(Storage.prototype, 'setItem');
    await clickContaining('Free phone options & integration v1', '.ql172-nav-button');
    await clickContaining('Inspect fictional reference event');
    expect(host.querySelector('.ql237-receipt')?.textContent).toContain('HELD_UNVERIFIED');
    await clickContaining('Repeat same event');
    expect(host.querySelector('.ql237-receipt')?.textContent).toContain('REJECT_REPLAY');
    await clickContaining('Try wrong business');
    expect(host.querySelector('.ql237-receipt')?.textContent).toContain('REJECT_CROSS_BUSINESS');
    await clickContaining('Try wrong tenant');
    expect(host.querySelector('.ql237-receipt')?.textContent).toContain('REJECT_TENANT_SCOPE');
    await clickContaining('Try direct app route');
    expect(host.querySelector('.ql237-receipt')?.textContent).toContain('REJECT_DIRECT_ROUTE');
    await clickContaining('Try unauthorized command');
    expect(host.querySelector('.ql237-receipt')?.textContent).toContain('REJECT_CAPABILITY');
    expect(host.querySelector('.ql237-receipt')?.textContent).toContain('dispatch 0');
    expect(fetchMock).not.toHaveBeenCalled();
    expect(storageMock).not.toHaveBeenCalled();
  });

  it('resets the demonstration on company change and blocks a missing campground tenant', async () => {
    await clickContaining('Free phone options & integration v1', '.ql172-nav-button');
    await clickContaining('Inspect fictional reference event');
    await clickContaining('iCamp', '.ql172-brand');
    expect(host.querySelector('[data-ql237-release]')?.getAttribute('data-company')).toBe('icamp');
    expect(host.querySelector('.ql237-receipt')?.textContent).toContain('No simulated gateway receipt yet');
    await clickContaining('Try wrong tenant');
    expect(host.querySelector('.ql237-receipt')?.textContent).toContain('REJECT_TENANT_SCOPE');
    await clickContaining('Inspect fictional reference event');
    expect(host.querySelector('.ql237-receipt')?.textContent).toContain('HELD_UNVERIFIED');
    expect(host.querySelector('#ql237-event')?.textContent).toContain('reservation.created');
  });

  it('provides mobile and keyboard visibility in stylesheet', () => {
    const css = readFileSync('src/operator/ql237-integration-options.css', 'utf8');
    expect(css).toContain('@media (max-width: 650px)');
    expect(css).toContain(':focus-visible');
    expect(css).toContain('@media (forced-colors: active)');
  });
});
