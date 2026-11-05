/** QL-340 preflight: owner-supervised OFFLINE authority key creation.
 * This utility never grants itself trust, signs an enrollment, queries Postgres,
 * calls Tailscale, or starts the private receiver. */
import {createHash,createPrivateKey,createPublicKey,generateKeyPairSync} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {userInfo} from 'node:os';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROLES=['source','master'];
const ID=/^[a-z0-9][a-z0-9._:-]{1,63}$/;
export const CANDIDATE_SCHEMA='rosevear.hub.ql340.owner-authority-candidate.v1';

export function createOwnerAuthorityCandidate({role,keyId,passphrase}={}){
  if(!ROLES.includes(role)||!ID.test(keyId??'')||
    typeof passphrase!=='string'||passphrase.length<16)
    throw new Error('DENY_OWNER_AUTHORITY_PARAMETERS');
  const {publicKey,privateKey}=generateKeyPairSync('ed25519');
  const publicKeyPem=publicKey.export({format:'pem',type:'spki'});
  const encryptedPrivateKeyPem=privateKey.export({format:'pem',type:'pkcs8',
    cipher:'aes-256-cbc',passphrase});
  const spkiSha256=createHash('sha256').update(publicKey.export({
    format:'der',type:'spki'})).digest('hex');
  return {encryptedPrivateKeyPem,publicCandidate:{schema:CANDIDATE_SCHEMA,
    role,keyId,publicKeyPem,spkiSha256,
    custodyState:'HELD_SEPARATE_OWNER_CUSTODY_AND_ORIGINAL_WITNESS_REQUIRED',
    enrollmentAuthorized:false}};
}

export function inspectPublicAuthorityCandidate(candidate,role){
  if(!candidate||candidate.schema!==CANDIDATE_SCHEMA||
    !ROLES.includes(candidate.role)||candidate.role!==role||
    !ID.test(candidate.keyId??'')||candidate.enrollmentAuthorized!==false)
    return {verified:false,state:'DENY_AUTHORITY_CANDIDATE_SCHEMA'};
  try{
    const publicKey=createPublicKey(candidate.publicKeyPem);
    const spkiSha256=createHash('sha256').update(publicKey.export({
      format:'der',type:'spki'})).digest('hex');
    return {verified:publicKey.asymmetricKeyType==='ed25519'&&
      spkiSha256===candidate.spkiSha256,
      state:spkiSha256===candidate.spkiSha256&&publicKey.asymmetricKeyType==='ed25519'
        ?'PUBLIC_AUTHORITY_CANDIDATE_ONLY':'DENY_INVALID_AUTHORITY_PIN',
      role:candidate.role,keyId:candidate.keyId,spkiSha256};
  }catch{return {verified:false,state:'DENY_INVALID_AUTHORITY_PIN'};}
}

export function roleDirectory(role,env=process.env){
  if(process.platform!=='win32'||!env.LOCALAPPDATA||!ROLES.includes(role))
    throw new Error('ORIGINAL_WINDOWS_OWNER_REQUIRED');
  return join(env.LOCALAPPDATA,'RosevearAIHub','CommsRelay','OwnerAuthorities',role);
}

export function restrictDirectory(directory){
  mkdirSync(directory,{recursive:true,mode:0o700});
  const accountName=userInfo().username,domain=process.env.USERDOMAIN;
  if(!accountName||!domain)throw new Error('HOLD_WINDOWS_OWNER_ACCOUNT_UNVERIFIED');
  const result=spawnSync('icacls.exe',[directory,'/inheritance:r','/grant:r',
    `${domain}\\${accountName}:(OI)(CI)F`,'/remove:g','*S-1-1-0','*S-1-5-32-545'],
  {encoding:'utf8',windowsHide:true,timeout:15_000});
  if(result.status!==0)throw new Error('HOLD_PRIVATE_OWNER_DIRECTORY_ACL_UNVERIFIED');
}

export async function hiddenPassphrase(prompt){
  if(!process.stdin.isTTY||typeof process.stdin.setRawMode!=='function')
    throw new Error('OWNER_INTERACTIVE_TERMINAL_REQUIRED');
  return new Promise((done,reject)=>{
    let secret='';const originallyRaw=Boolean(process.stdin.isRaw);
    const finish=(err)=>{process.stdin.off('data',receive);
      process.stdin.setRawMode(originallyRaw);process.stdin.pause();
      process.stderr.write('\n');err?reject(err):done(secret);};
    const receive=data=>{for(const byte of data){
      if(byte===3){finish(Error('OWNER_CANCELLED'));return;}
      if(byte===10||byte===13){finish();return;}
      if(byte===8||byte===127){secret=secret.slice(0,-1);continue;}
      if(byte>=32&&byte<=126&&secret.length<256)secret+=String.fromCharCode(byte);
    }};
    process.stderr.write(prompt);process.stdin.setRawMode(true);
    process.stdin.resume();process.stdin.on('data',receive);
  });
}

export function fileNames(role,directory){return {
  privateKey:join(directory,`${role}.private.pem`),
  candidate:join(directory,`${role}.public-candidate.json`)};}

export async function runOwnerAuthorityCli(args=process.argv.slice(2)){
  if(args.length===1&&args[0]==='--inspect'){
    const items=ROLES.map(role=>{const {privateKey,candidate}=fileNames(role,roleDirectory(role));
      return {role,encryptedPrivateKeyPresent:existsSync(privateKey),
        publicCandidatePresent:existsSync(candidate),
        publicCandidateVerified:existsSync(candidate)
          ?inspectPublicAuthorityCandidate(JSON.parse(readFileSync(candidate,'utf8')),role).verified
          :false};});
    return {schema:'rosevear.hub.ql340.authority-local-readback.v1',
      state:'LOCAL_OWNER_CUSTODY_REVIEW_REQUIRED',keys:items,
      databaseEnrollmentCreated:false,receiverActivated:false};
  }
  if(args.length!==3||args[0]!=='--create'||!ROLES.includes(args[1])||
    !ID.test(args[2]??''))throw new Error('DENY_UNAPPROVED_OWNER_AUTHORITY_ACTION');
  const [,role,keyId]=args;
  const directory=roleDirectory(role),{privateKey,candidate}=fileNames(role,directory);
  if(existsSync(privateKey)||existsSync(candidate))
    throw new Error('DENY_EXISTING_OWNER_SIGNER_NO_OVERWRITE');
  const passphrase=await hiddenPassphrase(`Original ${role} owner: choose a private 16+ character passphrase (hidden): `);
  if(passphrase.length<16)throw new Error('DENY_WEAK_OWNER_PASSPHRASE');
  const repeated=await hiddenPassphrase('Repeat the same private passphrase (hidden): ');
  if(passphrase!==repeated)throw new Error('DENY_OWNER_PASSPHRASE_MISMATCH');
  const issued=createOwnerAuthorityCandidate({role,keyId,passphrase});
  restrictDirectory(directory);
  writeFileSync(privateKey,issued.encryptedPrivateKeyPem,{flag:'wx',mode:0o600});
  writeFileSync(candidate,JSON.stringify(issued.publicCandidate,null,2)+'\n',
    {flag:'wx',mode:0o600});
  return {schema:'rosevear.hub.ql340.authority-local-readback.v1',
    state:'HELD_ORIGINAL_OWNER_PUBLIC_CANDIDATE_CREATED',role,keyId,
    publicCandidatePath:candidate,spkiSha256:issued.publicCandidate.spkiSha256,
    privateKeyEncrypted:true,privateKeyPrinted:false,
    databaseEnrollmentCreated:false,receiverActivated:false};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{process.stdout.write(JSON.stringify(await runOwnerAuthorityCli())+'\n');}
  catch(err){process.stderr.write(`${err.message}\n`);process.exitCode=1;}
}
