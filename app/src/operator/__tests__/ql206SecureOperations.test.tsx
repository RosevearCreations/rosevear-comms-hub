// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { OperatorShell } from '../OperatorShell';
import { connectorContracts } from '../ql199ConnectorContracts';
import { buildMockReviewQueue } from '../ql204HandoffReviewQueue';
import { assessMockHandoffSecurity, mockOperatorProfiles, type MockOperatorProfile, type MockSecurityOperation } from '../ql206SecureOperations';
import type { OrganizationId } from '../ql191Organizations';

const identities = Object.fromEntries(mockOperatorProfiles.map((profile) => [profile.id, profile])) as Record<string, MockOperatorProfile>;
function itemFor(organizationId: OrganizationId, id?: string) {
  const queue = buildMockReviewQueue(organizationId, connectorContracts[organizationId]);
  if (!queue.ok) throw new Error('Missing mock queue');
  const item = id ? queue.items.find((entry) => entry.id === id) : queue.items[0];
  if (!item) throw new Error(`Missing mock item ${organizationId}/${id}`);
  return item;
}
function check(org: OrganizationId, persona: string, operation: MockSecurityOperation, item = itemFor(org)) {
  return assessMockHandoffSecurity(org, connectorContracts[org], identities[persona], item, operation);
}

describe('QL-206 four-company role and tenant design tests', () => {
  it('denies unsigned and cross-company simulated profiles, including the owner role', () => {
    for (const org of ['rosiedazzlers', 'devilndove', 'icamp', 'yw'] as OrganizationId[]) {
      expect(check(org, 'signed-out', 'inspect_summary').reason).toBe('unverified_identity');
      expect(check(org, 'dnd-owner', 'inspect_summary').runtime).toBe('disabled');
      if (org !== 'devilndove') expect(check(org, 'dnd-owner', 'inspect_summary').reason).toBe('company_scope');
    }
    expect(check('devilndove', 'rosie-manager', 'prepare_packet').designAllows).toBe(false);
    expect(check('rosiedazzlers', 'dnd-owner', 'prepare_packet').designAllows).toBe(false);
  });

  it('models least-privilege review operations but never grants runtime access', () => {
    expect(check('rosiedazzlers', 'rosie-viewer', 'inspect_summary').designAllows).toBe(true);
    expect(check('rosiedazzlers', 'rosie-viewer', 'edit_rehearsal').reason).toBe('role_scope');
    expect(check('rosiedazzlers', 'rosie-reviewer', 'edit_rehearsal').designAllows).toBe(true);
    expect(check('rosiedazzlers', 'rosie-reviewer', 'prepare_packet').reason).toBe('role_scope');
    for (const org of ['rosiedazzlers', 'devilndove', 'icamp', 'yw'] as OrganizationId[]) {
      const who = { rosiedazzlers: 'rosie-manager', devilndove: 'dnd-owner', icamp: 'camp-rosevear-manager', yw: 'yw-rosevear-manager' }[org];
      const allowed = check(org, who, 'prepare_packet');
      expect(allowed).toMatchObject({ designAllows: true, reason: 'design_only', runtime: 'disabled', verifiedIdentity: false });
      expect(check(org, who, 'send_message')).toMatchObject({ designAllows: false, reason: 'external_disabled', runtime: 'disabled' });
    }
  });

  it('isolates campground tenants and YW company/property scopes', () => {
    expect(check('icamp', 'camp-rosevear-reviewer', 'edit_rehearsal').designAllows).toBe(true);
    expect(check('icamp', 'camp-isolated-manager', 'prepare_packet').reason).toBe('tenant_scope');
    expect(check('yw', 'yw-isolated-manager', 'prepare_packet').reason).toBe('tenant_scope');
    expect(check('yw', 'yw-property-a-reviewer', 'edit_rehearsal', itemFor('yw', 'yw-demo-septic')).designAllows).toBe(true);
    expect(check('yw', 'yw-property-a-reviewer', 'edit_rehearsal', itemFor('yw', 'yw-demo-snow')).reason).toBe('property_scope');
    expect(check('yw', 'yw-rosevear-manager', 'prepare_packet', itemFor('yw', 'yw-demo-snow')).designAllows).toBe(true);
  });

  it('rejects altered, held, cross-company, wrong-contract and invented personas', () => {
    const original = itemFor('yw');
    const altered = { ...original, reference: 'DEMO-SPOOFED' };
    expect(check('yw', 'yw-rosevear-manager', 'inspect_summary', altered).reason).toBe('invalid_source');
    expect(check('yw', 'yw-rosevear-manager', 'inspect_summary', { ...original, id: 'yw-demo-tree-held' }).reason).toBe('invalid_source');
    expect(assessMockHandoffSecurity('yw', connectorContracts.yw, identities['yw-rosevear-manager'], itemFor('rosiedazzlers'), 'inspect_summary').reason).toBe('invalid_source');
    expect(assessMockHandoffSecurity('yw', connectorContracts.icamp, identities['yw-rosevear-manager'], original, 'inspect_summary').reason).toBe('invalid_source');
    expect(assessMockHandoffSecurity('yw', connectorContracts.yw, { ...identities['yw-rosevear-manager'] }, original, 'inspect_summary').reason).toBe('unknown_profile');
    expect(check('yw', 'yw-rosevear-manager', 'nonexistent' as MockSecurityOperation).reason).toBe('external_disabled');
  });
});

let host: HTMLDivElement;
let root: Root;
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
  await act(async () => root.render(<OperatorShell />));
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); });
async function click(label: string, selector = 'button') {
  const button = [...host.querySelectorAll<HTMLButtonElement>(selector)].find((node) => node.textContent?.includes(label));
  if (!button) throw Error(`Missing button ${label}`);
  await act(async () => button.click());
}
async function choose(selector: string, value: string) {
  const select = host.querySelector<HTMLSelectElement>(selector);
  if (!select) throw Error(`Missing select ${selector}`);
  await act(async () => { const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')!.set!; setter.call(select, value); select.dispatchEvent(new Event('change', { bubbles: true })); });
}

describe('QL-206 operator security rehearsal screen', () => {
  it('tests and logs only local fictional policy decisions, resetting on company change', async () => {
    await click('Connector centre', '.ql172-nav-button');
    expect(host.querySelector('[data-ql206-release="ql206-four-company-secure-operations-mock-v1"]')).not.toBeNull();
    expect(host.textContent).toContain('DESIGN DENIED · RUNTIME DENIED');
    await click('ⓘ Help', '.ql206-heading button');
    expect(host.textContent).toContain('verified identity stays NO');
    await choose('#ql206-persona', 'rosie-manager');
    await choose('#ql206-operation', 'prepare_packet');
    expect(host.textContent).toContain('DESIGN MATCH · RUNTIME DENIED');
    await click('Record simulated test');
    expect(host.textContent).toContain('Session-only test results (1)');
    await choose('#ql206-operation', 'send_message');
    expect(host.textContent).toContain('No simulated role can send');
    await click('Record simulated test');
    expect(host.textContent).toContain('Session-only test results (2)');
    await click('Clear session test log');
    expect(host.textContent).toContain('Session-only test results (0)');
    await click('iCamp', '.ql172-brand');
    expect(host.querySelector<HTMLSelectElement>('#ql206-persona')?.value).toBe('signed-out');
    expect(host.textContent).toContain('Session-only test results (0)');
    await choose('#ql206-persona', 'camp-isolated-manager');
    expect(host.textContent).toContain('assigned campground tenant does not own');
    await choose('#ql206-persona', 'camp-rosevear-manager');
    expect(host.textContent).toContain('DESIGN MATCH · RUNTIME DENIED');
    expect(host.textContent).toContain('Actual provider or database operation');
    expect(host.textContent).toContain('DISABLED');
  });
});
