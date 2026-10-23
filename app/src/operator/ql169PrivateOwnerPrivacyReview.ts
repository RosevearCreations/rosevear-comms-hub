import type { Ql168HoldPrioritySummary } from './ql168UnresolvedHoldPrioritization';

export type Ql169PrivateReviewGap = {
  id: string;
  label: string;
  privateProofNeeded: string;
  previewPrivacyRule: string;
  status: 'pending_separate_private_human_review';
  evidenceVerified: false;
  signedByOwner: false;
};

export type Ql169PrivacyReview = {
  build: 'QL-169';
  reviewedBuild: 'QL-168';
  mode: 'public_synthetic_privacy_gap_summary_only';
  sourceContractVerified: boolean;
  publicPreviewContainsPrivateEvidence: false;
  privateIntakeOrStorageImplemented: false;
  ownerIdentityVerified: false;
  consentAndPurposeVerified: false;
  realEvidenceVerified: false;
  scopedHumanDispositionRecorded: false;
  authorizedToFollowUp: false;
  authorizedToDispatch: false;
  authorizedToClose: false;
  canWriteOrExport: false;
  livePhoneSmsEnabled: false;
  gaps: readonly Ql169PrivateReviewGap[];
  status: 'private_prerequisites_unmet';
  warning: string | null;
  notice: string;
};

// Fixed labels and rules only: never copy names, contact details, hold IDs,
// required-evidence strings, consent records or upstream untrusted text into
// this PUBLIC disabled-preview privacy summary.
const PRIVATE_REVIEW_GAPS = [
  {
    id: 'ql156-owner-identity',
    label: 'Authenticated owner identity and authorized role',
    privateProofNeeded: 'Independently verify the decision-maker and role in a separately approved, access-controlled process.',
    previewPrivacyRule: 'Do not display personal identifiers, credentials, account records or identity documents.'
  },
  {
    id: 'ql156-evidence-provenance',
    label: 'Independent evidence provenance and integrity',
    privateProofNeeded: 'Verify origin, purpose, timestamp, authenticity and per-hold lineage privately before any decision.',
    previewPrivacyRule: 'Do not expose recordings, messages, attachments, customer details or raw evidence.'
  },
  {
    id: 'ql156-hold-disposition',
    label: 'Explicit, per-hold human disposition',
    privateProofNeeded: 'Record each hold-specific human disposition and its evidence basis only after separate authorization.',
    previewPrivacyRule: 'Do not publish real hold identifiers, case notes, decisions or operational routing.'
  },
  {
    id: 'ql156-consent-and-scope',
    label: 'Consent, purpose, channel and scope',
    privateProofNeeded: 'Verify consent, lawful purpose, exact permitted use, communication channel and limits privately.',
    previewPrivacyRule: 'Do not reveal consent records, phone numbers, message contents or personal scope details.'
  },
  {
    id: 'ql156-audit-signoff',
    label: 'Restricted human approval and audit sign-off',
    privateProofNeeded: 'Establish authenticated approver, least-privilege access, retention, review trail and signed acceptance separately.',
    previewPrivacyRule: 'Do not present a signature, audit receipt, export or access grant as existing.'
  }
] as const;

const expectedIds = PRIVATE_REVIEW_GAPS.map(gap => gap.id);

/** Pure, public-safe gap matrix. No real private workflow is created here. */
export function reviewQl169PrivateOwnerPrerequisites(source: Ql168HoldPrioritySummary): Ql169PrivacyReview {
  const prerequisites = Array.isArray(source?.ownerPrerequisites) ? source.ownerPrerequisites : [];
  const ids = prerequisites.map(item => item.id);
  const sourceContractVerified = source?.build === 'QL-168' &&
    source.reviewedBuild === 'QL-163' &&
    source.mode === 'public_synthetic_display_only_priority_summary' &&
    source.sourceIntegrityVerified === true && source.integrityWarning === null &&
    source.actualPriorityOrUrgencyEstablished === false &&
    source.authorizedToFollowUp === false && source.authorizedToDispatch === false &&
    source.authorizedToClose === false && source.canWriteOrExport === false &&
    source.livePhoneSmsEnabled === false &&
    ids.length === expectedIds.length && new Set(ids).size === expectedIds.length &&
    expectedIds.every(id => ids.includes(id)) &&
    prerequisites.every(item => item.evidenceState === 'not_independently_verified' &&
      item.humanDecisionState === 'not_recorded');

  return {
    build: 'QL-169', reviewedBuild: 'QL-168',
    mode: 'public_synthetic_privacy_gap_summary_only',
    sourceContractVerified,
    publicPreviewContainsPrivateEvidence: false,
    privateIntakeOrStorageImplemented: false,
    ownerIdentityVerified: false,
    consentAndPurposeVerified: false,
    realEvidenceVerified: false,
    scopedHumanDispositionRecorded: false,
    authorizedToFollowUp: false, authorizedToDispatch: false,
    authorizedToClose: false, canWriteOrExport: false,
    livePhoneSmsEnabled: false,
    gaps: PRIVATE_REVIEW_GAPS.map(gap => ({
      ...gap,
      status: 'pending_separate_private_human_review',
      evidenceVerified: false,
      signedByOwner: false
    })),
    status: 'private_prerequisites_unmet',
    warning: sourceContractVerified ? null :
      'Synthetic upstream integrity or prerequisite contract could not be verified. No owner decision may be inferred.',
    notice: 'Five private evidence and approval gaps remain. This public disabled preview contains only generic requirements; it neither collects proof nor verifies consent, identity, an owner decision or permission to act.'
  };
}
