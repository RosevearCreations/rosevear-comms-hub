/** QL-340B: public, offline, owner-supervised TEST enrollment ceremony.
 * No database writes, network requests, receiver activation or device effects. */
import {createHash,createPrivateKey,createPublicKey,sign} from 'node:crypto';
import {readFileSync,statSync} from 'node:fs';
import {canonicalize} from '../master-discovery/manifest.mjs';
import {verifyDeviceEnrollment,ENROLLMENT_SCHEMA} from './enrollment.mjs';
import {inspectPublicAuthorityCandidate} from './owner-authority-custody.mjs';

export const REQUEST_SCHEMA='rosevear.hub.ql340b.enrollment-request.v1';
export const APPROVAL_SCHEMA='rosevear.hub.ql340b.owner-approval.v1';
const DEVICE_SCHEMA='rosevear.hub.ql339b.public-candidate.v1';
const SHA=/^[a-f0-9]{64}$/;
const ID=/^[a-z0-9][a-z0-9._:-]{1,63}$/;
const EVIDENCE_FIELDS=['windowsWitnessSha256','privateTlsWitnessSha256',
  'tailnetAclWitnessSha256','rollbackWitnessSha256'];
const own=(value,keys)=>value&&typeof value==='object'&&!Array.isArray(value)&&
  Object.keys(value).length===keys.length&&Object.keys(value).every(k=>keys.includes(k));
const digest=data=>createHash('sha256').update(data).digest('hex');
const hashPublic=pem=>{
  const key=createPublicKey(pem);
  if(key.asymmetricKeyType!=='ed25519')throw Error('DENY_NON_ED25519_PUBLIC_KEY');
  return digest(key.export({type:'spki',format:'der'}));
};
const safeDigest=value=>SHA.test(value??'')&&value!=='0'.repeat(64);

export function verifiedCandidatePins({device,source,master}){
  if(!own(device,['schema','deviceId','workloadId','keyId','devicePublicKeyPem',
    'deviceSpkiSha256','enrollmentState'])||device.schema!==DEVICE_SCHEMA||
    ![device.deviceId,device.workloadId,device.keyId].every(v=>ID.test(v??''))||
    device.enrollmentState!=='HELD_ORIGINAL_OWNER_SIGNATURES_REQUIRED'||
    !safeDigest(device.deviceSpkiSha256)||
    hashPublic(device.devicePublicKeyPem)!==device.deviceSpkiSha256)
    throw Error('DENY_DEVICE_PUBLIC_CANDIDATE');
  for(const [role,candidate] of [['source',source],['master',master]]){
    if(!inspectPublicAuthorityCandidate(candidate,role).verified||
      candidate.custodyState!=='HELD_SEPARATE_OWNER_CUSTODY_AND_ORIGINAL_WITNESS_REQUIRED')
      throw Error(`DENY_${role.toUpperCase()}_PUBLIC_CANDIDATE`);
  }
  if(source.spkiSha256===master.spkiSha256||source.keyId===master.keyId||
    [source.spkiSha256,master.spkiSha256].includes(device.deviceSpkiSha256))
    throw Error('DENY_NONINDEPENDENT_PUBLIC_KEYS');
  return {schema:'rosevear.hub.ql339b.owner-authorities.v1',
    source:{keyId:source.keyId,publicKeyPem:source.publicKeyPem},
    master:{keyId:master.keyId,publicKeyPem:master.publicKeyPem}};
}

/** The four files must be physically reviewed first. Hashing never attests the
 * issuer, TLS chain, Tailnet grants or rollback success on its own. */
export function hashWitnessFiles(filePaths){
  if(!own(filePaths,['windows','privateTls','tailnetAcl','rollback']))
    throw Error('HOLD_ORIGINAL_WITNESS_FILES_REQUIRED');
  const paths=[filePaths.windows,filePaths.privateTls,filePaths.tailnetAcl,filePaths.rollback];
  if(paths.some(p=>typeof p!=='string'||p.trim().length===0)||
    new Set(paths).size!==4)throw Error('DENY_WITNESS_FILES_REUSED');
  const result={};
  for(const [index,field] of EVIDENCE_FIELDS.entries()){
    const size=statSync(paths[index]).size;
    if(size<32||size>1_048_576)throw Error('DENY_WITNESS_FILE_SIZE');
    const bytes=readFileSync(paths[index]);
    if(!bytes.length)throw Error('DENY_EMPTY_WITNESS');
    result[field]=digest(bytes);
  }
  if(new Set(Object.values(result)).size!==4)throw Error('DENY_DUPLICATE_WITNESS_DIGEST');
  return result;
}

export function createEnrollmentRequest({device,source,master,witnessHashes,now=Date.now()}={}){
  const ownerAuthorityPins=verifiedCandidatePins({device,source,master});
  if(!own(witnessHashes,EVIDENCE_FIELDS)||
    !Object.values(witnessHashes).every(safeDigest)||
    new Set(Object.values(witnessHashes)).size!==4||
    !Number.isFinite(now))throw Error('HOLD_ORIGINAL_WITNESS_DIGESTS_REQUIRED');
  const payload={schema:ENROLLMENT_SCHEMA,issuer:'rosevear-ai-hub',
    audience:'rosevear-comms-hub:nonproduction',environment:'TEST',
    deviceId:device.deviceId,workloadId:device.workloadId,keyId:device.keyId,
    devicePublicKeyPem:device.devicePublicKeyPem,deviceSpkiSha256:device.deviceSpkiSha256,
    issuedAt:new Date(now).toISOString(),expiresAt:new Date(now+1_200_000).toISOString(),
    ...witnessHashes};
  return {schema:REQUEST_SCHEMA,payload,ownerAuthorityPins,
    custodyState:'AWAITING_TWO_ORIGINAL_OWNER_SIGNATURES_AND_INDEPENDENT_WITNESS',
    databaseEnrollmentCreated:false,receiverActivated:false};
}

export function inspectEnrollmentRequest(request,now=Date.now()){
  if(!own(request,['schema','payload','ownerAuthorityPins','custodyState',
    'databaseEnrollmentCreated','receiverActivated'])||request.schema!==REQUEST_SCHEMA||
    request.custodyState!=='AWAITING_TWO_ORIGINAL_OWNER_SIGNATURES_AND_INDEPENDENT_WITNESS'||
    request.databaseEnrollmentCreated!==false||request.receiverActivated!==false)
    return {valid:false,state:'DENY_REQUEST_SCHEMA'};
  const p=request.payload,a=request.ownerAuthorityPins;
  if(!own(a,['schema','source','master'])||
    a.schema!=='rosevear.hub.ql339b.owner-authorities.v1'||
    !own(a.source,['keyId','publicKeyPem'])||!own(a.master,['keyId','publicKeyPem']))
    return {valid:false,state:'DENY_PUBLIC_PINS'};
  try{
    const sourceHash=hashPublic(a.source.publicKeyPem),masterHash=hashPublic(a.master.publicKeyPem);
    if(sourceHash===masterHash||!ID.test(a.source.keyId)||!ID.test(a.master.keyId)||
      a.source.keyId===a.master.keyId)return {valid:false,state:'DENY_PUBLIC_PINS'};
    if(!EVIDENCE_FIELDS.every(key=>safeDigest(p?.[key]))||
      new Set(EVIDENCE_FIELDS.map(key=>p[key])).size!==4)
      return {valid:false,state:'DENY_UNREVIEWED_WITNESS_DIGESTS'};
    const fake={keyId:'test-invalid',signature:'_'.repeat(86)};
    const check=verifyDeviceEnrollment({payload:p,approvals:{source:fake,master:fake}},a,now);
    if(check.state!=='HOLD_INDEPENDENT_OWNER_SIGNATURES')
      return {valid:false,state:check.state};
    return {valid:true,state:'PUBLIC_TEST_REQUEST_READY_FOR_INDEPENDENT_OWNER_REVIEW',
      payloadSha256:digest(canonicalize(p)),expiresAt:p.expiresAt,
      sourceSpkiSha256:sourceHash,masterSpkiSha256:masterHash};
  }catch{return {valid:false,state:'DENY_UNREADABLE_PUBLIC_PINS'};}
}

export function signOwnerRequest({request,role,localCandidate,encryptedPrivateKeyPem,
  passphrase,now=Date.now()}={}){
  const inspected=inspectEnrollmentRequest(request,now);
  if(!inspected.valid)throw Error(inspected.state);
  if(!['source','master'].includes(role)||
    !inspectPublicAuthorityCandidate(localCandidate,role).verified||
    localCandidate.keyId!==request.ownerAuthorityPins[role].keyId||
    localCandidate.publicKeyPem!==request.ownerAuthorityPins[role].publicKeyPem||
    localCandidate.spkiSha256!==inspected[`${role}SpkiSha256`])
    throw Error('DENY_SIGNER_NOT_LOCAL_OR_UNPINNED');
  if(typeof passphrase!=='string'||passphrase.length<16)
    throw Error('DENY_OWNER_PASSPHRASE');
  let privateKey;
  try{privateKey=createPrivateKey({key:encryptedPrivateKeyPem,format:'pem',passphrase});}
  catch{throw Error('DENY_OWNER_KEY_DECRYPTION');}
  if(privateKey.asymmetricKeyType!=='ed25519'||
    hashPublic(createPublicKey(privateKey).export({type:'spki',format:'pem'}))!==localCandidate.spkiSha256)
    throw Error('DENY_PRIVATE_PUBLIC_KEY_MISMATCH');
  return {schema:APPROVAL_SCHEMA,role,keyId:localCandidate.keyId,
    payloadSha256:inspected.payloadSha256,
    signature:sign(null,Buffer.from(`${role}:${canonicalize(request.payload)}`),
      privateKey).toString('base64url')};
}

export function assembleSignedEnrollment({request,sourceApproval,masterApproval,now=Date.now()}={}){
  const inspected=inspectEnrollmentRequest(request,now);
  if(!inspected.valid)throw Error(inspected.state);
  for(const [role,approval] of [['source',sourceApproval],['master',masterApproval]]){
    if(!own(approval,['schema','role','keyId','payloadSha256','signature'])||
      approval.schema!==APPROVAL_SCHEMA||approval.role!==role||
      approval.payloadSha256!==inspected.payloadSha256||
      approval.keyId!==request.ownerAuthorityPins[role].keyId)
      throw Error(`DENY_${role.toUpperCase()}_APPROVAL`);
  }
  const enrollmentRecord={payload:request.payload,approvals:{
    source:{keyId:sourceApproval.keyId,signature:sourceApproval.signature},
    master:{keyId:masterApproval.keyId,signature:masterApproval.signature}}};
  const verified=verifyDeviceEnrollment(enrollmentRecord,request.ownerAuthorityPins,now);
  if(!verified.enrolled)throw Error(verified.state);
  return {state:'SIGNED_TEST_ENROLLMENT_READY_FOR_INDEPENDENT_FIELD_WITNESS',
    enrollmentRecord,ownerAuthorityPins:request.ownerAuthorityPins,
    databaseEnrollmentCreated:false,receiverActivated:false,
    realDeviceReceiptObserved:false};
}
