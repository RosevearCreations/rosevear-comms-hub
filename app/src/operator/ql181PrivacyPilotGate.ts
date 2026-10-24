/**
 * QL-181 — read-only, fail-closed privacy and live-pilot prerequisite inventory.
 * This pure model cannot approve a pilot, authenticate an operator, save a decision,
 * or change a carrier, Supabase, browser-storage or provider configuration.
 */
import type { BrandId } from '../types';
import type { AppAdminRole } from '../supabase/appAdmin.types';
import { validateQl173CanonicalSnapshot, type Ql173Migration } from '../fixtures/ql173CanonicalSynthetic';

export const QL181_GATE_VERSION = 'ql181-privacy-roles-live-pilot-hold-v1' as const;
export type Ql181PreviewRole = AppAdminRole | 'signed_out';
export type Ql181Category = 'Identity & roles' | 'Consent & privacy' | 'Provider & infrastructure' | 'Owner governance';
export type Ql181Capability = 'view_synthetic_samples' | 'inspect_own_brand_mock_reviews' | 'read_prerequisite_matrix';
export type Ql181Prerequisite = Readonly<{
  id: string;
  category: Ql181Category;
  title: string;
  currentEvidence: string;
  sourcePath: string;
  requiredBeforePilot: string;
  reviewer: string;
  state: 'HELD_UNVERIFIED';
}>;
export type Ql181GateRequest = Readonly<{
  prospectiveBrandId: BrandId;
  illustrativeRole: Ql181PreviewRole;
  readOnlyReviewedIds: readonly string[];
}>;
export type Ql181GateResult = Readonly<{
  version: typeof QL181_GATE_VERSION;
  disposition: 'LIVE_PILOT_HELD' | 'INVALID_PREVIEW_SCOPE';
  brandId: BrandId | null;
  illustrativeRole: Ql181PreviewRole | null;
  syntheticCapabilities: readonly Ql181Capability[];
  liveCapabilities: readonly never[];
  heldPrerequisiteIds: readonly string[];
  reviewedExplanationsOnly: readonly string[];
  blockedReasons: readonly string[];
  livePilotAuthorized: false;
  realOwnerDecisionCaptured: false;
  verifiedCustomerConsent: false;
  liveProviderEnabled: false;
  storedReviewEvidence: false;
  syntheticOnly: true;
}>;

/** Checked-in decision register: evidence is a pointer, NOT an attestation of completion. */
export const QL181_PREREQUISITES: readonly Ql181Prerequisite[] = [
  {
    id: 'identity-mfa', category: 'Identity & roles', title: 'Verified operator identity, sessions and MFA',
    currentEvidence: 'QL-009 has optional Supabase magic-link/auth allowlist checks; the local demo can run without it.',
    sourcePath: 'app/src/auth/AdminSessionGate.tsx',
    requiredBeforePilot: 'Independent server-session verification, MFA/step-up, secure recovery, revocation and account-offboarding acceptance.',
    reviewer: 'Owner and security reviewer', state: 'HELD_UNVERIFIED'
  },
  {
    id: 'brand-rls', category: 'Identity & roles', title: 'Server-enforced least privilege and brand scope',
    currentEvidence: 'Existing roles are owner/admin/staff_readonly; the demo brand selector is not server authorization.',
    sourcePath: 'app/src/supabase/appAdmin.types.ts',
    requiredBeforePilot: 'Document capability matrix; verify server authorization, per-record ownership, brand-scoped RLS and negative-IDOR tests for every real data route.',
    reviewer: 'Security and database reviewer', state: 'HELD_UNVERIFIED'
  },
  {
    id: 'lawful-collection', category: 'Consent & privacy', title: 'Notice, purpose and data minimization',
    currentEvidence: 'QL-004 local prototype can store/export manually entered lead names, numbers and messages in browser storage.',
    sourcePath: 'app/src/storage/localRepository.ts',
    requiredBeforePilot: 'Approve what personal information is needed, provide appropriate notice, restrict collection and replace unsafe browser demo storage for private data.',
    reviewer: 'Privacy lead and business owner', state: 'HELD_UNVERIFIED'
  },
  {
    id: 'consent-proof', category: 'Consent & privacy', title: 'Channel-specific consent and opt-out proof',
    currentEvidence: 'QL-175 reports consent unknown or local synthetic opt-out; no verified consent grant exists.',
    sourcePath: 'app/src/operator/ql175ContactContextConsent.ts',
    requiredBeforePilot: 'Separate transactional vs commercial intent; review Canadian CASL obligations; implement evidence-backed consent, withdrawal, STOP/HELP and suppression checks.',
    reviewer: 'Privacy/legal reviewer', state: 'HELD_UNVERIFIED'
  },
  {
    id: 'retention-deletion', category: 'Consent & privacy', title: 'Retention, access, deletion and export policy',
    currentEvidence: 'No authorized live customer retention or disposal workflow is established by synthetic QL-173 fixtures.',
    sourcePath: 'app/src/fixtures/ql173CanonicalSynthetic.ts',
    requiredBeforePilot: 'Approve purpose-based retention periods, access/correction requests, export limits, secure deletion, backups and breach notification responsibility.',
    reviewer: 'Privacy lead and owner', state: 'HELD_UNVERIFIED'
  },
  {
    id: 'provider-auth', category: 'Provider & infrastructure', title: 'Authenticated provider events and replay defence',
    currentEvidence: 'QL-179 is an in-process mock; its NO_REAL_SIGNATURE_OR_AUTHENTICATION state never verifies real webhooks.',
    sourcePath: 'app/src/operator/ql179MockPhoneSms.ts',
    requiredBeforePilot: 'Choose a provider; authenticate signatures and timestamps on a server, pin recipients, verify idempotency/replay and quarantine invalid events.',
    reviewer: 'Telephony and security reviewer', state: 'HELD_UNVERIFIED'
  },
  {
    id: 'secrets', category: 'Provider & infrastructure', title: 'Server-side secrets and key rotation',
    currentEvidence: 'Browser Supabase scaffolds use publishable/anon values; no approved telecom secret handling is implemented.',
    sourcePath: 'app/src/supabase/client.ts',
    requiredBeforePilot: 'Prove service_role/provider secrets never reach bundles or logs; arrange server vault, least-privilege keys, rotation and incident revocation.',
    reviewer: 'Security and infrastructure owner', state: 'HELD_UNVERIFIED'
  },
  {
    id: 'abuse-limits', category: 'Provider & infrastructure', title: 'Rate limits, abuse prevention and emergency stop',
    currentEvidence: 'QL-180 displays an IVR routing exercise; no live calls, forwarding, SMS, DTMF, limiters or provider controls exist.',
    sourcePath: 'app/src/operator/ql180RoutingIvr.ts',
    requiredBeforePilot: 'Threat-model spam, fraud, loops and call costs; configure server-side rate/volume limits, stop switch and negative tests.',
    reviewer: 'Telephony and security reviewer', state: 'HELD_UNVERIFIED'
  },
  {
    id: 'audit-monitor', category: 'Provider & infrastructure', title: 'Access logging, monitoring and incident response',
    currentEvidence: 'QL-178–180 traces are synthetic UI results, not audited real operator/provider activity.',
    sourcePath: 'app/src/operator/ql178OperatorTasks.ts',
    requiredBeforePilot: 'Implement private, access-controlled audit trail, tamper alerts, monitoring, incident on-call and restoration drills.',
    reviewer: 'Security and operations owner', state: 'HELD_UNVERIFIED'
  },
  {
    id: 'numbers-carrier', category: 'Provider & infrastructure', title: 'Line ownership, carrier/IVR consent and rollback',
    currentEvidence: 'QL-180 uses only sample business, shared and optional personal line identities.',
    sourcePath: 'app/src/operator/ql180RoutingIvr.ts',
    requiredBeforePilot: 'Verify ownership and provider terms for business cell/Bell Fibe lines, routing isolation, personal-line exclusion, failover, billing and rollback.',
    reviewer: 'Line owner and telephony reviewer', state: 'HELD_UNVERIFIED'
  },
  {
    id: 'independent-security', category: 'Owner governance', title: 'Independent end-to-end pilot security acceptance',
    currentEvidence: 'Synthetic routing and unreadied auth/data paths do not satisfy a real pilot penetration test.',
    sourcePath: 'app/src/operator/OperatorShell.tsx',
    requiredBeforePilot: 'Test real boundary/auth/consent/retention/abuse scenarios in isolated staging; document residual risk, rollback and separate release controls.',
    reviewer: 'Independent security reviewer', state: 'HELD_UNVERIFIED'
  },
  {
    id: 'owner-signoff', category: 'Owner governance', title: 'Verified owner scope and explicit out-of-band authorization',
    currentEvidence: 'This preview must not collect an actual accept/reject decision, signature, permission or owner consent.',
    sourcePath: 'docs/QL-171-182-REQUIRED_BUILD_QUEUE.md',
    requiredBeforePilot: 'After all prerequisites, independently verify the owner and separately approve exact lines, data scope, users, costs, go-live and rollback. New authorized build required.',
    reviewer: 'Verified business/line owner', state: 'HELD_UNVERIFIED'
  }
] as const;

const roles: readonly Ql181PreviewRole[] = ['owner', 'admin', 'staff_readonly', 'signed_out'];
const matrix: Readonly<Record<Ql181PreviewRole, readonly Ql181Capability[]>> = {
  owner: ['view_synthetic_samples', 'inspect_own_brand_mock_reviews', 'read_prerequisite_matrix'],
  admin: ['view_synthetic_samples', 'inspect_own_brand_mock_reviews', 'read_prerequisite_matrix'],
  staff_readonly: ['view_synthetic_samples', 'read_prerequisite_matrix'],
  signed_out: []
};
const requestFields = ['prospectiveBrandId', 'illustrativeRole', 'readOnlyReviewedIds'];

export function evaluateQl181LivePilotGate(migration: Ql173Migration, activeBrand: BrandId, input: unknown): Ql181GateResult {
  const allHeld = QL181_PREREQUISITES.map(row => row.id);
  const common = {
    version: QL181_GATE_VERSION, liveCapabilities: [] as readonly never[], heldPrerequisiteIds: allHeld,
    livePilotAuthorized: false as const, realOwnerDecisionCaptured: false as const,
    verifiedCustomerConsent: false as const, liveProviderEnabled: false as const,
    storedReviewEvidence: false as const, syntheticOnly: true as const
  };
  const deny = (reason: string): Ql181GateResult => ({
    ...common, disposition: 'INVALID_PREVIEW_SCOPE', brandId: null, illustrativeRole: null,
    syntheticCapabilities: [], reviewedExplanationsOnly: [], blockedReasons: [reason, 'All live-pilot prerequisites remain HELD.']
  });
  if (activeBrand !== 'rosiedazzlers' && activeBrand !== 'devilndove' || !migration.verified ||
    validateQl173CanonicalSnapshot(migration.snapshot).length !== 0) return deny('Unverified canonical synthetic fixture or business scope.');
  if (!input || typeof input !== 'object' || Array.isArray(input)) return deny('Malformed illustrative review request.');
  const request = input as Partial<Ql181GateRequest>;
  if (Object.keys(input).length !== requestFields.length || Object.keys(input).some(key => !requestFields.includes(key)) ||
    request.prospectiveBrandId !== activeBrand || !roles.includes(request.illustrativeRole as Ql181PreviewRole) ||
    !Array.isArray(request.readOnlyReviewedIds) || request.readOnlyReviewedIds.length > allHeld.length ||
    new Set(request.readOnlyReviewedIds).size !== request.readOnlyReviewedIds.length ||
    request.readOnlyReviewedIds.some(id => typeof id !== 'string' || !allHeld.includes(id))) {
    return deny('Incorrect brand, role, duplicate review flag or unrecognized prerequisite.');
  }
  const role = request.illustrativeRole as Ql181PreviewRole;
  return {
    ...common, disposition: 'LIVE_PILOT_HELD', brandId: activeBrand,
    illustrativeRole: role, syntheticCapabilities: matrix[role],
    reviewedExplanationsOnly: allHeld.filter(id => request.readOnlyReviewedIds!.includes(id)),
    blockedReasons: [
      `${allHeld.length} live-pilot prerequisites remain held regardless of local reading flags.`,
      'This selected role is illustrative; it is not a verified logged-in account or server permission.',
      'No real owner decision, customer consent, live-provider activation or security acceptance is collected.'
    ]
  };
}
