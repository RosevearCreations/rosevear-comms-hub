/** QL-366: original-device-only offline owner authorization ceremony.
 * Does not connect to a database/network, issue a GET or activate a receiver.
 * Only the separate original-private operator can verify custody and TEST.
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
import {createQl366TestIntent,inspectQl366TestIntent,signQl366OwnerIntent,
  inspectQl366OfflineSignatures,QL366_SIGNED}
  from './ql366-owner-controlled-private-test.mjs';

const hosts={source:{computer:'DESKTOP-AE894KC',user:'ree'},
  master:{computer:'TEMPLAR',user:'jfros'}};
const base=()=>join(process.env.LOCALAPPDATA,'RosevearAIHub','CommsRelay');
const HOLD={schema:'rosevear.hub.ql366.original-owner-test-cli.v1',
  state:'DUAL_OWNER_OFFLINE_TEST_REVIEW_ONLY',
  externallyReviewedLegacyApprovals:false,privateTestAuthorized:false,
  receiverActivated:false,customerCommunications:false,deviceActions:false,
  connected:false,connectionState:'DISCONNECTED / HOLD'};
function roleOnOriginalHost(){
  if(process.platform!=='win32'||!process.env.LOCALAPPDATA)return null;
  for(const [role,h] of Object.entries(hosts)){
    if(hostname().toUpperCase()===h.computer&&
      userInfo().username.toLowerCase()===h.user&&
      process.env.COMPUTERNAME?.toUpperCase()===h.computer&&
      process.env.USERNAME?.toLowerCase()===h.user)return role;
  }
  return null;
}
function read(path){
  const absolute=resolve(path);
  if(statSync(absolute).size>262_144)throw Error('DENY_QL366_OVERSIZED_EVIDENCE');
  return JSON.parse(readFileSync(absolute,'utf8'));
}
function self(role){
  const paths=fileNames(role,roleDirectory(role));
  const bytes=readFileSync(paths.candidate),candidate=JSON.parse(bytes.toString('utf8'));
  if(!inspectQl365aPinnedOwner(candidate,role,{originalBytes:bytes}).verified||
    !existsSync(paths.privateKey))throw Error('HOLD_QL366_ORIGINAL_PINNED_OWNER_KEY_REQUIRED');
  return {paths,bytes,candidate};
}
function reeReceiverOff(){
  const script=fileURLToPath(new URL('./ql344-windows-off-observer.ps1',import.meta.url));
  const result=spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','RemoteSigned',
    '-File',script,'-Status'],{encoding:'utf8',windowsHide:true,timeout:20_000});
  if(result.status!==0)throw Error('HOLD_QL366_ORIGINAL_RECEIVER_OFF_PROOF_REQUIRED');
  const off=JSON.parse(result.stdout);
  if(off.state!=='RECEIVER_OFF_OBSERVED_NOT_ACTIVE_STOP'||
    off.receiverActivated!==false||off.connected!==false)
    throw Error('HOLD_QL366_ORIGINAL_RECEIVER_NOT_OFF');
}
async function confirm(phrase){
  if(!process.stdin.isTTY||!process.stdout.isTTY)
    throw Error('HOLD_QL366_INTERACTIVE_OWNER_REQUIRED');
  const rl=createInterface({input:process.stdin,output:process.stderr});
  try{if(await rl.question(`Type ${phrase}: `)!==phrase)
    throw Error('HOLD_QL366_OWNER_DECLINED');}
  finally{rl.close();}
}
function save(path,value){
  const target=resolve(path),folder=resolve(join(base(),'Enrollment'));
  if(dirname(target).toLowerCase()!==folder.toLowerCase()||existsSync(target))
    throw Error('DENY_QL366_NEW_PRIVATE_ENROLLMENT_FILE_ONLY');
  restrictDirectory(folder);
  writeFileSync(target,JSON.stringify(value,null,2)+'\n',{flag:'wx',mode:0o600});
  return target;
}

export async function ql366Cli(args=process.argv.slice(2)){
  const [mode,...p]=args,role=roleOnOriginalHost();
  if(mode==='--help'&&p.length===0)return {...HOLD,commands:[
    '--prepare SOURCE_ID COMMIT MANIFEST_SHA CONTRACT_SHA HTTPS_ORIGIN TLS_SHA NEW_REQUEST',
    '--inspect REQUEST',
    '--sign REQUEST REVIEWED_INTENT_SHA NEW_APPROVAL',
    '--assemble REQUEST SOURCE_APPROVAL MASTER_APPROVAL SOURCE_PUBLIC MASTER_PUBLIC NEW_SIGNED',
    '--inspect-signed SIGNED SOURCE_PUBLIC MASTER_PUBLIC']};
  if(!role)throw Error('DENY_QL366_NONORIGINAL_OWNER_HOST');
  if(process.env.DATABASE_URL)throw Error('DENY_QL366_DATABASE_ENV_NOT_ALLOWED');
  const local=self(role);
  if(mode==='--prepare'&&p.length===7){
    if(role!=='source')throw Error('DENY_QL366_REE_ONLY_PREPARES');
    reeReceiverOff();
    await confirm('PREPARE_ONE_READ_ONLY_PRIVATE_TEST_INTENT');
    const intent=createQl366TestIntent({sourceId:p[0],sourceCommitSha:p[1],
      manifestSha256:p[2],contractSha256:p[3],sourceOrigin:p[4],
      tlsSpkiSha256:p[5]});
    const checked=inspectQl366TestIntent(intent);
    return {...HOLD,state:'ONE_SOURCE_PUBLIC_90_SECOND_INTENT_PREPARED',
      path:save(p[6],intent),intentSha256:checked.intentSha256,
      expiresAt:checked.expiresAt};
  }
  if(mode==='--inspect'&&p.length===1){
    const result=inspectQl366TestIntent(read(p[0]));
    return {...HOLD,...result,ownerRole:role};
  }
  if(mode==='--sign'&&p.length===3){
    if(role==='source')reeReceiverOff();
    const intent=read(p[0]),checked=inspectQl366TestIntent(intent);
    if(!checked.valid||checked.intentSha256!==p[1])
      throw Error('DENY_QL366_OWNER_REVIEW_DIGEST_MISMATCH');
    const phrase=`SIGN_QL366_${role.toUpperCase()}_ONE_HEALTH_TEST_ONLY`;
    await confirm(phrase);
    const passphrase=await hiddenPassphrase('Original encrypted owner-key passphrase (hidden): ');
    const signed=signQl366OwnerIntent({intent,role,localCandidate:local.candidate,
      originalPublicBytes:local.bytes,
      encryptedPrivateKeyPem:readFileSync(local.paths.privateKey,'utf8'),passphrase});
    return {...HOLD,state:'ONE_ORIGINAL_OWNER_SIGNED_OFFLINE_NOT_AUTHORIZED',
      path:save(p[2],signed),intentSha256:checked.intentSha256};
  }
  if(mode==='--assemble'&&p.length===6){
    if(role!=='source')throw Error('DENY_QL366_REE_ONLY_ASSEMBLES');
    reeReceiverOff();
    const intent=read(p[0]),approvals={source:read(p[1]),master:read(p[2])};
    const sourcePublic=read(p[3]),masterPublic=read(p[4]);
    if(sourcePublic.publicKeyPem!==local.candidate.publicKeyPem)
      throw Error('DENY_QL366_REE_SOURCE_KEY_DRIFT');
    const checked=inspectQl366OfflineSignatures({intent,approvals,
      sourcePublic,masterPublic});
    if(!checked.valid)throw Error(checked.state);
    const signed={schema:QL366_SIGNED,intent,approvals,
      state:'TWO_ORIGINAL_SIGNATURES_OFFLINE_CUSTODY_PENDING',
      privateTestAuthorized:false,connected:false};
    return {...HOLD,state:checked.state,path:save(p[5],signed),
      intentSha256:checked.intentSha256};
  }
  if(mode==='--inspect-signed'&&p.length===3){
    const signed=read(p[0]);
    if(signed?.schema!==QL366_SIGNED||
      signed.state!=='TWO_ORIGINAL_SIGNATURES_OFFLINE_CUSTODY_PENDING'||
      signed.privateTestAuthorized!==false||signed.connected!==false)
      throw Error('DENY_QL366_SIGNED_ENVELOPE');
    return {...HOLD,...inspectQl366OfflineSignatures({intent:signed.intent,
      approvals:signed.approvals,sourcePublic:read(p[1]),masterPublic:read(p[2])})};
  }
  throw Error('DENY_QL366_UNKNOWN_OR_UNAPPROVED_CLI_ACTION');
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{process.stdout.write(JSON.stringify(await ql366Cli())+'\n');}
  catch(error){process.stderr.write(error.message+'\n');process.exitCode=1;}
}
