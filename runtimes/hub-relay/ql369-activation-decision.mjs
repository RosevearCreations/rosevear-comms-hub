/** QL-369 original-device, explicit owner MEMBERSHIP ACTIVATION consent.
 * This is separate from QL-368's evidence-only signature. No RPC, service
 * token, database write, private TEST or connection activation is possible.
 */
import {createHash,createPrivateKey,createPublicKey,randomBytes,sign,webcrypto} from 'node:crypto';
import {canonicalize} from '../master-discovery/manifest.mjs';
import {inspectQl368DualOwnerApprovals,inspectQl368EnrollmentIntent} from './ql368-dual-owner-enrollment.mjs';
import {inspectQl365aPinnedOwner,QL365A_PINS} from './ql365a-first-time-trust.mjs';
import {inspectQl369ActivationPacket,QL369_ACTIVATION_INTENT,
  QL369_ACTIVATION_DECISION,QL369_SIGNED_ACTIVATION}
  from '../../supabase/functions/ql369-owner-enrollment/verify.mjs';

const sha=value=>createHash('sha256').update(Buffer.isBuffer(value)||typeof value==='string'
  ?value:canonicalize(value)).digest('hex');
const exact=(o,keys)=>o&&typeof o==='object'&&!Array.isArray(o)&&
  Object.keys(o).length===keys.length&&Object.keys(o).every(k=>keys.includes(k));
const domain='rosevear.hub.ql369.original-owner-membership-activation:';

export function createQl369ActivationIntent({signedEvidence,sourcePublic,masterPublic,
  now=Date.now(),nonce=randomBytes(16).toString('hex')}={}){
  const check=inspectQl368DualOwnerApprovals({intent:signedEvidence?.intent,
    approvals:signedEvidence?.approvals,sourcePublic,masterPublic,now});
  if(!check.valid||signedEvidence.schema!=='rosevear.hub.ql368.two-original-owner-evidence.v1'||
    signedEvidence.state!=='TWO_ORIGINAL_SIGNED_OWNER_EVIDENCE_ONLY'||
    signedEvidence.ownerMembershipActivated!==false||
    signedEvidence.privateTestAuthorized!==false||signedEvidence.connected!==false)
    throw Error('DENY_QL369_PINNED_QL368_EVIDENCE_FIRST');
  const intent={schema:QL369_ACTIVATION_INTENT,organizationId:'rosevear-creations',
    sourceUserId:signedEvidence.intent.sourceUserId,masterUserId:signedEvidence.intent.masterUserId,
    ql368IntentSha256:check.intentSha256,
    ql368SignedEvidenceSha256:sha(signedEvidence),issuedAt:new Date(now).toISOString(),
    expiresAt:new Date(now+3_600_000).toISOString(),nonce,
    decisionScope:'ACTIVATE_TWO_MASTER_OWNER_MEMBERSHIPS_ONCE',
    privateTestAuthorized:false,sourceConnectionsAllowed:false,
    childTenantAccess:false,customerOperations:false};
  return {intent,intentSha256:sha(intent)};
}

export function inspectQl369ActivationIntent({activationIntent,signedEvidence,
  sourcePublic,masterPublic,now=Date.now()}={}){
  const old=inspectQl368EnrollmentIntent(signedEvidence?.intent,now);
  const check=inspectQl368DualOwnerApprovals({intent:signedEvidence?.intent,
    approvals:signedEvidence?.approvals,sourcePublic,masterPublic,now});
  const issued=Date.parse(activationIntent?.issuedAt),expires=Date.parse(activationIntent?.expiresAt);
  if(!old.valid||!check.valid||!exact(activationIntent,['schema','organizationId','sourceUserId',
    'masterUserId','ql368IntentSha256','ql368SignedEvidenceSha256','issuedAt',
    'expiresAt','nonce','decisionScope','privateTestAuthorized','sourceConnectionsAllowed',
    'childTenantAccess','customerOperations'])||
    activationIntent.schema!==QL369_ACTIVATION_INTENT||
    activationIntent.organizationId!=='rosevear-creations'||
    activationIntent.sourceUserId!==signedEvidence.intent.sourceUserId||
    activationIntent.masterUserId!==signedEvidence.intent.masterUserId||
    activationIntent.ql368IntentSha256!==check.intentSha256||
    activationIntent.ql368SignedEvidenceSha256!==sha(signedEvidence)||
    !/^[a-f0-9]{32}$/.test(activationIntent.nonce??'')||
    activationIntent.decisionScope!=='ACTIVATE_TWO_MASTER_OWNER_MEMBERSHIPS_ONCE'||
    [activationIntent.privateTestAuthorized,activationIntent.sourceConnectionsAllowed,
      activationIntent.childTenantAccess,activationIntent.customerOperations].some(x=>x!==false)||
    !Number.isFinite(issued)||!Number.isFinite(expires)||
    new Date(issued).toISOString()!==activationIntent.issuedAt||
    new Date(expires).toISOString()!==activationIntent.expiresAt||
    expires-issued!==3_600_000||issued>now+5000||expires<=now||
    issued<Date.parse(signedEvidence.intent.issuedAt))
    return {valid:false,state:'DENY_QL369_EXPLICIT_ORIGINAL_ACTIVATION_INTENT_REQUIRED'};
  return {valid:true,state:'PENDING_TWO_EXPLICIT_ORIGINAL_ACTIVATION_DECISIONS',
    intentSha256:sha(activationIntent),expiresAt:activationIntent.expiresAt,
    activated:false,privateTestAuthorized:false};
}

export function signQl369ActivationDecision({activationIntent,signedEvidence,
  sourcePublic,masterPublic,role,localCandidate,originalPublicBytes,
  encryptedPrivateKeyPem,passphrase,now=Date.now()}={}){
  const check=inspectQl369ActivationIntent({activationIntent,signedEvidence,
    sourcePublic,masterPublic,now}),pin=QL365A_PINS[role];
  if(!check.valid||!pin||!Buffer.isBuffer(originalPublicBytes)||
    !inspectQl365aPinnedOwner(localCandidate,role,{originalBytes:originalPublicBytes}).verified||
    typeof passphrase!=='string'||passphrase.length<16)
    throw Error('DENY_QL369_EXPLICIT_ORIGINAL_CUSTODY_REQUIRED');
  let privateKey;
  try{privateKey=createPrivateKey({key:encryptedPrivateKeyPem,format:'pem',passphrase});}
  catch{throw Error('DENY_QL369_LOCAL_OWNER_KEY_DECRYPTION');}
  if(privateKey.asymmetricKeyType!=='ed25519'||
    sha(createPublicKey(privateKey).export({format:'der',type:'spki'}))!==pin.spkiSha256)
    throw Error('DENY_QL369_ORIGINAL_KEY_PIN_CHANGED');
  const payload={schema:QL369_ACTIVATION_DECISION,organizationId:'rosevear-creations',
    role,ownerUserId:role==='source'?activationIntent.sourceUserId:activationIntent.masterUserId,
    activationIntentSha256:check.intentSha256,
    decision:'APPROVE_ONE_TIME_TWO_MASTER_OWNER_MEMBERSHIP_ACTIVATION_ONLY',
    issuedAt:activationIntent.issuedAt,expiresAt:activationIntent.expiresAt};
  return {schema:QL369_ACTIVATION_DECISION,payload,signature:sign(null,
    Buffer.from(domain+role+':'+canonicalize(payload)),privateKey).toString('base64url')};
}

export async function inspectQl369SignedActivation({packet,sourcePublicText,
  masterPublicText,now=Date.now()}={}){
  return inspectQl369ActivationPacket({activationPacket:packet,
    sourceCandidateText:sourcePublicText,masterCandidateText:masterPublicText,
    now,webCrypto:webcrypto});
}

export function wrapQl369ActivationPacket({signedEvidence,activationIntent,
  sourceDecision,masterDecision}={}){
  return {schema:QL369_SIGNED_ACTIVATION,evidence:signedEvidence,activationIntent,
    decisions:{source:sourceDecision,master:masterDecision},
    ownerMembershipActivated:false,privateTestAuthorized:false,sourceConnectionsAllowed:false};
}
