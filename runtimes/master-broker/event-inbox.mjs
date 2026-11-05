/** QL-337 private, Node-only broker event contract. NEVER import into Vite. */
import {createHash,createPublicKey,verify} from 'node:crypto';
import {canonicalize,SOURCES} from '../master-discovery/manifest.mjs';

export const BROKER_EVENT_SCHEMA='rosevear.broker.comms.event.v1';
export const BROKER_EVENT_TYPES=Object.freeze(['case.handoff.requested','task.followup.requested']);
export const BROKER_MAX_AGE_MS=300_000;
const SHELLS=Object.freeze({yw:'yard-workers',icamp:'icamp',rosiedazzlers:'rosiedazzlers',devilndove:'devilndove'});
const ENVELOPE_KEYS=Object.freeze(['schemaVersion','eventId','eventType','traceId','sourceApplicationId',
  'originApplicationId','destinationApplicationId','sourceShell','tenantId','childId','audience',
  'environment','sourceReceiptSha256','consentSha256','payloadRef','nonce','issuedAt','expiresAt']);
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const ID=/^evt_[A-Za-z0-9_-]{12,80}$/;
const SCOPE=/^[a-z0-9][a-z0-9._:-]{0,63}$/;
const REF=/^ref_[A-Za-z0-9_-]{12,80}$/;
const NONCE=/^[A-Za-z0-9_-]{22,64}$/;
const SHA=/^[a-f0-9]{64}$/;
const SIG=/^[A-Za-z0-9_-]{86}$/;
const okKeys=(value,keys)=>value&&typeof value==='object'&&!Array.isArray(value)&&
  Object.keys(value).length===keys.length&&Object.keys(value).every(k=>keys.includes(k));
const digest=(s)=>createHash('sha256').update(s).digest('hex');
const result=(decision,more={})=>Object.freeze({decision,liveDelivery:false,communicationsSent:0,
  customerDataTransferred:0,...more});
const isoTime=s=>typeof s==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(s)&&
  Number.isFinite(Date.parse(s))&&new Date(s).toISOString()===s;

export function canonicalBrokerEvent(envelope){
  return canonicalize(envelope);
}

/** Exact schema and source-child binding; never accept customer payloads. */
export function inspectBrokerEvent(envelope,nowMs=Date.now()){
  if(!okKeys(envelope,ENVELOPE_KEYS))return result('DENY_EVENT_SCHEMA');
  if(envelope.schemaVersion!==BROKER_EVENT_SCHEMA||
    envelope.sourceApplicationId!=='ai-data-platform'||
    envelope.destinationApplicationId!=='rosevear-comms-hub'||
    envelope.audience!=='rosevear-comms-hub:nonproduction'||
    envelope.environment!=='TEST'||!BROKER_EVENT_TYPES.includes(envelope.eventType)||
    !Object.hasOwn(SHELLS,envelope.sourceShell)||
    envelope.originApplicationId!==SHELLS[envelope.sourceShell]||
    SOURCES[envelope.sourceShell]?.app!==envelope.originApplicationId||
    !ID.test(envelope.eventId??'')||!UUID.test(envelope.traceId??'')||
    !SCOPE.test(envelope.tenantId??'')||!SCOPE.test(envelope.childId??'')||
    !SHA.test(envelope.sourceReceiptSha256??'')||!SHA.test(envelope.consentSha256??'')||
    !REF.test(envelope.payloadRef??'')||!NONCE.test(envelope.nonce??''))
    return result('DENY_EVENT_FIELDS_OR_SCOPE');
  if(!isoTime(envelope.issuedAt)||!isoTime(envelope.expiresAt)||
    !Number.isFinite(nowMs)||Date.parse(envelope.issuedAt)>nowMs+30_000||
    nowMs>=Date.parse(envelope.expiresAt)||
    Date.parse(envelope.expiresAt)-Date.parse(envelope.issuedAt)>BROKER_MAX_AGE_MS)
    return result('HOLD_EVENT_EXPIRED_OR_FUTURE');
  return result('SCHEMA_VALID_TEST_ONLY',{envelopeSha256:digest(canonicalBrokerEvent(envelope))});
}

/** Caller must supply separately verified server-only custody, never claims from packet. */
export function verifyBrokerDelivery(packet,trust={},nowMs=Date.now()){
  if(!okKeys(packet,['envelope','signature','keyId']))return result('DENY_PACKET_SCHEMA');
  const v=inspectBrokerEvent(packet.envelope,nowMs);
  if(v.decision!=='SCHEMA_VALID_TEST_ONLY')return v;
  const e=packet.envelope;
  if([401,403].includes(trust.peerHttpStatus))return result('HOLD_PEER_IDENTITY_DENIED');
  if(trust.originChanged===true||trust.redirected===true)return result('DENY_UNPINNED_ORIGIN');
  if(trust.rollbackInProgress===true)return result('HOLD_BROKER_ROLLBACK');
  if(trust.authenticated!==true||trust.workloadVerified!==true||
    trust.originIndependentlyPinned!==true||trust.keyEpochValid!==true||
    trust.sourceRouteReviewed!==true||trust.nonproductionDeliveryApproved!==true||
    trust.sourceSignerIndependentlyPinned!==true||trust.sourceOwnerTestAuthorized!==true||
    trust.ownerTestAuthorized!==true||trust.signedSourceReceiptVerified!==true||
    trust.childIsolationVerified!==true||trust.consentProofVerified!==true||
    trust.sourceReceiptSha256!==e.sourceReceiptSha256||
    trust.consentSha256!==e.consentSha256||
    trust.tenantId!==e.tenantId||trust.childId!==e.childId||
    trust.sourceShell!==e.sourceShell||trust.originApplicationId!==e.originApplicationId||
    trust.workloadAudience!=='rosevear-comms-hub:nonproduction')
    return result('HOLD_UNVERIFIED_BROKER_OR_SOURCE_AUTHORITY');
  if(!/^broker-key-[a-z0-9-]{4,60}$/.test(packet.keyId??'')||
    packet.keyId!==trust.pinnedKeyId||!SIG.test(packet.signature??'')||
    !SHA.test(trust.pinnedPublicKeySha256??''))
    return result('DENY_UNPINNED_SIGNER');
  try{
    const key=createPublicKey(trust.pinnedPublicKeyPem);
    if(key.asymmetricKeyType!=='ed25519'||
      digest(key.export({format:'der',type:'spki'}))!==trust.pinnedPublicKeySha256||
      !verify(null,Buffer.from(canonicalBrokerEvent(e)),key,Buffer.from(packet.signature,'base64url')))
      return result('DENY_INVALID_BROKER_SIGNATURE');
  }catch{return result('DENY_INVALID_BROKER_SIGNATURE');}
  return result('VERIFIED_FOR_PRIVATE_INBOX',{envelopeSha256:v.envelopeSha256,
    effectKind:e.eventType==='case.handoff.requested'?'CASE_REVIEW_HELD':'TASK_REVIEW_HELD'});
}

/** The supplied transaction must commit inbox and one HOLD effect atomically. */
export function privateBrokerInbox(transaction){
  if(typeof transaction!=='function')throw new Error('PRIVATE_ATOMIC_TRANSACTION_REQUIRED');
  return {async receive(packet,trust,nowMs=Date.now()){
    const verified=verifyBrokerDelivery(packet,trust,nowMs);
    if(verified.decision!=='VERIFIED_FOR_PRIVATE_INBOX')return verified;
    const e=packet.envelope;
    return transaction(async tx=>{
      const inserted=await tx.query(`INSERT INTO public.master_broker_event_inbox_ql337
        (source_app_id,origin_app_id,shell_id,tenant_id,child_id,event_id,event_type,trace_id,
         nonce,source_receipt_sha256,consent_sha256,envelope_sha256,payload_ref)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
        ON CONFLICT DO NOTHING RETURNING inbox_id`,
        [e.sourceApplicationId,e.originApplicationId,e.sourceShell,e.tenantId,e.childId,
          e.eventId,e.eventType,e.traceId,e.nonce,e.sourceReceiptSha256,e.consentSha256,
          verified.envelopeSha256,e.payloadRef]);
      if(inserted.rows.length===0){
        const existing=await tx.query(`SELECT envelope_sha256 FROM public.master_broker_event_inbox_ql337
          WHERE source_app_id=$1 AND event_id=$2`,[e.sourceApplicationId,e.eventId]);
        if(existing.rows.length===0)return result('HOLD_NONCE_REPLAY_OR_SCOPE_CONFLICT');
        return existing.rows[0].envelope_sha256===verified.envelopeSha256?
          result('DUPLICATE_NO_EFFECT',{effectCount:0}):
          result('HOLD_EVENT_ID_CONFLICT',{effectCount:0});
      }
      await tx.query(`INSERT INTO public.master_broker_effect_receipts_ql337
        (inbox_id,effect_kind,effect_state,receipt_sha256)
        VALUES($1,$2,'HOLD',$3) ON CONFLICT DO NOTHING`,
        [inserted.rows[0].inbox_id,verified.effectKind,
          digest(verified.envelopeSha256+':'+verified.effectKind)]);
      return result('RECORDED_ONE_HELD_EFFECT',{effectCount:1,
        receiptSha256:digest(verified.envelopeSha256+':'+verified.effectKind)});
    });
  }};
}
