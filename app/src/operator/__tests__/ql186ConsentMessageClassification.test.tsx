// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OperatorShell } from '../OperatorShell';
import { Ql186ConsentMessageClassificationPreview } from '../Ql186ConsentMessageClassificationPreview';
import { assessQl186Message, QL186_CHANNELS, QL186_EVIDENCE_STATES,
  QL186_HOLDS, QL186_KEYWORD_EVENTS, QL186_PROPOSED_LEDGER_FIELDS, QL186_SCENARIOS, QL186_VERSION }
  from '../ql186ConsentMessageClassification';

const brands = ['rosiedazzlers', 'devilndove'] as const;
const base = (brand: typeof brands[number]) => ({ targetBrand: brand, scenarioId: 'booking_update',
  channel: 'sms', consentEvidence: 'none', priorSuppressed: false, keywordEvent: 'none' });

describe('QL-186 synthetic consent + message purpose specification', () => {
  it('keeps six intentionally reviewable scenarios, three channel distinctions and a private-ledger design only', () => {
    expect(QL186_VERSION).toBe('ql186-consent-message-classification-specification-v1');
    expect(QL186_SCENARIOS).toHaveLength(6);
    expect(new Set(QL186_SCENARIOS.map(s => s.id)).size).toBe(6);
    expect(QL186_CHANNELS).toEqual(['sms', 'email', 'voice']);
    expect(QL186_EVIDENCE_STATES).toEqual(['none', 'illustrative_claim_only']);
    expect(QL186_KEYWORD_EVENTS).toEqual(['none', 'STOP', 'START', 'HELP']);
    expect(QL186_PROPOSED_LEDGER_FIELDS).toHaveLength(7);
    expect(QL186_HOLDS).toHaveLength(7);
  });

  it('conservatively marks promotions, review-ads and service-plus-upsell as commercial candidates', () => {
    for (const id of ['seasonal_offer', 'review_solicitation', 'mixed_booking_promotion']) {
      expect(QL186_SCENARIOS.find(row => row.id === id)?.intent).toBe('commercial_candidate');
    }
    expect(QL186_SCENARIOS.find(row => row.id === 'booking_update')?.intent).toBe('service_only_candidate');
    expect(QL186_SCENARIOS.find(row => row.id === 'requested_quote')?.intent).toBe('service_only_candidate');
    expect(QL186_SCENARIOS.find(row => row.id === 'help_information')?.intent).toBe('control_only');
  });

  for (const brand of brands) {
    it(`${brand}: all combinations stay deny-by-default; consent claims cannot grant permission`, () => {
      for (const scenario of QL186_SCENARIOS) for (const channel of QL186_CHANNELS)
        for (const consentEvidence of QL186_EVIDENCE_STATES) for (const priorSuppressed of [false, true])
          for (const keywordEvent of QL186_KEYWORD_EVENTS) {
            const result = assessQl186Message(brand, {
              targetBrand: brand, scenarioId: scenario.id, channel, consentEvidence, priorSuppressed, keywordEvent
            });
            expect(result).toMatchObject({ version: QL186_VERSION, disposition: 'REVIEW_ONLY_NO_SEND',
              brandId: brand, scenarioId: scenario.id, channel, candidateIntent: scenario.intent,
              evidenceVerified: false, consentGranted: false, dispatchAllowed: false,
              providerConfigured: false, livePilotAuthorized: false, heldPrerequisites: 12,
              realRecipientsRead: 0, evidenceRecordsWritten: 0, suppressionRecordsWritten: 0,
              callsPlaced: 0, messagesSent: 0, ownerApprovals: 0 });
            expect(result.suppressionModeled).toBe(priorSuppressed || keywordEvent === 'STOP');
            if (channel === 'voice' || scenario.intent === 'commercial_candidate')
              expect(result.commercialReviewRequired).toBe(true);
          }
    });

    it(`${brand}: STOP is held suppression; START cannot remove a prior STOP; HELP makes no send`, () => {
      const stopped = assessQl186Message(brand, { ...base(brand), keywordEvent: 'STOP' });
      expect(stopped.suppressionModeled).toBe(true);
      expect(stopped.keywordInterpretation).toContain('suppression event');
      const started = assessQl186Message(brand, { ...base(brand), priorSuppressed: true, keywordEvent: 'START' });
      expect(started.suppressionModeled).toBe(true);
      expect(started.keywordInterpretation).toContain('NOT verified consent');
      const help = assessQl186Message(brand, { ...base(brand), keywordEvent: 'HELP', consentEvidence: 'illustrative_claim_only' });
      expect(help.messagesSent).toBe(0);
      expect(help.keywordInterpretation).toContain('No automated response');
    });

    it(`${brand}: cross-brand scope fails without leaking even a scenario or channel`, () => {
      const other = brand === 'rosiedazzlers' ? 'devilndove' : 'rosiedazzlers';
      expect(assessQl186Message(brand, { ...base(brand), targetBrand: other, scenarioId: 'seasonal_offer' })).toMatchObject({
        disposition: 'CROSS_BRAND_REJECTED', brandId: null, scenarioId: null, channel: null,
        candidateIntent: null, consentGranted: false, dispatchAllowed: false, messagesSent: 0
      });
    });
  }

  it('strictly rejects malformed inputs, unknown STOP variants, forged owner grants and prototypes', () => {
    for (const [brand, req] of [
      ['unknown', base('rosiedazzlers')],
      ['rosiedazzlers', { ...base('rosiedazzlers'), scenarioId: 'unknown' }],
      ['rosiedazzlers', { ...base('rosiedazzlers'), channel: 'push' }],
      ['rosiedazzlers', { ...base('rosiedazzlers'), keywordEvent: 'stop ' }],
      ['rosiedazzlers', { ...base('rosiedazzlers'), consentEvidence: 'verified_consent' }],
      ['rosiedazzlers', { ...base('rosiedazzlers'), priorSuppressed: 'false' }],
      ['rosiedazzlers', { ...base('rosiedazzlers'), targetBrand: 'personal' }],
      ['rosiedazzlers', { ...base('rosiedazzlers'), ownerApproved: true }],
      ['rosiedazzlers', { ...base('rosiedazzlers'), send: true }],
      ['rosiedazzlers', null],
      ['rosiedazzlers', []],
      ['rosiedazzlers', Object.create({ ...base('rosiedazzlers') })]
    ] as const) {
      expect(assessQl186Message(brand, req)).toMatchObject({ disposition: 'INVALID_PREVIEW_REQUEST',
        brandId: null, scenarioId: null, channel: null, consentGranted: false,
        suppressionRecordsWritten: 0, evidenceRecordsWritten: 0, messagesSent: 0, ownerApprovals: 0 });
    }
  });
});

let host: HTMLDivElement;
let root: Root;
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  host = document.createElement('div'); document.body.append(host);
  root = createRoot(host);
  await act(async () => root.render(<Ql186ConsentMessageClassificationPreview brandId="rosiedazzlers" />));
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.restoreAllMocks(); });

async function select(id: string, value: string) {
  await act(async () => {
    const el = host.querySelector<HTMLSelectElement>(`#${id}`)!;
    el.value = value; el.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

describe('QL-186 accessible, pure in-memory preview', () => {
  it('shows six labeled controls, the conservative matrix, two info sections and hard held status', () => {
    expect(host.textContent).toContain('Consent & message classification specification');
    expect(host.textContent).toContain('CLASSIFICATION REVIEW ONLY · NO SEND');
    expect(host.textContent).toContain('NO VERIFIED CONSENT · ALL SENDS BLOCKED');
    expect(host.textContent).toContain('Live-pilot holds: 12');
    expect(host.querySelectorAll('.ql186-controls label[for]')).toHaveLength(6);
    expect(host.querySelectorAll('.ql186-table-wrap tbody tr')).toHaveLength(6);
    expect(host.querySelectorAll('.ql186-help summary')).toHaveLength(2);
    expect(host.querySelector('.ql186-result[role="status"][aria-live="polite"]')).not.toBeNull();
  });

  it('consent claim, STOP, START, HELP and cross-brand action do not write or send', async () => {
    const write = vi.spyOn(Storage.prototype, 'setItem');
    const remove = vi.spyOn(Storage.prototype, 'removeItem');
    const network = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
    await select('ql186-evidence', 'illustrative_claim_only');
    await select('ql186-scenario', 'mixed_booking_promotion');
    expect(host.textContent).toContain('commercial candidate');
    for (const keyword of ['STOP', 'START', 'HELP']) {
      await select('ql186-keyword', keyword);
      expect(host.textContent).toContain('Phone/SMS/email sent: 0');
    }
    await select('ql186-prior', 'yes');
    await select('ql186-keyword', 'START');
    expect(host.textContent).toContain('Suppression modeled: YES');
    await select('ql186-brand', 'devilndove');
    expect(host.textContent).toContain('CROSS-BRAND REVIEW REJECTED');
    expect(host.textContent).not.toContain('Your booking is confirmed.');
    expect(write).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
    expect(network).not.toHaveBeenCalled();
  });

  it('remounting on a different business resets all illustrative state', async () => {
    await select('ql186-evidence', 'illustrative_claim_only');
    await select('ql186-keyword', 'STOP');
    await act(async () => root.render(<Ql186ConsentMessageClassificationPreview key="other" brandId="devilndove" />));
    expect(host.querySelector<HTMLSelectElement>('#ql186-brand')?.value).toBe('devilndove');
    expect(host.querySelector<HTMLSelectElement>('#ql186-evidence')?.value).toBe('none');
    expect(host.querySelector<HTMLSelectElement>('#ql186-keyword')?.value).toBe('none');
    expect(host.textContent).toContain('for Devil n Dove');
  });

  it('is integrated in the safety workspace alongside unchanged QL-185 and QL-181 holds', async () => {
    await act(async () => root.render(<OperatorShell key="complete-shell" />));
    const evidence = [...host.querySelectorAll<HTMLButtonElement>('.ql172-nav-button')]
      .find(button => button.textContent?.includes('Safety & hold review'))!;
    await act(async () => evidence.click());
    expect(host.querySelector('.ql186-consent')).not.toBeNull();
    expect(host.querySelector('.ql185-blueprint')).not.toBeNull();
    expect(host.querySelector('.ql181-gate')?.textContent).toContain('LIVE PILOT HELD');
  });

  it('uses accessible focus, touch targets, responsive and forced-colour rules', () => {
    const css = readFileSync('src/operator/ql186-consent-classification.css', 'utf8');
    expect(css).toContain('min-height:44px');
    expect(css).toContain('max-width:700px');
    expect(css).toContain('max-width:375px');
    expect(css).toContain('forced-colors:active');
    expect(css).toContain(':focus-visible');
  });
});
