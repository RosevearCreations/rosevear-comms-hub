/** QL-368: offline, independently signed master owner ENROLLMENT EVIDENCE.
 * Unlike QL-366's 90-second TEST permit, this document can only support a
 * future reviewed membership enrollment. It NEVER activates an account,
 * invokes Supabase Auth or permits any one of the six app connections.
 */
import {createHash,createPrivateKey,createPublicKey,randomBytes,sign,verify} from 'node:crypto';
import {canonicalize} from '../master-discovery/manifest.mjs';
import {inspectQl365aPinnedOwner,QL365A_PINS} from './ql365a-first-time-trust.mjs';

export const QL368_INTENT='rosevear.hub.ql368.two-owner-auth-enrollment-intent.v1';
export const QL368_APPROVAL='rosevear.hub.ql368.owner-enrollment-evidence-approval.v1';
export const QL368_SIGNED='rosevear.hub.ql368.two-original-owner-evidence.v1';
export const QL368_DOMAIN='rosevear.hub.ql368.original-owner-enrollment-evidence:';
const ORG='rosevear-creations';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const SHA=/^[0-9a-f]{64}$/;
const NONCE=/^[0-9a-f]{32}$/;
const exact=(o,fields)=>o&&typeof o==='object'&&!Array.isArray(o)&&
  Object.keys(o).length===fields.length&&Object.keys(o).every(k=>fields.includes(k));
const digest=o=>createHash('sha256').update(canonicalize(o)).digest('hex');
const iso=ms=>new Date(ms).toISOString();
const denial=state=>({schema:QL368_SIGNED,state,valid:false,
  organizationId:ORG,ownerMembershipActivated:false,ownerEnrollmentAuthorized:false,
  privateTestAuthorized:false,connected:false,connectionState:'DISCONNECTED / HOLD'});

export function createQl368EnrollmentIntent({sourceUserId,masterUserId,issuedAt=Date.now(),
  nonce=randomBytes(16).toString('hex')}={}){
  const intent={schema:QL368_INTENT,organizationId:ORG,
    sourceUserId,masterUserId,purpose:'TWO_ORIGINAL_OWNER_AUTH_MEMBERSHIP_EVIDENCE_ONLY',
    issuedAt:iso(issuedAt),expiresAt:iso(issuedAt+86_400_000),nonce,
    mfaServerVerificationRequired:true,ownerMembershipActivated:false,
    privateTestAuthorized:false,sourceConnectionsAllowed:false};
  const check=inspectQl368EnrollmentIntent(intent,issuedAt);
  if(!check.valid)throw Error(check.state);
  return intent;
}

export function inspectQl368EnrollmentIntent(intent,at=Date.now()){
  const issued=Date.parse(intent?.issuedAt),expires=Date.parse(intent?.expiresAt);
  if(!exact(intent,['schema','organizationId','sourceUserId','masterUserId','purpose',
    'issuedAt','expiresAt','nonce','mfaServerVerificationRequired',
    'ownerMembershipActivated','privateTestAuthorized','sourceConnectionsAllowed'])||
    intent.schema!==QL368_INTENT||intent.organizationId!==ORG||
    !UUID.test(intent.sourceUserId??'')||!UUID.test(intent.masterUserId??'')||
    intent.sourceUserId===intent.masterUserId||
    intent.purpose!=='TWO_ORIGINAL_OWNER_AUTH_MEMBERSHIP_EVIDENCE_ONLY'||
    !NONCE.test(intent.nonce??'')||!Number.isFinite(issued)||!Number.isFinite(expires)||
    intent.issuedAt!==iso(issued)||intent.expiresAt!==iso(expires)||
    expires-issued!==86_400_000||issued>at+5000||at>=expires||
    intent.mfaServerVerificationRequired!==true||
    [intent.ownerMembershipActivated,intent.privateTestAuthorized,
      intent.sourceConnectionsAllowed].some(x=>x!==false))
    return denial('DENY_QL368_CHANGED_INVALID_OR_EXPIRED_ENROLLMENT_INTENT');
  return {...denial('PENDING_TWO_INDEPENDENT_ORIGINAL_OWNER_APPROVALS'),
    valid:true,intentSha256:digest(intent),expiresAt:intent.expiresAt};
}

function payload(intent,role,hash){
  return {schema:QL368_APPROVAL,organizationId:ORG,role,
    ownerUserId:role==='source'?intent.sourceUserId:intent.masterUserId,
    intentSha256:hash,decision:'APPROVE_PENDING_OWNER_ENROLLMENT_EVIDENCE_ONLY',
    issuedAt:intent.issuedAt,expiresAt:intent.expiresAt};
}

export function signQl368EnrollmentApproval({intent,role,localCandidate,
  originalPublicBytes,encryptedPrivateKeyPem,passphrase,now=Date.now()}={}){
  const check=inspectQl368EnrollmentIntent(intent,now),pin=QL365A_PINS[role];
  if(!check.valid||!pin||!Buffer.isBuffer(originalPublicBytes)||
    !inspectQl365aPinnedOwner(localCandidate,role,{originalBytes:originalPublicBytes}).verified||
    typeof passphrase!=='string'||passphrase.length<16)
    throw Error('DENY_QL368_ORIGINAL_OWNER_CUSTODY_OR_INTENT_REQUIRED');
  let privateKey;
  try{privateKey=createPrivateKey({key:encryptedPrivateKeyPem,format:'pem',passphrase});}
  catch{throw Error('DENY_QL368_ORIGINAL_OWNER_KEY_DECRYPTION');}
  if(privateKey.asymmetricKeyType!=='ed25519'||
    createHash('sha256').update(createPublicKey(privateKey).export({format:'der',type:'spki'}))
      .digest('hex')!==pin.spkiSha256)
    throw Error('DENY_QL368_ORIGINAL_OWNER_KEY_PIN_DRIFT');
  const decision=payload(intent,role,check.intentSha256);
  return {schema:QL368_APPROVAL,payload:decision,signature:sign(null,
    Buffer.from(QL368_DOMAIN+role+':'+canonicalize(decision)),privateKey).toString('base64url')};
}

/** Testable cryptographic verifier; the outer packet verifier additionally
 * requires BOTH ORIGINAL pinned authority candidates, not arbitrary PEMs. */
export function verifyQl368SignatureBytes({intent,approval,role,publicKeyPem,at=Date.now()}={}){
  const check=inspectQl368EnrollmentIntent(intent,at),p=approval?.payload;
  if(!check.valid||!['source','master'].includes(role)||
    !exact(approval,['schema','payload','signature'])||approval.schema!==QL368_APPROVAL||
    !exact(p,['schema','organizationId','role','ownerUserId','intentSha256',
      'decision','issuedAt','expiresAt'])||
    canonicalize(p)!==canonicalize(payload(intent,role,check.intentSha256))||
    !/^[A-Za-z0-9_-]{86}$/.test(approval.signature??''))return false;
  try{return verify(null,Buffer.from(QL368_DOMAIN+role+':'+canonicalize(p)),
    createPublicKey(publicKeyPem),Buffer.from(approval.signature,'base64url'));}
  catch{return false;}
}

export function inspectQl368DualOwnerApprovals({intent,approvals,sourcePublic,
  masterPublic,now=Date.now()}={}){
  const check=inspectQl368EnrollmentIntent(intent,now);
  if(!check.valid)return check;
  if(!exact(approvals,['source','master']))return denial('HOLD_QL368_TWO_APPROVALS_REQUIRED');
  for(const [role,candidate] of [['source',sourcePublic],['master',masterPublic]]){
    if(!inspectQl365aPinnedOwner(candidate,role).verified||
      !verifyQl368SignatureBytes({intent,approval:approvals[role],role,
        publicKeyPem:candidate?.publicKeyPem,at:now}))
      return denial('DENY_QL368_UNTRUSTED_OR_INVALID_ORIGINAL_OWNER_APPROVAL');
  }
  return {...denial('TWO_ORIGINAL_SIGNATURE_BYTES_VERIFIED_MEMBERSHIP_STILL_INACTIVE'),
    valid:true,intentSha256:check.intentSha256,
    approvalsSha256:digest(approvals),mfaServerVerificationRequired:true};
}
