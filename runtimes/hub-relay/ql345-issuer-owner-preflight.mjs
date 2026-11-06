/** QL-345: offline public issuer-review challenge and separate owner decisions.
 * REVIEW_ACKNOWLEDGED is deliberately NOT consent to TEST enrollment.
 * Never verifies an issuer merely because a locally supplied file says so. */
import {createHash,createPrivateKey,createPublicKey,sign,verify} from 'node:crypto';
import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {canonicalize} from '../master-discovery/manifest.mjs';
import {verifiedCandidatePins} from './ql340b-enrollment.mjs';
import {inspectPublicAuthorityCandidate,roleDirectory,fileNames,
  restrictDirectory,hiddenPassphrase} from './owner-authority-custody.mjs';
import {inspectOffObservation} from './ql344-off-attestation.mjs';
import {inspectOwnerReviewPacket} from './ql343-owner-evidence-review.mjs';

export const QL345_CHALLENGE='rosevear.hub.ql345.issuer-owner-review-challenge.v1';
export const QL345_DECISION='rosevear.hub.ql345.independent-owner-review-decision.v1';
const SHA=/^[a-f0-9]{64}$/;
const ID=/^[a-z0-9][a-z0-9._:-]{1,63}$/;
const fields=['windowsWitnessSha256','privateTlsWitnessSha256',
  'tailnetAclWitnessSha256','rollbackWitnessSha256'];
const choices=['HOLD','REJECT','REVIEW_ACKNOWLEDGED_NO_ENROLLMENT'];
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const readJson=path=>JSON.parse(readFileSync(resolve(path),'utf8'));
const held=(state,other={})=>({schema:'rosevear.hub.ql345.preflight-readback.v1',state,
  originalIssuerIndependentlyConfirmed:false,sourceOwnerEnrollmentApproved:false,
  masterOwnerEnrollmentApproved:false,sourceEnrollmentSignaturePresent:false,
  masterEnrollmentSignaturePresent:false,requestMayBeSigned:false,
  originalReceiverStopped:false,receiverActivated:false,
  databaseEnrollmentCreated:false,connected:false,
  customerCommunications:false,deviceActions:false,...other});

/** No secret or signable TEST request payload is emitted. Original-issuer
 * endorsement remains unverified until independently authenticated evidence. */
export function prepareIssuerOwnerReview({observation,reviewPacket,
  device,source,master,now=Date.now()}={}){
  const off=inspectOffObservation(observation,now),prior=inspectOwnerReviewPacket(reviewPacket);
  if(!off.receiverOffObserved||!prior.validFormat||
    reviewPacket.rollbackKind!=='INERT_ONLY_NOT_ACTIVE_RECEIVER_STOP'||
    fields.some(k=>reviewPacket.evidenceDigests[k]!==observation.evidenceDigests[k]))
    throw Error('HOLD_QL344_OFF_OR_QL343_REVIEW_MISMATCH');
  const ownerAuthorityPins=verifiedCandidatePins({device,source,master});
  if(ownerAuthorityPins.source.keyId!==reviewPacket.candidateIds.source||
    ownerAuthorityPins.master.keyId!==reviewPacket.candidateIds.master)
    throw Error('DENY_REVIEWED_OWNER_SIGNER_CHANGED');
  return {schema:QL345_CHALLENGE,
    state:'ORIGINAL_ISSUER_AND_OWNER_REVIEW_ONLY_NOT_SIGNABLE',
    issuedAt:new Date(now).toISOString(),
    expiresAt:new Date(now+1_200_000).toISOString(),
    environment:'TEST',audience:'rosevear-comms-hub:nonproduction',
    observationSha256:off.observationSha256,
    evidenceDigests:observation.evidenceDigests,
    tlsCertificateFileSha256:off.tlsCertificateFileSha256,
    ownerAuthorityPins,deviceKeyId:device.keyId,
    rollbackKind:'INERT_ONLY_NOT_ACTIVE_RECEIVER_STOP',
    originalIssuerIndependentlyConfirmed:false,
    sourceOwnerEnrollmentApproved:false,masterOwnerEnrollmentApproved:false,
    requestMayBeSigned:false,receiverActivated:false,
    databaseEnrollmentCreated:false,connected:false};
}

export function inspectReviewChallenge(value,now=Date.now()){
  const issued=Date.parse(value?.issuedAt??''),expires=Date.parse(value?.expiresAt??'');
  const owners=value?.ownerAuthorityPins;
  try{
    if(value?.schema!==QL345_CHALLENGE||
      value.state!=='ORIGINAL_ISSUER_AND_OWNER_REVIEW_ONLY_NOT_SIGNABLE'||
      value.environment!=='TEST'||value.audience!=='rosevear-comms-hub:nonproduction'||
      value.rollbackKind!=='INERT_ONLY_NOT_ACTIVE_RECEIVER_STOP'||
      !SHA.test(value.observationSha256??'')||!SHA.test(value.tlsCertificateFileSha256??'')||
      !value.evidenceDigests||Object.keys(value.evidenceDigests).length!==4||
      !fields.every(k=>SHA.test(value.evidenceDigests[k]??''))||
      new Set(fields.map(k=>value.evidenceDigests[k])).size!==4||
      !ID.test(value.deviceKeyId??'')||
      value.originalIssuerIndependentlyConfirmed!==false||
      value.sourceOwnerEnrollmentApproved!==false||value.masterOwnerEnrollmentApproved!==false||
      value.requestMayBeSigned!==false||value.receiverActivated!==false||
      value.databaseEnrollmentCreated!==false||value.connected!==false||
      owners?.schema!=='rosevear.hub.ql339b.owner-authorities.v1'||
      !Number.isFinite(issued)||!Number.isFinite(expires)||!Number.isFinite(now)||
      issued>now+60_000||now>=expires||expires-issued!==1_200_000)
      throw Error('DENY_PUBLIC_CHALLENGE');
    const keys=['source','master'].map(role=>{
      if(!ID.test(owners[role]?.keyId??''))throw Error('DENY_ROLE_KEY_ID');
      const key=createPublicKey(owners[role].publicKeyPem);
      if(key.asymmetricKeyType!=='ed25519')throw Error('DENY_OWNER_KEY_ALGORITHM');
      return {role,keyId:owners[role].keyId,
        spkiSha256:hash(key.export({type:'spki',format:'der'}))};
    });
    if(keys[0].keyId===keys[1].keyId||keys[0].spkiSha256===keys[1].spkiSha256)
      throw Error('DENY_SHARED_OWNER_KEY');
    return held('PUBLIC_CHALLENGE_SHAPE_VALID_ISSUER_AND_OWNERS_HOLD',{
      valid:true,challengeSha256:hash(canonicalize(value)),
      sourceKeyId:keys[0].keyId,masterKeyId:keys[1].keyId,
      expiresAt:value.expiresAt,reviewOnly:true});
  }catch{return held('HOLD_INVALID_OR_EXPIRED_ISSUER_OWNER_CHALLENGE',{valid:false});}
}

/** Cryptographically signs ONLY a separate review disposition. The ciphertext
 * key never leaves its original owner's interactive Windows process. */
export function signReviewDisposition({challenge,role,decision,localCandidate,
  encryptedPrivateKeyPem,passphrase,now=Date.now()}={}){
  const inspected=inspectReviewChallenge(challenge,now);
  if(!inspected.valid||!['source','master'].includes(role)||
    !choices.includes(decision)||
    !inspectPublicAuthorityCandidate(localCandidate,role).verified||
    localCandidate.keyId!==challenge.ownerAuthorityPins[role].keyId||
    localCandidate.publicKeyPem!==challenge.ownerAuthorityPins[role].publicKeyPem||
    typeof passphrase!=='string'||passphrase.length<16)
    throw Error('DENY_UNREVIEWED_OR_WRONG_OWNER_DISPOSITION');
  let key;
  try{key=createPrivateKey({key:encryptedPrivateKeyPem,format:'pem',passphrase});}
  catch{throw Error('DENY_ORIGINAL_OWNER_PRIVATE_KEY_DECRYPTION');}
  if(key.asymmetricKeyType!=='ed25519'||
    hash(createPublicKey(key).export({type:'spki',format:'der'}))!==localCandidate.spkiSha256)
    throw Error('DENY_WRONG_ORIGINAL_OWNER_PRIVATE_KEY');
  const signedAt=new Date(now).toISOString();
  return {schema:QL345_DECISION,role,keyId:localCandidate.keyId,decision,
    challengeSha256:inspected.challengeSha256,signedAt,
    signature:sign(null,Buffer.from(`${role}:${decision}:${inspected.challengeSha256}:${signedAt}`),
      key).toString('base64url'),enrollmentAuthorized:false};
}

export function verifyReviewDisposition({challenge,disposition,role,now=Date.now()}={}){
  const inspected=inspectReviewChallenge(challenge,now);
  if(!inspected.valid||!disposition||disposition.schema!==QL345_DECISION||
    !['source','master'].includes(role)||disposition.role!==role||
    !choices.includes(disposition.decision)||
    disposition.enrollmentAuthorized!==false||
    disposition.keyId!==challenge.ownerAuthorityPins[role].keyId||
    disposition.challengeSha256!==inspected.challengeSha256||
    !Number.isFinite(Date.parse(disposition.signedAt??''))||
    Date.parse(disposition.signedAt)<Date.parse(challenge.issuedAt)||
    Date.parse(disposition.signedAt)>Date.parse(challenge.expiresAt)||
    Date.parse(disposition.signedAt)>now+60_000||
    !/^[A-Za-z0-9_-]{70,110}$/.test(disposition.signature??''))
    return {valid:false,state:'DENY_UNSIGNED_OR_CHANGED_OWNER_DISPOSITION'};
  try{
    const key=createPublicKey(challenge.ownerAuthorityPins[role].publicKeyPem);
    const signed=Buffer.from(`${role}:${disposition.decision}:${inspected.challengeSha256}:${disposition.signedAt}`);
    if(!verify(null,signed,key,Buffer.from(disposition.signature,'base64url')))
      throw Error('DENY_SIGNATURE');
    return {valid:true,role,decision:disposition.decision,keyId:disposition.keyId,
      enrollmentAuthorized:false};
  }catch{return {valid:false,state:'DENY_INVALID_ORIGINAL_OWNER_SIGNATURE'};}
}

/** External issuer provenance cannot be inferred from owner signatures. The
 * state remains HOLD even after TWO matching signed review acknowledgements. */
export function evaluateTestPreflight({challenge,sourceDecision,masterDecision,
  now=Date.now()}={}){
  const checked=inspectReviewChallenge(challenge,now);
  if(!checked.valid)return held('HOLD_EXPIRED_OR_CHANGED_TEST_REVIEW');
  const source=verifyReviewDisposition({challenge,disposition:sourceDecision,role:'source',now});
  const master=verifyReviewDisposition({challenge,disposition:masterDecision,role:'master',now});
  if(!source.valid||!master.valid)return held('HOLD_SEPARATE_ORIGINAL_OWNER_REVIEW_REQUIRED',{
    sourceReviewSignatureValid:source.valid,masterReviewSignatureValid:master.valid});
  if(['REJECT','HOLD'].includes(source.decision)||['REJECT','HOLD'].includes(master.decision))
    return held('HOLD_ORIGINAL_OWNER_DECLINED_OR_PAUSED',{
      sourceReviewSignatureValid:true,masterReviewSignatureValid:true,
      sourceDecision:source.decision,masterDecision:master.decision});
  return held('DUAL_REVIEW_ACKNOWLEDGED_ORIGINAL_ISSUER_UNCONFIRMED_TEST_HOLD',{
    sourceReviewSignatureValid:true,masterReviewSignatureValid:true,
    sourceDecision:source.decision,masterDecision:master.decision,
    independentIssuerConfirmationRequired:true,
    testAudience:'rosevear-comms-hub:nonproduction',
    challengeSha256:checked.challengeSha256,
    nextAction:'Obtain genuine independent issuer evidence; review signatures do not authorize QL-340B TEST enrollment'});
}

function originalWindowsOwner(role,env=process.env){
  if(process.platform!=='win32'||!env.LOCALAPPDATA||env.DATABASE_URL||
    (role==='source'&&!(env.COMPUTERNAME==='DESKTOP-AE894KC'&&env.USERNAME?.toLowerCase()==='ree'))||
    (role==='master'&&!(env.USERNAME?.toLowerCase()==='jfros'&&env.COMPUTERNAME!=='DESKTOP-AE894KC')))
    throw Error('HOLD_INDEPENDENT_ORIGINAL_WINDOWS_OWNER_HOST_REQUIRED');
}

export async function ql345Cli(args=process.argv.slice(2),env=process.env){
  if(args.length===1&&args[0]==='--help')return held('OFFLINE_QL345_OWNER_GUIDE',{
    commands:['--inspect CHALLENGE.json',
      '--stage-local OFF_OBSERVATION.json QL343_REVIEW.json DEVICE_PUBLIC.json SOURCE_PUBLIC.json MASTER_PUBLIC.json',
      '--decide source|master CHALLENGE.json HOLD|REJECT|REVIEW_ACKNOWLEDGED_NO_ENROLLMENT',
      '--check CHALLENGE.json SOURCE_DECISION.json MASTER_DECISION.json'],
    networkRequests:0,privateKeyExported:false,automaticApproval:false});
  if(args.length===2&&args[0]==='--inspect')return inspectReviewChallenge(readJson(args[1]));
  if(args.length===4&&args[0]==='--check')return evaluateTestPreflight({
    challenge:readJson(args[1]),sourceDecision:readJson(args[2]),masterDecision:readJson(args[3])});
  if(args.length===6&&args[0]==='--stage-local'){
    originalWindowsOwner('source',env);
    const [,off,review,device,source,master]=args;
    const packet=prepareIssuerOwnerReview({observation:readJson(off),
      reviewPacket:readJson(review),device:readJson(device),
      source:readJson(source),master:readJson(master)});
    const dir=join(env.LOCALAPPDATA,'RosevearAIHub','CommsRelay','Evidence');
    if(!existsSync(dir))throw Error('HOLD_PRIVATE_EVIDENCE_DIRECTORY_REQUIRED');
    restrictDirectory(dir);
    const file=join(dir,'ql345-public-review-challenge-'+new Date().toISOString().replace(/[:.]/g,'-')+'.json');
    writeFileSync(file,JSON.stringify(packet,null,2)+'\n',{flag:'wx',mode:0o600});
    return held('PUBLIC_REVIEW_CHALLENGE_STAGED_NO_SIGNING_AUTHORITY',{
      challengeFile:file,challengeSha256:inspectReviewChallenge(packet).challengeSha256,
      expiresAt:packet.expiresAt});
  }
  if(args.length===4&&args[0]==='--decide'){
    const [,role,path,choice]=args;
    if(!['source','master'].includes(role)||!choices.includes(choice))
      throw Error('DENY_UNKNOWN_OR_ENROLLMENT_DECISION');
    originalWindowsOwner(role,env);
    const challenge=readJson(path),inspected=inspectReviewChallenge(challenge);
    if(!inspected.valid)throw Error('HOLD_EXPIRED_OR_UNVERIFIED_PUBLIC_REVIEW');
    process.stderr.write(`Review-only ${role.toUpperCase()} decision. Public challenge SHA256: ${inspected.challengeSha256}\n`);
    const exact=await hiddenPassphrase('Type ACK_REVIEW_ONLY to confirm this is NOT enrollment consent (hidden): ');
    if(exact!=='ACK_REVIEW_ONLY')throw Error('OWNER_REVIEW_CANCELLED');
    const passphrase=await hiddenPassphrase('Original owner private-key passphrase (hidden): ');
    const directory=roleDirectory(role,env),files=fileNames(role,directory);
    const localCandidate=readJson(files.candidate);
    const decision=signReviewDisposition({challenge,role,decision:choice,
      localCandidate,encryptedPrivateKeyPem:readFileSync(files.privateKey,'utf8'),passphrase});
    const filename=join(directory,'ql345-'+role+'-review-'+new Date().toISOString().replace(/[:.]/g,'-')+'.json');
    writeFileSync(filename,JSON.stringify(decision,null,2)+'\n',{flag:'wx',mode:0o600});
    return held('SIGNED_REVIEW_DISPOSITION_STORED_NOT_ENROLLMENT_CONSENT',{
      role,decision:choice,decisionFile:filename,challengeSha256:inspected.challengeSha256});
  }
  throw Error('DENY_UNKNOWN_QL345_OR_TEST_ENROLLMENT_ACTION');
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{process.stdout.write(JSON.stringify(await ql345Cli())+'\n');}
  catch(err){process.stderr.write(`${err.message.startsWith('DENY_')?'DENY':'HOLD'}_QL345_ORIGINAL_ISSUER_OR_OWNER_REVIEW_REQUIRED\n`);process.exitCode=1;}
}
