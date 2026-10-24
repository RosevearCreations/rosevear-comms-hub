// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { migrateQl173SyntheticFixtures } from '../../fixtures/ql173CanonicalSynthetic';
import { Ql181PrivacyPilotGatePreview } from '../Ql181PrivacyPilotGatePreview';
import {
  QL181_GATE_VERSION, QL181_PREREQUISITES, evaluateQl181LivePilotGate,
  type Ql181GateRequest
} from '../ql181PrivacyPilotGate';

const migration = migrateQl173SyntheticFixtures();
const request = (change: Partial<Ql181GateRequest> = {}): Ql181GateRequest => ({
  prospectiveBrandId: 'rosiedazzlers', illustrativeRole: 'signed_out', readOnlyReviewedIds: [], ...change
});

describe('QL-181 immutable prerequisite and role-read gate', () => {
  it('pins twelve non-duplicate reviewed future prerequisites, each HELD with a reviewer and source path', () => {
    expect(migration.verified).toBe(true);
    expect(QL181_PREREQUISITES).toHaveLength(12);
    expect(new Set(QL181_PREREQUISITES.map(row => row.id)).size).toBe(12);
    expect(QL181_PREREQUISITES.every(row => row.state === 'HELD_UNVERIFIED' && Boolean(row.reviewer) &&
      (row.sourcePath.startsWith('app/') || row.sourcePath.startsWith('docs/')))).toBe(true);
    expect(new Set(QL181_PREREQUISITES.map(row => row.category)).size).toBe(4);
  });

  it('never enables a live capability for signed-out, staff, admin or owner role projections', () => {
    for (const illustrativeRole of ['signed_out', 'staff_readonly', 'admin', 'owner'] as const) {
      const result = evaluateQl181LivePilotGate(migration, 'rosiedazzlers', request({ illustrativeRole }));
      expect(result).toMatchObject({ version: QL181_GATE_VERSION, disposition: 'LIVE_PILOT_HELD',
        liveCapabilities: [], livePilotAuthorized: false, realOwnerDecisionCaptured: false,
        verifiedCustomerConsent: false, liveProviderEnabled: false, storedReviewEvidence: false, syntheticOnly: true });
      expect(result.heldPrerequisiteIds).toHaveLength(12);
    }
  });

  it('projects minimal synthetic-only permissions, never treating role selection as authentication', () => {
    const signedOut = evaluateQl181LivePilotGate(migration, 'rosiedazzlers', request());
    const staff = evaluateQl181LivePilotGate(migration, 'rosiedazzlers', request({ illustrativeRole: 'staff_readonly' }));
    const admin = evaluateQl181LivePilotGate(migration, 'rosiedazzlers', request({ illustrativeRole: 'admin' }));
    expect(signedOut.syntheticCapabilities).toHaveLength(0);
    expect(staff.syntheticCapabilities).toEqual(['view_synthetic_samples', 'read_prerequisite_matrix']);
    expect(admin.syntheticCapabilities).toContain('inspect_own_brand_mock_reviews');
    expect(admin.liveCapabilities).toHaveLength(0);
    expect(admin.blockedReasons.join(' ')).toContain('not a verified logged-in account');
  });

  it('reading every explanation never clears one hold, records owner consent or enables dispatch', () => {
    const ids = QL181_PREREQUISITES.map(row => row.id);
    const result = evaluateQl181LivePilotGate(migration, 'rosiedazzlers', request({
      illustrativeRole: 'owner', readOnlyReviewedIds: ids
    }));
    expect(result.reviewedExplanationsOnly).toEqual(ids);
    expect(result.heldPrerequisiteIds).toEqual(ids);
    expect(result.disposition).toBe('LIVE_PILOT_HELD');
    expect(result.livePilotAuthorized).toBe(false);
    expect(result.realOwnerDecisionCaptured).toBe(false);
    expect(result.verifiedCustomerConsent).toBe(false);
  });

  it('accepts a same-brand Devil n Dove illustrative role but still holds every pilot requirement', () => {
    const result = evaluateQl181LivePilotGate(migration, 'devilndove', {
      prospectiveBrandId: 'devilndove', illustrativeRole: 'owner', readOnlyReviewedIds: ['identity-mfa', 'brand-rls']
    });
    expect(result).toMatchObject({ disposition: 'LIVE_PILOT_HELD', brandId: 'devilndove', reviewedExplanationsOnly: ['identity-mfa', 'brand-rls'] });
    expect(result.heldPrerequisiteIds).toHaveLength(12);
  });

  it('blocks cross-brand role selection even if a role appears privileged', () => {
    const denied = evaluateQl181LivePilotGate(migration, 'rosiedazzlers', request({
      prospectiveBrandId: 'devilndove', illustrativeRole: 'owner'
    }));
    expect(denied).toMatchObject({ disposition: 'INVALID_PREVIEW_SCOPE', brandId: null, illustrativeRole: null,
      syntheticCapabilities: [], liveCapabilities: [], livePilotAuthorized: false });
  });

  it('rejects unknown roles, added permission fields, invalid review flags and duplicates', () => {
    const invalid: unknown[] = [null, [], {},
      { ...request(), illustrativeRole: 'superadmin' },
      { ...request(), livePilotAuthorized: true },
      { ...request(), readOnlyReviewedIds: ['owner-signoff', 'owner-signoff'] },
      { ...request(), readOnlyReviewedIds: ['nonexistent'] },
      { ...request(), readOnlyReviewedIds: 'owner-signoff' },
      { ...request(), readOnlyReviewedIds: ['__proto__'] },
      { ...request(), readOnlyReviewedIds: Array(13).fill('secrets') }
    ];
    for (const candidate of invalid) {
      const result = evaluateQl181LivePilotGate(migration, 'rosiedazzlers', candidate);
      expect(result.disposition).toBe('INVALID_PREVIEW_SCOPE');
      expect(result.livePilotAuthorized).toBe(false);
      expect(result.syntheticCapabilities).toHaveLength(0);
      expect(result.reviewedExplanationsOnly).toHaveLength(0);
    }
  });

  it('fails closed on unverified/tampered QL-173 fixtures', () => {
    const disabled = { ...migration, verified: false };
    expect(evaluateQl181LivePilotGate(disabled, 'rosiedazzlers', request()).disposition).toBe('INVALID_PREVIEW_SCOPE');
    const drifted = structuredClone(migration);
    drifted.snapshot.messages[0].humanApproved = true;
    expect(evaluateQl181LivePilotGate(drifted, 'rosiedazzlers', request()).disposition).toBe('INVALID_PREVIEW_SCOPE');
  });

  it('does not mutate the source snapshot or change catalog state after any role or review count', () => {
    const initial = JSON.stringify(migration.snapshot);
    const catalog = JSON.stringify(QL181_PREREQUISITES);
    for (const illustrativeRole of ['owner', 'admin', 'staff_readonly', 'signed_out'] as const) {
      evaluateQl181LivePilotGate(migration, 'rosiedazzlers', request({
        illustrativeRole, readOnlyReviewedIds: QL181_PREREQUISITES.map(row => row.id)
      }));
    }
    expect(JSON.stringify(migration.snapshot)).toBe(initial);
    expect(JSON.stringify(QL181_PREREQUISITES)).toBe(catalog);
  });
});

let host: HTMLDivElement;
let root: Root;
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  host = document.createElement('div'); document.body.append(host);
  root = createRoot(host);
  await act(async () => root.render(<Ql181PrivacyPilotGatePreview brandId="rosiedazzlers" />));
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.restoreAllMocks(); });

async function changeRole(value: string) {
  const select = host.querySelector<HTMLSelectElement>('#ql181-role')!;
  await act(async () => { select.value = value; select.dispatchEvent(new Event('change', { bubbles: true })); });
}

async function clickRead(index: number) {
  const box = host.querySelectorAll<HTMLInputElement>('.ql181-check input')[index];
  await act(async () => box.click());
}

describe('QL-181 accessible public disabled-preview gate', () => {
  it('displays 12 held requirements, 0 approvals, 0 live capabilities and explicit disabled state', () => {
    expect(host.textContent).toContain('Privacy, roles & live-pilot gate');
    expect(host.textContent).toContain('LIVE PILOT HELD · NO APPROVAL');
    expect(host.querySelectorAll('.ql181-card')).toHaveLength(12);
    expect(host.textContent).toContain('0 · NOT COLLECTED');
    expect(host.textContent).toContain('0 · LOCKED');
    expect(host.querySelectorAll('#ql181-role option')).toHaveLength(4);
  });

  it('shows projected role differences without clearing a hold for owner', async () => {
    await changeRole('owner');
    expect(host.textContent).toContain('Inspect same-brand mock reviews');
    expect(host.textContent).toContain('For every role, real customer records');
    expect(host.textContent).toContain('LIVE PILOT HELD');
    await changeRole('signed_out');
    expect(host.textContent).toContain('No preview capabilities for an unidentified session');
  });

  it('read marks remain non-authorizing and can be cleared, including every item', async () => {
    for (let i = 0; i < 12; i++) await clickRead(i);
    expect(host.textContent).toContain('12 / 12');
    expect(host.textContent).toContain('0 · NOT COLLECTED');
    expect(host.querySelectorAll<HTMLInputElement>('.ql181-check input:checked')).toHaveLength(12);
    expect(host.textContent).toContain('HELD · UNVERIFIED');
    const clear = [...host.querySelectorAll('button')].find(button => button.textContent?.includes('Clear local reading marks'))!;
    await act(async () => clear.click());
    expect(host.querySelectorAll<HTMLInputElement>('.ql181-check input:checked')).toHaveLength(0);
  });

  it('discards all local review state on business switch', async () => {
    await changeRole('owner');
    await clickRead(0);
    await act(async () => root.render(<Ql181PrivacyPilotGatePreview brandId="devilndove" />));
    expect(host.querySelector<HTMLSelectElement>('#ql181-role')?.value).toBe('signed_out');
    expect(host.querySelectorAll<HTMLInputElement>('.ql181-check input:checked')).toHaveLength(0);
    expect(host.textContent).toContain('LIVE PILOT HELD');
  });

  it('does not call network, storage or Supabase during privacy gate review', async () => {
    const network = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
    const storage = vi.spyOn(Storage.prototype, 'setItem');
    await changeRole('owner');
    await clickRead(0);
    await clickRead(1);
    expect(network).not.toHaveBeenCalled();
    expect(storage).not.toHaveBeenCalled();
    const code = readFileSync('src/operator/ql181PrivacyPilotGate.ts', 'utf8') +
      readFileSync('src/operator/Ql181PrivacyPilotGatePreview.tsx', 'utf8');
    expect(code).not.toMatch(/\bfetch\s*\(|\baxios\s*\(|\.from\s*\(|\.insert\s*\(|\.update\s*\(|localStorage\.|sendSms\s*\(|makeCall\s*\(/);
  });
});
