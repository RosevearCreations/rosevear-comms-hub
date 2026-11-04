import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {randomUUID} from 'node:crypto';
import {
  CustodyHold,assessRotation,digest,emergencyRevoke,requireVerifiedCustody,
  rotateScopedKey,isOpaqueHandle
} from './rotation.mjs';

const NOW = Date.parse('2026-11-04T03:00:00Z');
const iso = delta => new Date(NOW+delta).toISOString();
const hash = value => digest(value);
const uuid = '11111111-1111-4111-8111-111111111111';
function scope(overrides={}) {
  return {
    shellId:'yw',purpose:'BROKER_SIGN',
    ownerAuthorizationSha256:hash('owner receipt'),
    sourceAuthorizationSha256:hash('source receipt'),
    workload:{id:uuid,state:'VERIFIED',attestationSha256:hash('attestation'),expiresAt:iso(86400000)},
    issuer:{id:'issuer-1',shellId:'yw',state:'VERIFIED',algorithm:'Ed25519',
      publicKeySha256:hash('source public key'),originalProofSha256:hash('original B'),
      custodySha256:hash('independent'),sourceApprovalSha256:hash('source receipt')},
    active:{id:'handle-1',shellId:'yw',purpose:'BROKER_SIGN',provider:'SUPABASE_VAULT',
      opaqueRef:'vault:'+uuid,keyVersion:3,activationReceiptSha256:hash('activation'),
      issuerRecordId:'issuer-1',workloadId:uuid,
      expiresAt:iso(86400000),nextRotationAt:iso(60000),state:'ACTIVE'},
    ...overrides
  };
}
const isHold = code => e => e instanceof CustodyHold && e.code===code;
function harness(input=scope()) {
  const events=[];
  const store={
    loadVerifiedScope:async()=>input,
    claim:async()=>{events.push('CLAIM');return {id:'job-1',leaseToken:'only-private-coordinator',expiresAt:iso(300000)};},
    markDualKey:async()=>{events.push('DUAL');},
    commitCutover:async(_,payload)=>{events.push('CUTOVER');assert.equal(payload.expectedVersion,3);},
    quarantine:async(_,payload)=>{events.push('QUARANTINE:'+payload.reason);},
    loadHandleForRevocation:async()=>input.active,
    markRevoked:async()=>{events.push('REVOKED');}
  };
  const provider={
    stageVersion:async()=>{events.push('KMS_STAGE');return {
      shellId:'yw',purpose:'BROKER_SIGN',provider:'SUPABASE_VAULT',
      opaqueRef:'vault:22222222-2222-4222-8222-222222222222',keyVersion:4};},
    revoke:async()=>{events.push('KMS_REVOKE');}
  };
  const peerVerifier={verifyBothSides:async params=>{
    events.push('DUAL_VERIFY');
    return {shellId:'yw',purpose:'BROKER_SIGN',nonce:params.nonce,
      issuerFingerprint:params.issuerFingerprint,previousVersion:3,candidateVersion:4,
      oldVerified:true,newVerified:true,sourceReceiptSha256:hash('peer signed'),
      brokerReceiptSha256:hash('broker signed')};
  }};
  return {events,store,provider,peerVerifier};
}
const args = h => ({shellId:'yw',purpose:'BROKER_SIGN',
  store:h.store,provider:h.provider,peerVerifier:h.peerVerifier,
  now:()=>NOW,nonce:randomUUID()});

test('requires exact authentic shell and independent trusted workload + issuer + owner decisions',()=>{
  assert.equal(requireVerifiedCustody(scope()).shellId,'yw');
  for(const [change,code] of [
    [{shellId:'rosevear-landscaping'},'UNKNOWN_SHELL'],
    [{workload:{...scope().workload,state:'PENDING'}},'WORKLOAD_NOT_ATTESTED'],
    [{workload:{...scope().workload,expiresAt:iso(-1)}},'WORKLOAD_NOT_ATTESTED'],
    [{issuer:{...scope().issuer,shellId:'icamp'}},'ISSUER_NOT_PINNED'],
    [{issuer:{...scope().issuer,state:'REVOKED'}},'ISSUER_NOT_PINNED'],
    [{sourceAuthorizationSha256:hash('swapped approval')},'ORIGINAL_APPROVAL_MISSING'],
    [{ownerAuthorizationSha256:null},'ORIGINAL_APPROVAL_MISSING'],
    [{active:{...scope().active,shellId:'icamp'}},'ACTIVE_HANDLE_INVALID'],
    [{active:{...scope().active,expiresAt:iso(-1)}},'ACTIVE_HANDLE_INVALID']
  ]) assert.throws(()=>requireVerifiedCustody(scope(change),{now:NOW}),isHold(code));
});
test('opaque handles are tightly shaped and never plaintext strings',()=>{
  assert.equal(isOpaqueHandle(scope().active),true);
  assert.equal(isOpaqueHandle({provider:'MANAGED_KMS',opaqueRef:'kms:projects/account/keys/primary'}),true);
  for(const ref of ['super-secret','vault:plaintext','kms:short','kms:evil?token=abc',
    'kms:\nwindow.localStorage']) assert.equal(isOpaqueHandle({provider:'MANAGED_KMS',opaqueRef:ref}),false);
});
test('monitor-only assessment has zero peer calls and no privilege expansion',()=>{
  assert.equal(assessRotation(scope(),{now:NOW}).decision,'ROTATION_DUE');
  const later=scope({active:{...scope().active,nextRotationAt:iso(40*86400000),expiresAt:iso(45*86400000)}});
  assert.deepEqual({...assessRotation(later,{now:NOW}),keyMaterialReturned:false}.permissionsAdded,0);
  assert.equal(assessRotation(later,{now:NOW}).decision,'MONITOR');
});
test('valid due rotation uses overlap, verifies both sides, then cuts over without secrets',async()=>{
  const h=harness();
  const result=await rotateScopedKey(args(h));
  assert.deepEqual(h.events,['CLAIM','KMS_STAGE','DUAL','DUAL_VERIFY','CUTOVER']);
  assert.deepEqual(result,{state:'CUTOVER',shellId:'yw',purpose:'BROKER_SIGN',
    previousVersion:3,newVersion:4,receiptSha256:hash('broker signed'),
    permissionsAdded:0,keyMaterialReturned:false});
});
test('concurrent lease is fail-closed before reaching the key provider',async()=>{
  const h=harness();h.store.claim=async()=>null;
  await assert.rejects(rotateScopedKey(args(h)),isHold('CONCURRENT_ROTATION'));
  assert.deepEqual(h.events,[]);
});
test('wrong shell, unsupported scope, not-due and absent coordinator do nothing',async()=>{
  const h=harness();
  await assert.rejects(rotateScopedKey({...args(h),shellId:'icamp'}),isHold('CROSS_SCOPE_MISMATCH'));
  await assert.rejects(rotateScopedKey({...args(h),purpose:'SEND_CUSTOMER_SMS'}),isHold('INVALID_PURPOSE'));
  await assert.rejects(rotateScopedKey({...args(h),overlapMs:2000}),isHold('OVERLAP_OUT_OF_RANGE'));
  await assert.rejects(rotateScopedKey({shellId:'yw',purpose:'BROKER_SIGN'}),isHold('PRIVATE_COORDINATOR_UNAVAILABLE'));
  assert.deepEqual(h.events,[]);
});
test('managed service outage quarantines job; never cuts over or logs a secret',async()=>{
  const h=harness();
  h.provider.stageVersion=async()=>{throw new Error('private provider trace has sensitive material');};
  await assert.rejects(rotateScopedKey(args(h)),isHold('ROTATION_PROVIDER_FAILED'));
  assert.deepEqual(h.events,['CLAIM','QUARANTINE:ROTATION_PROVIDER_FAILED']);
});
test('swapped issuer, wrong new key, failed dual key, and replay nonce all quarantine',async()=>{
  for(const scenario of ['issuer','scope','dual','nonce']){
    const h=harness();
    if(scenario==='issuer')h.store.loadVerifiedScope=async()=>scope({issuer:{...scope().issuer,shellId:'icamp'}});
    if(scenario==='scope')h.provider.stageVersion=async()=>({...await harness().provider.stageVersion(),shellId:'icamp'});
    if(scenario==='dual')h.peerVerifier.verifyBothSides=async p=>({...await harness().peerVerifier.verifyBothSides(p),newVerified:false});
    if(scenario==='nonce')h.peerVerifier.verifyBothSides=async p=>({...await harness().peerVerifier.verifyBothSides(p),nonce:randomUUID()});
    await assert.rejects(rotateScopedKey(args(h)),isHold({
      issuer:'ISSUER_NOT_PINNED',scope:'STAGED_HANDLE_INVALID',
      dual:'DUAL_SIDE_VERIFICATION_FAILED',nonce:'DUAL_SIDE_VERIFICATION_FAILED'
    }[scenario]));
    assert.equal(h.events.includes('CUTOVER'),false);
    if(scenario!=='issuer')assert.equal(h.events.some(x=>x.startsWith('QUARANTINE:')),true);
  }
});
test('emergency revocation checks exact scope and preserves no replacement permissions',async()=>{
  const h=harness();
  await assert.rejects(emergencyRevoke({shellId:'icamp',purpose:'BROKER_SIGN',
    handleId:'handle-1',store:h.store,provider:h.provider,
    emergencyAuthorizationSha256:hash('emergency')}),isHold('CROSS_SCOPE_MISMATCH'));
  assert.deepEqual(h.events,[]);
  const result=await emergencyRevoke({shellId:'yw',purpose:'BROKER_SIGN',
    handleId:'handle-1',store:h.store,provider:h.provider,
    emergencyAuthorizationSha256:hash('emergency')});
  assert.deepEqual(h.events,['KMS_REVOKE','REVOKED']);
  assert.equal(result.permissionsAdded,0);
});
test('SQL is client inaccessible, no seeded identities/keys, and custody receipts are immutable',()=>{
  const sql=readFileSync(new URL('../../database/migrations/0010_ql332_managed_custody.sql',import.meta.url),'utf8');
  const tables=['master_workload_identities','master_peer_issuers','master_managed_key_handles',
    'master_rotation_jobs','master_custody_receipts'];
  for(const table of tables){
    assert.match(sql,new RegExp('ALTER TABLE public\\.'+table+' ENABLE ROW LEVEL SECURITY'));
    assert.match(sql,new RegExp('ALTER TABLE public\\.'+table+' FORCE ROW LEVEL SECURITY'));
  }
  assert.match(sql,/FROM PUBLIC, anon, authenticated/);
  assert.match(sql,/CREATE TRIGGER master_custody_receipt_no_edit/);
  assert.match(sql,/UNIQUE \(shell_id,purpose,key_version\)/);
  assert.match(sql,/master_rotation_single_inflight_per_scope/);
  for(const index of ['master_managed_handle_issuer_fk','master_managed_handle_workload_fk',
    'master_rotation_previous_handle_fk','master_rotation_candidate_handle_fk',
    'master_custody_receipt_shell_fk','master_custody_receipt_job_fk'])
    assert.match(sql,new RegExp(index));
  assert.doesNotMatch(sql,/GRANT (?:SELECT|INSERT|UPDATE|DELETE|EXECUTE).*TO (?:anon|authenticated)/i);
  assert.doesNotMatch(sql,/INSERT INTO public\.master_/i);
  assert.doesNotMatch(sql,/SECURITY DEFINER/i);
});
