/** QL-369: WebCrypto-only original Ed25519 enrollment packet verifier.
 * Shared unchanged by the deployed Supabase Edge Function and Node tests.
 * No private signing keys, Auth tokens, service keys or enrollment writes here.
 */
export const OWNER_PINS=Object.freeze({
  source:Object.freeze({role:'source',keyId:'source-owner-ql340a',
    spkiSha256:'e3be0648e3c9c7737c2857a8d36d31ea5c74a69211a55ac201347ce220d3158e',
    originalFileSha256:'e37042d382be26bedda70f72fa7934018bca0513fd1b106243618d450eaa2e43'}),
  master:Object.freeze({role:'master',keyId:'comms-master-jack-ql340a',
    spkiSha256:'3b086d0f89e51311b458eb94aa585f7b7a797a86c8061c8cd0b4b4d0b75585d5',
    originalFileSha256:'f5b0f8cb970ca6504be63f75898c21491a4f83feac8b7c5c5e408e4b729e0f8f'})
});
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const SHA=/^[a-f0-9]{64}$/;
const DOMAIN='rosevear.hub.ql368.original-owner-enrollment-evidence:';
const ACTIVATION_DOMAIN='rosevear.hub.ql369.original-owner-membership-activation:';
export const QL369_ACTIVATION_INTENT='rosevear.hub.ql369.original-owner-membership-activation-intent.v1';
export const QL369_ACTIVATION_DECISION='rosevear.hub.ql369.original-owner-activation-decision.v1';
export const QL369_SIGNED_ACTIVATION='rosevear.hub.ql369.signed-original-owner-activation.v1';
const schema={intent:'rosevear.hub.ql368.two-owner-auth-enrollment-intent.v1',
  approval:'rosevear.hub.ql368.owner-enrollment-evidence-approval.v1',
  signed:'rosevear.hub.ql368.two-original-owner-evidence.v1'};
const exact=(value,keys)=>value&&typeof value==='object'&&!Array.isArray(value)&&
  Object.keys(value).length===keys.length&&Object.keys(value).every(key=>keys.includes(key));
export function canonicalize369(value){
  if(Array.isArray(value))return '['+value.map(canonicalize369).join(',')+']';
  if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(k=>
    JSON.stringify(k)+':'+canonicalize369(value[k])).join(',')+'}';
  return JSON.stringify(value);
}
const bytes=value=>new TextEncoder().encode(value);
const hex=raw=>Array.from(new Uint8Array(raw),x=>x.toString(16).padStart(2,'0')).join('');
async function sha256(value,webCrypto){return hex(await webCrypto.subtle.digest('SHA-256',
  typeof value==='string'?bytes(value):value));}
function base64Bytes(encoded){
  const binary=atob(encoded.replaceAll('-','+').replaceAll('_','/'));
  return Uint8Array.from(binary,c=>c.charCodeAt(0));
}
function publicSpki(pem){
  if(typeof pem!=='string'||!/^-----BEGIN PUBLIC KEY-----\n[A-Za-z0-9+/=\n]+\n-----END PUBLIC KEY-----\n?$/.test(pem))
    throw Error('DENY_QL369_PUBLIC_PEM_FORMAT');
  return base64Bytes(pem.replace(/-----[^-]+-----/g,'').replace(/\s+/g,''));
}
const deny=reason=>({valid:false,state:reason,activated:false,privateTestAuthorized:false,
  sourceConnectionsAllowed:false,connectionState:'DISCONNECTED / HOLD'});
export async function inspectQl369OriginalPacket({signedPacket,sourceCandidateText,
  masterCandidateText,now=Date.now(),pins=OWNER_PINS,webCrypto=globalThis.crypto}={}){
  const fail=state=>{throw Error(state);};
  try{
    if(!webCrypto?.subtle||!exact(signedPacket,['schema','intent','approvals','state',
      'ownerMembershipActivated','privateTestAuthorized','connected'])||
      signedPacket.schema!==schema.signed||
      signedPacket.state!=='TWO_ORIGINAL_SIGNED_OWNER_EVIDENCE_ONLY'||
      signedPacket.ownerMembershipActivated!==false||
      signedPacket.privateTestAuthorized!==false||signedPacket.connected!==false)
      fail('DENY_QL369_SIGNED_PACKET_SCOPE');
    const intent=signedPacket.intent;
    if(!exact(intent,['schema','organizationId','sourceUserId','masterUserId','purpose',
      'issuedAt','expiresAt','nonce','mfaServerVerificationRequired',
      'ownerMembershipActivated','privateTestAuthorized','sourceConnectionsAllowed'])||
      intent.schema!==schema.intent||intent.organizationId!=='rosevear-creations'||
      !UUID.test(intent.sourceUserId??'')||!UUID.test(intent.masterUserId??'')||
      intent.sourceUserId===intent.masterUserId||
      intent.purpose!=='TWO_ORIGINAL_OWNER_AUTH_MEMBERSHIP_EVIDENCE_ONLY'||
      !/^[0-9a-f]{32}$/.test(intent.nonce??'')||
      intent.mfaServerVerificationRequired!==true||
      intent.ownerMembershipActivated!==false||intent.privateTestAuthorized!==false||
      intent.sourceConnectionsAllowed!==false)
      fail('DENY_QL369_CHANGED_INTENT');
    const issued=Date.parse(intent.issuedAt),expires=Date.parse(intent.expiresAt);
    if(!Number.isFinite(issued)||!Number.isFinite(expires)||
      new Date(issued).toISOString()!==intent.issuedAt||
      new Date(expires).toISOString()!==intent.expiresAt||
      issued>now+5000||expires<=now||expires-issued!==86_400_000)
      fail('DENY_QL369_EXPIRED_OR_INVALID_INTENT');
    const intentSha256=await sha256(canonicalize369(intent),webCrypto);
    const approvals=signedPacket.approvals;
    if(!exact(approvals,['source','master']))fail('DENY_QL369_BOTH_SIGNATURES_REQUIRED');
    for(const [role,text] of [['source',sourceCandidateText],['master',masterCandidateText]]){
      const pin=pins[role];
      if(!pin||typeof text!=='string'||text.length>16384||
        !SHA.test(pin.spkiSha256)||!SHA.test(pin.originalFileSha256)||
        await sha256(text,webCrypto)!==pin.originalFileSha256)
        fail('DENY_QL369_ORIGINAL_PUBLIC_FILE_PIN');
      const candidate=JSON.parse(text);
      if(candidate?.schema!=='rosevear.hub.ql340.owner-authority-candidate.v1'||
        candidate.role!==role||candidate.keyId!==pin.keyId||
        candidate.spkiSha256!==pin.spkiSha256||
        candidate.enrollmentAuthorized!==false)
        fail('DENY_QL369_CHANGED_PUBLIC_CANDIDATE');
      const spki=publicSpki(candidate.publicKeyPem);
      if(await sha256(spki,webCrypto)!==pin.spkiSha256)
        fail('DENY_QL369_CHANGED_ED25519_KEY');
      const key=await webCrypto.subtle.importKey('spki',spki,{name:'Ed25519'},false,['verify']);
      const approval=approvals[role],payload=approval?.payload;
      if(!exact(approval,['schema','payload','signature'])||approval.schema!==schema.approval||
        !exact(payload,['schema','organizationId','role','ownerUserId','intentSha256',
          'decision','issuedAt','expiresAt'])||
        !/^[A-Za-z0-9_-]{86}$/.test(approval.signature??''))
        fail('DENY_QL369_INVALID_OWNER_APPROVAL_SCHEMA');
      const expected={schema:schema.approval,organizationId:'rosevear-creations',role,
        ownerUserId:role==='source'?intent.sourceUserId:intent.masterUserId,
        intentSha256,decision:'APPROVE_PENDING_OWNER_ENROLLMENT_EVIDENCE_ONLY',
        issuedAt:intent.issuedAt,expiresAt:intent.expiresAt};
      if(canonicalize369(payload)!==canonicalize369(expected))
        fail('DENY_QL369_APPROVAL_SCOPE_OR_USER_BINDING');
      const ok=await webCrypto.subtle.verify('Ed25519',key,
        base64Bytes(approval.signature),bytes(DOMAIN+role+':'+canonicalize369(payload)));
      if(!ok)fail('DENY_QL369_INVALID_ORIGINAL_OWNER_SIGNATURE');
    }
    return {...deny('TWO_PINNED_ORIGINAL_SIGNATURES_VERIFIED'),valid:true,
      sourceUserId:intent.sourceUserId,masterUserId:intent.masterUserId,
      intentSha256,approvalsSha256:await sha256(canonicalize369(approvals),webCrypto),
      signedPacketSha256:await sha256(canonicalize369(signedPacket),webCrypto)};
  }catch(error){return deny(typeof error?.message==='string'&&error.message.startsWith('DENY_QL369_')
    ?error.message:'DENY_QL369_INVALID_OR_UNTRUSTED_ORIGINAL_EVIDENCE');}
}

/** QL-368 evidence-only approvals are NOT consent to activate membership.
 * QL-369 requires a new, separately signed, explicitly activation-scoped
 * original owner decision, bound to the exact QL-368 evidence packet bytes. */
export async function inspectQl369ActivationPacket({activationPacket,sourceCandidateText,
  masterCandidateText,now=Date.now(),pins=OWNER_PINS,webCrypto=globalThis.crypto}={}){
  const fail=state=>{throw Error(state);};
  try{
    if(!exact(activationPacket,['schema','evidence','activationIntent','decisions',
      'ownerMembershipActivated','privateTestAuthorized','sourceConnectionsAllowed'])||
      activationPacket.schema!==QL369_SIGNED_ACTIVATION||
      activationPacket.ownerMembershipActivated!==false||
      activationPacket.privateTestAuthorized!==false||
      activationPacket.sourceConnectionsAllowed!==false)
      fail('DENY_QL369_EXPLICIT_ACTIVATION_PACKET_REQUIRED');
    const evidence=await inspectQl369OriginalPacket({signedPacket:activationPacket.evidence,
      sourceCandidateText,masterCandidateText,now,pins,webCrypto});
    if(!evidence.valid)fail('DENY_QL369_ORIGINAL_QL368_EVIDENCE_REQUIRED');
    const intent=activationPacket.activationIntent;
    if(!exact(intent,['schema','organizationId','sourceUserId','masterUserId',
      'ql368IntentSha256','ql368SignedEvidenceSha256','issuedAt','expiresAt','nonce',
      'decisionScope','privateTestAuthorized','sourceConnectionsAllowed',
      'childTenantAccess','customerOperations'])||
      intent.schema!==QL369_ACTIVATION_INTENT||intent.organizationId!=='rosevear-creations'||
      intent.sourceUserId!==evidence.sourceUserId||intent.masterUserId!==evidence.masterUserId||
      intent.ql368IntentSha256!==evidence.intentSha256||
      intent.ql368SignedEvidenceSha256!==evidence.signedPacketSha256||
      intent.decisionScope!=='ACTIVATE_TWO_MASTER_OWNER_MEMBERSHIPS_ONCE' ||
      !/^[a-f0-9]{32}$/.test(intent.nonce??'') ||
      [intent.privateTestAuthorized,intent.sourceConnectionsAllowed,
        intent.childTenantAccess,intent.customerOperations].some(x=>x!==false))
      fail('DENY_QL369_ACTIVATION_SCOPE_OR_EVIDENCE_DRIFT');
    const issued=Date.parse(intent.issuedAt),expires=Date.parse(intent.expiresAt);
    if(!Number.isFinite(issued)||!Number.isFinite(expires)||
      new Date(issued).toISOString()!==intent.issuedAt||
      new Date(expires).toISOString()!==intent.expiresAt||
      issued>now+5000||expires<=now||expires-issued!==3_600_000||
      issued<Date.parse(activationPacket.evidence.intent.issuedAt))
      fail('DENY_QL369_ACTIVATION_DECISION_EXPIRED_OR_BACKDATED');
    const intentSha=await sha256(canonicalize369(intent),webCrypto);
    const decisions=activationPacket.decisions;
    if(!exact(decisions,['source','master']))fail('DENY_QL369_TWO_ACTIVATION_DECISIONS_REQUIRED');
    for(const [role,text] of [['source',sourceCandidateText],['master',masterCandidateText]]){
      const candidate=JSON.parse(text),pin=pins[role];
      if(!pin||await sha256(text,webCrypto)!==pin.originalFileSha256||
        candidate.role!==role||candidate.keyId!==pin.keyId)
        fail('DENY_QL369_ACTIVATION_OWNER_PUBLIC_PIN');
      const spki=publicSpki(candidate.publicKeyPem);
      const key=await webCrypto.subtle.importKey('spki',spki,{name:'Ed25519'},false,['verify']);
      const approval=decisions[role],p=approval?.payload;
      if(!exact(approval,['schema','payload','signature'])||
        approval.schema!==QL369_ACTIVATION_DECISION||
        !exact(p,['schema','organizationId','role','ownerUserId',
          'activationIntentSha256','decision','issuedAt','expiresAt'])||
        !/^[A-Za-z0-9_-]{86}$/.test(approval.signature??''))
        fail('DENY_QL369_CHANGED_ACTIVATION_DECISION');
      const expected={schema:QL369_ACTIVATION_DECISION,organizationId:'rosevear-creations',
        role,ownerUserId:role==='source'?intent.sourceUserId:intent.masterUserId,
        activationIntentSha256:intentSha,
        decision:'APPROVE_ONE_TIME_TWO_MASTER_OWNER_MEMBERSHIP_ACTIVATION_ONLY',
        issuedAt:intent.issuedAt,expiresAt:intent.expiresAt};
      if(canonicalize369(p)!==canonicalize369(expected)||
        !await webCrypto.subtle.verify('Ed25519',key,base64Bytes(approval.signature),
          bytes(ACTIVATION_DOMAIN+role+':'+canonicalize369(p))))
        fail('DENY_QL369_ORIGINAL_OWNER_DID_NOT_SIGN_EXPLICIT_ACTIVATION');
    }
    return {...deny('TWO_ORIGINAL_ACTIVATION_DECISIONS_VERIFIED_AAL2_SERVER_STILL_REQUIRED'),
      valid:true,sourceUserId:evidence.sourceUserId,masterUserId:evidence.masterUserId,
      intentSha256:evidence.intentSha256,
      approvalsSha256:await sha256(canonicalize369(decisions),webCrypto),
      signedPacketSha256:await sha256(canonicalize369(activationPacket),webCrypto)};
  }catch(error){return deny(typeof error?.message==='string'&&error.message.startsWith('DENY_QL369_')
    ?error.message:'DENY_QL369_MISSING_OR_INVALID_EXPLICIT_ACTIVATION_APPROVAL');}
}
