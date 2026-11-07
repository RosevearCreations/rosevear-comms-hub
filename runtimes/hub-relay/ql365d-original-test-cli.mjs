/** QL-365D supervised, original Windows OFFLINE one-source review ceremony.
 * No external network, SQL, new signer, receiver, private TEST or GET command.
 */
import {spawnSync} from 'node:child_process';
import {existsSync,readFileSync,statSync,writeFileSync} from 'node:fs';
import {hostname,userInfo} from 'node:os';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createInterface} from 'node:readline/promises';
import {hiddenPassphrase,roleDirectory,fileNames,restrictDirectory}
  from './owner-authority-custody.mjs';
import {inspectQl365aPinnedOwner} from './ql365a-first-time-trust.mjs';
import {createQl365dFirstTestRequest,inspectQl365dFirstTestRequest,
  signQl365dOwnerReview,assembleQl365dSignedReview,inspectQl365dSignedReview}
  from './ql365d-first-test-ceremony.mjs';

const hosts={source:{computer:'DESKTOP-AE894KC',user:'ree'},
  master:{computer:'TEMPLAR',user:'jfros'}};
const root=()=>join(process.env.LOCALAPPDATA,'RosevearAIHub','CommsRelay');
const HOLD={schema:'rosevear.hub.ql365d.original-one-source-test-review-cli.v1',
  state:'OFFLINE_ORIGINAL_OWNER_REVIEW_ONLY_NO_PRIVATE_TEST',
  originalIssuerAuthenticated:false,independentWitnessAuthenticated:false,
  privateTestAuthorized:false,sourceGetAuthorized:false,
  databaseEnrollmentAuthorized:false,receiverActivated:false,
  sixAppGrantsAuthorized:false,customerCommunications:false,
  deviceActions:false,connected:false,connectionState:'DISCONNECTED / HOLD'};
function originalRole(){
  if(process.platform!=='win32'||!process.env.LOCALAPPDATA)return null;
  for(const [role,host] of Object.entries(hosts)){
    if(hostname().toUpperCase()===host.computer&&
      userInfo().username.toLowerCase()===host.user&&
      process.env.COMPUTERNAME?.toUpperCase()===host.computer&&
      process.env.USERNAME?.toLowerCase()===host.user)return role;
  }
  return null;
}
function file(path){
  const resolved=resolve(path);
  if(statSync(resolved).size>262_144)throw Error('DENY_QL365D_OVERSIZED_EVIDENCE_FILE');
  return JSON.parse(readFileSync(resolved,'utf8'));
}
function owner(role){
  const paths=fileNames(role,roleDirectory(role));
  const bytes=readFileSync(paths.candidate),candidate=JSON.parse(bytes.toString('utf8'));
  if(!inspectQl365aPinnedOwner(candidate,role,{originalBytes:bytes}).verified)
    throw Error('DENY_QL365D_ORIGINAL_PUBLIC_KEY_PIN_DRIFT');
  if(!existsSync(paths.privateKey))throw Error('HOLD_QL365D_ENCRYPTED_ORIGINAL_OWNER_KEY_REQUIRED');
  return {paths,bytes,candidate};
}
function requireReeOff(){
  const script=fileURLToPath(new URL('./ql344-windows-off-observer.ps1',import.meta.url));
  const result=spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','RemoteSigned',
    '-File',script,'-Status'],{encoding:'utf8',windowsHide:true,timeout:20_000});
  if(result.status!==0)throw Error('HOLD_QL365D_ORIGINAL_OFF_STATUS_REQUIRED');
  const observed=JSON.parse(result.stdout);
  if(observed.state!=='RECEIVER_OFF_OBSERVED_NOT_ACTIVE_STOP'||
    observed.receiverOffObserved!==true||observed.receiverActivated!==false||
    observed.connected!==false)
    throw Error('HOLD_QL365D_GENUINE_RECEIVER_OFF_NOT_VERIFIED');
}
async function confirm(message,phrase){
  if(!process.stdin.isTTY||!process.stdout.isTTY)
    throw Error('HOLD_QL365D_INTERACTIVE_ORIGINAL_OWNER_REQUIRED');
  const rl=createInterface({input:process.stdin,output:process.stderr});
  try{if(await rl.question(message)!==phrase)
    throw Error('HOLD_QL365D_OWNER_DECLINED');}
  finally{rl.close();}
}
function save(path,value){
  const target=resolve(path),privateDir=resolve(join(root(),'Enrollment'));
  if(dirname(target).toLowerCase()!==privateDir.toLowerCase()||existsSync(target))
    throw Error('DENY_QL365D_PRIVATE_NEW_FILE_ONLY');
  restrictDirectory(privateDir);
  writeFileSync(target,JSON.stringify(value,null,2)+'\n',{flag:'wx',mode:0o600});
  return target;
}
export async function ql365dCli(args=process.argv.slice(2)){
  const [mode,...params]=args,role=originalRole();
  if(mode==='--help'&&params.length===0)return {...HOLD,commands:[
    '--status',
    '--prepare SOURCE_ID CANDIDATE SOURCE_REVIEW MASTER_REVIEW CUSTODY NEW_REQUEST',
    '--inspect REQUEST CANDIDATE SOURCE_REVIEW MASTER_REVIEW CUSTODY',
    '--sign REQUEST CANDIDATE SOURCE_REVIEW MASTER_REVIEW CUSTODY REVIEW_SHA NEW_APPROVAL',
    '--assemble REQUEST CANDIDATE SOURCE_REVIEW MASTER_REVIEW CUSTODY SOURCE_APPROVAL MASTER_APPROVAL NEW_SIGNED',
    '--inspect-signed SIGNED CANDIDATE SOURCE_REVIEW MASTER_REVIEW CUSTODY']};
  if(mode==='--status'&&params.length===0)return {...HOLD,originalOwnerRole:role,
    nextAction:'Only separately identified original Windows owners can review one public source proposal; no TEST is authorized.'};
  if(!role)throw Error('DENY_QL365D_NONORIGINAL_WINDOWS_OWNER');
  if(process.env.DATABASE_URL)throw Error('HOLD_QL365D_DATABASE_CREDENTIAL_ENV_NOT_ALLOWED');
  const self=owner(role);
  if(mode==='--prepare'&&params.length===6){
    if(role!=='source')throw Error('DENY_QL365D_ONLY_ORIGINAL_REE_PREPARES');
    requireReeOff();
    const [sourceId,candidatePath,sourcePath,masterPath,custodyPath,output]=params;
    const candidate=file(candidatePath),sourceReview=file(sourcePath),
      masterReview=file(masterPath),custodyReceipt=file(custodyPath);
    if(candidate?.request?.payload?.ownerPins?.source?.publicKeyPem!==self.candidate.publicKeyPem)
      throw Error('DENY_QL365D_REE_NOT_ON_SIGNED_CANDIDATE');
    await confirm('Ree: type PREPARE_QL365D_ONE_SOURCE_OFFLINE_ONLY: ',
      'PREPARE_QL365D_ONE_SOURCE_OFFLINE_ONLY');
    const request=createQl365dFirstTestRequest({sourceId,candidate,sourceReview,
      masterReview,custodyReceipt});
    const check=inspectQl365dFirstTestRequest({request,candidate,sourceReview,
      masterReview,custodyReceipt});
    return {...HOLD,state:'UNSIGNED_90_SECOND_ONE_SOURCE_REVIEW_PREPARED',
      requestPath:save(output,request),requestSha256:check.requestSha256,
      sourceId:check.sourceId,expiresAt:check.expiresAt};
  }
  if((mode==='--inspect'&&params.length===5)||
    (mode==='--sign'&&params.length===7)||
    (mode==='--assemble'&&params.length===8)){
    if(mode==='--assemble'&&role!=='source')
      throw Error('DENY_QL365D_ONLY_ORIGINAL_REE_RECONCILES');
    if(role==='source')requireReeOff();
    const [requestPath,candidatePath,sourcePath,masterPath,custodyPath]=params;
    const context={request:file(requestPath),candidate:file(candidatePath),
      sourceReview:file(sourcePath),masterReview:file(masterPath),
      custodyReceipt:file(custodyPath)};
    if(context.candidate?.request?.payload?.ownerPins?.[role]?.publicKeyPem!==
      self.candidate.publicKeyPem)
      throw Error('DENY_QL365D_LOCAL_OWNER_NOT_ON_REQUEST');
    const check=inspectQl365dFirstTestRequest(context);
    if(!check.valid)throw Error(check.state);
    if(mode==='--inspect')return {...HOLD,...check,originalOwnerRole:role};
    if(mode==='--sign'){
      const reviewedHash=params[5],output=params[6];
      if(!/^[a-f0-9]{64}$/.test(reviewedHash)||reviewedHash!==check.requestSha256)
        throw Error('DENY_QL365D_REVIEWED_DIGEST_MISMATCH');
      const phrase=`SIGN_QL365D_${role.toUpperCase()}_OFFLINE_REVIEW_ONLY`;
      await confirm(`${role.toUpperCase()}: independently verify SHA and type ${phrase}: `,phrase);
      const passphrase=await hiddenPassphrase('Original owner encrypted-key passphrase (hidden): ');
      const approval=signQl365dOwnerReview({...context,role,
        localCandidate:self.candidate,originalPublicBytes:self.bytes,
        encryptedPrivateKeyPem:readFileSync(self.paths.privateKey,'utf8'),passphrase});
      return {...HOLD,state:'ONE_ORIGINAL_OWNER_REVIEW_SIGNATURE_SAVED_NO_TEST',
        role,approvalPath:save(output,approval),requestSha256:check.requestSha256};
    }
    const signed=assembleQl365dSignedReview({...context,
      sourceApproval:file(params[5]),masterApproval:file(params[6])});
    return {...HOLD,state:'TWO_ORIGINAL_OWNER_REVIEW_SIGNATURES_RECONCILED_NO_TEST',
      signedPath:save(params[7],signed),requestSha256:check.requestSha256,
      sourceId:check.sourceId};
  }
  if(mode==='--inspect-signed'&&params.length===5){
    if(role==='source')requireReeOff();
    const [signedPath,candidatePath,sourcePath,masterPath,custodyPath]=params;
    const context={signedReview:file(signedPath),candidate:file(candidatePath),
      sourceReview:file(sourcePath),masterReview:file(masterPath),
      custodyReceipt:file(custodyPath)};
    if(context.candidate?.request?.payload?.ownerPins?.[role]?.publicKeyPem!==
      self.candidate.publicKeyPem)
      throw Error('DENY_QL365D_LOCAL_OWNER_NOT_ON_SIGNED_REVIEW');
    const checked=inspectQl365dSignedReview(context);
    if(!checked.valid)throw Error(checked.state);
    return {...HOLD,...checked,originalOwnerRole:role};
  }
  throw Error('DENY_QL365D_UNAPPROVED_ACTION_OR_ARGUMENTS');
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{process.stdout.write(JSON.stringify(await ql365dCli())+'\n');}
  catch(error){process.stderr.write(error.message+'\n');process.exitCode=1;}
}
