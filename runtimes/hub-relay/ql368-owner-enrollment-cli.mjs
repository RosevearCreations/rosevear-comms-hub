/** QL-368 original-device-only, offline dual-owner Auth enrollment evidence.
 * No hosted DB connection, MFA claims, receiver startup or enrollment write.
 */
import {existsSync,readFileSync,statSync,writeFileSync} from 'node:fs';
import {hostname,userInfo} from 'node:os';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createInterface} from 'node:readline/promises';
import {hiddenPassphrase,roleDirectory,fileNames,restrictDirectory}
  from './owner-authority-custody.mjs';
import {inspectQl365aPinnedOwner} from './ql365a-first-time-trust.mjs';
import {createQl368EnrollmentIntent,inspectQl368EnrollmentIntent,
  signQl368EnrollmentApproval,inspectQl368DualOwnerApprovals,QL368_SIGNED}
  from './ql368-dual-owner-enrollment.mjs';

const originalHosts={source:{computer:'DESKTOP-AE894KC',user:'ree'},
  master:{computer:'TEMPLAR',user:'jfros'}};
const HOLD={schema:'rosevear.hub.ql368.offline-dual-owner-enrollment-cli.v1',
  state:'ORIGINAL_OWNER_AUTH_ENROLLMENT_EVIDENCE_ONLY',
  ownerMembershipActivated:false,sourceConnectionsAllowed:false,
  privateTestAuthorized:false,connected:false,connectionState:'DISCONNECTED / HOLD'};
const base=()=>join(process.env.LOCALAPPDATA,'RosevearAIHub','CommsRelay');

function originalRole(){
  if(process.platform!=='win32'||!process.env.LOCALAPPDATA)return null;
  for(const [role,host] of Object.entries(originalHosts)){
    if(hostname().toUpperCase()===host.computer&&
      userInfo().username.toLowerCase()===host.user&&
      process.env.COMPUTERNAME?.toUpperCase()===host.computer&&
      process.env.USERNAME?.toLowerCase()===host.user)return role;
  }
  return null;
}
function read(path){
  const target=resolve(path);
  if(statSync(target).size>262_144)throw Error('DENY_QL368_OVERSIZED_EVIDENCE');
  return JSON.parse(readFileSync(target,'utf8'));
}
function owner(role){
  const paths=fileNames(role,roleDirectory(role));
  const bytes=readFileSync(paths.candidate),candidate=JSON.parse(bytes.toString('utf8'));
  if(!inspectQl365aPinnedOwner(candidate,role,{originalBytes:bytes}).verified||
    !existsSync(paths.privateKey))throw Error('HOLD_QL368_ORIGINAL_PINNED_OWNER_KEY_REQUIRED');
  return {paths,bytes,candidate};
}
async function confirm(phrase){
  if(!process.stdin.isTTY||!process.stdout.isTTY)
    throw Error('HOLD_QL368_INTERACTIVE_ORIGINAL_OWNER_REQUIRED');
  const rl=createInterface({input:process.stdin,output:process.stderr});
  try{if(await rl.question(`Type ${phrase}: `)!==phrase)
    throw Error('HOLD_QL368_OWNER_DECLINED');}
  finally{rl.close();}
}
function save(path,value){
  const target=resolve(path),folder=resolve(join(base(),'Enrollment'));
  if(dirname(target).toLowerCase()!==folder.toLowerCase()||existsSync(target))
    throw Error('DENY_QL368_PRIVATE_NEW_EVIDENCE_FILE_REQUIRED');
  restrictDirectory(folder);
  writeFileSync(target,JSON.stringify(value,null,2)+'\n',{flag:'wx',mode:0o600});
  return target;
}

export async function ql368EnrollmentCli(args=process.argv.slice(2)){
  const [mode,...p]=args;
  if(mode==='--help'&&p.length===0)return {...HOLD,commands:[
    '--prepare SOURCE_AUTH_UUID MASTER_AUTH_UUID NEW_INTENT',
    '--inspect INTENT',
    '--sign INTENT REVIEWED_INTENT_SHA NEW_APPROVAL',
    '--assemble INTENT SOURCE_APPROVAL MASTER_APPROVAL SOURCE_PUBLIC MASTER_PUBLIC NEW_SIGNED',
    '--inspect-signed SIGNED SOURCE_PUBLIC MASTER_PUBLIC']};
  const role=originalRole();
  if(!role)throw Error('DENY_QL368_NONORIGINAL_OWNER_HOST');
  if(process.env.DATABASE_URL||process.env.SUPABASE_SERVICE_ROLE_KEY)
    throw Error('DENY_QL368_OFFLINE_ONLY_NO_HOSTED_DATABASE_CREDENTIALS');
  const local=owner(role);
  if(mode==='--prepare'&&p.length===3){
    if(role!=='source')throw Error('DENY_QL368_REE_PREPARES');
    await confirm('PREPARE_PENDING_AUTH_OWNER_ENROLLMENT_ONLY');
    const intent=createQl368EnrollmentIntent({sourceUserId:p[0],masterUserId:p[1]});
    const checked=inspectQl368EnrollmentIntent(intent);
    return {...HOLD,state:'PENDING_AUTH_OWNER_INTENT_PREPARED',
      path:save(p[2],intent),intentSha256:checked.intentSha256,
      expiresAt:checked.expiresAt};
  }
  if(mode==='--inspect'&&p.length===1)
    return {...HOLD,...inspectQl368EnrollmentIntent(read(p[0])),ownerRole:role};
  if(mode==='--sign'&&p.length===3){
    const intent=read(p[0]),checked=inspectQl368EnrollmentIntent(intent);
    if(!checked.valid||checked.intentSha256!==p[1])
      throw Error('DENY_QL368_OWNER_REVIEW_HASH_MISMATCH');
    await confirm(`SIGN_QL368_${role.toUpperCase()}_PENDING_ENROLLMENT_ONLY`);
    const passphrase=await hiddenPassphrase('Original owner-key passphrase (hidden): ');
    const signed=signQl368EnrollmentApproval({intent,role,localCandidate:local.candidate,
      originalPublicBytes:local.bytes,
      encryptedPrivateKeyPem:readFileSync(local.paths.privateKey,'utf8'),passphrase});
    return {...HOLD,state:'ORIGINAL_OWNER_SIGNED_PENDING_ENROLLMENT_EVIDENCE_ONLY',
      path:save(p[2],signed),intentSha256:checked.intentSha256};
  }
  if(mode==='--assemble'&&p.length===6){
    if(role!=='source')throw Error('DENY_QL368_REE_ASSEMBLES');
    const intent=read(p[0]),approvals={source:read(p[1]),master:read(p[2])};
    const sourcePublic=read(p[3]),masterPublic=read(p[4]);
    if(sourcePublic.publicKeyPem!==local.candidate.publicKeyPem)
      throw Error('DENY_QL368_SOURCE_OWNER_PUBLIC_KEY_DRIFT');
    const checked=inspectQl368DualOwnerApprovals({intent,approvals,
      sourcePublic,masterPublic});
    if(!checked.valid)throw Error(checked.state);
    const signed={schema:QL368_SIGNED,intent,approvals,
      state:'TWO_ORIGINAL_SIGNED_OWNER_EVIDENCE_ONLY',
      ownerMembershipActivated:false,privateTestAuthorized:false,connected:false};
    return {...HOLD,state:checked.state,path:save(p[5],signed),
      intentSha256:checked.intentSha256};
  }
  if(mode==='--inspect-signed'&&p.length===3){
    const signed=read(p[0]);
    if(signed?.schema!==QL368_SIGNED||
      signed.state!=='TWO_ORIGINAL_SIGNED_OWNER_EVIDENCE_ONLY'||
      signed.ownerMembershipActivated!==false||
      signed.privateTestAuthorized!==false||signed.connected!==false)
      throw Error('DENY_QL368_SIGNED_PACKET_SCOPE');
    return {...HOLD,...inspectQl368DualOwnerApprovals({intent:signed.intent,
      approvals:signed.approvals,sourcePublic:read(p[1]),masterPublic:read(p[2])})};
  }
  throw Error('DENY_QL368_UNKNOWN_OR_UNAPPROVED_ACTION');
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{process.stdout.write(JSON.stringify(await ql368EnrollmentCli())+'\n');}
  catch(error){process.stderr.write(error.message+'\n');process.exitCode=1;}
}
