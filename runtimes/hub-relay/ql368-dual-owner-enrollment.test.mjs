import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {canonicalize} from '../master-discovery/manifest.mjs';
import {createQl368EnrollmentIntent,inspectQl368EnrollmentIntent,
  inspectQl368DualOwnerApprovals,verifyQl368SignatureBytes,
  signQl368EnrollmentApproval,QL368_APPROVAL,QL368_DOMAIN}
  from './ql368-dual-owner-enrollment.mjs';
import {ql368EnrollmentCli} from './ql368-owner-enrollment-cli.mjs';

const sourceUserId='69f496bc-ee9d-4bdb-8022-0d5620a11b09';
const masterUserId='f8118088-01ee-4701-9f34-1480ec33723f';
const now=Date.parse('2026-11-08T04:00:00.000Z');
const makeIntent=()=>createQl368EnrollmentIntent({sourceUserId,masterUserId,
  issuedAt:now,nonce:'ab'.repeat(16)});

function fixtureApproval(intent,role,privateKey,at=now){
  const check=inspectQl368EnrollmentIntent(intent,at);
  const payload={schema:QL368_APPROVAL,organizationId:'rosevear-creations',role,
    ownerUserId:role==='source'?sourceUserId:masterUserId,
    intentSha256:check.intentSha256,
    decision:'APPROVE_PENDING_OWNER_ENROLLMENT_EVIDENCE_ONLY',
    issuedAt:intent.issuedAt,expiresAt:intent.expiresAt};
  return {schema:QL368_APPROVAL,payload,signature:sign(null,
    Buffer.from(QL368_DOMAIN+role+':'+canonicalize(payload)),privateKey).toString('base64url')};
}

test('QL-368 requires two different original-owner Auth UUIDs and exact 24-hour evidence-only intent',()=>{
  const intent=makeIntent(),check=inspectQl368EnrollmentIntent(intent,now);
  assert.equal(check.valid,true);
  assert.equal(check.ownerEnrollmentAuthorized,false);
  assert.equal(check.ownerMembershipActivated,false);
  assert.equal(check.privateTestAuthorized,false);
  assert.equal(check.connectionState,'DISCONNECTED / HOLD');
  for(const mutated of [
    {...intent,masterUserId:sourceUserId},
    {...intent,organizationId:'other'},
    {...intent,privateTestAuthorized:true},
    {...intent,sourceConnectionsAllowed:true},
    {...intent,mfaServerVerificationRequired:false},
    {...intent,expiresAt:new Date(now+86_400_001).toISOString()},
    {...intent,extraPermission:true}
  ])assert.equal(inspectQl368EnrollmentIntent(mutated,now).valid,false);
  assert.equal(inspectQl368EnrollmentIntent(intent,now+86_400_000).valid,false);
  assert.throws(()=>createQl368EnrollmentIntent({sourceUserId,masterUserId:sourceUserId,issuedAt:now}));
});

test('signature bytes are bound to exact owner role, user UUID, nonce, intent hash and narrow purpose',()=>{
  const intent=makeIntent(),{privateKey,publicKey}=generateKeyPairSync('ed25519');
  const approval=fixtureApproval(intent,'source',privateKey);
  const pem=publicKey.export({format:'pem',type:'spki'});
  const check=(overrides={})=>verifyQl368SignatureBytes({intent,approval,
    role:'source',publicKeyPem:pem,at:now,...overrides});
  assert.equal(check(),true);
  assert.equal(check({role:'master'}),false);
  assert.equal(check({intent:{...intent,nonce:'cd'.repeat(16)}}),false);
  assert.equal(check({approval:{...approval,payload:{...approval.payload,
    ownerUserId:masterUserId}}}),false);
  assert.equal(check({at:now+86_400_000}),false);
  assert.equal(check({approval:{...approval,signature:'Z'.repeat(86)}}),false);
});

test('copied test keys cannot pass original-host pinned authority checks or authorize enrollment',()=>{
  const intent=makeIntent(),source=generateKeyPairSync('ed25519'),
    master=generateKeyPairSync('ed25519');
  const approvals={source:fixtureApproval(intent,'source',source.privateKey),
    master:fixtureApproval(intent,'master',master.privateKey)};
  const candidate=pair=>({role:'source',keyId:'forged',enrollmentAuthorized:false,
    publicKeyPem:pair.publicKey.export({format:'pem',type:'spki'}),
    spkiSha256:createHash('sha256').update(pair.publicKey.export({format:'der',type:'spki'})).digest('hex')});
  const result=inspectQl368DualOwnerApprovals({intent,approvals,
    sourcePublic:candidate(source),masterPublic:candidate(master),now});
  assert.equal(result.valid,false);
  assert.equal(result.ownerEnrollmentAuthorized,false);
  assert.equal(result.connected,false);
  assert.throws(()=>signQl368EnrollmentApproval({intent,role:'source',
    localCandidate:candidate(source),originalPublicBytes:Buffer.from('{}'),
    encryptedPrivateKeyPem:'not an original encrypted key',passphrase:'long-test-only-phrase',now}),
  /DENY_QL368/);
});

test('neither a missing decision nor one original signature grants membership',()=>{
  const intent=makeIntent();
  for(const approvals of [undefined,{}, {source:{}}, {source:{},master:{}}]){
    const result=inspectQl368DualOwnerApprovals({intent,approvals,now});
    assert.equal(result.valid,false);
    assert.equal(result.ownerMembershipActivated,false);
    assert.equal(result.privateTestAuthorized,false);
  }
});

test('original-device CLI is inert on CI and its help never invokes the private host',async()=>{
  const help=await ql368EnrollmentCli(['--help']);
  assert.equal(help.ownerMembershipActivated,false);
  assert.equal(help.connected,false);
  assert.ok(help.commands.some(c=>c.startsWith('--sign')));
  await assert.rejects(()=>ql368EnrollmentCli(['--prepare',sourceUserId,masterUserId,'ignored.json']),
    /DENY_QL368_NONORIGINAL_OWNER_HOST/);
});
