// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OperatorShell } from '../OperatorShell';
import { Ql184BrandWorkspacePermissionPreview } from '../Ql184BrandWorkspacePermissionPreview';
import { assessQl184Permission, QL184_OPERATIONS, QL184_ROLES, QL184_VERSION } from '../ql184BrandWorkspacePermissions';

const brands = ['rosiedazzlers', 'devilndove'] as const;
const request = (brand: typeof brands[number]) => ({
  role: 'admin', assignedBrands: [brand], targetBrand: brand, operationId: 'inbox_triage'
});

describe('QL-184 proposed server permission mapping — never runtime grants', () => {
  it('uses only QL-009 roles and describes all 11 uniquely identifiable operations', () => {
    expect(QL184_VERSION).toBe('ql184-brand-workspace-permission-blueprint-v1');
    expect(QL184_ROLES).toEqual(['signed_out', 'staff_readonly', 'admin', 'owner']);
    expect(QL184_OPERATIONS).toHaveLength(11);
    expect(new Set(QL184_OPERATIONS.map(operation => operation.id)).size).toBe(11);
    expect(QL184_OPERATIONS.every(operation => operation.resource && operation.action && operation.approvalBoundary)).toBe(true);
    for (const id of ['customer_export', 'provider_dispatch', 'pilot_authorize']) {
      expect(QL184_OPERATIONS.find(row => row.id === id)?.proposedRoles).toEqual([]);
    }
  });

  for (const brand of brands) {
    it(`${brand}: same-brand admin can match a proposed internal triage, but actual access remains denied`, () => {
      const result = assessQl184Permission(brand, request(brand));
      expect(result).toMatchObject({ version: QL184_VERSION, disposition: 'DESIGN_ALLOWED_RUNTIME_HELD',
        proposedDesignAllows: true, actualRuntimeAllows: false, brandId: brand, targetBrand: brand,
        verifiedSession: false, livePilotAuthorized: false, heldPrerequisites: 12,
        customerRecordsRead: 0, supabaseMutations: 0, callsPlaced: 0, messagesSent: 0, ownerApprovals: 0 });
      expect(result.pendingSecurityReviews).toHaveLength(5);
    });

    it(`${brand}: staff read-only cannot triage or prepare drafts; owner role is not an approval`, () => {
      const staff = { ...request(brand), role: 'staff_readonly' };
      expect(assessQl184Permission(brand, staff)).toMatchObject({ disposition: 'DESIGN_DENIED_RUNTIME_HELD', proposedDesignAllows: false });
      expect(assessQl184Permission(brand, { ...staff, operationId: 'draft_prepare' }).proposedDesignAllows).toBe(false);
      expect(assessQl184Permission(brand, { ...staff, operationId: 'inbox_read' }).proposedDesignAllows).toBe(true);
      for (const id of ['customer_export', 'provider_dispatch', 'pilot_authorize']) {
        expect(assessQl184Permission(brand, { ...request(brand), role: 'owner', operationId: id })).toMatchObject({
          disposition: 'DESIGN_DENIED_RUNTIME_HELD', proposedDesignAllows: false, actualRuntimeAllows: false,
          livePilotAuthorized: false, ownerApprovals: 0
        });
      }
    });

    it(`${brand}: assigned scope is required, and two-brand owner has no implicit cross-brand hop`, () => {
      const other = brand === 'rosiedazzlers' ? 'devilndove' : 'rosiedazzlers';
      expect(assessQl184Permission(brand, { ...request(brand), assignedBrands: [] }).proposedDesignAllows).toBe(false);
      expect(assessQl184Permission(brand, { ...request(brand), assignedBrands: [other] }).proposedDesignAllows).toBe(false);
      const cross = assessQl184Permission(brand, { role: 'owner', assignedBrands: [...brands], targetBrand: other, operationId: 'inbox_read' });
      expect(cross).toMatchObject({ disposition: 'DESIGN_DENIED_RUNTIME_HELD', proposedDesignAllows: false, actualRuntimeAllows: false });
      expect(cross.reason).toContain('Cross-brand access denied');
      expect(assessQl184Permission(other, { role: 'owner', assignedBrands: [...brands], targetBrand: other, operationId: 'inbox_read' }).proposedDesignAllows).toBe(true);
    });
  }

  it('unidentified roles and malformed/tampered requests fail closed without projecting private roles or targets', () => {
    for (const [active, candidate] of [
      ['bogus', request('rosiedazzlers')],
      ['rosiedazzlers', { ...request('rosiedazzlers'), role: 'superuser' }],
      ['rosiedazzlers', { ...request('rosiedazzlers'), assignedBrands: ['rosiedazzlers', 'rosiedazzlers'] }],
      ['rosiedazzlers', { ...request('rosiedazzlers'), assignedBrands: ['unknown'] }],
      ['rosiedazzlers', { ...request('rosiedazzlers'), targetBrand: 'personal' }],
      ['rosiedazzlers', { ...request('rosiedazzlers'), operationId: 'database_write' }],
      ['rosiedazzlers', { ...request('rosiedazzlers'), verifiedSession: true }],
      ['rosiedazzlers', Object.create({ inherited: true })],
      ['rosiedazzlers', null],
      ['rosiedazzlers', []]
    ] as const) {
      expect(assessQl184Permission(active, candidate)).toMatchObject({ disposition: 'INVALID_PREVIEW_REQUEST',
        proposedDesignAllows: false, actualRuntimeAllows: false, role: null, brandId: null,
        targetBrand: null, operation: null, customerRecordsRead: 0, ownerApprovals: 0 });
    }
  });

  it('all combinations preserve runtime denial even when design scope/role agrees', () => {
    for (const active of brands) for (const role of QL184_ROLES) for (const targetBrand of brands) for (const operation of QL184_OPERATIONS) {
      const result = assessQl184Permission(active, {
        role, assignedBrands: [...brands], targetBrand, operationId: operation.id
      });
      expect(result.actualRuntimeAllows).toBe(false);
      expect(result.livePilotAuthorized).toBe(false);
      expect(result.customerRecordsRead + result.supabaseMutations + result.callsPlaced + result.messagesSent + result.ownerApprovals).toBe(0);
      if (role === 'signed_out' || targetBrand !== active || operation.proposedRoles.length === 0) {
        expect(result.proposedDesignAllows).toBe(false);
      }
    }
  });
});

let host: HTMLDivElement;
let root: Root;
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  host = document.createElement('div'); document.body.append(host);
  root = createRoot(host);
  await act(async () => root.render(<Ql184BrandWorkspacePermissionPreview brandId="rosiedazzlers" />));
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.restoreAllMocks(); });

async function select(id: string, value: string) {
  await act(async () => {
    const control = host.querySelector<HTMLSelectElement>(`#${id}`)!;
    control.value = value;
    control.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

describe('QL-184 accessible synthetic permission preview', () => {
  it('defaults to denial, labels every selector, shows matrix and held runtime boundary', () => {
    expect(host.textContent).toContain('Brand workspace permission blueprint');
    expect(host.textContent).toContain('DESIGN DENIED · RUNTIME DENIED');
    expect(host.textContent).toContain('Real access granted: NO');
    expect(host.textContent).toContain('Live-pilot prerequisites: 12 HELD');
    expect(host.querySelectorAll('.ql184-controls label[for]')).toHaveLength(4);
    expect(host.querySelectorAll('.ql184-table-wrap tbody tr')).toHaveLength(11);
    expect(host.querySelector('table caption')?.textContent).toContain('not effective permissions');
    expect(host.querySelector('.ql184-result[role="status"][aria-live="polite"]')).not.toBeNull();
    expect(host.querySelector('.ql184-help summary')?.textContent).toContain('ⓘ');
  });

  it('role, scope, target and action selections remain entirely in-memory and no real permissions appear', async () => {
    const storage = vi.spyOn(Storage.prototype, 'setItem');
    const network = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
    await select('ql184-role', 'admin');
    await select('ql184-scope', 'rosie');
    await select('ql184-operation', 'inbox_triage');
    expect(host.textContent).toContain('DESIGN MATCH ONLY · RUNTIME DENIED');
    await select('ql184-target', 'devilndove');
    expect(host.textContent).toContain('Cross-brand access denied');
    await select('ql184-target', 'rosiedazzlers');
    await select('ql184-operation', 'provider_dispatch');
    expect(host.textContent).toContain('DESIGN DENIED · RUNTIME DENIED');
    expect(host.textContent).toContain('Phone/SMS sent: 0');
    expect(storage).not.toHaveBeenCalled();
    expect(network).not.toHaveBeenCalled();
  });

  it('business remount discards illustrative role choices and prevents a foreign business context', async () => {
    await select('ql184-role', 'owner');
    await select('ql184-scope', 'both');
    await act(async () => root.render(<Ql184BrandWorkspacePermissionPreview key="devilndove" brandId="devilndove" />));
    expect(host.querySelector<HTMLSelectElement>('#ql184-role')?.value).toBe('signed_out');
    expect(host.querySelector<HTMLSelectElement>('#ql184-scope')?.value).toBe('none');
    expect(host.querySelector<HTMLSelectElement>('#ql184-target')?.value).toBe('devilndove');
    expect(host.textContent).toContain('Active workspace: Devil n Dove');
    expect(host.textContent).toContain('RUNTIME DENIED');
  });

  it('is integrated into the real safety workspace and retains the QL-181 live hold', async () => {
    await act(async () => root.render(<OperatorShell key="full-shell" />));
    const safety = [...host.querySelectorAll<HTMLButtonElement>('.ql172-nav-button')].find(b => b.textContent?.includes('Safety & hold review'))!;
    await act(async () => safety.click());
    expect(host.querySelector('.ql184-permissions')).not.toBeNull();
    expect(host.querySelector('.ql181-gate')?.textContent).toContain('LIVE PILOT HELD');
    const other = [...host.querySelectorAll<HTMLButtonElement>('.ql172-brand')].find(b => b.textContent?.includes('Devil n Dove'))!;
    await act(async () => other.click());
    expect(host.querySelector<HTMLSelectElement>('#ql184-role')?.value).toBe('signed_out');
    expect(host.querySelector<HTMLSelectElement>('#ql184-target')?.value).toBe('devilndove');
  });

  it('includes accessible touch sizes, focus, responsive wrapping and forced-colours rules', () => {
    const css = readFileSync('src/operator/ql184-brand-workspace-permissions.css', 'utf8');
    expect(css).toContain('min-height:44px');
    expect(css).toContain('max-width:700px');
    expect(css).toContain('max-width:375px');
    expect(css).toContain('forced-colors:active');
    expect(css).toContain(':focus-visible');
  });
});
