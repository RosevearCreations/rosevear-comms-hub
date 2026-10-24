// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OperatorShell } from '../OperatorShell';
import { Ql185PrivateDataBlueprintPreview } from '../Ql185PrivateDataBlueprintPreview';
import { assessQl185Lifecycle, QL185_ACTIONS, QL185_CATEGORIES, QL185_DECISIONS_HELD,
  QL185_LIFECYCLE, QL185_STORAGE_RISKS, QL185_VERSION } from '../ql185PrivateDataBlueprint';

const brands = ['rosiedazzlers', 'devilndove'] as const;
const request = (brand: typeof brands[number]) => ({ targetBrand: brand, categoryId: 'contact_identity', action: 'retain' });

describe('QL-185 private-data minimization & retention — pure, held model', () => {
  it('maps exactly the seven known schema/synthetic classes and all six lifecycle actions', () => {
    expect(QL185_VERSION).toBe('ql185-private-data-minimization-retention-blueprint-v1');
    expect(QL185_CATEGORIES).toHaveLength(7);
    expect(new Set(QL185_CATEGORIES.map(item => item.id)).size).toBe(7);
    expect(QL185_CATEGORIES.filter(item => item.classification === 'synthetic_public')).toHaveLength(1);
    expect(QL185_CATEGORIES.every(item => item.existingFields && item.currentSurface && item.proposedMinimization && item.futureBoundary)).toBe(true);
    expect(QL185_ACTIONS).toEqual(['collect', 'view', 'export', 'correct', 'delete', 'retain']);
    expect(Object.keys(QL185_LIFECYCLE)).toHaveLength(6);
    expect(QL185_DECISIONS_HELD).toHaveLength(6);
  });

  it('maps browser-local database, full JSON export/import and unsafe reset semantics without claiming deletion', () => {
    expect(QL185_STORAGE_RISKS.map(row => row.source)).toEqual([
      'QL-004 localStorage', 'QL-004 JSON export', 'QL-004 JSON import', 'QL-004 reset'
    ]);
    const repository = readFileSync('src/storage/localRepository.ts', 'utf8');
    expect(repository).toContain('window.localStorage.setItem');
    expect(repository).toContain('return JSON.stringify(db, null, 2)');
    expect(repository).toContain('return { ok: true, db: saveHubDb(parsed) }');
    expect(repository).toContain('export function resetHubDb()');
  });

  for (const brand of brands) {
    it(`${brand} yields no real authorization or policy dates for any category/action pair`, () => {
      for (const item of QL185_CATEGORIES) for (const action of QL185_ACTIONS) {
        const result = assessQl185Lifecycle(brand, { targetBrand: brand, categoryId: item.id, action });
        expect(result).toMatchObject({ version: QL185_VERSION, disposition: 'PLANNING_ONLY_HELD',
          targetBrand: brand, category: item.id, action, classification: item.classification,
          retentionMinimum: null, retentionMaximum: null, retentionApproved: false,
          exportAuthorized: false, deletionPerformed: false, actualPrivateDataActionAllowed: false,
          livePilotAuthorized: false, heldPrerequisites: 12, realRecordsRead: 0,
          storageWrites: 0, networkRequests: 0, customerExports: 0, customerDeletions: 0,
          ownerApprovals: 0 });
        expect(result.proposedSafeguard).toContain(QL185_LIFECYCLE[action]);
      }
    });

    it(`${brand} rejects cross-brand even for synthetic samples and never exposes a foreign category`, () => {
      const other = brand === 'rosiedazzlers' ? 'devilndove' : 'rosiedazzlers';
      for (const categoryId of ['contact_identity', 'public_synthetic']) {
        expect(assessQl185Lifecycle(brand, { targetBrand: other, categoryId, action: 'export' })).toMatchObject({
          disposition: 'CROSS_BRAND_REJECTED', targetBrand: null, category: null, action: null,
          classification: null, customerExports: 0, actualPrivateDataActionAllowed: false
        });
      }
    });
  }

  it('fails closed for malformed IDs, forged approvals, extra properties, arrays and prototypes', () => {
    for (const [brand, input] of [
      ['invalid-brand', request('rosiedazzlers')],
      ['rosiedazzlers', { ...request('rosiedazzlers'), action: 'purge_now' }],
      ['rosiedazzlers', { ...request('rosiedazzlers'), categoryId: 'passport' }],
      ['rosiedazzlers', { ...request('rosiedazzlers'), targetBrand: 'personal' }],
      ['rosiedazzlers', { ...request('rosiedazzlers'), approvedByOwner: true }],
      ['rosiedazzlers', { ...request('rosiedazzlers'), customerData: 'test' }],
      ['rosiedazzlers', { targetBrand: 'rosiedazzlers', categoryId: 'contact_identity' }],
      ['rosiedazzlers', null],
      ['rosiedazzlers', []],
      ['rosiedazzlers', Object.create({ targetBrand: 'rosiedazzlers' })]
    ] as const) {
      expect(assessQl185Lifecycle(brand, input)).toMatchObject({ disposition: 'INVALID_BLUEPRINT_REQUEST',
        targetBrand: null, category: null, action: null, classification: null,
        retentionApproved: false, customerExports: 0, customerDeletions: 0, ownerApprovals: 0 });
    }
  });
});

let host: HTMLDivElement;
let root: Root;
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  host = document.createElement('div'); document.body.append(host);
  root = createRoot(host);
  await act(async () => root.render(<Ql185PrivateDataBlueprintPreview brandId="rosiedazzlers" />));
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.restoreAllMocks(); });

async function select(id: string, value: string) {
  await act(async () => {
    const control = host.querySelector<HTMLSelectElement>(`#${id}`)!;
    control.value = value;
    control.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

describe('QL-185 in-memory accessible policy preview', () => {
  it('shows clearly held policy, 7 classes, labeled controls, retention unset and expandable help', () => {
    expect(host.textContent).toContain('Private data minimization & retention blueprint');
    expect(host.textContent).toContain('POLICY PLANNING ONLY · ALL PRIVATE ACTIONS HELD');
    expect(host.textContent).toContain('NOT SET / NOT SET');
    expect(host.textContent).toContain('Live-pilot holds: 12');
    expect(host.querySelectorAll('.ql185-controls label[for]')).toHaveLength(3);
    expect(host.querySelectorAll('.ql185-table-wrap tbody tr')).toHaveLength(7);
    expect(host.querySelectorAll('.ql185-help summary')).toHaveLength(2);
    expect(host.querySelector('.ql185-result[aria-live="polite"][role="status"]')).not.toBeNull();
  });

  it('simulates export, delete and retention policy without storage or network side effects', async () => {
    const storage = vi.spyOn(Storage.prototype, 'setItem');
    const remove = vi.spyOn(Storage.prototype, 'removeItem');
    const network = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
    for (const action of ['export', 'delete', 'retain']) {
      await select('ql185-action', action);
      expect(host.textContent).toContain('POLICY PLANNING ONLY · ALL PRIVATE ACTIONS HELD');
      expect(host.textContent).toContain('Exports: 0 · Deletions: 0');
    }
    await select('ql185-category', 'audit_details');
    expect(host.textContent).toContain('AuditEvent.details');
    await select('ql185-brand', 'devilndove');
    expect(host.textContent).toContain('CROSS-BRAND REVIEW REJECTED');
    expect(host.textContent).not.toContain('AuditEvent.details');
    expect(storage).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
    expect(network).not.toHaveBeenCalled();
  });

  it('changing business remounts an unprivileged, default policy preview', async () => {
    await select('ql185-category', 'conversation_content');
    await select('ql185-action', 'export');
    await act(async () => root.render(<Ql185PrivateDataBlueprintPreview key="devilndove" brandId="devilndove" />));
    expect(host.querySelector<HTMLSelectElement>('#ql185-brand')?.value).toBe('devilndove');
    expect(host.querySelector<HTMLSelectElement>('#ql185-category')?.value).toBe('contact_identity');
    expect(host.querySelector<HTMLSelectElement>('#ql185-action')?.value).toBe('retain');
    expect(host.textContent).toContain('Review QL-004 data fields, browser storage risks and proposed lifecycle safeguards for Devil n Dove');
  });

  it('appears in safety workspace next to unchanged QL-184 and QL-181 gates', async () => {
    await act(async () => root.render(<OperatorShell key="full-shell" />));
    const safety = [...host.querySelectorAll<HTMLButtonElement>('.ql172-nav-button')]
      .find(button => button.textContent?.includes('Safety & hold review'))!;
    await act(async () => safety.click());
    expect(host.querySelector('.ql185-blueprint')).not.toBeNull();
    expect(host.querySelector('.ql184-permissions')).not.toBeNull();
    expect(host.querySelector('.ql181-gate')?.textContent).toContain('LIVE PILOT HELD');
  });

  it('includes keyboard focus, touch targets, narrow breakpoints and forced-colour support', () => {
    const css = readFileSync('src/operator/ql185-private-data-blueprint.css', 'utf8');
    expect(css).toContain('min-height:44px');
    expect(css).toContain('max-width:700px');
    expect(css).toContain('max-width:375px');
    expect(css).toContain('forced-colors:active');
    expect(css).toContain(':focus-visible');
  });
});
