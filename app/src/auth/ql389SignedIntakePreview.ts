import {reviewCrossAppIntake,type CrossAppIntake} from './ql388CrossAppIntake';

/** Intentionally not an intake endpoint. All public keys and owner decisions are
 * scenario inputs only: neither this module nor a browser can attest custody. */
export type QL389SignatureProof={algorithm:'Ed25519';keyId:string;signatureBase64Url:string};
export type QL389ScenarioPin={sourceId:string;keyId:string;publicKeySpkiBase64Url:string};
export type QL389ScenarioRoute={
  sourceId:string;destinationId:'rosevear-comms-hub';
  kinds:readonly CrossAppIntake['kind'][];
  categories:readonly CrossAppIntake['category'][];
};
export type QL389Scenario={
  nowMs:number;
  pins:readonly QL389ScenarioPin[];
  routes:readonly QL389ScenarioRoute[];
  sourceOwnerDecision:'SIMULATED_APPROVED'|'HOLD';
  masterOwnerDecision:'SIMULATED_APPROVED'|'HOLD';
  receiverEnrollment:'SIMULATED_READY'|'HOLD';
  previouslySeenMessageIds:readonly string[];
  previouslySeenIdempotencyKeys:readonly string[];
};
export type QL389GateReview={state:'DENIED'|'PREVIEW_ONLY';stage:string;reason:string};

export const QL389_PREVIEW_STAGES=[
  {stage:'ENVELOPE',label:'Validate six-source shell intake contract'},
  {stage:'PIN',label:'Require a unique source-bound signing key pin'},
  {stage:'SIGNATURE',label:'Verify detached Ed25519 signature over exact event fields'},
  {stage:'FRESHNESS',label:'Reject stale or future-dated event timestamps'},
  {stage:'REPLAY',label:'Reject previously seen source-scoped message or idempotency IDs'},
  {stage:'POLICY',label:'Check per-source route, event scope, owner reviews and receiver readiness'}
] as const;

const DOMAIN='ROSEVEAR-COMMS|QL389|INTAKE-V1\n';
const KEY_ID=/^[A-Za-z0-9][A-Za-z0-9._-]{7,63}$/;
const B64URL=/^[A-Za-z0-9_-]+$/;
const MAX_AGE_MS=5*60*1000;
const MAX_FUTURE_MS=60*1000;
const deny=(stage:string,reason:string):QL389GateReview=>({state:'DENIED',stage,reason});

/** Fixed field order and domain separation bind the signature to the full
 * immutable QL-388 payload. This must be adopted exactly by future senders. */
export function ql389CanonicalIntakeBytes(event:CrossAppIntake):Uint8Array<ArrayBuffer>{
  const ordered={
    contractVersion:event.contractVersion,messageId:event.messageId,correlationId:event.correlationId,
    idempotencyKey:event.idempotencyKey,sourceId:event.sourceId,destinationId:event.destinationId,
    tenantScope:event.tenantScope,kind:event.kind,category:event.category,severity:event.severity,
    eventCode:event.eventCode,occurredAt:event.occurredAt,evidenceRefs:event.evidenceRefs
  };
  return new TextEncoder().encode(DOMAIN+JSON.stringify(ordered));
}

function decodeBase64Url(value:string):Uint8Array|null{
  if(!B64URL.test(value)||value.length%4===1||value.length>1024)return null;
  try{
    const padded=value.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-value.length%4)%4);
    const decoded=atob(padded);
    return Uint8Array.from(decoded,char=>char.charCodeAt(0));
  }catch{return null;}
}

/** Offline/inert review only. The caller controls all scenario pins, owner
 * statuses and replay snapshots; therefore success is NEVER authorization. */
export async function reviewSignedIntakePreview(
  rawEvent:unknown,rawProof:unknown,scenario:QL389Scenario
):Promise<QL389GateReview>{
  const envelopeReview=reviewCrossAppIntake(rawEvent);
  if(envelopeReview.state!=='DESIGN_ONLY')return deny('ENVELOPE',envelopeReview.reason);
  const event=rawEvent as CrossAppIntake;
  if(!rawProof||typeof rawProof!=='object'||Array.isArray(rawProof))
    return deny('SIGNATURE','Detached source signature is missing');
  const proof=rawProof as Record<string,unknown>;
  if(Object.keys(proof).length!==3||Object.keys(proof).some(k=>!['algorithm','keyId','signatureBase64Url'].includes(k))||
     proof.algorithm!=='Ed25519'||typeof proof.keyId!=='string'||!KEY_ID.test(proof.keyId)||
     typeof proof.signatureBase64Url!=='string')
    return deny('SIGNATURE','Signature metadata is incomplete or uses an unapproved algorithm');
  const pins=scenario.pins.filter(pin=>pin.sourceId===event.sourceId&&pin.keyId===proof.keyId);
  if(pins.length!==1)return deny('PIN','Exactly one source-matched key pin is required for the preview');
  const signature=decodeBase64Url(proof.signatureBase64Url);
  const spki=decodeBase64Url(pins[0].publicKeySpkiBase64Url);
  if(!signature||signature.length!==64||!spki)return deny('SIGNATURE','Malformed Ed25519 signature or pinned public key');
  try{
    if(!globalThis.crypto?.subtle)return deny('SIGNATURE','Cryptographic verification is unavailable');
    const key=await globalThis.crypto.subtle.importKey('spki',new Uint8Array(spki),{name:'Ed25519'},false,['verify']);
    const verified=await globalThis.crypto.subtle.verify('Ed25519',key,new Uint8Array(signature),ql389CanonicalIntakeBytes(event));
    if(!verified)return deny('SIGNATURE','Signature does not match the pinned source key and canonical event');
  }catch{return deny('SIGNATURE','Signature verification or public key import failed');}

  const occurredMs=Date.parse(event.occurredAt);
  if(!Number.isFinite(scenario.nowMs)||occurredMs<scenario.nowMs-MAX_AGE_MS||occurredMs>scenario.nowMs+MAX_FUTURE_MS)
    return deny('FRESHNESS','Event timestamp is outside the five-minute age and one-minute future preview window');

  const messageKey=`${event.sourceId}:${event.messageId}`;
  const idempotencyKey=`${event.sourceId}:${event.idempotencyKey}`;
  if(scenario.previouslySeenMessageIds.includes(messageKey)||scenario.previouslySeenIdempotencyKeys.includes(idempotencyKey))
    return deny('REPLAY','A source-scoped message or idempotency key was already observed in this supplied snapshot');

  const matchingRoutes=scenario.routes.filter(route=>route.sourceId===event.sourceId&&route.destinationId===event.destinationId);
  if(matchingRoutes.length!==1||!matchingRoutes[0].kinds.includes(event.kind)||
     !matchingRoutes[0].categories.includes(event.category))
    return deny('POLICY','No unique source/destination policy permits this event kind and category');
  if(scenario.sourceOwnerDecision!=='SIMULATED_APPROVED'||scenario.masterOwnerDecision!=='SIMULATED_APPROVED'||
     scenario.receiverEnrollment!=='SIMULATED_READY')
    return deny('POLICY','Separate owner approvals or receiver readiness remain on HOLD');

  return {state:'PREVIEW_ONLY',stage:'INERT',reason:'Scenario checks match, but supplied pins, policy and replay snapshots are not trusted server evidence; no intake, authority or persistence is enabled'};
}
