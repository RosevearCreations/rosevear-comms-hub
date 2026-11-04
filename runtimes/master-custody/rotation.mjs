/**
 * QL-332 PRIVATE BROKER MODULE — not imported by the browser and not scheduled
 * until a real owner, source custodian, workload identity and managed provider
 * are independently enrolled. The injected store must make claim/cutover
 * compare-and-swap transactions and persist append-only signed receipt hashes.
 * The injected provider must never return plaintext keys to this module.
 */
import {createHash, randomUUID, timingSafeEqual} from 'node:crypto';

const SHELLS = new Set([
  'yw','icamp','rosiedazzlers','devilndove','ai-data-platform','rosevear-ai-hub'
]);
const PURPOSES = new Set(['BROKER_SIGN','BROKER_DECRYPT','PEER_VERIFY']);
const HASH = /^[0-9a-f]{64}$/;
const MAX_OVERLAP_MS = 24 * 60 * 60 * 1000;
const MIN_ROTATION_NOTICE_MS = 60 * 60 * 1000;

export class CustodyHold extends Error {
  constructor(code) { super(code); this.name = 'CustodyHold'; this.code = code; }
}
const hold = code => {throw new CustodyHold(code);};
const validDigest = value => typeof value === 'string' && HASH.test(value);
const positiveVersion = value => Number.isSafeInteger(value) && value > 0 && value < 1_000_001;
export const digest = value => createHash('sha256').update(value).digest('hex');
export const scopeIds = Object.freeze([...SHELLS]);

function sameDigest(left,right) {
  if (!validDigest(left) || !validDigest(right)) return false;
  return timingSafeEqual(Buffer.from(left,'hex'),Buffer.from(right,'hex'));
}

/**
 * Input must be loaded from the trusted private DB by the backend, NOT accepted
 * from a browser payload. Approval digests are receipts of out-of-band,
 * independently checked original issuer/source-owner and owner decisions.
 */
export function requireVerifiedCustody(scope,{now = Date.now()} = {}) {
  if (!SHELLS.has(scope?.shellId)) hold('UNKNOWN_SHELL');
  if (!PURPOSES.has(scope?.purpose)) hold('INVALID_PURPOSE');
  if (!scope?.workload || scope.workload.state !== 'VERIFIED' ||
    !validDigest(scope.workload.attestationSha256) ||
    !Number.isFinite(Date.parse(scope.workload.expiresAt)) ||
    Date.parse(scope.workload.expiresAt) <= now) hold('WORKLOAD_NOT_ATTESTED');
  if (!scope?.issuer || scope.issuer.shellId !== scope.shellId ||
    scope.issuer.state !== 'VERIFIED' ||
    !validDigest(scope.issuer.originalProofSha256) ||
    !validDigest(scope.issuer.custodySha256) ||
    !validDigest(scope.issuer.sourceApprovalSha256) ||
    !validDigest(scope.issuer.publicKeySha256) ||
    !['Ed25519','ES256'].includes(scope.issuer.algorithm)) hold('ISSUER_NOT_PINNED');
  if (!validDigest(scope.ownerAuthorizationSha256) ||
    !validDigest(scope.sourceAuthorizationSha256) ||
    !sameDigest(scope.sourceAuthorizationSha256,scope.issuer.sourceApprovalSha256))
    hold('ORIGINAL_APPROVAL_MISSING');
  if (!scope.active || scope.active.shellId !== scope.shellId ||
    scope.active.purpose !== scope.purpose ||
    scope.active.state !== 'ACTIVE' || !positiveVersion(scope.active.keyVersion) ||
    !validDigest(scope.active.activationReceiptSha256) ||
    scope.active.issuerRecordId !== scope.issuer.id ||
    scope.active.workloadId !== scope.workload.id ||
    !Number.isFinite(Date.parse(scope.active.expiresAt)) ||
    Date.parse(scope.active.expiresAt) <= now) hold('ACTIVE_HANDLE_INVALID');
  if (!['SUPABASE_VAULT','MANAGED_KMS'].includes(scope.active.provider) ||
    !isOpaqueHandle(scope.active)) hold('INVALID_MANAGED_HANDLE');
  return scope;
}

export function isOpaqueHandle(handle) {
  if (handle?.provider === 'SUPABASE_VAULT')
    return /^vault:[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(handle.opaqueRef ?? '');
  if (handle?.provider === 'MANAGED_KMS')
    return /^kms:[A-Za-z0-9/_:.@-]{12,240}$/.test(handle.opaqueRef ?? '');
  return false;
}

/** Inventory-only plan — never reads secret material and never starts a job. */
export function assessRotation(scope,{now=Date.now(),noticeMs=7*24*60*60*1000}={}) {
  requireVerifiedCustody(scope,{now});
  if (!Number.isSafeInteger(noticeMs) || noticeMs < MIN_ROTATION_NOTICE_MS) hold('INVALID_NOTICE');
  const rotateBy = Date.parse(scope.active.nextRotationAt || scope.active.expiresAt);
  if (!Number.isFinite(rotateBy)) hold('INVALID_EXPIRY');
  return Object.freeze({
    shellId:scope.shellId,purpose:scope.purpose,
    handleId:scope.active.id,keyVersion:scope.active.keyVersion,
    decision:rotateBy <= now+noticeMs ? 'ROTATION_DUE' : 'MONITOR',
    dueAt:new Date(rotateBy).toISOString(),
    keyMaterialReturned:false,peerCalls:0,permissionsAdded:0
  });
}

/**
 * Stages a new managed version, uses a bounded dual-key overlap, requires
 * independent signed both-side verification, then atomically cuts over.
 * Store.claim must atomically reject a second in-flight shell+purpose job;
 * store.commit must check the same lease and old version. No live transport is
 * provided by this package: the trusted peer verifier is separately reviewed.
 */
export async function rotateScopedKey({shellId,purpose,store,provider,peerVerifier,
  now=()=>Date.now(),overlapMs=60*60*1000,nonce=randomUUID()}={}) {
  if (!SHELLS.has(shellId)) hold('UNKNOWN_SHELL');
  if (!PURPOSES.has(purpose)) hold('INVALID_PURPOSE');
  if (!Number.isSafeInteger(overlapMs) || overlapMs<MIN_ROTATION_NOTICE_MS ||
    overlapMs>MAX_OVERLAP_MS) hold('OVERLAP_OUT_OF_RANGE');
  if (!/^[a-f0-9-]{36}$/.test(nonce)) hold('INVALID_NONCE');
  if (!store || !provider || !peerVerifier) hold('PRIVATE_COORDINATOR_UNAVAILABLE');
  const scope=await store.loadVerifiedScope(shellId,purpose);
  requireVerifiedCustody(scope,{now:now()});
  if (scope.shellId!==shellId || scope.purpose!==purpose) hold('CROSS_SCOPE_MISMATCH');
  if (assessRotation(scope,{now:now()}).decision!=='ROTATION_DUE') hold('NOT_DUE');
  const lease=await store.claim(shellId,purpose,scope.active.id,scope.active.keyVersion,digest(nonce));
  if (!lease?.id || !lease?.leaseToken || !lease?.expiresAt) hold('CONCURRENT_ROTATION');
  let staged;
  try {
    if (Date.parse(lease.expiresAt)<=now()) hold('LEASE_EXPIRED');
    staged=await provider.stageVersion({
      shellId,purpose,oldOpaqueHandle:scope.active.opaqueRef,
      provider:scope.active.provider,nextVersion:scope.active.keyVersion+1,
      workloadId:scope.workload.id,issuerFingerprint:scope.issuer.publicKeySha256
    });
    if (!staged || staged.shellId!==shellId || staged.purpose!==purpose ||
      staged.provider!==scope.active.provider ||
      staged.keyVersion!==scope.active.keyVersion+1 || !isOpaqueHandle(staged) ||
      staged.opaqueRef===scope.active.opaqueRef) hold('STAGED_HANDLE_INVALID');
    const overlapUntil=new Date(now()+overlapMs).toISOString();
    await store.markDualKey(lease,staged,overlapUntil);
    const receipt=await peerVerifier.verifyBothSides({
      shellId,purpose,nonce,issuerFingerprint:scope.issuer.publicKeySha256,
      previous:scope.active.opaqueRef,candidate:staged.opaqueRef,
      overlapUntil
    });
    if (!receipt || !validDigest(receipt.sourceReceiptSha256) ||
      !validDigest(receipt.brokerReceiptSha256) ||
      receipt.shellId!==shellId || receipt.purpose!==purpose ||
      receipt.nonce!==nonce || receipt.previousVersion!==scope.active.keyVersion ||
      receipt.candidateVersion!==staged.keyVersion ||
      receipt.issuerFingerprint!==scope.issuer.publicKeySha256 ||
      receipt.oldVerified!==true || receipt.newVerified!==true ||
      now()>=Date.parse(overlapUntil)) hold('DUAL_SIDE_VERIFICATION_FAILED');
    await store.commitCutover(lease,{
      previousHandleId:scope.active.id,candidate:staged,
      expectedVersion:scope.active.keyVersion,
      sourceReceiptSha256:receipt.sourceReceiptSha256,
      brokerReceiptSha256:receipt.brokerReceiptSha256,
      receiptIdempotencySha256:digest(shellId+':'+purpose+':'+nonce),
      overlapUntil
    });
    return Object.freeze({state:'CUTOVER',shellId,purpose,
      previousVersion:scope.active.keyVersion,newVersion:staged.keyVersion,
      receiptSha256:receipt.brokerReceiptSha256,permissionsAdded:0,
      keyMaterialReturned:false});
  } catch (error) {
    // Never silently fall back to another issuer, shell, child or authority.
    await store.quarantine(lease,{
      reason:error instanceof CustodyHold?error.code:'ROTATION_PROVIDER_FAILED',
      candidateOpaqueRef:staged?.opaqueRef ?? null
    });
    throw error instanceof CustodyHold ? error : new CustodyHold('ROTATION_PROVIDER_FAILED');
  }
}

/** Compromised keys are revoked without creating replacement authority. */
export async function emergencyRevoke({shellId,purpose,handleId,store,provider,
  emergencyAuthorizationSha256}={}) {
  if (!SHELLS.has(shellId)||!PURPOSES.has(purpose)||!validDigest(emergencyAuthorizationSha256))
    hold('EMERGENCY_AUTHORITY_MISSING');
  if (!store || !provider) hold('PRIVATE_COORDINATOR_UNAVAILABLE');
  const handle=await store.loadHandleForRevocation(shellId,purpose,handleId);
  if (!handle || handle.shellId!==shellId||handle.purpose!==purpose||
    !isOpaqueHandle(handle)) hold('CROSS_SCOPE_MISMATCH');
  await provider.revoke(handle.opaqueRef);
  await store.markRevoked(shellId,purpose,handleId,emergencyAuthorizationSha256);
  return {state:'REVOKED',shellId,purpose,handleId,connectionsEnabled:0,permissionsAdded:0};
}
