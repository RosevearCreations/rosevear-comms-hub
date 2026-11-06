/** QL-344 offline independent-receiver-OFF evidence reconciliation.
 * This is a format/hash and public-key readiness check, NOT issuer approval,
 * active process stop, an owner signature or a database enrollment. */
import {createHash} from 'node:crypto';
import {readFileSync,statSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {verifiedCandidatePins} from './ql340b-enrollment.mjs';
import {inspectOwnerReviewPacket} from './ql343-owner-evidence-review.mjs';

export const OBSERVATION_SCHEMA='rosevear.hub.ql344.receiver-off-observation.v1';
const SHA=/^[0-9a-f]{64}$/;
const fields=['windowsWitnessSha256','privateTlsWitnessSha256',
  'tailnetAclWitnessSha256','rollbackWitnessSha256'];
const digest=value=>createHash('sha256').update(value).digest('hex');
const held=(state,other={})=>({schema:'rosevear.hub.ql344.signing-readiness.v1',state,
  receiverOffObserved:false,originalReceiverStopped:false,
  originalIssuerEvidenceIndependentlyVerified:false,
  independentOriginalOwnerApproval:false,sourceSigned:false,masterSigned:false,
  requestMayBeSigned:false,receiverActivated:false,databaseEnrollmentCreated:false,
  connected:false,customerCommunications:false,deviceActions:false,...other});
const isOff=value=>value?.schema===OBSERVATION_SCHEMA&&
  value.state==='RECEIVER_OFF_OBSERVED_NOT_ACTIVE_STOP'&&
  value.computer==='DESKTOP-AE894KC'&&value.windowsUser?.toLowerCase()==='ree'&&
  value.receiverPort===8788&&value.localListenerCount===0&&
  value.tailscaleServeNoConfig===true&&value.inertDrillFileCount===1&&
  value.receiverOffObserved===true&&value.originalReceiverStopped===false&&
  value.originalIssuerEvidenceIndependentlyVerified===false&&
  value.independentOriginalOwnerApproval===false&&value.sourceSigned===false&&
  value.masterSigned===false&&value.requestMayBeSigned===false&&
  value.receiverActivated===false&&value.databaseEnrollmentCreated===false&&
  value.connected===false&&value.customerCommunications===false&&
  value.deviceActions===false&&SHA.test(value.tlsCertificateFileSha256??'')&&
  value.evidenceDigests&&Object.keys(value.evidenceDigests).length===4&&
  fields.every(k=>SHA.test(value.evidenceDigests[k]??''))&&
  new Set(fields.map(k=>value.evidenceDigests[k])).size===4;

/** Parsing and freshness alone cannot authenticate which host created a file. */
export function inspectOffObservation(value,now=Date.now()){
  const when=Date.parse(value?.capturedAt??'');
  if(!isOff(value)||!Number.isFinite(when)||!Number.isFinite(now)||
    when>now+60_000||now-when>24*60*60_000)
    return held('HOLD_INVALID_OR_STALE_RECEIVER_OFF_DOCUMENT');
  return held('OFF_DOCUMENT_FORMAT_VALID_ORIGINAL_HOST_REVIEW_REQUIRED',{
    receiverOffObserved:true,observationSha256:digest(JSON.stringify(value)),
    capturedAt:value.capturedAt,evidenceDigests:value.evidenceDigests,
    tlsCertificateFileSha256:value.tlsCertificateFileSha256,
    independentFieldReviewRequired:true});
}

function fileDigest(path){
  if(typeof path!=='string'||!path)throw Error('DENY_WITNESS_FILE_REQUIRED');
  const size=statSync(path).size;
  if(size<32||size>1_048_576)throw Error('DENY_WITNESS_FILE_SIZE');
  return digest(readFileSync(path));
}

/** Require four original witness files, the actual TLS cert, and three pinned
 * public candidates. Hash parity and public-key integrity do not prove issuer. */
export function reconcileOriginalIssuerEvidence({observation,reviewPacket,
  evidencePaths,tlsCertificatePath,device,source,master,now=Date.now()}={}){
  const inspected=inspectOffObservation(observation,now);
  if(!inspected.receiverOffObserved)return inspected;
  if(!inspectOwnerReviewPacket(reviewPacket).validFormat||
    reviewPacket.rollbackKind!=='INERT_ONLY_NOT_ACTIVE_RECEIVER_STOP'||
    fields.some(k=>reviewPacket.evidenceDigests[k]!==observation.evidenceDigests[k]))
    return held('HOLD_QL343_EVIDENCE_REVIEW_CONFLICT');
  let pins;
  try{
    if(!evidencePaths||Object.keys(evidencePaths).length!==4||
      fields.some((k,i)=>!evidencePaths[['windows','privateTls','tailnetAcl','rollback'][i]])||
      new Set(Object.values(evidencePaths).map(p=>resolve(p))).size!==4)
      throw Error('DENY_MISSING_DISTINCT_WITNESSES');
    const paths=['windows','privateTls','tailnetAcl','rollback'];
    if(fields.some((k,i)=>fileDigest(evidencePaths[paths[i]])!==observation.evidenceDigests[k])||
      fileDigest(tlsCertificatePath)!==observation.tlsCertificateFileSha256)
      throw Error('DENY_EVIDENCE_HASH_CHANGED');
    pins=verifiedCandidatePins({device,source,master});
    if(pins.source.keyId!==reviewPacket.candidateIds?.source||
      pins.master.keyId!==reviewPacket.candidateIds?.master)
      throw Error('DENY_PUBLIC_SIGNER_ID_CHANGED');
  }catch{return held('HOLD_ORIGINAL_FILE_OR_PUBLIC_SIGNER_MISMATCH');}
  return held('ORIGINAL_BYTES_MATCH_REVIEW_DUAL_OWNER_DECISION_STILL_HELD',{
    receiverOffObserved:true,originalBytesMatch:true,
    publicCandidatesVerified:true,distinctOwnerKeysVerified:true,
    sourceKeyId:pins.source.keyId,masterKeyId:pins.master.keyId,
    observationSha256:inspected.observationSha256,
    signingReadiness:'REQUIRES_INDEPENDENT_ORIGINAL_ISSUER_AND_BOTH_OWNERS',
    nextAction:'Ree and Jack review original source/TLS/Tailnet issuer evidence separately; no TEST signing yet'});
}

const readJson=path=>JSON.parse(readFileSync(resolve(path),'utf8'));
export async function ql344Cli(args=process.argv.slice(2)){
  if(args.length===1&&args[0]==='--help')return held('OFFLINE_COMMAND_HELP',{
    commands:['--inspect OBSERVATION.json',
      '--reconcile OBSERVATION.json QL343_REVIEW.json EVIDENCE_PATHS.json TLS_CERT.crt DEVICE_PUBLIC.json SOURCE_PUBLIC.json MASTER_PUBLIC.json'],
    networkRequests:0,privateKeysRead:false,signingImplemented:false});
  if(args.length===2&&args[0]==='--inspect')return inspectOffObservation(readJson(args[1]));
  if(args.length===8&&args[0]==='--reconcile'){
    const [,observation,reviewPacket,paths,tls,device,source,master]=args;
    return reconcileOriginalIssuerEvidence({observation:readJson(observation),
      reviewPacket:readJson(reviewPacket),evidencePaths:readJson(paths),
      tlsCertificatePath:tls,device:readJson(device),source:readJson(source),
      master:readJson(master)});
  }
  throw Error('DENY_QL344_UNKNOWN_OR_SIGNING_ACTION');
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{process.stdout.write(JSON.stringify(await ql344Cli())+'\n');}
  catch{process.stderr.write('HOLD_QL344_ORIGINAL_OWNER_REVIEW_REQUIRED\n');process.exitCode=1;}
}
