/** QL-365C original Windows review: strictly read-only local evidence inspection.
 * No trust enrollment, key generation, network call, SQL, credential use or TEST.
 */
import {spawnSync} from 'node:child_process';
import {hostname,userInfo} from 'node:os';
import {readFileSync,statSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {roleDirectory,fileNames} from './owner-authority-custody.mjs';
import {inspectQl365aPinnedOwner} from './ql365a-first-time-trust.mjs';
import {verifyQl365bOwnerReviews} from './ql365b-original-reconciliation.mjs';

const HOSTS={source:{computer:'DESKTOP-AE894KC',user:'ree'},
  master:{computer:'TEMPLAR',user:'jfros'}};
const HOLD={schema:'rosevear.hub.ql365c.original-private-test-preflight-cli.v1',
  state:'ORIGINAL_INDEPENDENT_REVIEWER_AND_SIGNED_CUSTODY_PENDING',
  independentReviewerEnrolled:false,independentWitnessEnrolled:false,
  signedCustodyVerified:false,originalIssuerAuthenticated:false,
  privateTestAuthorized:false,databaseEnrollmentAuthorized:false,
  receiverActivated:false,sixAppGrantsAuthorized:false,
  customerCommunications:false,deviceActions:false,connected:false,
  connectionState:'DISCONNECTED / HOLD'};
function originalRole(){
  if(process.platform!=='win32'||!process.env.LOCALAPPDATA)return null;
  for(const [role,host] of Object.entries(HOSTS)){
    if(hostname().toUpperCase()===host.computer&&
      userInfo().username.toLowerCase()===host.user&&
      process.env.COMPUTERNAME?.toUpperCase()===host.computer&&
      process.env.USERNAME?.toLowerCase()===host.user)return role;
  }
  return null;
}
function localPinnedOwner(role){
  const path=fileNames(role,roleDirectory(role)).candidate;
  const bytes=readFileSync(path),candidate=JSON.parse(bytes.toString('utf8'));
  const inspected=inspectQl365aPinnedOwner(candidate,role,{originalBytes:bytes});
  if(!inspected.verified)throw Error(inspected.state);
  return candidate;
}
function json(path){
  const resolved=resolve(path);
  if(statSync(resolved).size>262_144)throw Error('DENY_QL365C_EVIDENCE_TOO_LARGE');
  return JSON.parse(readFileSync(resolved,'utf8'));
}
function reeReceiverOff(){
  const script=fileURLToPath(new URL('./ql344-windows-off-observer.ps1',import.meta.url));
  const status=spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','RemoteSigned',
    '-File',script,'-Status'],{encoding:'utf8',windowsHide:true,timeout:20_000});
  if(status.status!==0)throw Error('HOLD_QL365C_ORIGINAL_RECEIVER_OFF_READBACK_REQUIRED');
  const observed=JSON.parse(status.stdout);
  if(observed.state!=='RECEIVER_OFF_OBSERVED_NOT_ACTIVE_STOP'||
    observed.receiverOffObserved!==true||observed.receiverActivated!==false||
    observed.connected!==false)
    throw Error('HOLD_QL365C_GENUINE_RECEIVER_OFF_NOT_VERIFIED');
}
export async function ql365cCli(args=process.argv.slice(2)){
  const [mode,...params]=args,role=originalRole();
  if(mode==='--help'&&params.length===0)return {...HOLD,commands:[
    '--status','--inspect-owner-reviews SIGNED_QL365A_CANDIDATE SOURCE_QL365B_REVIEW MASTER_QL365B_REVIEW']};
  if(mode==='--status'&&params.length===0)return {...HOLD,originalOwnerRole:role,
    nextAction:'Real external identities must be independently authenticated and pinned before any private TEST review.'};
  if(mode!=='--inspect-owner-reviews'||params.length!==3)
    throw Error('DENY_QL365C_NO_UNSUPERVISED_ENROLLMENT_OR_TEST_COMMAND');
  if(!role)throw Error('DENY_QL365C_NONORIGINAL_WINDOWS_OWNER');
  if(process.env.DATABASE_URL)throw Error('HOLD_QL365C_DB_CREDENTIAL_ENV_NOT_ALLOWED');
  const pinned=localPinnedOwner(role),candidate=json(params[0]);
  if(candidate?.request?.payload?.ownerPins?.[role]?.publicKeyPem!==pinned.publicKeyPem)
    throw Error('DENY_QL365C_ORIGINAL_OWNER_NOT_BOUND_TO_CANDIDATE');
  const reviewed=verifyQl365bOwnerReviews({candidate,
    sourceReview:json(params[1]),masterReview:json(params[2])});
  if(!reviewed.valid)throw Error(reviewed.state);
  if(role==='source')reeReceiverOff();
  return {...HOLD,state:'ORIGINAL_OWNER_SIGNATURES_VERIFIED_EXTERNAL_REVIEWERS_PENDING',
    originalOwnerRole:role,originalOwnerReviewsVerified:true,
    candidateSha256:reviewed.candidateSha256,
    sourceReviewSha256:reviewed.sourceReviewSha256,
    masterReviewSha256:reviewed.masterReviewSha256,
    originalReceiverOffReadback:role==='source'};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{process.stdout.write(JSON.stringify(await ql365cCli())+'\n');}
  catch(error){process.stderr.write(error.message+'\n');process.exitCode=1;}
}
