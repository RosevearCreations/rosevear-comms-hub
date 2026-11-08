import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign,webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createQl368EnrollmentIntent} from '../../../runtimes/hub-relay/ql368-dual-owner-enrollment.mjs';
import {canonicalize369,inspectQl369OriginalPacket,inspectQl369ActivationPacket,
  QL369_ACTIVATION_INTENT,QL369_ACTIVATION_DECISION,QL369_SIGNED_ACTIVATION,
  OWNER_PINS} from './verify.mjs';

const sha=value=>createHash('sha256').update(value).digest('hex');
function fixture(){
  const owners={};
  const pins={};
  for(const role of ['source','master']){
    const {privateKey,publicKey}=generateKeyPairSync('ed25519');
    const pem=publicKey.export({format:'pem',type:'spki'});
    const spkiSha256=sha(publicKey.export({format:'der',type:'spki'}));
    const candidate={schema:'rosevear.hub.ql340.owner-authority-candidate.v1',role,
      keyId:role+'-fixture',spkiSha256,publicKeyPem:pem,enrollmentAuthorized:false};
    const text=JSON.stringify(candidate,null,2)+'\n';
    owners[role]={privateKey,text};
    pins[role]={role,keyId:candidate.keyId,spkiSha256,originalFileSha256:sha(text)};
  }
  const intent=createQl368EnrollmentIntent({
    sourceUserId:'69f496bc-ee9d-4bdb-8022-0d5620a11b09',
    masterUserId:'f8118088-01ee-4701-9f34-1480ec33723f'});
  const intentSha256=sha(canonicalize369(intent));
  const approvals={};
  for(const role of ['source','master']){
    const payload={schema:'rosevear.hub.ql368.owner-enrollment-evidence-approval.v1',
      organizationId:'rosevear-creations',role,
      ownerUserId:role==='source'?intent.sourceUserId:intent.masterUserId,
      intentSha256,decision:'APPROVE_PENDING_OWNER_ENROLLMENT_EVIDENCE_ONLY',
      issuedAt:intent.issuedAt,expiresAt:intent.expiresAt};
    approvals[role]={schema:payload.schema,payload,
      signature:sign(null,Buffer.from('rosevear.hub.ql368.original-owner-enrollment-evidence:'+role+':'+
        canonicalize369(payload)),owners[role].privateKey).toString('base64url')};
  }
  const signedPacket={
    schema:'rosevear.hub.ql368.two-original-owner-evidence.v1',intent,approvals,
    state:'TWO_ORIGINAL_SIGNED_OWNER_EVIDENCE_ONLY',ownerMembershipActivated:false,
    privateTestAuthorized:false,connected:false};
  const issued=Date.now();
  const activationIntent={schema:QL369_ACTIVATION_INTENT,organizationId:'rosevear-creations',
    sourceUserId:intent.sourceUserId,masterUserId:intent.masterUserId,
    ql368IntentSha256:intentSha256,
    ql368SignedEvidenceSha256:sha(canonicalize369(signedPacket)),
    issuedAt:new Date(issued).toISOString(),expiresAt:new Date(issued+3_600_000).toISOString(),
    nonce:'b'.repeat(32),decisionScope:'ACTIVATE_TWO_MASTER_OWNER_MEMBERSHIPS_ONCE',
    privateTestAuthorized:false,sourceConnectionsAllowed:false,
    childTenantAccess:false,customerOperations:false};
  const activationIntentSha256=sha(canonicalize369(activationIntent));
  const decisions={};
  for(const role of ['source','master']){
    const payload={schema:QL369_ACTIVATION_DECISION,organizationId:'rosevear-creations',
      role,ownerUserId:role==='source'?intent.sourceUserId:intent.masterUserId,
      activationIntentSha256,
      decision:'APPROVE_ONE_TIME_TWO_MASTER_OWNER_MEMBERSHIP_ACTIVATION_ONLY',
      issuedAt:activationIntent.issuedAt,expiresAt:activationIntent.expiresAt};
    decisions[role]={schema:QL369_ACTIVATION_DECISION,payload,
      signature:sign(null,Buffer.from('rosevear.hub.ql369.original-owner-membership-activation:'+role+':'+
        canonicalize369(payload)),owners[role].privateKey).toString('base64url')};
  }
  return {pins,now:Date.now(),signedPacket,activationPacket:{
    schema:QL369_SIGNED_ACTIVATION,evidence:signedPacket,activationIntent,decisions,
    ownerMembershipActivated:false,privateTestAuthorized:false,sourceConnectionsAllowed:false},
    sourceCandidateText:owners.source.text,masterCandidateText:owners.master.text,
    webCrypto:webcrypto};
}

test('verified WebCrypto Ed25519 original owner bytes remain evidence until server MFA',async()=>{
  const proof=fixture();
  const result=await inspectQl369OriginalPacket(proof);
  assert.equal(result.valid,true);
  assert.equal(result.activated,false);
  assert.equal(result.privateTestAuthorized,false);
  assert.equal(result.sourceConnectionsAllowed,false);
  assert.equal(result.connectionState,'DISCONNECTED / HOLD');
  assert.match(result.intentSha256,/^[a-f0-9]{64}$/);
});

test('QL-368 evidence alone is never the new QL-369 activation permission',async()=>{
  const proof=fixture();
  assert.equal((await inspectQl369ActivationPacket({...proof,activationPacket:proof.signedPacket})).valid,false);
  const result=await inspectQl369ActivationPacket(proof);
  assert.equal(result.valid,true);
  assert.equal(result.activated,false);
  assert.equal(result.sourceConnectionsAllowed,false);
});

test('new activation decision must be independently signed by BOTH original owners',async()=>{
  for(const mutation of [
    p=>{p.activationPacket.decisions.master.signature='A'.repeat(86);},
    p=>{delete p.activationPacket.decisions.master;},
    p=>{p.activationPacket.activationIntent.ql368SignedEvidenceSha256='b'.repeat(64);},
    p=>{p.activationPacket.activationIntent.privateTestAuthorized=true;},
    p=>{p.activationPacket.ownerMembershipActivated=true;},
    p=>{p.activationPacket.decisions.source.payload.decision='EVIDENCE_ONLY';},
    p=>{p.activationPacket.activationIntent.sourceUserId=p.activationPacket.activationIntent.masterUserId;},
    p=>{p.now=Date.parse(p.activationPacket.activationIntent.expiresAt);}
  ]){
    const proof=fixture();mutation(proof);
    assert.equal((await inspectQl369ActivationPacket(proof)).valid,false);
  }
});

test('wrong master signature is rejected regardless of correct source signature',async()=>{
  const proof=fixture();
  proof.signedPacket.approvals.master.signature='A'.repeat(86);
  assert.equal((await inspectQl369OriginalPacket(proof)).valid,false);
});

test('swapping original public keys is rejected by original bytes and role',async()=>{
  const proof=fixture();
  proof.masterCandidateText=proof.sourceCandidateText;
  assert.equal((await inspectQl369OriginalPacket(proof)).valid,false);
});

test('tampered UUID, intent, extra permission and absent signer all fail closed',async()=>{
  for(const mutation of [
    p=>{p.signedPacket.intent.sourceUserId=p.signedPacket.intent.masterUserId;},
    p=>{p.signedPacket.intent.privateTestAuthorized=true;},
    p=>{p.signedPacket.privateTestAuthorized=true;},
    p=>{delete p.signedPacket.approvals.master;},
    p=>{p.signedPacket.approvals.source.payload.decision='ACTIVATE_NOW';},
    p=>{p.signedPacket.extra='unexpected';}
  ]){
    const proof=fixture();mutation(proof);
    assert.equal((await inspectQl369OriginalPacket(proof)).valid,false);
  }
});

test('expired 24-hour packet is rejected even with real signatures',async()=>{
  const proof=fixture();proof.now=Date.parse(proof.signedPacket.intent.expiresAt);
  assert.equal((await inspectQl369OriginalPacket(proof)).valid,false);
});

test('real production pins never equal test-only generated public identities',async()=>{
  const proof=fixture();
  assert.equal((await inspectQl369OriginalPacket({...proof,pins:OWNER_PINS})).valid,false);
});

test('Edge handler contains identity, AAL2, original upload, and server-only RPC checks',()=>{
  const edge=readFileSync(new URL('./index.ts',import.meta.url),'utf8');
  assert.match(edge,/auth\/v1\/user/);
  assert.match(edge,/claims\.aal!=='aal2'/);
  assert.match(edge,/claims\.session_id/);
  assert.match(edge,/inspectQl369ActivationPacket/);
  assert.match(edge,/ql369_activate_original_dual_owner_once/);
  assert.match(edge,/SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(edge,/origin!==ORIGIN/);
  assert.doesNotMatch(edge,/access-control-allow-origin['"]\s*:\s*['"]\*/);
});
