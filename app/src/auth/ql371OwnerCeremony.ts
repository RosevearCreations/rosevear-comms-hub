import type {OwnerProgress, ProgressAttestationState} from './ql370OwnerProgress';

/** QL-371: presentation-only evidence. These values can never authorize an
 * owner, an offline signature, a private TEST, or any source connection. */
export type CeremonyStepStatus = 'verified' | 'offline' | 'pending' | 'attention';
export type CeremonyStep = {
  id: string;
  title: string;
  status: CeremonyStepStatus;
  details: string;
};
export type AttestationCountdown = {
  severity: 'none' | 'normal' | 'soon' | 'urgent' | 'expired' | 'review';
  text: string;
  verifiedCurrent: boolean;
};

const MINUTE = 60_000;
const SNAPSHOT_FRESH_MS = 2 * MINUTE;
const OFFLINE = 'This offline evidence cannot be verified by a browser checklist; use the original Windows signer and review the final signed packet.';

export const SAFE_OWNER_HANDOFF = [
  'ROSEVEAR CREATIONS — ORIGINAL OWNER CEREMONY HANDOFF (INSTRUCTIONS ONLY)',
  '1. Ree and Jack each use their own trusted Windows computer and personal Supabase login.',
  '2. Prepare and independently inspect QL-368 original-device evidence (24-hour limit).',
  '3. Independently review and sign a NEW QL-369 explicit owner-only activation decision (one-hour limit).',
  '4. On each computer, complete authenticator MFA (AAL2); compare the SAME intent SHA-256 from the original evidence.',
  '5. Each owner explicitly records their OWN intent-bound MFA attestation (30-minute limit).',
  '6. Ree alone reviews the assembled separately signed packet and explicitly submits the one-time membership activation.',
  '7. Independently verify the two owner memberships; all six application shells MUST remain DISCONNECTED / HOLD.',
  'Do not send passwords, MFA codes, tokens, private keys, signing passphrases, sensitive signed packets or recovery secrets in this note.',
  'This note is not authorization, a signature, evidence of consent or a connection approval.'
].join('\n');

function validTime(value: string | null): number | null {
  if (!value) return null;
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : null;
}

/** An advisory countdown is derived from a protected server snapshot and the
 * local clock. Only an explicit *new server readback* can confirm current MFA. */
export function countdownForAttestation(
  state: ProgressAttestationState,
  expiresAt: string | null,
  snapshotAt: string | null,
  nowMs: number
): AttestationCountdown {
  if (state === 'NOT_RECORDED') return {
    severity: 'none', text: 'No matching server attestation yet.', verifiedCurrent: false
  };
  if (state === 'REVOKED_OR_STALE') return {
    severity: 'review', text: 'Recorded session or authenticator is no longer valid. Renew MFA and refresh.', verifiedCurrent: false
  };
  if (state === 'EXPIRED') return {
    severity: 'expired', text: 'Expired according to the server. Obtain a fresh attestation.', verifiedCurrent: false
  };
  const expires = validTime(expiresAt);
  const captured = validTime(snapshotAt);
  if (expires === null || captured === null || !Number.isFinite(nowMs)) return {
    severity: 'review', text: 'Unverifiable expiry time. Refresh protected server status.', verifiedCurrent: false
  };
  if (nowMs < captured - SNAPSHOT_FRESH_MS) return {
    severity: 'review', text: 'This device clock appears behind the server. Check the clock and refresh.', verifiedCurrent: false
  };
  const remaining = expires - nowMs;
  if (remaining <= 0) return {
    severity: 'expired', text: 'Estimated time elapsed. Refresh; the server decides if renewal is required.', verifiedCurrent: false
  };
  if (nowMs - captured > SNAPSHOT_FRESH_MS) return {
    severity: 'review', text: 'Status readback is over two minutes old. Refresh before relying on it.', verifiedCurrent: false
  };
  const minutes = Math.ceil(remaining / MINUTE);
  const prefix = minutes === 1 ? 'About 1 minute' : `About ${minutes} minutes`;
  return {
    severity: remaining <= 5 * MINUTE ? 'urgent' : remaining <= 10 * MINUTE ? 'soon' : 'normal',
    text: `${prefix} remaining (device-clock estimate; server rechecks on submission).`,
    verifiedCurrent: true
  };
}

export function isOriginalActivationVerified(progress: OwnerProgress | null): boolean {
  return Boolean(progress && progress.ownerMembershipActive &&
    progress.organizationEnrollmentState === 'VERIFIED' &&
    progress.activeOwnerMemberships === 2 && progress.audit.activationRecorded &&
    progress.audit.activationAt !== null &&
    progress.audit.verifiedActivationEvents === 1 &&
    progress.audit.lastVerifiedEventAt !== null &&
    progress.offlineApprovalState === 'VERIFIED_AT_ORIGINAL_ACTIVATION' &&
    progress.connectionsState === 'DISCONNECTED / HOLD' &&
    progress.totalApplicationShells === 6 && progress.heldApplicationShells === 6 &&
    !progress.privateTestAuthorized);
}

export function buildOwnerCeremonySteps(args: {
  progress: OwnerProgress | null;
  mfaVerified: boolean;
  intentSupplied: boolean;
  ownerRole: 'source' | 'master';
  nowMs: number;
}): { steps: CeremonyStep[]; own: AttestationCountdown; peer: AttestationCountdown; stop: boolean } {
  const {progress,mfaVerified,intentSupplied,ownerRole,nowMs} = args;
  const own = countdownForAttestation(progress?.ownAttestation.state ?? 'NOT_RECORDED',
    progress?.ownAttestation.expiresAt ?? null,progress?.snapshotAt ?? null,nowMs);
  const peer = countdownForAttestation(progress?.peerAttestation.state ?? 'NOT_RECORDED',
    progress?.peerAttestation.expiresAt ?? null,progress?.snapshotAt ?? null,nowMs);
  const activation = isOriginalActivationVerified(progress);
  const drift = Boolean(progress && (
    progress.connectionsState !== 'DISCONNECTED / HOLD' ||
    progress.totalApplicationShells !== 6 || progress.heldApplicationShells !== 6 ||
    ((progress.audit.activationRecorded || progress.activeOwnerMemberships > 0 ||
      progress.organizationEnrollmentState === 'VERIFIED') && !activation)
  ));
  const snapshotAt=progress?validTime(progress.snapshotAt):null;
  const snapshotFresh=Boolean(snapshotAt!==null&&Number.isFinite(nowMs)&&
    Math.abs(nowMs-(snapshotAt as number))<=SNAPSHOT_FRESH_MS);
  const actualMfa = Boolean(mfaVerified && progress?.sessionAal2Verified && snapshotFresh);
  const verified = (value: boolean): CeremonyStepStatus => value ? 'verified' : 'pending';
  const ownStatus: CeremonyStepStatus = own.verifiedCurrent ? 'verified' :
    ['expired','review'].includes(own.severity) ? 'attention' : 'pending';
  const peerStatus: CeremonyStepStatus = peer.verifiedCurrent ? 'verified' :
    ['expired','review'].includes(peer.severity) ? 'attention' : 'pending';
  return {own,peer,stop:drift,steps:[
    {id:'ql368',title:'Prepare the original QL-368 evidence on Ree’s computer',
      status:activation?'verified':'offline',
      details:`The original intent and two independent evidence-only signatures have a 24-hour window. ${activation?'Validated retrospectively by the final server activation.':OFFLINE}`},
    {id:'ql369',title:'Sign the separate explicit QL-369 activation decision',
      status:activation?'verified':'offline',
      details:`A NEW decision for activating only two owner memberships must be signed separately within one hour. ${activation?'Validated retrospectively by the final server activation.':OFFLINE}`},
    {id:'aal2',title:'Sign in individually and complete authenticator MFA',
      status:verified(actualMfa),
      details:actualMfa?'This original owner’s AAL2 session was recently confirmed by the protected server readback.':
        'Each person needs their own Supabase Auth sign-in and verified TOTP challenge. Refresh if this readback is stale; a password or recovery link alone is insufficient.'},
    {id:'intent',title:'Compare one matching original intent SHA-256',
      status:verified(Boolean(intentSupplied && (own.verifiedCurrent || peer.verifiedCurrent || activation))),
      details:intentSupplied&&(own.verifiedCurrent || peer.verifiedCurrent || activation)?
        'A current original-owner MFA attestation matches this intent hash. Its original 24-hour evidence window must still be verified offline.':
        'Enter the original 64-character hash in the QL-369 form, then obtain a matching server-confirmed attestation. Merely typing a hash proves nothing.'},
    {id:'self',title:'Record this owner’s current MFA attestation',
      status:ownStatus,
      details:own.text},
    {id:'peer',title:`Confirm ${ownerRole==='source'?'Jack':'Ree'} independently attested`,
      status:peerStatus,
      details:peer.text},
    {id:'activate',title:'Ree alone reviews and submits the two signed approvals',
      status:verified(activation),
      details:activation?'Two original owner memberships and one matching immutable activation audit are recorded. Applications remain on HOLD.':
        'The browser cannot observe or create offline signatures. Only Ree explicitly submits the original signed packet, after the server confirms both fresh MFA attestations.'}
  ]};
}
