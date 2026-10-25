// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { OperatorShell } from '../OperatorShell';
import { connectorContracts } from '../ql199ConnectorContracts';
import { buildMockReviewQueue } from '../ql204HandoffReviewQueue';
import { eligibleMockReviewDesk, mockReviewReadiness, normalizeMockReviewDraft } from '../ql205ReviewDesk';
import type { OrganizationId } from '../ql191Organizations';

let host: HTMLDivElement;
let root: Root;
beforeEach(async () => { Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }); host = document.createElement('div'); document.body.append(host); root = createRoot(host); await act(async () => root.render(<OperatorShell />)); });
afterEach(async () => { await act(async () => root.unmount()); host.remove(); });
async function click(text: string, selector = 'button') { const button = [...host.querySelectorAll<HTMLButtonElement>(selector)].find((item) => item.textContent?.includes(text)); if (!button) throw Error(`Missing ${text}`); await act(async () => button.click()); }
async function fill(selector: string, value: string) { const input = host.querySelector<HTMLTextAreaElement>(selector)!; await act(async () => { const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!; setter.call(input, value); input.dispatchEvent(new Event('input', { bubbles: true })); }); }

describe('QL-205 in-session handoff review desk', () => {
  it('accepts only currently eligible synthetic items for the exact company contract', () => {
    for (const company of ['rosiedazzlers', 'devilndove', 'icamp', 'yw'] as OrganizationId[]) {
      const queue = buildMockReviewQueue(company, connectorContracts[company]);
      expect(queue.ok).toBe(true);
      if (!queue.ok) continue;
      const item = queue.items[0];
      expect(eligibleMockReviewDesk(company, connectorContracts[company], item).ok).toBe(true);
      expect(eligibleMockReviewDesk(company, connectorContracts[company], { ...item, threadId: 'other-source' })).toEqual({ ok: false, reason: 'sample_not_allowed' });
      for (const foreign of ['rosiedazzlers', 'devilndove', 'icamp', 'yw'].filter((id) => id !== company) as OrganizationId[]) {
        expect(eligibleMockReviewDesk(foreign, connectorContracts[foreign], item)).toEqual({ ok: false, reason: 'organization_mismatch' });
      }
    }
    const yw = buildMockReviewQueue('yw', connectorContracts.yw);
    if (yw.ok) expect(eligibleMockReviewDesk('yw', connectorContracts.yw, { ...yw.items[0], id: 'yw-demo-tree-held' })).toEqual({ ok: false, reason: 'sample_not_allowed' });
  });
  it('bounds local drafts and never mistakes a complete rehearsal for real approval', () => {
    const draft = normalizeMockReviewDraft({ note: 'a'.repeat(700), proposedReply: 'b'.repeat(1100), steps: ['read_source', 'read_source', 'identify_gaps', 'check_scope'] });
    expect(draft.note).toHaveLength(500);
    expect(draft.proposedReply).toHaveLength(800);
    expect(draft.steps).toHaveLength(3);
    expect(mockReviewReadiness(draft)).toEqual({ prepared: true, missing: [] });
    expect(mockReviewReadiness({ note: '', proposedReply: '', steps: [] }).prepared).toBe(false);
  });
  it('edits and reopens an unsent local draft, clears it, and resets after switching brands', async () => {
    await click('Connector centre', '.ql172-nav-button');
    await click('Open review desk', '.ql204-actions button');
    expect(host.querySelector('[data-ql205-release="ql205-handoff-review-desk-mock-v1"]')).not.toBeNull();
    expect(host.textContent).toContain('Demo packet incomplete');
    await click('ⓘ Help', '.ql205-header button');
    expect(host.textContent).toContain('not a staff sign-off');
    await fill('#ql205-notes', 'Ask staff to verify coating eligibility.');
    await fill('#ql205-reply', 'This is a fictional reply for review only.');
    const checks = [...host.querySelectorAll<HTMLInputElement>('.ql205-checklist input[type="checkbox"]')];
    expect(checks).toHaveLength(3);
    for (const input of checks) await act(async () => input.click());
    expect(host.textContent).toContain('Demo packet prepared — not approved or sent');
    expect(host.textContent).toContain('Local review draft present');
    await click('Close review desk');
    await click('Open review desk', '.ql204-actions button');
    expect(host.querySelector<HTMLTextAreaElement>('#ql205-notes')?.value).toBe('Ask staff to verify coating eligibility.');
    await click('Clear local draft');
    expect(host.querySelector<HTMLTextAreaElement>('#ql205-reply')?.value).toBe('');
    expect(host.textContent).toContain('Demo packet incomplete');
    await fill('#ql205-notes', 'Session-only note');
    await click('iCamp', '.ql172-brand');
    expect(host.querySelector('[data-ql205-release]')).toBeNull();
    expect(host.textContent).not.toContain('Session-only note');
    await click('Rosie Dazzlers', '.ql172-brand');
    await click('Open review desk', '.ql204-actions button');
    expect(host.querySelector<HTMLTextAreaElement>('#ql205-notes')?.value).toBe('');
  });
});
