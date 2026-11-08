import type {OwnerProgress} from './ql370OwnerProgress';
import type {CeremonyStep} from './ql371OwnerCeremony';

/** QL-372 stores ONLY an inert help-page position in tab-scoped sessionStorage.
 * No identity, evidence, intent, session, auth token, attestation, or approval is saved. */
export const WALKTHROUGH_STEP_IDS = [
  'ql368', 'ql369', 'aal2', 'intent', 'self', 'peer', 'activate'
] as const;
export type WalkthroughStepId = typeof WALKTHROUGH_STEP_IDS[number];
export type OwnerRole = 'source' | 'master';
type ResumeStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

const KEY_PREFIX = 'rosevear-comms-hub:ql372:help-position:';
const FRESH_SNAPSHOT_MS = 2 * 60_000;
const keyFor = (role:OwnerRole) => KEY_PREFIX + role;

/** A fresh original-owner AAL2-protected server readback is mandatory before
 * even offering an old *navigation position*. No stale security state is reused. */
export function mayOfferWalkthroughResume(
  progress:OwnerProgress | null, mfaVerified:boolean, role:OwnerRole, nowMs:number
):boolean {
  const captured = progress ? Date.parse(progress.snapshotAt) : NaN;
  return Boolean(progress && mfaVerified && progress.sessionAal2Verified &&
    progress.ownerRole === role && progress.state === 'ORIGINAL_OWNER_PROGRESS_READ_ONLY' &&
    progress.connectionsState === 'DISCONNECTED / HOLD' &&
    progress.totalApplicationShells === 6 && progress.heldApplicationShells === 6 &&
    !progress.privateTestAuthorized && Number.isFinite(nowMs) &&
    Number.isFinite(captured) && Math.abs(nowMs - captured) <= FRESH_SNAPSHOT_MS);
}

export function readHelpPosition(role:OwnerRole,storage:ResumeStorage):WalkthroughStepId|null {
  try {
    const raw=storage.getItem(keyFor(role));
    if (!raw || !raw.startsWith('v1:')) return null;
    const id=raw.slice(3);
    return WALKTHROUGH_STEP_IDS.includes(id as WalkthroughStepId) ? id as WalkthroughStepId : null;
  } catch { return null; }
}

export function saveHelpPosition(role:OwnerRole,id:WalkthroughStepId,storage:ResumeStorage):boolean {
  if (!WALKTHROUGH_STEP_IDS.includes(id)) return false;
  try { storage.setItem(keyFor(role),'v1:'+id); return true; }
  catch { return false; }
}

export function clearHelpPosition(role:OwnerRole,storage:ResumeStorage):void {
  try { storage.removeItem(keyFor(role)); } catch { /* Browser storage may be disabled. */ }
}

export function clearAllOwnerHelpPositions(storage:ResumeStorage):void {
  clearHelpPosition('source',storage);
  clearHelpPosition('master',storage);
}

export function walkthroughStepGuidance(role:OwnerRole,step:CeremonyStep):string {
  const name=role==='source'?'Ree':'Jack';
  switch(step.id){
    case 'ql368': return role==='source'
      ? 'Ree: on your original Windows computer, prepare the evidence-only intent. Jack separately reviews and signs on his own computer. Neither browser can confirm the original-device signatures.'
      : 'Jack: ask Ree for the intent details through the established trusted channel. Review and sign your own evidence on your original Windows computer; do not use Ree’s login.';
    case 'ql369': return `${name}: independently review and sign a NEW explicit activation decision with your own original Windows key. The signed decision expires after one hour; the browser cannot sign it.`;
    case 'aal2': return `${name}: sign in only as yourself, complete your own authenticator challenge, then refresh protected server status. The other owner must do the same separately.`;
    case 'intent': return `${name}: enter the identical SHA-256 from Ree’s original intent in the QL-369 form. A typed value alone does not verify or authorize anything.`;
    case 'self': return `${name}: explicitly request your own server-side intent-bound MFA attestation. It must be recent and independently confirmed by the protected server.`;
    case 'peer': return role==='source'
      ? 'Ree: wait for the protected server to confirm Jack’s separate attestation for the same intent. Never enter an MFA code on his behalf.'
      : 'Jack: wait for the protected server to confirm Ree’s separate attestation for the same intent. Never approve on her behalf.';
    case 'activate': return role==='source'
      ? 'Ree only: once both fresh attestations and BOTH separately signed decisions are independently checked, use the explicit final QL-369 submission. Navigation in this guide never submits the packet.'
      : 'Jack: stop here. Only Ree can submit the original signed activation packet. Your participation never permits application access.';
    default: return 'Review this step on your own trusted device. A help-page position is never evidence or authorization.';
  }
}
