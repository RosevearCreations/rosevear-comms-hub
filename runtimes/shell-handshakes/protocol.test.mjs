import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,sign} from 'node:crypto';
import {SHELLS,SHELL_GET_PATHS,makeShellChallenge,signShellChallenge,acceptAtSource,verifyAtMaster} from './protocol.mjs';

const now=Date.parse('2026-11-04T18:00:00Z');
const trust={independentSourceSigner:true,ownerTestAuthorized:true,sourceOwnerTestAuthorized:true,
  workloadVerified:true,keyHandleActive:true,manifestVerified:true,nonproductionOriginPinned:true,
  ownerReceipt:'a'.repeat(64),sourceReceipt:'b'.repeat(64),manifestSha256:'c'.repeat(64),
  workloadId:'00000000-1111-4222-8333-444444444444',
  brokerKeyId:'broker-ql335-sign-v1',sourceKeyId:'source-ql335-sign-v1'};
const broker=generateKeyPairSync('ed25519'),source=generateKeyPairSync('ed25519');
const pem=(p)=>p.publicKey.export({format:'pem',type:'spki'}).toString();
const kms=(key,keyId)=>async bytes=>({attested:true,keyId,
  signature:sign(null,bytes,key.privateKey).toString('base64url')});
const brokerSign=kms(broker,'broker-ql335-sign-v1'),sourceSign=kms(source,'source-ql335-sign-v1');
const nonce='a'.repeat(43);
const create=(shellId='yw',path=SHELL_GET_PATHS[0],proof=trust)=>
  makeShellChallenge({shellId,path,nonce,nowMs:now,trust:proof});

test('QL335 independent YW shell != landscaping company and iCamp shell != campground',()=>{
  assert.deepEqual(Object.keys(SHELLS),['yw','icamp']);
  assert.equal(SHELLS.yw.sourceAppId,'yard-workers');
  assert.equal(SHELLS.icamp.sourceAppId,'icamp');
  assert.equal(create('yw').challenge.source_app_id,'yard-workers');
  assert.equal(create('icamp').challenge.source_app_id,'icamp');
  for(const child of ['rosevear-landscaping','camp-rosevear','rosevear-landscaping-demo']){
    assert.notEqual(create(child).status,'CHALLENGE_READY_PRIVATE_SIGNING_REQUIRED');
  }
});
test('No verified source signer, owner source consent, handle, workload or pinned nonproduction origin means no challenge',()=>{
  for(const key of Object.keys(trust)){
    const denied=create('yw',SHELL_GET_PATHS[0],{...trust,[key]:null});
    assert.equal(denied.status,'HOLD_MISSING_SIGNED_TEST_AUTHORITY');
    assert.equal(denied.privateReads,0);assert.equal(denied.connected,false);
  }
  assert.equal(create('yw','/api/customers').status,'HOLD_MISSING_SIGNED_TEST_AUTHORITY');
  assert.equal(create('yw',SHELL_GET_PATHS[0],trust).challenge.tenantId,undefined);
});
test('Per-shell signed nonproduction receipt validates both independent KMS signatures and never grants child data',async()=>{
  for(const shellId of ['yw','icamp']){
    for(const path of SHELL_GET_PATHS){
      const challenge=create(shellId,path).challenge;
      const signed=await signShellChallenge(challenge,brokerSign);
      assert.equal(signed.status,'SIGNED_SHELL_CHALLENGE_PREPARED');
      const claimed=new Set();
      const sourceResult=await acceptAtSource(signed.envelope,{expectedShell:shellId,nowMs:now+1000,
        trust,brokerPublicKeyPem:pem(broker),claimNonce:async x=>{
          if(claimed.has(x.nonceSha256))return false;claimed.add(x.nonceSha256);return true;},
        signWithSourceKms:sourceSign});
      assert.equal(sourceResult.status,'SOURCE_SIGNED_READONLY_RECEIPT');
      const replay=await acceptAtSource(signed.envelope,{expectedShell:shellId,nowMs:now+1000,
        trust,brokerPublicKeyPem:pem(broker),claimNonce:async x=>{
          if(claimed.has(x.nonceSha256))return false;claimed.add(x.nonceSha256);return true;},
        signWithSourceKms:sourceSign});
      assert.equal(replay.status,'DENY_REPLAY_OR_NONCE_STORE_UNAVAILABLE');
      const matched=new Set();
      const verifyOptions={sourcePublicKeyPem:pem(source),nowMs:now+2000,trust,
        claimReceiptNonce:async x=>{if(matched.has(x.nonceSha256))return false;matched.add(x.nonceSha256);return true;}};
      const accepted=await verifyAtMaster(challenge,sourceResult.envelope,verifyOptions);
      assert.equal(accepted.status,'SIGNED_NONPRODUCTION_SHELL_TEST_RECONCILED');
      assert.equal(accepted.authenticated,true);assert.equal(accepted.connected,false);
      assert.equal(accepted.privateReads,1);assert.equal(accepted.childReads,0);
      assert.equal(accepted.writes,0);assert.equal(accepted.communicationsSent,0);
      assert.equal((await verifyAtMaster(challenge,sourceResult.envelope,verifyOptions)).status,
        'DENY_SOURCE_RECEIPT_REPLAY');
    }
  }
});
test('Wrong source shell, child, issuer, audience, path and extra privileged fields are denied',async()=>{
  const challenge=create('yw').challenge;
  const signed=(await signShellChallenge(challenge,brokerSign)).envelope;
  const opts={expectedShell:'yw',nowMs:now+1000,trust,brokerPublicKeyPem:pem(broker),
    claimNonce:async()=>true,signWithSourceKms:sourceSign};
  for(const mismatch of [
    {...challenge,shell_id:'icamp'},
    {...challenge,source_app_id:'icamp'},
    {...challenge,issuer:'rosevear-landscaping'},
    {...challenge,audience:'camp-rosevear'},
    {...challenge,path:'/api/integration/v1/health'},
    {...challenge,tenant_id:'camp-rosevear'},
    {...challenge,method:'POST'},
    {...challenge,scope:'read_client'},
    {...challenge,environment:'production'}]){
    const rejected=await acceptAtSource({...signed,challenge:mismatch},opts);
    assert.equal(rejected.status,'DENY_SHELL_IDENTITY_SCOPE_OR_AUTHORITY');
    assert.equal(rejected.privateReads,0);
  }
  assert.equal((await acceptAtSource(signed,{...opts,expectedShell:'icamp'})).status,
    'DENY_SHELL_IDENTITY_SCOPE_OR_AUTHORITY');
});
test('Missing nonce store, invalid signature, expired timestamp and KMS failure fail closed',async()=>{
  const challenge=create().challenge;
  const signed=(await signShellChallenge(challenge,brokerSign)).envelope;
  const options={expectedShell:'yw',nowMs:now+1000,trust,brokerPublicKeyPem:pem(broker),
    claimNonce:async()=>true,signWithSourceKms:sourceSign};
  assert.equal((await acceptAtSource(signed,{...options,claimNonce:undefined})).status,
    'HOLD_NO_ORIGINAL_BROKER_KEY_OR_NONCE_STORE');
  assert.equal((await acceptAtSource({...signed,signature:'X'.repeat(86)},options)).status,
    'DENY_INVALID_BROKER_SIGNATURE');
  assert.equal((await acceptAtSource(signed,{...options,nowMs:now+121_000})).status,
    'DENY_SHELL_IDENTITY_SCOPE_OR_AUTHORITY');
  assert.equal((await acceptAtSource(signed,{...options,signWithSourceKms:async()=>({attested:false})})).status,
    'HOLD_UNATTESTED_SOURCE_KMS');
  assert.equal((await signShellChallenge(challenge,undefined)).status,'HOLD_NO_VERIFIED_BROKER_SIGNER');
  assert.equal((await signShellChallenge(challenge,async()=>{throw Error('offline');})).status,
    'HOLD_BROKER_KMS_UNAVAILABLE');
});
test('Cross-peer response, tamper and replay cannot be counted as a signed session',async()=>{
  const challenge=create().challenge;
  const sourceReceipt=(await acceptAtSource((await signShellChallenge(challenge,brokerSign)).envelope,
    {expectedShell:'yw',nowMs:now+1000,trust,brokerPublicKeyPem:pem(broker),
      claimNonce:async()=>true,signWithSourceKms:sourceSign})).envelope;
  const opts={sourcePublicKeyPem:pem(source),nowMs:now+2000,trust,claimReceiptNonce:async()=>true};
  for(const mismatch of [
    {...sourceReceipt.receipt,shell_id:'icamp'},
    {...sourceReceipt.receipt,nonce_sha256:'a'.repeat(64)},
    {...sourceReceipt.receipt,tenant_data_included:true},
    {...sourceReceipt.receipt,capabilities_enabled:true},
    {...sourceReceipt.receipt,customer_name:'No child data permitted'}]){
    const result=await verifyAtMaster(challenge,{...sourceReceipt,receipt:mismatch},opts);
    assert.equal(result.authenticated,false);assert.equal(result.privateReads,0);
  }
  const foreign=generateKeyPairSync('ed25519');
  assert.equal((await verifyAtMaster(challenge,sourceReceipt,{...opts,sourcePublicKeyPem:pem(foreign)})).status,
    'DENY_INVALID_SOURCE_SIGNATURE');
  assert.equal((await verifyAtMaster(challenge,sourceReceipt,{...opts,claimReceiptNonce:async()=>false})).status,
    'DENY_SOURCE_RECEIPT_REPLAY');
});
