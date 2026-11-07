/** QL-365A original-Windows-only offline owner decisions.
 * No network, database, receiver, Tailnet, repo write or unattended signing.
 */
import {spawnSync} from 'node:child_process';
import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {hostname,userInfo} from 'node:os';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createInterface} from 'node:readline/promises';
import {hiddenPassphrase,roleDirectory,fileNames,restrictDirectory} from './owner-authority-custody.mjs';
import {createQl365aFirstTrustRequest,inspectQl365aFirstTrustRequest,
  inspectQl365aPinnedOwner,signQl365aFirstTrustRequest,
  assembleQl365aFirstTrust,inspectQl365aSignedCandidate} from './ql365a-first-time-trust.mjs';

const ROOT=()=>join(process.env.LOCALAPPDATA,'RosevearAIHub','CommsRelay');
const FILE=path=>JSON.parse(readFileSync(resolve(path),'utf8'));
const ROLE_HOSTS=Object.freeze({source:{computer:'DESKTOP-AE894KC',user:'ree'},
  master:{computer:'TEMPLAR',user:'jfros'}});
const HOLD={schema:'rosevear.hub.ql365a.original-owner-offline-cli.v1',
  state:'HOLD_NO_AUTO_TRUST_ENROLLMENT_OR_RECEIVER',
  independentIssuerAuthenticated:false,independentWitnessAuthenticated:false,
  originalReceiverStopped:false,databaseEnrollmentAuthorized:false,
  receiverActivated:false,sixAppGrantsAuthorized:false,connected:false,
  connectionState:'DISCONNECTED / HOLD'};

function originalOwnerRole(){
  if(process.platform!=='win32'||!process.env.LOCALAPPDATA)return null;
  for(const [role,host] of Object.entries(ROLE_HOSTS)){
    if(hostname().toUpperCase()===host.computer&&
      userInfo().username.toLowerCase()===host.user&&
      process.env.COMPUTERNAME?.toUpperCase()===host.computer&&
      process.env.USERNAME?.toLowerCase()===host.user)return role;
  }
  return null;
}
function requireOwner(role){
  if(originalOwnerRole()!==role)throw Error('DENY_QL365A_NONORIGINAL_OWNER_OR_WRONG_ROLE');
  if(process.env.DATABASE_URL)throw Error('HOLD_QL365A_DB_CREDENTIAL_ENV_NOT_ALLOWED');
}
function localOwner(role){
  const paths=fileNames(role,roleDirectory(role));
  const bytes=readFileSync(paths.candidate);
  const candidate=JSON.parse(bytes.toString('utf8'));
  const checked=inspectQl365aPinnedOwner(candidate,role,{originalBytes:bytes});
  if(!checked.verified)throw Error(checked.state);
  if(!existsSync(paths.privateKey))throw Error('HOLD_QL365A_ORIGINAL_ENCRYPTED_PRIVATE_KEY_REQUIRED');
  return {paths,bytes,candidate,checked};
}
async function promptExact(message,expected){
  if(!process.stdin.isTTY||!process.stdout.isTTY)throw Error('HOLD_QL365A_INTERACTIVE_OWNER_REQUIRED');
  const rl=createInterface({input:process.stdin,output:process.stderr});
  try{
    const answer=await rl.question(message);
    if(answer!==expected)throw Error('HOLD_QL365A_OWNER_DID_NOT_APPROVE_ACTION');
  }finally{rl.close();}
}
function saveNew(path,value){
  const target=resolve(path);
  const privateDir=resolve(join(ROOT(),'Enrollment'));
  if(dirname(target).toLowerCase()!==privateDir.toLowerCase())
    throw Error('DENY_QL365A_OUTPUT_MUST_BE_IN_PRIVATE_ENROLLMENT_FOLDER');
  if(existsSync(target))throw Error('DENY_QL365A_NO_OVERWRITE');
  restrictDirectory(privateDir);
  writeFileSync(target,JSON.stringify(value,null,2)+'\n',{flag:'wx',mode:0o600});
  return target;
}
function offNow(){
  const script=fileURLToPath(new URL('./ql344-windows-off-observer.ps1',import.meta.url));
  const result=spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','RemoteSigned',
    '-File',script,'-Status'],{encoding:'utf8',windowsHide:true,timeout:20_000});
  if(result.status!==0)throw Error('HOLD_QL365A_ORIGINAL_OFF_STATUS_FAILED');
  const readback=JSON.parse(result.stdout);
  if(readback.state!=='RECEIVER_OFF_OBSERVED_NOT_ACTIVE_STOP'||
    !readback.receiverOffObserved||readback.receiverActivated||readback.connected)
    throw Error('HOLD_QL365A_RECEIVER_OR_TAILNET_NOT_VERIFIED_OFF');
  return readback;
}

export async function ql365aCli(args=process.argv.slice(2)){
  const [mode,...params]=args;
  if(mode==='--help')return {...HOLD,commands:[
    '--status','--prepare EVIDENCE_PATHS_JSON FRESH_OFF_OBSERVATION_JSON NEW_REQUEST_JSON',
    '--inspect REQUEST_JSON','--sign REQUEST_JSON REVIEWED_PAYLOAD_SHA256 NEW_APPROVAL_JSON',
    '--assemble REQUEST_JSON SOURCE_APPROVAL_JSON MASTER_APPROVAL_JSON',
    '--inspect-signed SIGNED_CANDIDATE_JSON']};
  const role=originalOwnerRole();
  if(mode==='--status'&&params.length===0)return {...HOLD,originalOwnerRole:role,
    nextAction:role?'Inspect and review original owner evidence; do not sign until a fresh coordinated owner window.':
      'Only original Ree/Jack Windows hosts may prepare or sign.'};
  if(!role)throw Error('DENY_QL365A_NONORIGINAL_OWNER_ACTION');
  requireOwner(role);
  if(mode==='--prepare'&&params.length===3){
    requireOwner('source');
    const [evidencePath,offPath,output]=params;
    offNow();
    const owner=localOwner('source');
    const master=FILE(join(ROOT(),'Imports','jack-master.public-candidate.json'));
    const device=FILE(join(ROOT(),'ql339b-hub.public-candidate.json'));
    const offBytes=readFileSync(resolve(offPath)),offObservation=JSON.parse(offBytes.toString('utf8'));
    await promptExact('Ree: type PREPARE_QL365A_UNSIGNED_FIRST_TRUST_ONLY: ',
      'PREPARE_QL365A_UNSIGNED_FIRST_TRUST_ONLY');
    const request=createQl365aFirstTrustRequest({device,source:owner.candidate,master,
      evidencePaths:FILE(evidencePath),offObservation,offObservationBytes:offBytes,
      sourceOriginalBytes:owner.bytes});
    return {...HOLD,state:'UNSIGNED_20_MINUTE_FIRST_TIME_REQUEST_PREPARED',
      publicRequestPath:saveNew(output,request),...inspectQl365aFirstTrustRequest(request)};
  }
  if(mode==='--inspect'&&params.length===1){
    const owner=localOwner(role),request=FILE(params[0]);
    const result=inspectQl365aFirstTrustRequest(request);
    if(!result.valid)throw Error(result.state);
    if(owner.candidate.publicKeyPem!==request.payload.ownerPins[role].publicKeyPem)
      throw Error('DENY_QL365A_LOCAL_OWNER_NOT_ON_REVIEWED_PROPOSAL');
    return {...HOLD,...result,localRole:role,localPinnedOwnerVerified:true};
  }
  if(mode==='--sign'&&params.length===3){
    const [requestPath,reviewDigest,output]=params;
    const owner=localOwner(role),request=FILE(requestPath);
    const result=inspectQl365aFirstTrustRequest(request);
    if(!result.valid)throw Error(result.state);
    if(!/^[0-9a-f]{64}$/.test(reviewDigest)||reviewDigest!==result.payloadSha256)
      throw Error('DENY_QL365A_REVIEW_DIGEST_MISMATCH');
    const phrase=`SIGN_QL365A_FIRST_TRUST_${role.toUpperCase()}`;
    await promptExact(`${role.toUpperCase()} owner: compare digest and type ${phrase}: `,phrase);
    const passphrase=await hiddenPassphrase('Original owner encrypted-key passphrase (hidden): ');
    const approval=signQl365aFirstTrustRequest({request,role,localCandidate:owner.candidate,
      originalPublicBytes:owner.bytes,
      encryptedPrivateKeyPem:readFileSync(owner.paths.privateKey,'utf8'),passphrase});
    return {...HOLD,state:'ONE_ORIGINAL_OWNER_SIGNATURE_RECORDED_NOT_ENROLLED',
      role,approvalPath:saveNew(output,approval),payloadSha256:result.payloadSha256,
      expiresAt:result.expiresAt};
  }
  if(mode==='--assemble'&&params.length===3){
    requireOwner('source');
    offNow();
    const [requestPath,sourcePath,masterPath]=params;
    localOwner('source');
    const request=FILE(requestPath),sourceApproval=FILE(sourcePath),masterApproval=FILE(masterPath);
    const signed=assembleQl365aFirstTrust({request,sourceApproval,masterApproval});
    const output=join(ROOT(),'Enrollment','ql365a-signed-first-trust-candidate.json');
    if(existsSync(output))throw Error('DENY_QL365A_SIGNED_CANDIDATE_NO_OVERWRITE');
    return {...HOLD,state:'DUAL_ORIGINAL_OWNER_SIGNATURES_VERIFIED_CANDIDATE_ONLY',
      signedCandidatePath:saveNew(output,signed),
      ...inspectQl365aSignedCandidate(signed)};
  }
  if(mode==='--inspect-signed'&&params.length===1){
    localOwner(role);
    return {...HOLD,...inspectQl365aSignedCandidate(FILE(params[0]))};
  }
  throw Error('DENY_QL365A_UNAPPROVED_ACTION_OR_ARGUMENTS');
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{process.stdout.write(JSON.stringify(await ql365aCli())+'\n');}
  catch(error){process.stderr.write(error.message+'\n');process.exitCode=1;}
}
