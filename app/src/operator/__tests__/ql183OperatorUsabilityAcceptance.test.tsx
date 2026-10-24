// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OperatorShell } from '../OperatorShell';
import { Ql183OperatorUsabilityPreview } from '../Ql183OperatorUsabilityPreview';
import { assessQl183Rehearsal, QL183_MODES, QL183_TASKS, QL183_VERSION } from '../ql183OperatorUsabilityAcceptance';

const brands = ['rosiedazzlers', 'devilndove'] as const;

describe('QL-183 manual usability acceptance contract', () => {
  it('defines nine deterministic, uniquely identified walkthroughs across keyboard, screen-reader and mobile', () => {
    expect(QL183_VERSION).toBe('ql183-operator-usability-acceptance-v1');
    expect(QL183_MODES.map(mode => mode.id)).toEqual(['keyboard', 'screen_reader', 'mobile']);
    expect(QL183_TASKS).toHaveLength(9);
    expect(new Set(QL183_TASKS.map(task => task.id)).size).toBe(9);
    for (const mode of QL183_MODES) expect(QL183_TASKS.filter(task => task.mode === mode.id)).toHaveLength(3);
    expect(QL183_TASKS.every(task => task.action && task.expected && task.workspace)).toBe(true);
  });

  for (const brandId of brands) {
    it(`${brandId}: defaults to an incomplete, fully held self-review`, () => {
      expect(assessQl183Rehearsal(brandId, {})).toEqual({
        version: QL183_VERSION, brandId, disposition: 'INCOMPLETE_SELF_REVIEW',
        total: 9, usable: 0, needsImprovement: 0, notTested: 9, flaggedTaskIds: [],
        syntheticTrainingOnly: true, verifiedAccessibilityAudit: false, livePilotAuthorized: false,
        heldPrerequisites: 12, externalWrites: 0, messagesSent: 0, callsPlaced: 0, ownerApprovals: 0
      });
    });

    it(`${brandId}: explicit self-reports never count as a verified audit or authorize a pilot`, () => {
      const full = Object.fromEntries(QL183_TASKS.map(task => [task.id, 'SELF_REPORTED_USABLE']));
      const complete = assessQl183Rehearsal(brandId, full);
      expect(complete).toMatchObject({ disposition: 'SELF_REPORTED_READY_FOR_INDEPENDENT_REVIEW',
        usable: 9, notTested: 0, verifiedAccessibilityAudit: false, livePilotAuthorized: false, heldPrerequisites: 12 });
      const flagged = assessQl183Rehearsal(brandId, { ...full, sr_safety: 'NEEDS_IMPROVEMENT' });
      expect(flagged).toMatchObject({ disposition: 'NEEDS_REMEDIATION', needsImprovement: 1,
        flaggedTaskIds: ['sr_safety'], verifiedAccessibilityAudit: false, externalWrites: 0, ownerApprovals: 0 });
      expect(assessQl183Rehearsal(brandId, full)).toEqual(complete);
      expect(full.sr_safety).toBe('SELF_REPORTED_USABLE');
    });
  }

  it('rejects unsupported brand, invented task/status, arrays and prototype-bearing payloads without projecting foreign details', () => {
    for (const [brandId, input] of [
      ['elsewhere', {}], ['rosiedazzlers', { unknown_customer: 'SELF_REPORTED_USABLE' }],
      ['devilndove', { key_skip: 'APPROVED' }], ['rosiedazzlers', []],
      ['rosiedazzlers', null], ['devilndove', Object.create({ inherited: true })]
    ] as const) {
      expect(assessQl183Rehearsal(brandId, input)).toMatchObject({ disposition: 'DENIED_INVALID_REHEARSAL',
        brandId: null, total: 0, usable: 0, flaggedTaskIds: [], livePilotAuthorized: false });
    }
  });
});

let host: HTMLDivElement;
let root: Root;
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  host = document.createElement('div'); document.body.append(host);
  root = createRoot(host);
  await act(async () => root.render(<Ql183OperatorUsabilityPreview brandId="rosiedazzlers" />));
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.restoreAllMocks(); });

function chooseMode(value: string) {
  const select = host.querySelector<HTMLSelectElement>('#ql183-mode')!;
  select.value = value;
  select.dispatchEvent(new Event('change', { bubbles: true }));
}

describe('QL-183 operator accessibility rehearsal UI', () => {
  it('has native names, state and detailed safety copy; no false audit result', () => {
    expect(host.textContent).toContain('Operator usability acceptance rehearsal');
    expect(host.textContent).toContain('not an automated accessibility audit');
    expect(host.textContent).toContain('Independent review: NOT VERIFIED');
    expect(host.textContent).toContain('12 HELD');
    expect(host.querySelector('label[for="ql183-mode"]')).not.toBeNull();
    expect(host.querySelectorAll('.ql183-tasks fieldset')).toHaveLength(3);
    expect(host.querySelectorAll('.ql183-tasks legend')).toHaveLength(3);
    expect(host.querySelectorAll('input[type="radio"]')).toHaveLength(9);
    expect(host.querySelector('[role="status"][aria-live="polite"]')).not.toBeNull();
    expect(host.querySelector('.ql183-usability button')?.getAttribute('type')).toBe('button');
  });

  it('records preset feedback in memory across modes and flags improvement without sending anything', async () => {
    const storage = vi.spyOn(Storage.prototype, 'setItem');
    const network = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
    await act(async () => {
      const item = host.querySelector<HTMLInputElement>('input[name="ql183-key_skip"][value="NEEDS_IMPROVEMENT"]')!;
      item.click();
    });
    expect(host.textContent).toContain('1 needs improvement');
    expect(host.querySelector('.ql183-followup')?.textContent).toContain('Skip repeated navigation');
    await act(async () => chooseMode('screen_reader'));
    expect(host.textContent).toContain('screen reader and its landmark');
    expect(host.querySelectorAll('.ql183-tasks fieldset')).toHaveLength(3);
    await act(async () => {
      host.querySelector<HTMLInputElement>('input[name="ql183-sr_landmarks"][value="SELF_REPORTED_USABLE"]')!.click();
    });
    expect(host.textContent).toContain('1 usable · 1 needs improvement');
    await act(async () => chooseMode('mobile'));
    expect(host.textContent).toContain('320 px');
    expect(host.textContent).toContain('200% text zoom');
    expect(storage).not.toHaveBeenCalled();
    expect(network).not.toHaveBeenCalled();
  });

  it('reset removes all training results; switching brands remounts with an empty rehearsal', async () => {
    await act(async () => host.querySelector<HTMLInputElement>('input[value="NEEDS_IMPROVEMENT"]')!.click());
    expect(host.textContent).toContain('1 needs improvement');
    await act(async () => host.querySelector<HTMLButtonElement>('.ql183-actions button')!.click());
    expect(host.textContent).toContain('0 needs improvement · 9 not tested');
    await act(async () => host.querySelector<HTMLInputElement>('input[value="SELF_REPORTED_USABLE"]')!.click());
    await act(async () => root.render(<Ql183OperatorUsabilityPreview key="devilndove" brandId="devilndove" />));
    expect(host.textContent).toContain('Devil n Dove');
    expect(host.textContent).toContain('0 usable · 0 needs improvement · 9 not tested');
    expect(host.querySelectorAll<HTMLInputElement>('input[value="SELF_REPORTED_USABLE"]:checked')).toHaveLength(0);
  });

  it('persists only in shell memory across workspaces, resets for a different business, and announces context', async () => {
    await act(async () => root.render(<OperatorShell key="full-shell" />));
    expect(host.querySelector('main#ql172-workspace')?.getAttribute('tabindex')).toBe('-1');
    expect(host.querySelector('.ql172-context .ql172-kicker')?.getAttribute('aria-live')).toBe('polite');
    const safety = [...host.querySelectorAll<HTMLButtonElement>('.ql172-nav-button')].find(b => b.textContent?.includes('Safety & hold review'))!;
    await act(async () => safety.click());
    expect(host.querySelector('.ql183-usability')).not.toBeNull();
    expect(host.querySelector('.ql182-journey')).not.toBeNull();
    await act(async () => host.querySelector<HTMLInputElement>('input[name="ql183-key_skip"][value="NEEDS_IMPROVEMENT"]')!.click());
    expect(host.querySelector('.ql183-usability')?.textContent).toContain('1 needs improvement');
    const samples = [...host.querySelectorAll<HTMLButtonElement>('.ql172-nav-button')].find(b => b.textContent?.includes('Synthetic conversations'))!;
    await act(async () => samples.click());
    expect(host.querySelector('.ql183-usability')).toBeNull();
    await act(async () => safety.click());
    expect(host.querySelector('.ql183-usability')?.textContent).toContain('1 needs improvement');
    const otherBrand = [...host.querySelectorAll<HTMLButtonElement>('.ql172-brand')].find(b => b.textContent?.includes('Devil n Dove'))!;
    await act(async () => otherBrand.click());
    expect(host.querySelector('.ql183-usability')?.textContent).toContain('Devil n Dove');
    expect(host.querySelector('.ql183-usability')?.textContent).toContain('0 needs improvement · 9 not tested');
    expect(host.querySelector('.ql172-status')?.textContent).toContain('DISABLED PREVIEW');
  });

  it('provides narrow viewport wrapping, 44 px controls, forced colours and visible focus', () => {
    const css = readFileSync('src/operator/ql183-operator-usability.css', 'utf8');
    expect(css).toContain('min-height:44px');
    expect(css).toContain('max-width:375px');
    expect(css).toContain('max-width:700px');
    expect(css).toContain('forced-colors:active');
    expect(css).toContain(':focus-visible');
  });
});
