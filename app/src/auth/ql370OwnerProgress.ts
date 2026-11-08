/** QL-370: verified, redacted server snapshot. This is presentation data,
 * never authorization, activation consent or a source connection grant.
 * No private Auth/session/factor IDs, email or signing material may arrive.
 */
export type ProgressAttestationState =
  | 'NOT_RECORDED' | 'CURRENT' | 'EXPIRED' | 'REVOKED_OR_STALE';
export type OwnerProgress = {
  state: 'ORIGINAL_OWNER_PROGRESS_READ_ONLY';
  organizationId: 'rosevear-creations';
  ownerRole: 'source' | 'master';
  sessionAal2Verified: true;
  ownerMembershipActive: boolean;
  organizationEnrollmentState: 'PENDING_VERIFIED_AUTH_USERS' | 'VERIFIED';
  activeOwnerMemberships: number;
  ownAttestation: { state: ProgressAttestationState; expiresAt: string | null };
  peerAttestation: { state: ProgressAttestationState; expiresAt: string | null };
  offlineApprovalState:
    | 'NOT_OBSERVABLE_UNTIL_FINAL_SIGNED_SUBMISSION'
    | 'VERIFIED_AT_ORIGINAL_ACTIVATION';
  audit: {
    activationRecorded: boolean;
    activationAt: string | null;
    verifiedActivationEvents: number;
    lastVerifiedEventAt: string | null;
  };
  heldApplicationShells: number;
  totalApplicationShells: number;
  connectionsState: 'DISCONNECTED / HOLD' | 'HOLD_STATE_DRIFT_REQUIRES_REVIEW';
  privateTestAuthorized: false;
  snapshotAt: string;
};

type RecordLike = Record<string, unknown>;
const record = (value: unknown): value is RecordLike =>
  Boolean(value && typeof value === 'object' && !Array.isArray(value));
const exact = (value: RecordLike, fields: string[]) =>
  Object.keys(value).length === fields.length && Object.keys(value).every(k => fields.includes(k));
const dateOrNull = (value: unknown) =>
  value === null || (typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value) &&
    Number.isFinite(Date.parse(value)));
const allowedAttestations: ProgressAttestationState[] =
  ['NOT_RECORDED', 'CURRENT', 'EXPIRED', 'REVOKED_OR_STALE'];
function attestation(value: unknown): value is OwnerProgress['ownAttestation'] {
  return record(value) && exact(value, ['state', 'expiresAt']) &&
    allowedAttestations.includes(value.state as ProgressAttestationState) &&
    dateOrNull(value.expiresAt) &&
    (value.state === 'NOT_RECORDED' ? value.expiresAt === null : value.expiresAt !== null);
}

/** Reject extra fields so leaked private attributes are never rendered. */
export function parseOwnerProgress(
  payload: unknown, expectedRole: 'source' | 'master'
): OwnerProgress | null {
  if (!record(payload) || !exact(payload, [
    'state', 'organizationId', 'ownerRole', 'sessionAal2Verified',
    'ownerMembershipActive', 'organizationEnrollmentState',
    'activeOwnerMemberships', 'ownAttestation', 'peerAttestation',
    'offlineApprovalState', 'audit', 'heldApplicationShells',
    'totalApplicationShells', 'connectionsState', 'privateTestAuthorized', 'snapshotAt'
  ])) return null;
  const audit = payload.audit;
  if (!record(audit) || !exact(audit, [
    'activationRecorded', 'activationAt', 'verifiedActivationEvents', 'lastVerifiedEventAt'
  ])) return null;
  if (payload.state !== 'ORIGINAL_OWNER_PROGRESS_READ_ONLY' ||
    payload.organizationId !== 'rosevear-creations' ||
    payload.ownerRole !== expectedRole || payload.sessionAal2Verified !== true ||
    typeof payload.ownerMembershipActive !== 'boolean' ||
    !['PENDING_VERIFIED_AUTH_USERS', 'VERIFIED'].includes(String(payload.organizationEnrollmentState)) ||
    !Number.isInteger(payload.activeOwnerMemberships) ||
    (payload.activeOwnerMemberships as number) < 0 || (payload.activeOwnerMemberships as number) > 2 ||
    !attestation(payload.ownAttestation) || !attestation(payload.peerAttestation) ||
    !['NOT_OBSERVABLE_UNTIL_FINAL_SIGNED_SUBMISSION', 'VERIFIED_AT_ORIGINAL_ACTIVATION'].includes(
      String(payload.offlineApprovalState)) ||
    typeof audit.activationRecorded !== 'boolean' ||
    !dateOrNull(audit.activationAt) || !dateOrNull(audit.lastVerifiedEventAt) ||
    !Number.isInteger(audit.verifiedActivationEvents) ||
    (audit.verifiedActivationEvents as number) < 0 || (audit.verifiedActivationEvents as number) > 1 ||
    !Number.isInteger(payload.heldApplicationShells) ||
    (payload.heldApplicationShells as number) < 0 || (payload.heldApplicationShells as number) > 6 ||
    !Number.isInteger(payload.totalApplicationShells) ||
    (payload.totalApplicationShells as number) < 0 ||
    !['DISCONNECTED / HOLD', 'HOLD_STATE_DRIFT_REQUIRES_REVIEW'].includes(String(payload.connectionsState)) ||
    payload.privateTestAuthorized !== false ||
    !dateOrNull(payload.snapshotAt) || typeof payload.snapshotAt !== 'string'
  ) return null;
  // An activation audit without the immutable receipt or vice versa is drift.
  if (audit.activationRecorded !== (audit.activationAt !== null) ||
    (audit.verifiedActivationEvents === 0) !== (audit.lastVerifiedEventAt === null)) return null;
  return payload as OwnerProgress;
}

export function ownerProgressGuidance(
  progress: OwnerProgress | null, intentSupplied: boolean
): { heading: string; message: string } {
  if (!progress) return {heading: 'Server progress unavailable',
    message: 'The protected status request did not succeed. Do not assume any approval or membership is active.'};
  if (progress.connectionsState !== 'DISCONNECTED / HOLD') return {
    heading: 'Application HOLD needs investigation',
    message: 'The server reported a shell-state mismatch. Stop enrollment and review the system before continuing.'
  };
  if ((progress.ownerMembershipActive || progress.activeOwnerMemberships > 0 ||
      progress.audit.activationRecorded ||
      progress.organizationEnrollmentState === 'VERIFIED') &&
    !(progress.ownerMembershipActive && progress.activeOwnerMemberships === 2 &&
      progress.audit.activationRecorded &&
      progress.organizationEnrollmentState === 'VERIFIED')) return {
    heading: 'Owner enrollment evidence needs review',
    message: 'The membership and audit records do not agree. Do not retry activation or assume access; review the protected original owner evidence.'
  };
  if (progress.ownerMembershipActive && progress.activeOwnerMemberships === 2 &&
    progress.audit.activationRecorded) return {
      heading: 'Both owner memberships recorded',
      message: 'Owner membership is verified; this does not approve private TEST, child business access, or any application connection.'
    };
  if (!intentSupplied) return {
    heading: 'Begin with the original intent',
    message: 'Prepare and review the QL-368 intent on the original Windows computer. Enter its SHA-256 in the ceremony form, then recheck this dashboard.'
  };
  if (['EXPIRED', 'REVOKED_OR_STALE'].includes(progress.ownAttestation.state)) return {
    heading: 'Renew our own MFA attestation',
    message: 'Recheck the original evidence and activation decision expiry. If still valid, complete current MFA and attest again. Otherwise prepare a fresh offline intent and obtain fresh signatures.'
  };
  if (progress.ownAttestation.state !== 'CURRENT') return {
    heading: 'Our own attestation is still needed',
    message: 'Complete the authenticator challenge on this original owner account, then click the server attestation button for the exact intent.'
  };
  if (progress.peerAttestation.state !== 'CURRENT') return {
    heading: 'Waiting for the other owner',
    message: 'The other owner must independently sign in, complete MFA and attest the same intent before the 30-minute window expires.'
  };
  return {
    heading: 'Fresh MFA attestations confirmed',
    message: 'Both current MFA attestations match this intent. The server cannot verify original offline signing until Ree submits the separately signed QL-369 activation packet.'
  };
}
