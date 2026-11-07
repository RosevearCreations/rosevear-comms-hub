/** QL-365B: original-Ree/Jack, supervised, OFFLINE candidate review only.
 * CI can read --status. No network, SQL, enrollment, receiver or source app writes.
 */
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync,readFileSync,statSync,writeFileSync} from 'node:fs';
import {hostname,userInfo} from 'node:os';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createInterface} from 'node:readline/promises';
import {canonicalize} from '../master-discovery/manifest.mjs';
import {hiddenPassphrase,roleDirectory,fileNames,restrictDirectory}
  from './owner-authority-custody.mjs';
import {inspectQl365aPinnedOwner,inspectQl365aSignedCandidate}
  from './ql365a-first-time-trust.mjs';
import {signQl365bOwnerReview,verifyQl365bOwnerReviews}
  from './ql365b-original-reconciliation.mjs';

const root=()=>join(process.env.LOCALAPPDATA,'RosevearAIHub','CommsRelay');
const expected=Object.freeze({source:{host:'DESKTOP-AE894KC',user:'ree'},
  master:{host:'TEMPLAR',user:'jfros'}});
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const HOLD={schema:'rosevear.hub.ql365b.original-owner-cli.v1',
  state:'HOLD_INDEPENDENT_FIRST_TRUST_AND_GENUINE_TEST_NOT_YET_AUTHORIZED',
  originalIssuerAuthenticated:false,independentFieldWitnessVerified:false,
  databaseEnrollmentAuthorized:false,receiverActivated:false,
  supervisedTestAuthorized:false,sixAppGrantsAuthorized:false,
  customerCommunications:false,deviceActions:false,connected:false,
  connectionState:'DISCONNECTED / HOLD'};

function originalRole(){
  if(process.platform!=='win32'||!process.env.LOCALAPPDATA)return null;
  for(const [role,identity] of Object.entries(expected)){
    if(hostname().toUpperCase()===identity.host&&
      userInfo().username.toLowerCase()===identity.user&&
      process.env.COMPUTERNAME?.toUpperCase()===identity.host&&
      process.env.USERNAME?.toLowerCase()===identity.user)return role;
  }
  return null;
}
function readJson(path){
  const file=resolve(path);
  if(statSync(file).size>262_144)throw Error('DENY_QL365B_OVERSIZED_EVIDENCE_FILE');
  return JSON.parse(readFileSync(file,'utf8'));
}
function localOwner(role){
  const paths=fileNames(role,roleDirectory(role));
  const bytes=readFileSync(paths.candidate);
  const candidate=JSON.parse(bytes.toString('utf8'));
  const check=inspectQl365aPinnedOwner(candidate,role,{originalBytes:bytes});
  if(!check.verified)throw Error(check.state);
  if(!existsSync(paths.privateKey))throw Error('HOLD_QL365B_ORIGINAL_ENCRYPTED_KEY_REQUIRED');
  return {paths,bytes,candidate};
}
function originalOff(){
  const script=fileURLToPath(new URL('./ql344-windows-off-observer.ps1',import.meta.url));
  const result=spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','RemoteSigned',
    '-File',script,'-Status'],{encoding:'utf8',windowsHide:true,timeout:20_000});
  if(result.status!==0)throw Error('HOLD_QL365B_ORIGINAL_REE_RECEIVER_OFF_NOT_VERIFIED');
  const status=JSON.parse(result.stdout);
  if(status.state!=='RECEIVER_OFF_OBSERVED_NOT_ACTIVE_STOP'||
    status.receiverOffObserved!==true||status.receiverActivated!==false||
    status.connected!==false)throw Error('HOLD_QL365B_ORIGINAL_RECEIVER_NOT_OFF');
  return true;
}
async function confirm(message,phrase){
  if(!process.stdin.isTTY||!process.stdout.isTTY)
    throw Error('HOLD_QL365B_ORIGINAL_INTERACTIVE_OWNER_REQUIRED');
  const rl=createInterface({input:process.stdin,output:process.stderr});
  try{if(await rl.question(message)!==phrase)
    throw Error('HOLD_QL365B_OWNER_DECLINED_REVIEW');}
  finally{rl.close();}
}
function saveNew(path,value){
  const target=resolve(path),directory=resolve(join(root(),'Enrollment'));
  if(dirname(target).toLowerCase()!==directory.toLowerCase())
    throw Error('DENY_QL365B_PRIVATE_ENROLLMENT_OUTPUT_ONLY');
  if(existsSync(target))throw Error('DENY_QL365B_NEVER_OVERWRITE_ORIGINAL_REVIEW');
  restrictDirectory(directory);
  writeFileSync(target,JSON.stringify(value,null,2)+'\n',{flag:'wx',mode:0o600});
  return target;
}
export async function ql365bCli(args=process.argv.slice(2)){
  const [mode,...params]=args,role=originalRole();
  if(mode==='--help'&&params.length===0)return {...HOLD,commands:[
    '--status','--inspect SIGNED_QL365A_CANDIDATE_JSON',
    '--review SIGNED_QL365A_CANDIDATE_JSON REVIEWED_CANDIDATE_SHA256 NEW_REVIEW_JSON',
    '--reconcile SIGNED_QL365A_CANDIDATE_JSON SOURCE_REVIEW_JSON MASTER_REVIEW_JSON']};
  if(mode==='--status'&&params.length===0)return {...HOLD,originalOwnerRole:role,
    nextAction:role?'Use --inspect only after independent review of the original evidence.':
      'Only the original Ree and Jack Windows accounts can review or reconcile.'};
  if(!role)throw Error('DENY_QL365B_NONORIGINAL_WINDOWS_OWNER');
  if(process.env.DATABASE_URL)throw Error('HOLD_QL365B_DB_CREDENTIAL_ENV_NOT_ALLOWED');
  if(!['--inspect','--review','--reconcile'].includes(mode))
    throw Error('DENY_QL365B_UNAPPROVED_COMMAND');
  if((mode==='--inspect'&&params.length!==1)||
    (mode==='--review'&&params.length!==3)||
    (mode==='--reconcile'&&params.length!==3))
    throw Error('DENY_QL365B_UNAPPROVED_ARGUMENTS');
  if(mode==='--reconcile'&&role!=='source')
    throw Error('DENY_QL365B_ONLY_ORIGINAL_REE_CAN_RECONCILE');
  const owner=localOwner(role),candidate=readJson(params[0]);
  const inspection=inspectQl365aSignedCandidate(candidate);
  if(!inspection.valid)throw Error(inspection.state);
  if(owner.candidate.publicKeyPem!==candidate.request.payload.ownerPins[role].publicKeyPem)
    throw Error('DENY_QL365B_ORIGINAL_OWNER_NOT_ON_CANDIDATE');
  const candidateSha256=hash(canonicalize(candidate));
  if(role==='source')originalOff(); // Actual source receiver, not a simulated STOP.
  if(mode==='--inspect')return {...HOLD,state:'LOCAL_ORIGINAL_PIN_AND_DUAL_SIGNATURES_VALID',
    originalOwnerRole:role,candidateSha256,originalPayloadSha256:inspection.payloadSha256,
    expiresAt:inspection.expiresAt,sourceReceiverOffReadback:role==='source'};
  if(mode==='--review'){
    const [,,output]=params,reviewedHash=params[1];
    if(!/^[0-9a-f]{64}$/.test(reviewedHash)||reviewedHash!==candidateSha256)
      throw Error('DENY_QL365B_EXACT_CANDIDATE_REVIEW_DIGEST_REQUIRED');
    const phrase=`REVIEW_QL365B_${role.toUpperCase()}_ONLY`;
    await confirm(`${role.toUpperCase()} verify candidate SHA and type ${phrase}: `,phrase);
    const passphrase=await hiddenPassphrase('Original encrypted owner-key passphrase (hidden): ');
    const review=signQl365bOwnerReview({candidate,role,localCandidate:owner.candidate,
      originalPublicBytes:owner.bytes,
      encryptedPrivateKeyPem:readFileSync(owner.paths.privateKey,'utf8'),passphrase});
    return {...HOLD,state:'ONE_ORIGINAL_KEY_REVIEW_RECEIPT_SIGNED_OFFLINE',
      role,candidateSha256,reviewPath:saveNew(output,review)};
  }
  const result=verifyQl365bOwnerReviews({candidate,
    sourceReview:readJson(params[1]),masterReview:readJson(params[2])});
  if(!result.valid)throw Error(result.state);
  return {...HOLD,...result,
    nextAction:'Independent separately pinned policy reviewer and field witness remain required. '
      +'Never run legacy enrollment, enable the receiver or mark six apps connected.'};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{process.stdout.write(JSON.stringify(await ql365bCli())+'\n');}
  catch(error){process.stderr.write(error.message+'\n');process.exitCode=1;}
}
