/** QL-339: private Node-only portal receipt gate. Never import into the public Vite app. */
import {createHash,createPublicKey,verify} from 'node:crypto';
import {canonicalize,SOURCES} from '../master-discovery/manifest.mjs';

export const PORTAL_SCHEMA='rosevear.comms.child.portal.journey.v1';
export const PORTAL_EVENTS=Object.freeze(['case.opened','case.status.updated','booking.status.updated',
  'communication.preference.updated','consent.granted','consent.revoked','session.revoked']);
const SHELLS=Object.freeze({yw:'yard-workers',icamp:'icamp',rosiedazzlers:'rosiedazzlers',devilndove:'devilndove'});
const FIELDS=Object.freeze(['schemaVersion','eventId','eventType','issuer','destination','shellId',
  'tenantId','childId','subjectRef','caseRef','consentReceiptSha256','ownerGrantSha256',
  'sourceReceiptSha256','nonce','issuedAt','expiresAt','retentionDays','audience','environment']);
const exact=(o,fields)=>o&&typeof o==='object'&&!Array.isArray(o)&&
  Object.keys(o).length===fields.length&&Object.keys(o).every(k=>fields.includes(k));
const ID=/^[a-z0-9][a-z0-9._:-]{0,63}$/;
const EVENT_ID=/^evt_[A-Za-z0-9_-]{12,80}$/;
const REF=/^ref_[A-Za-z0-9_-]{12,80}$/;
const NONCE=/^[A-Za-z0-9_-]{22,64}$/;
const SHA=/^[a-f0-9]{64}$/;
const SIG=/^[A-Za-z0-9_-]{86}$/;
const ISO=/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/;
const sha=data=>createHash('sha256').update(data).digest('hex');
const date=s=>typeof s==='string'&&ISO.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString()===s;
const held=(decision,extra={})=>Object.freeze({decision,connection:'DISCONNECTED / HOLD',
  livePortal:false,customerRecordsTransferred:0,communicationsSent:0,...extra});

export function inspectPortalJourney(e,now=Date.now()){
  if(!exact(e,FIELDS))return held('DENY_SCHEMA_OR_CUSTOMER_PAYLOAD');
  if(e.schemaVersion!==PORTAL_SCHEMA||!PORTAL_EVENTS.includes(e.eventType)||
    !Object.hasOwn(SHELLS,e.shellId)||e.issuer!==SHELLS[e.shellId]||
    SOURCES[e.shellId]?.app!==e.issuer||e.destination!=='rosevear-comms-hub'||
    e.audience!=='rosevear-comms-hub:child-portal:nonproduction'||e.environment!=='TEST'||
    !EVENT_ID.test(e.eventId??'')||!ID.test(e.tenantId??'')||!ID.test(e.childId??'')||
    !REF.test(e.subjectRef??'')||!REF.test(e.caseRef??'')||!NONCE.test(e.nonce??'')||
    !SHA.test(e.consentReceiptSha256??'')||!SHA.test(e.ownerGrantSha256??'')||
    !SHA.test(e.sourceReceiptSha256??'')||!Number.isInteger(e.retentionDays)||
    e.retentionDays<1||e.retentionDays>365)return held('DENY_SOURCE_SCOPE_OR_RETENTION');
  if(!date(e.issuedAt)||!date(e.expiresAt)||!Number.isFinite(now)||
    Date.parse(e.issuedAt)>now+30_000||Date.parse(e.expiresAt)<=now||
    Date.parse(e.expiresAt)<=Date.parse(e.issuedAt)||
    Date.parse(e.expiresAt)-Date.parse(e.issuedAt)>300_000)
    return held('HOLD_EXPIRED_OR_FUTURE');
  return held('SCHEMA_VALID_TEST_ONLY',{eventSha256:sha(canonicalize(e))});
}

/** Real grants must be supplied by separately authenticated, server-side original issuers. */
export function verifyPortalJourney(packet,trust={},now=Date.now()){
  if(!exact(packet,['envelope','signature','keyId']))return held('DENY_SIGNED_PACKET');
  const inspection=inspectPortalJourney(packet.envelope,now);
  if(inspection.decision!=='SCHEMA_VALID_TEST_ONLY')return inspection;
  const e=packet.envelope;
  if([401,403].includes(trust.peerStatus)||trust.redirected===true||trust.signerRevoked===true)
    return held('DENY_AUTHENTICATION_OR_ORIGIN');
  if(trust.identityAuthenticated!==true||trust.workloadAuthenticated!==true||
    trust.sourceOwnerTestApproved!==true||trust.commsOwnerTestApproved!==true||
    trust.originalIssuerWitnessed!==true||trust.signerIndependentlyPinned!==true||
    trust.signedSourceReceiptVerified!==true||trust.ownerGrantVerified!==true||
    trust.childDelegationVerified!==true||
    trust.consentReceiptVerified!==true||trust.sessionValid!==true||
    trust.roleRevoked===true||trust.sessionRevoked===true||trust.grantRevoked===true||
    trust.audience!==e.audience||trust.issuer!==e.issuer||trust.shellId!==e.shellId||
    trust.tenantId!==e.tenantId||trust.childId!==e.childId||
    trust.subjectRef!==e.subjectRef||trust.consentReceiptSha256!==e.consentReceiptSha256||
    trust.ownerGrantSha256!==e.ownerGrantSha256||trust.sourceReceiptSha256!==e.sourceReceiptSha256)
    return held('HOLD_MISSING_OR_REVOKED_CHILD_AUTHORITY');
  if(!['consent.revoked','session.revoked'].includes(e.eventType)&&trust.consentActive!==true)
    return held('HOLD_CONSENT_NOT_ACTIVE');
  if(!/^portal-key-[a-z0-9-]{4,60}$/.test(packet.keyId??'')||
    packet.keyId!==trust.pinnedKeyId||!SIG.test(packet.signature??'')||
    !SHA.test(trust.pinnedPublicKeySha256??''))return held('DENY_UNPINNED_SIGNER');
  try{
    const key=createPublicKey(trust.pinnedPublicKeyPem);
    if(key.asymmetricKeyType!=='ed25519'||
      sha(key.export({format:'der',type:'spki'}))!==trust.pinnedPublicKeySha256||
      !verify(null,Buffer.from(canonicalize(e)),key,Buffer.from(packet.signature,'base64url')))
      return held('DENY_SIGNATURE');
  }catch{return held('DENY_SIGNATURE');}
  return held('VERIFIED_PRIVATE_RECEIPT_HELD',{eventSha256:inspection.eventSha256});
}

/** Every portal read/export must be bound to one exact shell, tenant, child and subject. */
export function authorizePortalAccess(request,trust={}){
  if(!exact(request,['operation','shellId','tenantId','childId','subjectRef']))return held('DENY_ACCESS_SCHEMA');
  if(!['read','export','delete-request'].includes(request.operation)||
    !Object.hasOwn(SHELLS,request.shellId)||!ID.test(request.tenantId??'')||
    !ID.test(request.childId??'')||!REF.test(request.subjectRef??''))return held('DENY_ACCESS_SCOPE');
  if(trust.identityAuthenticated!==true||trust.sessionValid!==true||
    trust.sessionRevoked===true||trust.roleRevoked===true||trust.grantRevoked===true||
    trust.shellId!==request.shellId||trust.tenantId!==request.tenantId||
    trust.childId!==request.childId||trust.subjectRef!==request.subjectRef||
    trust.childDelegationVerified!==true)return held('DENY_CROSS_CHILD_OR_REVOKED_SESSION');
  if(trust.consentActive!==true||trust.consentReceiptVerified!==true||
    (request.operation==='export'&&trust.exportConsentVerified!==true)||
    (request.operation==='delete-request'&&trust.deleteRequestAuthorized!==true))
    return held('DENY_MISSING_OPERATION_CONSENT');
  return held('AUTHORIZED_PRIVATE_SCOPE_ONLY',{scope:[request.shellId,request.tenantId,
    request.childId,request.subjectRef]});
}

/** Supplied transaction must enforce uniqueness and append-only effects atomically. */
export function privatePortalLedger(transaction){
  if(typeof transaction!=='function')throw new Error('PRIVATE_ATOMIC_TRANSACTION_REQUIRED');
  return {async receive(packet,trust,now=Date.now()){
    const decision=verifyPortalJourney(packet,trust,now);
    if(decision.decision!=='VERIFIED_PRIVATE_RECEIPT_HELD')return decision;
    const e=packet.envelope;
    return transaction(async tx=>{
      const inserted=await tx.query(`INSERT INTO public.master_client_portal_journeys_ql339
        (shell_id,tenant_id,child_id,subject_ref,case_ref,event_id,event_type,nonce,
         consent_receipt_sha256,owner_grant_sha256,source_receipt_sha256,event_sha256,
         retention_until) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
         ON CONFLICT DO NOTHING RETURNING journey_id`,
      [e.shellId,e.tenantId,e.childId,e.subjectRef,e.caseRef,e.eventId,e.eventType,e.nonce,
        e.consentReceiptSha256,e.ownerGrantSha256,e.sourceReceiptSha256,decision.eventSha256,
        new Date(Date.parse(e.issuedAt)+e.retentionDays*86_400_000).toISOString()]);
      if(inserted.rows.length===0){
        const existing=await tx.query(`SELECT event_sha256 FROM public.master_client_portal_journeys_ql339
          WHERE shell_id=$1 AND tenant_id=$2 AND child_id=$3 AND event_id=$4`,
          [e.shellId,e.tenantId,e.childId,e.eventId]);
        if(existing.rows.length===0)return held('HOLD_NONCE_REPLAY_OR_SCOPE_CONFLICT');
        return existing.rows[0].event_sha256===decision.eventSha256?
          held('DUPLICATE_NO_EFFECT'):held('HOLD_EVENT_ID_CONFLICT');
      }
      return held('RECORDED_ONE_PRIVATE_HELD_RECEIPT',{receiptRecorded:true});
    });
  },async scopedRead(request,trust){
    const decision=authorizePortalAccess(request,trust);
    if(decision.decision!=='AUTHORIZED_PRIVATE_SCOPE_ONLY')return decision;
    if(request.operation!=='read')return held('HOLD_EXPORT_OR_ERASURE_OWNER_WORKFLOW');
    const [shell,tenant,child,subject]=decision.scope;
    return transaction(async tx=>{
      const rows=await tx.query(`SELECT event_id,event_type,case_ref,received_at
        FROM public.master_client_portal_journeys_ql339
        WHERE shell_id=$1 AND tenant_id=$2 AND child_id=$3 AND subject_ref=$4
          AND retention_until>now() ORDER BY received_at DESC LIMIT 50`,
      [shell,tenant,child,subject]);
      return held('PRIVATE_SCOPE_READ_ONLY',{events:rows.rows,scope:[shell,tenant,child]});
    });
  }};
}
