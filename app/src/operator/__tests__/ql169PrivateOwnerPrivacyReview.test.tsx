// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it } from 'vitest';
import type { Ql168HoldPrioritySummary } from '../ql168UnresolvedHoldPrioritization';
import { reviewQl169PrivateOwnerPrerequisites } from '../ql169PrivateOwnerPrivacyReview';
import { Ql093SafeReadPreview } from '../Ql093SafeReadPreview';

const expectedIds = [
  'ql156-owner-identity', 'ql156-evidence-provenance', 'ql156-hold-disposition',
  'ql156-consent-and-scope', 'ql156-audit-signoff'
];

function fixture(): Ql168HoldPrioritySummary {
  return {
    build: 'QL-168', reviewedBuild: 'QL-163',
    mode: 'public_synthetic_display_only_priority_summary',
    sourceIntegrityVerified: true, integrityWarning: null,
    outstandingHoldIds: ['private-person-phone-555-0100'],
    lanes: [], blockedGates: [],
    ownerPrerequisites: expectedIds.map(id => ({
      id, requirement: `NEVER_ECHO_PRIVATE_EVIDENCE_${id}`,
      affectedHoldIds: ['private-person-phone-555-0100'],
      evidenceState: 'not_independently_verified' as const,
      humanDecisionState: 'not_recorded' as const
    })),
    actualPriorityOrUrgencyEstablished: false,
    authorizedToFollowUp: false, authorizedToDispatch: false,
    authorizedToClose: false, canWriteOrExport: false,
    livePhoneSmsEnabled: false,
    notice: 'NEVER_ECHO_PRIVATE_MESSAGE_CONTENT'
  };
}

function expectHeld(review: ReturnType<typeof reviewQl169PrivateOwnerPrerequisites>) {
  expect(review.status).toBe('private_prerequisites_unmet');
  expect(review.publicPreviewContainsPrivateEvidence).toBe(false);
  expect(review.privateIntakeOrStorageImplemented).toBe(false);
  expect(review.ownerIdentityVerified).toBe(false);
  expect(review.consentAndPurposeVerified).toBe(false);
  expect(review.realEvidenceVerified).toBe(false);
  expect(review.scopedHumanDispositionRecorded).toBe(false);
  expect(review.authorizedToFollowUp).toBe(false);
  expect(review.authorizedToDispatch).toBe(false);
  expect(review.authorizedToClose).toBe(false);
  expect(review.canWriteOrExport).toBe(false);
  expect(review.livePhoneSmsEnabled).toBe(false);
  expect(review.gaps.every(gap => gap.status === 'pending_separate_private_human_review' &&
    gap.evidenceVerified === false && gap.signedByOwner === false)).toBe(true);
}

describe('QL-169 private owner-decision prerequisite and privacy review', () => {
  it('maps five unchanged private proof categories to generic privacy rules only', () => {
    const review = reviewQl169PrivateOwnerPrerequisites(fixture());
    expect(review.sourceContractVerified).toBe(true);
    expect(review.warning).toBeNull();
    expect(review.gaps.map(gap => gap.id)).toEqual(expectedIds);
    expect(review.gaps.map(gap => gap.previewPrivacyRule)).toEqual(expect.arrayContaining([
      expect.stringContaining('personal identifiers'),
      expect.stringContaining('recordings'),
      expect.stringContaining('real hold identifiers'),
      expect.stringContaining('phone numbers'),
      expect.stringContaining('audit receipt')
    ]));
    expectHeld(review);
  });

  it('never carries upstream private text or hold identifiers into its output', () => {
    const review = reviewQl169PrivateOwnerPrerequisites(fixture());
    const rendered = JSON.stringify(review);
    expect(rendered).not.toContain('private-person-phone-555-0100');
    expect(rendered).not.toContain('NEVER_ECHO_PRIVATE_');
    expect(rendered).not.toContain('NEVER_ECHO_PRIVATE_MESSAGE_CONTENT');
  });

  it('does not approve a zero-hold source or implement private intake', () => {
    const input = fixture();
    input.outstandingHoldIds = [];
    input.ownerPrerequisites = input.ownerPrerequisites.map(item => ({ ...item, affectedHoldIds: [] }));
    const review = reviewQl169PrivateOwnerPrerequisites(input);
    expect(review.sourceContractVerified).toBe(true);
    expectHeld(review);
  });

  it.each([
    ['source integrity failure', (input: any) => { input.sourceIntegrityVerified = false; }],
    ['invalid source mode', (input: any) => { input.mode = 'private_approval'; }],
    ['source warning present', (input: any) => { input.integrityWarning = 'broken'; }],
    ['forged follow-up approval', (input: any) => { input.authorizedToFollowUp = true; }],
    ['forged dispatch', (input: any) => { input.authorizedToDispatch = true; }],
    ['forged write access', (input: any) => { input.canWriteOrExport = true; }],
    ['forged live SMS', (input: any) => { input.livePhoneSmsEnabled = true; }],
    ['missing owner prerequisite', (input: any) => { input.ownerPrerequisites.pop(); }],
    ['duplicate owner prerequisite', (input: any) => { input.ownerPrerequisites[0].id = input.ownerPrerequisites[1].id; }],
    ['forged private evidence', (input: any) => { input.ownerPrerequisites[0].evidenceState = 'verified'; }],
    ['forged owner signature', (input: any) => { input.ownerPrerequisites[0].humanDecisionState = 'signed'; }]
  ])('fails closed for %s', (_label, change) => {
    const input = structuredClone(fixture());
    change(input);
    const review = reviewQl169PrivateOwnerPrerequisites(input);
    expect(review.sourceContractVerified).toBe(false);
    expect(review.warning).toContain('No owner decision may be inferred');
    expect(review.gaps.map(gap => gap.id)).toEqual(expectedIds);
    expectHeld(review);
  });

  it('renders generic privacy gaps without adding private forms or action controls', async () => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    const host = document.createElement('div');
    document.body.append(host);
    const root = createRoot(host);
    try {
      await act(async () => root.render(<Ql093SafeReadPreview />));
      await act(async () => host.querySelector<HTMLButtonElement>('.ql093-toggle')!.click());
      const section = host.querySelector<HTMLElement>('[aria-label="QL-169 private owner-decision prerequisite and privacy review"]');
      expect(section).not.toBeNull();
      expect(section?.textContent).toContain('Private owner-decision prerequisites still unmet');
      expect(section?.textContent).toContain('Private review required');
      expect(section?.querySelectorAll('li')).toHaveLength(5);
      expect(section?.querySelectorAll('button, input, textarea, select, form, a')).toHaveLength(0);
      expect(section?.textContent).not.toContain('verified consent');
    } finally {
      await act(async () => root.unmount());
      host.remove();
    }
  });
});
