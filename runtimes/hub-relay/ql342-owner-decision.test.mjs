import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {mkdtempSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {test} from 'node:test';
import {canonicalize} from '../master-discovery/manifest.mjs';
import {createOwnerAuthorityCandidate} from './owner-authority-custody.mjs';
import {createEnrollmentRequest,assembleSignedEnrollment,signOwnerRequest} from './ql340b-enrollment.mjs';
import {preflightFileState,reviewOwnerEnrollment,verifyOneHeldTestReceipt,
  ql342Cli,QL342_DECISION_SCHEMA} from './ql342-owner-decision.mjs';

const sha=value=>createHash('sha256').update(value).digest('hex');
const now=Date.parse('2026-11-05T23:00:00.000Z');
const source=createOwnerAuthorityCandidate({role:'source',keyId:'synthetic-source-ql342',
  passphrase:'synthetic-source-passphrase-only'});
const master=createOwnerAuthorityCandidate({role:'master',keyId:'synthetic-master-ql342',
  passphrase:'synthetic-master-passphrase-only'});
const deviceKey=generateKeyPairSync('ed25519');
const device={schema:'rosevear.hub.ql339b.public-candidate.v1',
  deviceId:'rosevear-windows-hub',workloadId:'hub-probe',keyId:'hub-ql339b',
  devicePublicKeyPem:deviceKey.publicKey.export({format:'pem',type:'spki'}),
  deviceSpkiSha256:sha(deviceKey.publicKey.export({format:'der',type:'spki'})),
  enrollmentState:'HELD_ORIGINAL_OWNER_SIGNATURES_REQUIRED'};
const candidates={device,source:source.publicCandidate,master:master.publicCandidate};
const evidenceDigests={windowsWitnessSha256:sha('synthetic-windows'),
  privateTlsWitnessSha256:sha('synthetic-tls'),
  tailnetAclWitnessSha256:sha('synthetic-tailnet'),
  rollbackWitnessSha256:sha('synthetic-preflight-only')};
const request=createEnrollmentRequest({...candidates,witnessHashes:evidenceDigests,now});
const signApproval=(role,owner,passphrase)=>signOwnerRequest({request,role,
  localCandidate:owner.publicCandidate,encryptedPrivateKeyPem:owner.encryptedPrivateKeyPem,
  passphrase,now});
const assembled=assembleSignedEnrollment({request,
  sourceApproval:signApproval('source',source,'synthetic-source-passphrase-only'),
  masterApproval:signApproval('master',master,'synthetic-master-passphrase-only'),now});
const enrollment=assembled.enrollmentRecord,pins=assembled.ownerAuthorityPins;
const review=()=>reviewOwnerEnrollment({enrollment,pins,candidates,evidenceDigests,
  rollbackRecord:{schema:'rosevear.hub.ql340c.preflight.v1',
    state:'RECEIVER_START_PREVENTED'},now});
const envelope={schemaVersion:'rosevear.hub.relay.heartbeat.v1',issuer:'rosevear-ai-hub',
  audience:'rosevear-comms-hub:nonproduction',deviceId:'rosevear-windows-hub',
  workloadId:'hub-probe',environment:'TEST',sequence:1,
  nonce:'syntheticNonceWith22Chars1234',
  sessionId:'59d4eb96-ff78-4524-857a-a6a60ec813ce',
  issuedAt:new Date(now-20_000).toISOString(),expiresAt:new Date(now+50_000).toISOString(),
  capabilities:['health.read','capabilities.read'],queueDepth:0,relayMode:'OUTBOUND_ONLY'};
const packet={envelope,keyId:'hub-ql339b',
  signature:sign(null,Buffer.from(canonicalize(envelope)),deviceKey.privateKey).toString('base64url')};
const receipt={device_id:envelope.deviceId,workload_id:envelope.workloadId,
  session_id:envelope.sessionId,sequence_no:1,nonce:envelope.nonce,
  heartbeat_sha256:sha(canonicalize(envelope)),queue_depth:0,
  source_app_id:'rosevear-ai-hub',connection_state:'HOLD',received_at:new Date(now)};
const query=(opts={})=>async sql=>{
  if(sql.startsWith('SELECT current_user'))return {rows:[{receiver_role:opts.role??'ql340c_private_receiver'}]};
  if(sql.includes('count(receipt_id)'))return {rows:[{count:opts.count??1}]};
  if(sql.includes('master_hub_relay_receipts_ql338'))return {rows:opts.receipts??[receipt]};
  if(sql.includes('master_hub_device_enrollments_ql339b'))
    return {rows:opts.enrollmentRows??[{enrollment_record:enrollment,revoked_at:opts.revoked??null}]};
  throw Error('UNEXPECTED_SYNTHETIC_SQL');
};

test('original Ree/Jack owner signatures and all four original evidence hashes verify without authorizing anything',()=>{
  const result=review();
  assert.equal(result.schema,QL342_DECISION_SCHEMA);
  assert.equal(result.originalOwnerSignaturesVerified,true);
  assert.equal(result.fourCurrentWitnessHashesMatch,true);
  assert.equal(result.approved,false);
  assert.equal(result.connected,false);
  assert.equal(result.actualReceiverStopDocumentPresent,false);
  assert.equal(result.stopPreflightIsNotActiveStop,true);
  assert.equal(result.databaseEnrollmentCreated,false);
  assert.equal(result.customerCommunications,false);
  assert.equal(result.deviceActions,false);
});

test('unreviewed owner, swapped master, forged evidence, expired and forged signed enrollment fail closed',()=>{
  const input={enrollment,pins,candidates,evidenceDigests,now};
  assert.match(reviewOwnerEnrollment({...input,pins:{...pins,master:pins.source}}).state,/DENY/);
  assert.match(reviewOwnerEnrollment({...input,evidenceDigests:{...evidenceDigests,
    privateTlsWitnessSha256:'0'.repeat(64)}}).state,/DENY/);
  assert.match(reviewOwnerEnrollment({...input,now:now+1_300_000}).state,/HOLD_ENROLLMENT_EXPIRED/);
  assert.match(reviewOwnerEnrollment({...input,enrollment:{...enrollment,payload:{...enrollment.payload,
    issuedAt:new Date(now-10_000).toISOString()}}}).state,/DENY_OWNER_SIGNATURE/);
  assert.match(reviewOwnerEnrollment({...input,candidates:{...candidates,
    master:source.publicCandidate}}).state,/DENY_ORIGINAL_PUBLIC/);
});

test('one actual original signed TEST receipt and independently stored enrollment verify TEST only',async()=>{
  const decision=review();
  const v=await verifyOneHeldTestReceipt(query(),pins,packet,decision,now+1000);
  assert.equal(v.verified,true);
  assert.equal(v.state,'ORIGINAL_SIGNED_ONE_TEST_RECEIPT_VERIFIED_STILL_HELD');
  assert.equal(v.connected,false);
  assert.equal(v.peerConnections,0);
  assert.equal(v.customerCommunications,false);
  assert.equal(v.deviceActions,false);
  assert.equal(v.receiverActivated,false);
  assert.equal(v.receiptCount,1);
});

test('missing DB enrollment, no receipt, replay, wrong DB role, forged packet and expired receipt never verify',async()=>{
  const decision=review();
  const check=(q,p=packet,d=decision,at=now+1000)=>verifyOneHeldTestReceipt(q,pins,p,d,at);
  for(const [q,p,d,at] of [
    [query({enrollmentRows:[]}),packet,decision,now+1000],
    [query({count:0}),packet,decision,now+1000],
    [query({count:2}),packet,decision,now+1000],
    [query({role:'postgres'}),packet,decision,now+1000],
    [query(),{...packet,signature:'x'.repeat(86)},decision,now+1000],
    [query(),packet,{...decision,approved:true},now+1000],
    [query(),packet,decision,now+300_000],
    [query({enrollmentRows:[{enrollment_record:{...enrollment,
      payload:{...enrollment.payload,nonce:'untrusted'}}}]}),packet,decision,now+1000]
  ])assert.notEqual((await check(q,p,d,at)).verified,true,'test tuple must remain HOLD');
});

test('field preflight does not invent original signer, password, receiver or observed stop',async()=>{
  const empty=mkdtempSync(join(tmpdir(),'ql342-empty-'));
  const snapshot=preflightFileState(empty);
  assert.equal(snapshot.signedEnrollmentPresent,false);
  assert.equal(snapshot.approvedPublicPinsPresent,false);
  assert.equal(snapshot.privateCredentialEncryptedOnDisk,false);
  assert.equal(snapshot.oneHeldTestReceiptVerified,false);
  assert.equal(snapshot.receiverActivated,false);
  const help=await ql342Cli(['--help']);
  assert.equal(help.networkRequests,0);
  const expectedHold=process.platform==='win32'
    ? /HOLD_PRIVATE_DATABASE_CREDENTIAL_REQUIRED/
    : /HOLD_REE_ORIGINAL_WINDOWS_HOST_REQUIRED/;
  await assert.rejects(()=>ql342Cli(['--verify-one','foo','bar']),expectedHold);
  const sql=readFileSync(new URL('../../supabase/migrations/20261106004637_ql341_six_private_peers_and_receipt_readback.sql',import.meta.url),'utf8');
  assert.match(sql,/FORCE ROW LEVEL SECURITY/);
  const operator=readFileSync(new URL('./ql340c-windows-operator.ps1',import.meta.url),'utf8');
  assert.match(operator,/if \(\$OwnerPreflight\)/);
  assert.match(operator,/if \(\$VerifyOneReceipt\)/);
  assert.match(operator,/HOLD_PRIVATE_DATABASE_CREDENTIAL_REQUIRED/);
});
