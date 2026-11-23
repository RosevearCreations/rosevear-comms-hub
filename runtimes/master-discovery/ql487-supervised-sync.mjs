/** QL-487 supervised private six-app synchronization; never a public Worker route. */
import {createHash,createPublicKey,verify} from 'node:crypto';
import {canonicalize} from './manifest.mjs';
import {QL485_SOURCE_IDS,verifyQl485SourceNotice} from './ql485-signed-release-negotiation.mjs';
const SHA=/^[a-f0-9]{40}$/;
const HEX=/^[a-f0-9]{64}$/;
const TOKEN=/^[A-Za-z0-9_-]{8,96}$/;
const hold=reason=>({state:'HOLD',reason,sourceConnected:false,authorityTransfer:false,automaticMerge:false,productionAcceptance:false});
const digest=x=>createHash('sha256').update(canonicalize(x)).digest('hex');
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const keys=(o,k)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).length===k.length&&k.every(x=>Object.hasOwn(o,x));
export const QL487_DECISION_SCHEMA='rosevear.comms.ql487.operator-reconciliation-decision.v1';
const DECISION_FIELDS=['schema','decisionId','sourceId','observedRevision','approvedRevision','registryDigest','noticeDigest','decision','operatorId','issuedAtMs','expiresAtMs','authorityTransfer'];
const SOURCE_FIELDS=['sourceId','noticePacket','sourceAttestationPacket','ownerPacket','reviewerPacket'];
function verifyDecision(packet,pem,now){
 try{
  if(!keys(packet,['payload','signature'])||!keys(packet.payload,DECISION_FIELDS))return false;
  const k=createPublicKey(pem),sig=Buffer.from(packet.signature,'base64url');
  return k.asymmetricKeyType==='ed25519'&&sig.length===64&&
   sig.toString('base64url')===packet.signature&&
   verify(null,Buffer.from(canonicalize(packet.payload)),k,sig)&&
   packet.payload.schema===QL487_DECISION_SCHEMA&&
   TOKEN.test(packet.payload.decisionId)&&TOKEN.test(packet.payload.operatorId)&&
   ['ACKNOWLEDGE_HOLD','REQUEST_INDEPENDENT_REVIEW'].includes(packet.payload.decision)&&
   Number.isSafeInteger(packet.payload.issuedAtMs)&&
   packet.payload.issuedAtMs<=now&&now-packet.payload.issuedAtMs<=120000&&
   Number.isSafeInteger(packet.payload.expiresAtMs)&&
   packet.payload.expiresAtMs>now&&packet.payload.expiresAtMs-packet.payload.issuedAtMs<=300000&&
   packet.payload.authorityTransfer===false;
 }catch{return false}
}
/** Never infer source availability from a public Git commit or browser claim. */
export function classifyQl487Drift({sourceId,observedRevision,registry,pins,noticePacket,nowMs=Date.now()}={}){
 if(!QL485_SOURCE_IDS.includes(sourceId)||!SHA.test(observedRevision??'')||
  !registry||typeof registry.summary!=='function'||!pins?.[sourceId])
  return hold('QL487_SOURCE_AND_TRUST_REQUIRED');
 const snap=registry.summary(),stored=snap.sources?.[sourceId];
 if(snap.state!=='PRIVATE_OPERATOR_REGISTRY_READ_ONLY_HELD'||!stored||
  stored.state==='PRIVATE_SOURCE_ATTESTATION_TAMPER_HOLD')
  return hold('QL487_PRIVATE_CHAIN_UNTRUSTED');
 const verified=verifyQl485SourceNotice({packet:noticePacket,pin:pins[sourceId],nowMs});
 if(verified.state==='HOLD'||noticePacket?.payload?.sourceRevision!==observedRevision)
  return hold('QL487_SIGNED_SOURCE_REVISION_OR_CONTRACT_INVALID');
 const reasons=[];
 if(stored.approvedRevision!==observedRevision)reasons.push('SOURCE_REVISION_DRIFT');
 if(stored.sourceRevision&&stored.sourceRevision!==observedRevision)reasons.push('LAST_RECORDED_REVISION_CHANGED');
 if(stored.contractVersion&&stored.contractVersion!==noticePacket.payload.contractVersion)reasons.push('CONTRACT_VERSION_DRIFT');
 if(stored.attestationCount===0)reasons.push('NO_DURABLE_ATTESTATION');
 if(verified.state!=='SIGNED_COMPATIBLE_READ_ONLY_CONTRACT_HELD')reasons.push('CONTRACT_REVIEW_REQUIRED');
 return {state:reasons.length?'OPERATOR_REVIEW_HOLD':'SIGNED_METADATA_MATCH_HELD',
  sourceId,observedRevision,approvedRevision:stored.approvedRevision,
  noticeDigest:verified.noticeDigest,registryDigest:snap.registryDigest,
  reasons,sourceConnected:false,originalRuntimeVerified:false,
  authorityTransfer:false,automaticMerge:false,productionAcceptance:false};
}
/** Caller must supply a narrow, trusted HTTPS fetcher and signed original-source packets.
 * No automatic polling, environment credential discovery, background retries or endpoints
 * are created by this module. A real fetch is only a transport observation, not source proof.
 */
export function createQl487SupervisedSync({registry,pins,fetchSource,operatorPins,now=()=>Date.now()}={}){
 if(typeof registry?.commit!=='function'||typeof registry?.summary!=='function'||
  typeof fetchSource!=='function'||!pins||!operatorPins)
  throw Error('QL487_PRIVATE_REGISTRY_SIGNERS_AND_TRANSPORT_REQUIRED');
 async function observe(sourceId,{supervised=false}={}){
  if(!supervised||!QL485_SOURCE_IDS.includes(sourceId))
   return hold('QL487_EXPLICIT_SCOPED_SUPERVISION_REQUIRED');
  let response;
  try{response=await fetchSource(sourceId)}catch{return hold('QL487_PRIVATE_SOURCE_UNREACHABLE')}
  if(!keys(response,SOURCE_FIELDS)||response.sourceId!==sourceId||
    !SHA.test(response.noticePacket?.payload?.sourceRevision??''))
   return hold('QL487_EXACT_SIGNED_SOURCE_BUNDLE_REQUIRED');
  const preview=classifyQl487Drift({sourceId,observedRevision:response.noticePacket.payload.sourceRevision,
   registry,pins,noticePacket:response.noticePacket,nowMs:now()});
  if(preview.state==='HOLD')return preview;
  const receipt=registry.commit(response);
  if(!receipt.state?.startsWith('DURABLE_'))
   return hold('QL487_SIGNED_TRIPLE_ATTESTATION_AND_DURABLE_READBACK_REQUIRED');
  return {state:'SUPERVISED_PRIVATE_SYNC_RECORDED_HELD',sourceId,
   drift:preview.reasons,receiptDigest:receipt.recordDigest,
   sequence:receipt.sequence,sourceConnected:false,originalRuntimeVerified:false,
   authorityTransfer:false,productionAcceptance:false,automaticMerge:false};
 }
 async function sweep({supervised=false,sourceIds=[]}={}){
  if(!supervised||!Array.isArray(sourceIds)||sourceIds.length<1||
   sourceIds.length>6||new Set(sourceIds).size!==sourceIds.length||
   sourceIds.some(id=>!QL485_SOURCE_IDS.includes(id)))
   return hold('QL487_EXPLICIT_NON_DUPLICATE_SOURCE_SCOPE_REQUIRED');
  const sources={};
  for(const id of sourceIds)sources[id]=await observe(id,{supervised:true});
  return {state:'SUPERVISED_SWEEP_FINISHED_HELD',sources,
   sourceConnectionsVerified:0,customerWrites:false,automaticMerge:false};
 }
 function reconcile(packet){
  const p=packet?.payload,at=now();
  if(!p||!QL485_SOURCE_IDS.includes(p.sourceId)||
   !verifyDecision(packet,operatorPins[p.sourceId],at))
   return hold('QL487_INDEPENDENT_OPERATOR_SIGNATURE_REQUIRED');
  const snap=registry.summary(),source=snap.sources?.[p.sourceId];
  if(snap.state!=='PRIVATE_OPERATOR_REGISTRY_READ_ONLY_HELD'||!source||
   source.state==='PRIVATE_SOURCE_ATTESTATION_TAMPER_HOLD'||
   p.registryDigest!==snap.registryDigest||
   p.observedRevision!==source.sourceRevision||
   p.approvedRevision!==source.approvedRevision||
   !SHA.test(p.observedRevision??'')||!SHA.test(p.approvedRevision??'')||
   !HEX.test(p.noticeDigest??'')||
   !TOKEN.test(p.operatorId??''))
   return hold('QL487_OPERATOR_DECISION_STALE_OR_REGISTRY_UNTRUSTED');
  return {state:'OPERATOR_DECISION_RECORDED_IN_MEMORY_HOLD',sourceId:p.sourceId,
   decision:p.decision,decisionDigest:digest(packet),
   sourceRevision:p.observedRevision,approvedRevision:p.approvedRevision,
   sourceAuthorized:false,authorityTransfer:false,automaticMerge:false,
   productionAcceptance:false};
 }
 return Object.freeze({observe,sweep,reconcile,
  state:'OWNER_SUPERVISED_PRIVATE_SYNC_OFF_BY_DEFAULT',automaticPolling:false,
  publicRoute:false,customerWrites:false,sourceWrites:false,automaticMerge:false});
}
