/** QL-404 private Node-only original evidence and owner approval boundary.
 * A local cryptographically verified review is never a six-app connection,
 * receiver enrollment, network TEST grant, or authority to remove HOLD.
 */
import {createHash,createPublicKey,verify} from 'node:crypto';
import {SOURCES,canonicalize} from '../master-discovery/manifest.mjs';

export const QL404_SCHEMA='rosevear.hub.ql404.original-evidence.v1';
export const QL404_REVIEW_SCHEMA='rosevear.hub.ql404.independent-review.v1';
export const QL404_APPROVAL_SCHEMA='rosevear.hub.ql404.owner-decision.v1';
export const QL404_GATES=Object.freeze(['SOURCE_OWNER','MASTER_OWNER','SOURCE_PIN','RECEIVER','CONSENT']);
export const QL404_MAX_ORIGINAL_BYTES=65_536;
const SHA=/^[a-f0-9]{64}$/;
const NONCE=/^[a-f0-9]{32}$/;
const OPAQUE=/^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/;
const SIGNATURE=/^[A-Za-z0-9_-]{86}$/;
const HEX40=/^[0-9a-f]{40}$/;
const hash=data=>createHash('sha256').update(data).digest('hex');
const exact=(value,keys)=>value&&typeof value==='object'&&!Array.isArray(value)&&
  Object.keys(value).length===keys.length&&Object.keys(value).every(key=>keys.includes(key));
const hold=(reason,extra={})=>({schema:QL404_SCHEMA,state:reason,
  originalEvidenceVerified:false,independentReviewerVerified:false,
  sourceOwnerSigned:false,masterOwnerSigned:false,authorizedTest:false,
  connected:false,receiverActivated:false,communicationsSent:0,
  customerDataAccess:false,deviceActions:0,registryWrites:0,persisted:false,...extra});

export function ql404SigningBytes(role,payload){
  if(!['SOURCE_OWNER','INDEPENDENT_REVIEWER','MASTER_OWNER'].includes(role))
    throw Error('DENY_QL404_UNKNOWN_ROLE');
  return Buffer.from(`rosevear.ql404.${role}:`+canonicalize(payload),'utf8');
}

function trustedKey(item){
  if(!exact(item,['keyId','spkiSha256','publicKeyPem'])||
    !OPAQUE.test(item.keyId)||!SHA.test(item.spkiSha256)||
    typeof item.publicKeyPem!=='string'||item.publicKeyPem.length>1500)
    return null;
  try{
    const key=createPublicKey(item.publicKeyPem);
    if(key.asymmetricKeyType!=='ed25519'||
      hash(key.export({format:'der',type:'spki'}))!==item.spkiSha256)return null;
    return key;
  }catch{return null;}
}

function checkSigned(signed,expectedSchema,role,pin){
  if(!exact(signed,['payload','keyId','signature'])||
    !exact(signed.payload,role==='SOURCE_OWNER'?[
      'schema','sourceId','sourceRevision','caseId','assignmentId','correlationId',
      'purpose','environment','issuedAt','expiresAt','nonce','evidence']:
      role==='INDEPENDENT_REVIEWER'?[
        'schema','sourceId','caseId','packetSha256','sourceSignatureSha256',
        'disposition','reasonCode','reviewedAt','nonce']:[
        'schema','sourceId','caseId','packetSha256','reviewSha256','decision',
        'approvedAt','expiresAt','nonce'])||
    signed.payload.schema!==expectedSchema||signed.keyId!==pin.keyId||
    typeof signed.signature!=='string'||!SIGNATURE.test(signed.signature))return false;
  const key=trustedKey(pin);
  if(!key)return false;
  try{return verify(null,ql404SigningBytes(role,signed.payload),key,
    Buffer.from(signed.signature,'base64url'));}
  catch{return false;}
}

/** All key pins MUST come from independently enrolled private configuration.
 * The input cannot supply or revise them. The returned approval is only for
 * a protected owner review, not for sending or activating a connection. */
export function createQl404ProtectedReview({trustedPins,now=()=>Date.now()}={}){
  const spent=new Set();
  const pins=trustedPins;
  const roles=['sourceOwner','independentReviewer','masterOwner'];
  const configured=exact(pins,roles)&&roles.every(role=>trustedKey(pins[role]))&&
    new Set(roles.map(role=>pins[role].spkiSha256)).size===3;
  return Object.freeze({
    inspect(){return hold(configured?'PROTECTED_REVIEW_CONFIGURED_NO_CONNECTION':
      'HOLD_INDEPENDENT_TRUSTED_KEY_PINS_REQUIRED',{reviewedNonceCount:spent.size});},
    verify({sourcePacket,independentReview,masterDecision,originalBytesByGate}={}){
      if(!configured)return hold('HOLD_INDEPENDENT_TRUSTED_KEY_PINS_REQUIRED');
      if(!checkSigned(sourcePacket,QL404_SCHEMA,'SOURCE_OWNER',pins.sourceOwner))
        return hold('DENY_ORIGINAL_SOURCE_OWNER_SIGNATURE');
      const p=sourcePacket.payload;
      if(!Object.hasOwn(SOURCES,p.sourceId)||!OPAQUE.test(p.caseId??'')||
        !OPAQUE.test(p.assignmentId??'')||!OPAQUE.test(p.correlationId??'')||
        !HEX40.test(p.sourceRevision??'')||p.purpose!=='original-evidence-review'||
        p.environment!=='TEST'||!NONCE.test(p.nonce??'')||
        !Number.isFinite(Date.parse(p.issuedAt))||
        !Number.isFinite(Date.parse(p.expiresAt))||
        Date.parse(p.expiresAt)-Date.parse(p.issuedAt)!==300_000||
        now()<Date.parse(p.issuedAt)-5_000||now()>=Date.parse(p.expiresAt))
        return hold('DENY_SOURCE_SCOPE_OR_EXPIRED_REVIEW_PACKET');
      if(!Array.isArray(p.evidence)||p.evidence.length!==5||
        p.evidence.some((e,i)=>!exact(e,['gate','originalSha256','opaqueReference'])||
          e.gate!==QL404_GATES[i]||!SHA.test(e.originalSha256??'')||
          !OPAQUE.test(e.opaqueReference??''))||
        !exact(originalBytesByGate,QL404_GATES))
        return hold('HOLD_FIVE_SOURCE_BOUND_ORIGINAL_ARTIFACTS_REQUIRED');
      for(const evidence of p.evidence){
        const bytes=originalBytesByGate[evidence.gate];
        if(!Buffer.isBuffer(bytes)||bytes.length<1||bytes.length>QL404_MAX_ORIGINAL_BYTES||
          hash(bytes)!==evidence.originalSha256)
          return hold('DENY_ORIGINAL_ARTIFACT_HASH_OR_BOUNDS');
      }
      const packetSha256=hash(ql404SigningBytes('SOURCE_OWNER',p));
      if(!checkSigned(independentReview,QL404_REVIEW_SCHEMA,'INDEPENDENT_REVIEWER',
        pins.independentReviewer))return hold('DENY_INDEPENDENT_REVIEWER_SIGNATURE');
      const r=independentReview.payload;
      if(r.sourceId!==p.sourceId||r.caseId!==p.caseId||r.packetSha256!==packetSha256||
        r.sourceSignatureSha256!==hash(sourcePacket.signature)||
        r.disposition!=='ACCEPT_ORIGINALS'||r.reasonCode!=='ORIGINALS_MATCHED_AND_WITNESSED'||
        r.nonce!==p.nonce||!Number.isFinite(Date.parse(r.reviewedAt))||
        Date.parse(r.reviewedAt)<Date.parse(p.issuedAt)||
        Date.parse(r.reviewedAt)>now()||Date.parse(r.reviewedAt)>=Date.parse(p.expiresAt))
        return hold('HOLD_INDEPENDENT_REVIEWER_OR_ORIGINAL_DISPOSITION');
      if(!checkSigned(masterDecision,QL404_APPROVAL_SCHEMA,'MASTER_OWNER',pins.masterOwner))
        return hold('DENY_MASTER_OWNER_SIGNATURE');
      const m=masterDecision.payload;
      const reviewSha256=hash(ql404SigningBytes('INDEPENDENT_REVIEWER',r));
      if(m.sourceId!==p.sourceId||m.caseId!==p.caseId||
        m.packetSha256!==packetSha256||m.reviewSha256!==reviewSha256||
        m.decision!=='APPROVE_PROTECTED_REVIEW_ONLY'||m.nonce!==p.nonce||
        !Number.isFinite(Date.parse(m.approvedAt))||
        !Number.isFinite(Date.parse(m.expiresAt))||
        Date.parse(m.approvedAt)<Date.parse(r.reviewedAt)||
        Date.parse(m.approvedAt)>now()||
        Date.parse(m.expiresAt)!==Date.parse(p.expiresAt))
        return hold('HOLD_MASTER_OWNER_SCOPE_OR_DISPOSITION');
      const replayKey=`${p.sourceId}/${p.caseId}/${p.nonce}`;
      if(spent.has(replayKey))return hold('DENY_REPLAYED_OWNER_REVIEW');
      spent.add(replayKey);
      return hold('SIGNED_ORIGINAL_REVIEW_VERIFIED_CONNECTION_STILL_HELD',{
        sourceId:p.sourceId,caseId:p.caseId,packetSha256,reviewSha256,
        originalEvidenceVerified:true,independentReviewerVerified:true,
        sourceOwnerSigned:true,masterOwnerSigned:true,
        nextAction:'Separately verify source/receiver TEST grants, consent and signed receiver receipt before any connection change'});
    }
  });
}
