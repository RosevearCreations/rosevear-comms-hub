/**
 * QL-485: offline, fail-closed six-source signed contract negotiation.
 * All versions are proposals; no network, source writes, customer data,
 * signer self-enrollment, automatic connection, git merge or live acceptance.
 */
import {createHash,createPublicKey,verify} from 'node:crypto';
import {SOURCES,canonicalize} from './manifest.mjs';

export const QL485_SCHEMA='rosevear.comms.ql485.source-release-notice.v1';
export const QL485_REVIEW_SCHEMA='rosevear.comms.ql485.independent-contract-review.v1';
export const QL485_SOURCE_IDS=Object.freeze(Object.keys(SOURCES).sort());
export const QL485_FIELDS=Object.freeze(['schema','noticeId','sourceId',
 'repository','sourceRevision','previousRevision','manifestMajor',
 'contractVersion','eventSchemas','capabilities','tenantBoundary',
 'environment','audience','issuedAtMs','expiresAtMs','requestedAction',
 'customerDataIncluded','authorityTransfer']);
const PIN_FIELDS=['sourceId','publicKeyPem','approvedRevision',
 'approvedContractVersion','approvedEventSchemas','approvedCapabilities',
 'independentlyVerified','sourceOwnerApproved'];
const REVIEW_FIELDS=['schema','reviewId','sourceId','noticeDigest','reviewerId',
 'reviewedAtMs','decision','customerDataReviewed','authorityTransfer'];
const CAPABILITIES={
 yw:['health.read','private.incident.review'],
 icamp:['health.read','private.incident.review'],
 rosiedazzlers:['health.read','storefront.status.read'],
 devilndove:['health.read','storefront.status.read'],
 'ai-data-platform':['broker.case.review','health.read'],
 'rosevear-ai-hub':['device.status.read','health.read']
};
const SHA=/^[a-f0-9]{40}$/,HEX=/^[a-f0-9]{64}$/,
 ID=/^[A-Za-z0-9_-]{8,96}$/,VER=/^[0-9]+\.[0-9]+\.[0-9]+$/;
const own=(v,k)=>Object.prototype.hasOwnProperty.call(v,k);
const exact=(v,fields)=>!!v&&typeof v==='object'&&!Array.isArray(v)&&
 Object.keys(v).length===fields.length&&fields.every(k=>own(v,k));
const digest=v=>createHash('sha256').update(canonicalize(v),'utf8').digest('hex');
const hold=reason=>({state:'HOLD',reason,connected:false,
 sourceAuthorized:false,productionAcceptance:false,automaticMerge:false,
 customerData:false,authorityTransfer:false});
const arrayValid=a=>Array.isArray(a)&&a.length>0&&a.length<=8&&
 a.every(x=>typeof x==='string'&&/^[a-z][a-z0-9._-]{2,96}$/.test(x))&&
 [...new Set(a)].sort().join('|')===a.join('|');
const same=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&
 a.every((x,i)=>x===b[i]);
function pinnedKey(pem){
 try{if(typeof pem!=='string'||pem.length>4096)return null;
  const k=createPublicKey(pem);
  return k.asymmetricKeyType==='ed25519'?k:null;
 }catch{return null}
}
function packetValid(packet,pem,fields){
 try{
  if(!exact(packet,['payload','signature'])||
   !exact(packet.payload,fields)||!pinnedKey(pem)||
   typeof packet.signature!=='string'||
   !/^[A-Za-z0-9_-]{86}$/.test(packet.signature))return false;
  const sig=Buffer.from(packet.signature,'base64url');
  return sig.length===64&&sig.toString('base64url')===packet.signature&&
   verify(null,Buffer.from(canonicalize(packet.payload),'utf8'),
    pinnedKey(pem),sig);
 }catch{return false}
}
/** Independently pinned signatures prove these bytes, not source authority. */
export function verifyQl485SourceNotice({packet,pin,nowMs=Date.now()}={}){
 const p=packet?.payload;
 if(!exact(pin,PIN_FIELDS)||!QL485_SOURCE_IDS.includes(pin.sourceId)||
  pin.independentlyVerified!==true||pin.sourceOwnerApproved!==true||
  !pinnedKey(pin.publicKeyPem)||!SHA.test(pin.approvedRevision??'')||
  !VER.test(pin.approvedContractVersion??'')||
  !arrayValid(pin.approvedEventSchemas)||!arrayValid(pin.approvedCapabilities)||
  pin.approvedCapabilities.some(x=>!CAPABILITIES[pin.sourceId].includes(x)))
  return hold('QL485_INDEPENDENT_SOURCE_PIN_AND_OWNER_APPROVAL_REQUIRED');
 if(!packetValid(packet,pin.publicKeyPem,QL485_FIELDS))
  return hold('QL485_SIGNED_SOURCE_NOTICE_REQUIRED');
 const source=SOURCES[p.sourceId];
 if(!source||p.sourceId!==pin.sourceId||p.schema!==QL485_SCHEMA||
   !ID.test(p.noticeId??'')||
   p.repository!=='RosevearCreations/'+source.repo||
   p.tenantBoundary!==source.boundary||
   !SHA.test(p.sourceRevision??'')||
   !(p.previousRevision===null||SHA.test(p.previousRevision??''))||
   p.manifestMajor!==1||!VER.test(p.contractVersion??'')||
   !arrayValid(p.eventSchemas)||!arrayValid(p.capabilities)||
   p.capabilities.some(x=>!CAPABILITIES[p.sourceId].includes(x))||
   !['TEST','PRIVATE_STAGING'].includes(p.environment)||
   p.audience!=='rosevear-comms-hub:private-negotiation'||
   p.requestedAction!=='READ_ONLY_COMPATIBILITY_REVIEW'||
   p.customerDataIncluded!==false||p.authorityTransfer!==false||
   !Number.isSafeInteger(nowMs)||!Number.isSafeInteger(p.issuedAtMs)||
   !Number.isSafeInteger(p.expiresAtMs)||p.issuedAtMs<=0||
   p.issuedAtMs>nowMs||nowMs-p.issuedAtMs>120000||
   p.expiresAtMs<=nowMs||p.expiresAtMs-p.issuedAtMs>300000)
  return hold('QL485_SOURCE_IDENTITY_SCOPE_VERSION_OR_FRESHNESS_DENIED');
 const common={sourceId:p.sourceId,repository:p.repository,
  sourceRevision:p.sourceRevision,approvedRevision:pin.approvedRevision,
  contractVersion:p.contractVersion,
  noticeDigest:digest(packet),
  connected:false,sourceAuthorized:false,productionAcceptance:false,
  automaticMerge:false,customerData:false,authorityTransfer:false};
 if(p.contractVersion.split('.')[0]!==pin.approvedContractVersion.split('.')[0])
  return {...common,state:'HOLD',reason:'QL485_MAJOR_VERSION_INCOMPATIBLE'};
 if(p.sourceRevision!==pin.approvedRevision)return p.previousRevision===pin.approvedRevision?
  {...common,state:'SIGNED_NEW_REVISION_OWNER_REENROLLMENT_REQUIRED',
   reason:'QL485_INDEPENDENT_SOURCE_REVISION_REVIEW'}:
  {...common,state:'HOLD',reason:'QL485_RELEASE_CHAIN_NOT_ANCHORED'};
 if(!same(p.eventSchemas,pin.approvedEventSchemas))
  return {...common,state:'SIGNED_EVENT_SCHEMA_CHANGE_REVIEW_REQUIRED',
   reason:'QL485_SOURCE_SCHEMA_NOT_SILENTLY_APPROVED'};
 if(!same(p.capabilities,pin.approvedCapabilities))
  return {...common,state:'SIGNED_CAPABILITY_CHANGE_REVIEW_REQUIRED',
   reason:'QL485_SOURCE_CAPABILITY_CHANGE_REQUIRES_APPROVAL'};
 if(p.contractVersion!==pin.approvedContractVersion)
  return {...common,state:'SIGNED_SEMVER_CHANGE_REVIEW_REQUIRED',
   reason:'QL485_CONTRACT_VERSION_CHANGED'};
 return {...common,state:'SIGNED_COMPATIBLE_READ_ONLY_CONTRACT_HELD',
  reason:'QL485_SIGNATURE_DOES_NOT_ACTIVATE_SOURCE'};
}
/** Independent signature can approve REVIEW, never modify trust pins. */
export function verifyQl485IndependentReview({release,reviewPacket,reviewerPin,
 sourcePin,nowMs=Date.now()}={}){
 const p=reviewPacket?.payload;
 if(!pinnedKey(reviewerPin)||!pinnedKey(sourcePin)||reviewerPin===sourcePin||
  !packetValid(reviewPacket,reviewerPin,REVIEW_FIELDS)||
  !release||!QL485_SOURCE_IDS.includes(release.sourceId)||
  !HEX.test(release.noticeDigest??'')||
  !['SIGNED_NEW_REVISION_OWNER_REENROLLMENT_REQUIRED',
    'SIGNED_EVENT_SCHEMA_CHANGE_REVIEW_REQUIRED',
    'SIGNED_CAPABILITY_CHANGE_REVIEW_REQUIRED',
    'SIGNED_SEMVER_CHANGE_REVIEW_REQUIRED'].includes(release.state)||
  p.schema!==QL485_REVIEW_SCHEMA||!ID.test(p.reviewId??'')||
  !ID.test(p.reviewerId??'')||p.sourceId!==release.sourceId||
  p.noticeDigest!==release.noticeDigest||
  !Number.isSafeInteger(p.reviewedAtMs)||p.reviewedAtMs>nowMs||
  nowMs-p.reviewedAtMs>300000||
  p.decision!=='REVIEW_ONLY_OWNER_REENROLLMENT_PENDING'||
  p.customerDataReviewed!==false||p.authorityTransfer!==false)
  return hold('QL485_DISTINCT_INDEPENDENT_REVIEW_REQUIRED');
 return {state:'INDEPENDENT_CONTRACT_CHANGE_REVIEW_HELD',
  sourceId:release.sourceId,noticeDigest:release.noticeDigest,
  reviewerDigest:digest(reviewPacket),sourceAuthorized:false,
  productionAcceptance:false,authorityTransfer:false,
  automaticMerge:false};
}
/** One independently verified source slot for every one of the six apps. */
export function negotiateQl485SixSources({packets={},pins={},nowMs=Date.now()}={}){
 const results={};
 // Reused source keys are refused even when packets have different source IDs.
 const keyUse=new Map();
 for(const id of QL485_SOURCE_IDS){
  const pem=pins[id]?.publicKeyPem;
  if(typeof pem==='string'&&pinnedKey(pem)){
   const ids=keyUse.get(pem)??[];ids.push(id);keyUse.set(pem,ids);
  }
 }
 const sharedKeys=new Set([...keyUse.values()].filter(ids=>ids.length>1).flat());
 for(const id of QL485_SOURCE_IDS){
  if(sharedKeys.has(id)){results[id]=hold('QL485_REUSED_SOURCE_SIGNER_PIN_DENIED');continue}
  if(!own(packets,id)){results[id]=hold('QL485_SOURCE_NOTICE_MISSING');continue}
  if(packets[id]?.payload?.sourceId!==id){
   results[id]=hold('QL485_WRONG_SOURCE_ENVELOPE');continue}
  results[id]=verifyQl485SourceNotice({packet:packets[id],pin:pins[id],nowMs});
 }
 const compatible=Object.values(results).filter(x=>
  x.state==='SIGNED_COMPATIBLE_READ_ONLY_CONTRACT_HELD').length;
 const pending=QL485_SOURCE_IDS.filter(id=>
  results[id].state!=='SIGNED_COMPATIBLE_READ_ONLY_CONTRACT_HELD');
 return {state:compatible===6?'ALL_SIX_SIGNED_CONTRACTS_READ_ONLY_HELD':
   'MULTISOURCE_CONTRACT_REVIEW_HOLD',sourceCount:6,compatibleCount:compatible,
  pendingSources:pending,results,summaryDigest:digest(results),
  sourceRuntimeVerified:false,productionAcceptance:false,
  customerDelivery:false,automaticMerge:false};
}
/** GitHub ahead/behind only describes this repo's Git ancestry.
 * Caller metadata is never mistaken for a cryptographically signed API fact. */
export function diagnoseQl485CrossAppDivergence({git,sourceHeads={},
 negotiation}={}){
 if(!exact(git,['repository','mainSha','devSha','aheadBy','behindBy','checkedAtMs'])||
  git.repository!=='RosevearCreations/rosevear-comms-hub'||
  !SHA.test(git.mainSha??'')||!SHA.test(git.devSha??'')||
  !Number.isSafeInteger(git.aheadBy)||git.aheadBy<0||
  !Number.isSafeInteger(git.behindBy)||git.behindBy<0||
  !Number.isSafeInteger(git.checkedAtMs)||git.checkedAtMs<=0||
  !negotiation?.results||!HEX.test(negotiation.summaryDigest??''))
  return hold('QL485_GIT_AND_SOURCE_REPORT_MUST_BE_EXPLICIT');
 const gitAncestry=git.aheadBy>0&&git.behindBy>0?'DIVERGED':
  git.aheadBy>0?'DEV_AHEAD':git.behindBy>0?'MAIN_AHEAD':'IN_SYNC';
 const sources={};
 for(const id of QL485_SOURCE_IDS){
  const head=sourceHeads[id],release=negotiation.results[id];
  sources[id]={sourceReleaseState:release?.state??'HOLD',
   headState:head===undefined?'HEAD_NOT_RETRIEVED':
    !SHA.test(head)||!SHA.test(release?.sourceRevision??'')?
     'SOURCE_HEAD_OR_PIN_UNAVAILABLE':
     head===release.sourceRevision?'HEAD_MATCHES_SIGNED_CLAIM':
      'EXTERNAL_SOURCE_HEAD_CHANGE_NEEDS_INDEPENDENT_REVIEW'};
 }
 return {state:'READ_ONLY_CROSS_APP_DIAGNOSTICS',
  gitAncestry,mainSha:git.mainSha,devSha:git.devSha,
  aheadBy:git.aheadBy,behindBy:git.behindBy,sources,
  gitMetadataTrust:'CALLER_SUPPLIED_NOT_ATTESTED',
  externalSourceUpdatesCauseGitDivergence:false,
  automaticMerge:false,sourceRuntimeVerified:false,
  productionAcceptance:false};
}
export const QL485_BOUNDARY=Object.freeze({
 networkRequests:0,privateListeners:0,customerWrites:false,
 sourceWrites:false,signerSelfEnrollment:false,
 automaticSourcePromotion:false,automaticGitMerge:false,
 originalHostVerified:false,publicRoute:false});
