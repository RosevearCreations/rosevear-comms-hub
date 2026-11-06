/** QL-343 offline, non-authoritative field evidence intake for Ree and Jack.
 * This file never signs, grants, starts a receiver or connects to a database. */
import {createHash} from 'node:crypto';
import {existsSync,readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {hashWitnessFiles,inspectEnrollmentRequest,verifiedCandidatePins} from './ql340b-enrollment.mjs';
import {inspectInertDrillDocument} from './ql342a-rollback-drill.mjs';
import {restrictDirectory} from './owner-authority-custody.mjs';

export const QL343_REVIEW_SCHEMA='rosevear.hub.ql343.original-owner-evidence-review.v1';
const SHA=/^[a-f0-9]{64}$/;
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const readJson=path=>JSON.parse(readFileSync(path,'utf8'));
const names={device:'ql339b-hub.public-candidate.json',
  source:'OwnerAuthorities/source/source.public-candidate.json',
  master:'Imports/jack-master.public-candidate.json',
  windows:'Evidence/windows-process-readback.json',
  privateTls:'Evidence/private-tls-chain.json',
  tailnetAcl:'Evidence/tailnet-grants-readback.hujson'};

export function findOwnerEvidenceFiles(base,rollbackPath){
  const files=Object.fromEntries(Object.entries(names).map(([k,n])=>[k,join(base,n)]));
  const evidenceDir=join(base,'Evidence');
  const drills=existsSync(evidenceDir)?readdirSync(evidenceDir).filter(n=>
    /^ql342a-inert-rollback-drill-\d{4}-\d\d-\d\dT[\w-]+\.json$/.test(n)):[];
  if(rollbackPath&&dirname(resolve(rollbackPath)).toLowerCase()!==resolve(evidenceDir).toLowerCase())
    throw Error('DENY_ROLLBACK_FILE_OUTSIDE_PRIVATE_EVIDENCE_FOLDER');
  files.rollback=rollbackPath?resolve(rollbackPath):drills.length===1
    ?join(evidenceDir,drills[0]):null;
  return {files,drillFileCount:drills.length,explicitRollbackPath:Boolean(rollbackPath)};
}

const held=(state,extra={})=>({schema:QL343_REVIEW_SCHEMA,state,
  independentOriginalOwnerApproval:false,sourceSigned:false,masterSigned:false,
  originalReceiverStopped:false,receiverActivated:false,databaseEnrollmentCreated:false,
  networkRequests:0,customerCommunications:false,deviceActions:false,connected:false,
  ...extra});

/** Reads public candidates and evidence bytes only; valid structure is not
 * independent proof of issuer, operator, origin or human approval. */
export function reviewOriginalOwnerEvidence({base,rollbackPath,now=Date.now()}={}){
  if(typeof base!=='string'||!base)return held('HOLD_LOCAL_ORIGINAL_OWNER_BASE_REQUIRED');
  const located=findOwnerEvidenceFiles(base,rollbackPath),files=located.files;
  const presence=Object.fromEntries(Object.entries(files).map(([k,p])=>[k,Boolean(p&&existsSync(p))]));
  if(Object.values(presence).some(v=>!v))return held('HOLD_MISSING_OR_AMBIGUOUS_FIELD_EVIDENCE',{
    filePresence:presence,drillFileCount:located.drillFileCount,
    nextAction:'Select one actual rollback/drill file and inspect original issuer evidence'});
  let publicPins,evidenceDigests,rollback,rollbackKind;
  try{
    publicPins=verifiedCandidatePins({device:readJson(files.device),
      source:readJson(files.source),master:readJson(files.master)});
    evidenceDigests=hashWitnessFiles({windows:files.windows,
      privateTls:files.privateTls,tailnetAcl:files.tailnetAcl,rollback:files.rollback});
    rollback=readJson(files.rollback);
    if(inspectInertDrillDocument(rollback,{expectedComputer:'DESKTOP-AE894KC',now}).validDrillDocument)
      rollbackKind='INERT_ONLY_NOT_ACTIVE_RECEIVER_STOP';
    else if(rollback?.schema==='rosevear.hub.ql340c.stop-witness.v1')
      rollbackKind='CLAIMED_REAL_RECEIVER_STOP_REQUIRES_INDEPENDENT_WITNESS';
    else rollbackKind='UNRECOGNIZED_ROLLBACK_WITNESS';
  }catch{return held('HOLD_UNVERIFIED_PUBLIC_CANDIDATE_OR_WITNESS_FILE',{
    filePresence:presence,drillFileCount:located.drillFileCount});}
  const candidateIds={source:publicPins.source.keyId,master:publicPins.master.keyId};
  const result=held('EVIDENCE_HASHED_ORIGINAL_OWNER_AND_ISSUER_REVIEW_REQUIRED',{
    filePresence:presence,drillFileCount:located.drillFileCount,
    candidateIds,evidenceDigests,rollbackKind,
    rollbackFileSha256:hash(readFileSync(files.rollback)),
    rollbackEvidencePath:files.rollback,
    originalFieldWitnessApproved:false,certificateChainIndependentlyApproved:false,
    tailnetPolicyIndependentlyApproved:false,
    signedTestRequestPresent:false,requestMayBeSigned:false,
    nextAction:rollbackKind==='INERT_ONLY_NOT_ACTIVE_RECEIVER_STOP'
      ?'Independent Ree and Jack review must reconcile receiver-OFF evidence; inert drill cannot be called an active stop'
      :'Independently review original issuer, receiver state, TLS, Tailnet policy and current signer custody'});
  return result;
}

export function inspectOwnerReviewPacket(value){
  if(!value||value.schema!==QL343_REVIEW_SCHEMA||
    value.state!=='EVIDENCE_HASHED_ORIGINAL_OWNER_AND_ISSUER_REVIEW_REQUIRED'||
    !['INERT_ONLY_NOT_ACTIVE_RECEIVER_STOP',
      'CLAIMED_REAL_RECEIVER_STOP_REQUIRES_INDEPENDENT_WITNESS',
      'UNRECOGNIZED_ROLLBACK_WITNESS'].includes(value.rollbackKind)||
    !value.evidenceDigests||Object.keys(value.evidenceDigests).length!==4||
    Object.values(value.evidenceDigests).some(v=>!SHA.test(v))||
    !SHA.test(value.rollbackFileSha256)||
    typeof value.candidateIds?.source!=='string'||!value.candidateIds.source||
    typeof value.candidateIds?.master!=='string'||!value.candidateIds.master||
    value.candidateIds.source===value.candidateIds.master||
    value.independentOriginalOwnerApproval!==false||value.sourceSigned!==false||
    value.masterSigned!==false||value.originalReceiverStopped!==false||
    value.originalFieldWitnessApproved!==false||
    value.certificateChainIndependentlyApproved!==false||
    value.tailnetPolicyIndependentlyApproved!==false||
    value.receiverActivated!==false||value.databaseEnrollmentCreated!==false||
    value.connected!==false||value.requestMayBeSigned!==false)
    return held('DENY_UNVERIFIED_OR_ELEVATED_OWNER_REVIEW_PACKET',{validFormat:false});
  return held('OWNER_REVIEW_PACKET_FORMAT_VALID_NOT_HUMAN_APPROVAL',{
    validFormat:true,rollbackKind:value.rollbackKind,
    evidenceDigests:value.evidenceDigests,
    independentHumanReviewRequired:true,requestMayBeSigned:false});
}

/** Independent computer can inspect a time-limited request but can never turn
 * local file presence into an authority decision. */
export function compareSignedRequestToReview(request,packet,now=Date.now()){
  const reviewed=inspectOwnerReviewPacket(packet),inspected=inspectEnrollmentRequest(request,now);
  if(!reviewed.validFormat||!inspected.valid)
    return held('HOLD_INVALID_OR_EXPIRED_PUBLIC_SIGNING_REQUEST');
  if(Object.entries(reviewed.evidenceDigests).some(([k,v])=>request.payload?.[k]!==v))
    return held('DENY_TEST_REQUEST_EVIDENCE_CHANGED');
  if(request.ownerAuthorityPins?.source?.keyId!==packet.candidateIds?.source||
    request.ownerAuthorityPins?.master?.keyId!==packet.candidateIds?.master)
    return held('DENY_TEST_REQUEST_ORIGINAL_OWNER_KEY_CHANGED');
  return held('PUBLIC_REQUEST_MATCHES_REVIEWED_HASHES_OWNER_DECISION_STILL_REQUIRED',{
    payloadSha256:inspected.payloadSha256,expiresAt:inspected.expiresAt,
    rollbackKind:reviewed.rollbackKind,requestMayBeSigned:false,
    nextAction:'Ree and Jack must separately inspect original evidence, approve exact 20-minute request and sign only on their own computers'});
}

const reeBase=env=>{
  if(process.platform!=='win32'||env.COMPUTERNAME!=='DESKTOP-AE894KC'||
    !env.LOCALAPPDATA||env.DATABASE_URL)
    throw Error('HOLD_ORIGINAL_REE_WINDOWS_OWNER_HOST_REQUIRED');
  return join(env.LOCALAPPDATA,'RosevearAIHub','CommsRelay');
};

export async function ql343Cli(args=process.argv.slice(2),env=process.env){
  if(args.length===1&&args[0]==='--help')return {schema:'rosevear.hub.ql343.cli.v1',
    commands:['--review-local [ROLLBACK_JSON_PATH]','--stage-local [ROLLBACK_JSON_PATH]',
      '--inspect-stage REVIEW_PACKET_JSON',
      '--compare-request REQUEST_JSON REVIEW_PACKET_JSON'],
    originalOwnerSigning:false,networkRequests:0,databaseMutations:0,
    receiverActivated:false,connected:false};
  if(args.length===2&&args[0]==='--inspect-stage')
    return inspectOwnerReviewPacket(readJson(resolve(args[1])));
  if(args.length===3&&args[0]==='--compare-request')
    return compareSignedRequestToReview(readJson(resolve(args[1])),readJson(resolve(args[2])));
  if(['--review-local','--stage-local'].includes(args[0])&&args.length<=2){
    const base=reeBase(env),result=reviewOriginalOwnerEvidence({base,rollbackPath:args[1]});
    if(args[0]==='--review-local'||result.state!==
      'EVIDENCE_HASHED_ORIGINAL_OWNER_AND_ISSUER_REVIEW_REQUIRED')return result;
    const dir=join(base,'Evidence');restrictDirectory(dir);
    const timestamp=new Date().toISOString().replace(/[:.]/g,'-');
    const path=join(dir,'ql343-owner-evidence-review-'+timestamp+'.json');
    const evidencePathsFile=join(dir,'ql343-original-evidence-paths-'+timestamp+'.json');
    const located=findOwnerEvidenceFiles(base,args[1]).files;
    const originalPaths={windows:located.windows,privateTls:located.privateTls,
      tailnetAcl:located.tailnetAcl,rollback:located.rollback};
    writeFileSync(evidencePathsFile,JSON.stringify(originalPaths,null,2)+'\n',
      {flag:'wx',mode:0o600});
    writeFileSync(path,JSON.stringify(result,null,2)+'\n',{flag:'wx',mode:0o600});
    return {...result,reviewPacketPath:path,evidencePathsFile};
  }
  throw Error('DENY_UNSUPERVISED_OR_UNKNOWN_OWNER_ENROLLMENT_ACTION');
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{process.stdout.write(JSON.stringify(await ql343Cli())+'\n');}
  catch{process.stderr.write('HOLD_QL343_ORIGINAL_OWNER_REVIEW_REQUIRED\n');process.exitCode=1;}
}
