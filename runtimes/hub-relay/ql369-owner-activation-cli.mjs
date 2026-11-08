/** QL-369 human-interactive original Windows owner signature ceremony.
 * This cannot call Supabase, activate a membership or handle service keys.
 */
import {existsSync,readFileSync,statSync,writeFileSync} from 'node:fs';
import {hostname,userInfo} from 'node:os';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createInterface} from 'node:readline/promises';
import {hiddenPassphrase,roleDirectory,fileNames,restrictDirectory} from './owner-authority-custody.mjs';
import {inspectQl365aPinnedOwner} from './ql365a-first-time-trust.mjs';
import {createQl369ActivationIntent,inspectQl369ActivationIntent,
  signQl369ActivationDecision,inspectQl369SignedActivation,wrapQl369ActivationPacket}
  from './ql369-activation-decision.mjs';

const hosts={source:{computer:'DESKTOP-AE894KC',user:'ree'},
  master:{computer:'TEMPLAR',user:'jfros'}};
const HOLD={schema:'rosevear.hub.ql369.original-owner-activation-cli.v1',
  state:'NO_MEMBERSHIP_ACTIVATION_ONLY_SIGNED_DECISION_EVIDENCE',
  membershipActivated:false,privateTestAuthorized:false,sourceConnectionsAllowed:false,
  connectionState:'DISCONNECTED / HOLD'};
const base=()=>join(process.env.LOCALAPPDATA,'RosevearAIHub','CommsRelay','Enrollment');
const originalRole=()=>{
  if(process.platform!=='win32'||!process.env.LOCALAPPDATA)return null;
  for(const [role,host] of Object.entries(hosts)){
    if(hostname().toUpperCase()===host.computer&&
      userInfo().username.toLowerCase()===host.user&&
      process.env.COMPUTERNAME?.toUpperCase()===host.computer&&
      process.env.USERNAME?.toLowerCase()===host.user)return role;
  }return null;
};
function read(path){
  const target=resolve(path);
  if(statSync(target).size>65_536)throw Error('DENY_QL369_EVIDENCE_FILE_TOO_LARGE');
  return JSON.parse(readFileSync(target,'utf8'));
}
function candidateText(path){
  const target=resolve(path);
  if(statSync(target).size>16_384)throw Error('DENY_QL369_PUBLIC_CANDIDATE_TOO_LARGE');
  return readFileSync(target,'utf8');
}
function owner(role){
  const paths=fileNames(role,roleDirectory(role));
  const bytes=readFileSync(paths.candidate),candidate=JSON.parse(bytes.toString('utf8'));
  if(!inspectQl365aPinnedOwner(candidate,role,{originalBytes:bytes}).verified||
    !existsSync(paths.privateKey))throw Error('HOLD_QL369_ORIGINAL_ENCRYPTED_SIGNER_REQUIRED');
  return {paths,bytes,candidate};
}
async function confirm(phrase){
  if(!process.stdin.isTTY||!process.stdout.isTTY)
    throw Error('HOLD_QL369_ORIGINAL_HUMAN_INTERACTION_REQUIRED');
  const rl=createInterface({input:process.stdin,output:process.stderr});
  try{if(await rl.question(`Type ${phrase}: `)!==phrase)
    throw Error('HOLD_QL369_ACTIVATION_APPROVAL_DECLINED');}
  finally{rl.close();}
}
function save(path,value){
  const target=resolve(path),directory=resolve(base());
  if(dirname(target).toLowerCase()!==directory.toLowerCase()||existsSync(target))
    throw Error('DENY_QL369_NEW_PRIVATE_ENROLLMENT_FILE_REQUIRED');
  restrictDirectory(directory);
  writeFileSync(target,JSON.stringify(value,null,2)+'\n',{flag:'wx',mode:0o600});
  return target;
}

export async function ql369ActivationCli(args=process.argv.slice(2)){
  const [mode,...p]=args;
  if(mode==='--help'&&p.length===0)return {...HOLD,commands:[
    '--prepare QL368_SIGNED SOURCE_PUBLIC MASTER_PUBLIC NEW_ACTIVATION_INTENT',
    '--inspect ACTIVATION_INTENT QL368_SIGNED SOURCE_PUBLIC MASTER_PUBLIC',
    '--sign ACTIVATION_INTENT QL368_SIGNED SOURCE_PUBLIC MASTER_PUBLIC REVIEWED_ACTIVATION_SHA NEW_DECISION',
    '--assemble ACTIVATION_INTENT QL368_SIGNED SOURCE_DECISION MASTER_DECISION SOURCE_PUBLIC MASTER_PUBLIC NEW_PACKET',
    '--inspect-signed QL369_PACKET SOURCE_PUBLIC MASTER_PUBLIC']};
  const role=originalRole();
  if(!role)throw Error('DENY_QL369_NONORIGINAL_WINDOWS_OWNER_HOST');
  if(process.env.DATABASE_URL||process.env.SUPABASE_SERVICE_ROLE_KEY)
    throw Error('DENY_QL369_OFFLINE_SIGNATURE_ONLY_NO_DATABASE_CREDENTIALS');
  const local=owner(role);
  if(mode==='--prepare'&&p.length===4){
    if(role!=='source')throw Error('DENY_QL369_ONLY_REE_PREPARES');
    await confirm('PREPARE_EXPLICIT_TWO_OWNER_MEMBERSHIP_ACTIVATION_DECISION');
    const signedEvidence=read(p[0]),sourcePublic=read(p[1]),masterPublic=read(p[2]);
    if(sourcePublic.publicKeyPem!==local.candidate.publicKeyPem)
      throw Error('DENY_QL369_LOCAL_REE_KEY_DRIFT');
    const created=createQl369ActivationIntent({signedEvidence,sourcePublic,masterPublic});
    return {...HOLD,state:'PENDING_EXPLICIT_ACTIVATION_OWNER_DECISIONS',
      path:save(p[3],created.intent),intentSha256:created.intentSha256,
      expiresAt:created.intent.expiresAt};
  }
  if(mode==='--inspect'&&p.length===4){
    return {...HOLD,...inspectQl369ActivationIntent({activationIntent:read(p[0]),
      signedEvidence:read(p[1]),sourcePublic:read(p[2]),masterPublic:read(p[3])})};
  }
  if(mode==='--sign'&&p.length===6){
    const activationIntent=read(p[0]),signedEvidence=read(p[1]);
    const sourcePublic=read(p[2]),masterPublic=read(p[3]);
    const checked=inspectQl369ActivationIntent({activationIntent,signedEvidence,
      sourcePublic,masterPublic});
    const ownPublic=role==='source'?sourcePublic:masterPublic;
    if(!checked.valid||checked.intentSha256!==p[4]||
      ownPublic.publicKeyPem!==local.candidate.publicKeyPem)
      throw Error('DENY_QL369_OWNER_REVIEWED_INTENT_HASH_OR_PIN');
    await confirm(`SIGN_QL369_${role.toUpperCase()}_ACTIVATE_ONLY_TWO_OWNER_MEMBERSHIPS`);
    const passphrase=await hiddenPassphrase('Original owner-key passphrase (hidden): ');
    const decision=signQl369ActivationDecision({activationIntent,signedEvidence,
      sourcePublic,masterPublic,role,localCandidate:local.candidate,
      originalPublicBytes:local.bytes,
      encryptedPrivateKeyPem:readFileSync(local.paths.privateKey,'utf8'),passphrase});
    return {...HOLD,state:'EXPLICIT_ORIGINAL_ACTIVATION_DECISION_SIGNED_NOT_EXECUTED',
      path:save(p[5],decision),intentSha256:checked.intentSha256};
  }
  if(mode==='--assemble'&&p.length===7){
    if(role!=='source')throw Error('DENY_QL369_ONLY_REE_ASSEMBLES');
    const packet=wrapQl369ActivationPacket({activationIntent:read(p[0]),
      signedEvidence:read(p[1]),sourceDecision:read(p[2]),masterDecision:read(p[3])});
    const sourcePublicText=candidateText(p[4]),masterPublicText=candidateText(p[5]);
    if(JSON.parse(sourcePublicText).publicKeyPem!==local.candidate.publicKeyPem)
      throw Error('DENY_QL369_LOCAL_REE_SIGNER_DRIFT');
    const checked=await inspectQl369SignedActivation({packet,sourcePublicText,
      masterPublicText});
    if(!checked.valid)throw Error(checked.state);
    return {...HOLD,state:'EXPLICIT_DUAL_OWNER_ACTIVATION_PACKET_READY_NOT_EXECUTED',
      path:save(p[6],packet),intentSha256:checked.intentSha256};
  }
  if(mode==='--inspect-signed'&&p.length===3){
    const checked=await inspectQl369SignedActivation({packet:read(p[0]),
      sourcePublicText:candidateText(p[1]),masterPublicText:candidateText(p[2])});
    return {...HOLD,...checked};
  }
  throw Error('DENY_QL369_UNREVIEWED_OR_UNSUPPORTED_ACTION');
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{process.stdout.write(JSON.stringify(await ql369ActivationCli())+'\n');}
  catch(error){process.stderr.write(error.message+'\n');process.exitCode=1;}
}
