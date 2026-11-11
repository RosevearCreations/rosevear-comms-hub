import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,createHash,sign} from 'node:crypto';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openQl412DurableReplayLedger,reviewQl412SignerCandidate}
  from './ql412-protected-enrollment.mjs';
import {handleQl414OneTest,reviewQl414OwnerDecision} from './ql414-one-test-transport.mjs';

const source=generateKeyPairSync('ed25519');
const receiver=generateKeyPairSync('ed25519');
const pin=key=>key.publicKey.export({type:'spki',format:'der'});
const sourcePin=pin(source),receiverPin=pin(receiver).toString('base64');
const sourceRevision='2780e94077fcee154a22e0e61ace72c36410cb90';
const controller='4b45b435fa7b6fc83b94e31556648fe4190a9f53';
const nowMs=Date.parse('2026-11-11T12:00:00.000Z');
const payload={schema:'rosevear.ql411.ree-telemetry.v1',sourceId:'rosevear-ai-hub',
  hostId:'DESKTOP-AE894KC',sourceRevision,
  capturedAt:'2026-11-11T11:59:00.000Z',episodeId:'ql414_episode_0001',samples:[
    {observationId:'ql414_sample_0001',service:'hub_api_8765',observedAt:'2026-11-11T11:58:00.000Z',reachable:true,latencyMs:10},
    {observationId:'ql414_sample_0002',service:'hub_api_8765',observedAt:'2026-11-11T11:59:00.000Z',reachable:false,latencyMs:2000}]};
const envelope=()=>({payload,signature:sign(null,Buffer.from(JSON.stringify(payload)),source.privateKey).toString('base64')});
const request=()=>({operation:'MASTER360_ONE_TEST_READ_ONLY',correlationId:'ql414_corr_0001',envelope:envelope()});
const ledger=()=>openQl412DurableReplayLedger(mkdtempSync(join(tmpdir(),'ql414-ledger-')));
const enrollment=reviewQl412SignerCandidate({spkiBase64:sourcePin.toString('base64'),
  independentSha256:createHash('sha256').update(sourcePin).digest('hex'),
  originalHost:'DESKTOP-AE894KC',sourceRevision,independentOwnerApproval:true});
const opts=(store)=>({transportAuthenticated:true,ownerAuthorizationVerified:true,
  independentReviewerVerified:true,enrollment,ledger:store,
  expectedSourceRevision:sourceRevision,aiDataControllerRevision:controller,
  receiverKeyId:'receiver_ql414_001',receiverPublicPin:receiverPin,
  receiverSign:bytes=>sign(null,bytes,receiver.privateKey),nowMs});

test('QL414 protected one TEST produces independently verifiable signed receiver ACK only',()=>{
  const result=handleQl414OneTest(request(),opts(ledger()));
  assert.equal(result.state,'SIGNED_RECEIVER_ACK_FOR_REVIEW');
  assert.equal(result.ack.payload.connection,'HOLD');
  assert.equal(result.receiver,'OFF');
  assert.equal(result.incidentCandidates.length,1);
  const review=reviewQl414OwnerDecision(result.ack,{trustedReceiverPublicPin:receiverPin,
    expectedSourceRevision:sourceRevision,ownerApproval:true,
    independentReviewerApproval:true,nowMs});
  assert.equal(review.state,'OWNER_SUPERVISED_ACK_REVIEWED');
  assert.equal(review.connection,'HOLD');
});
test('QL414 requires channel, owner, reviewer, signer and protected replay ledger',()=>{
  for(const field of ['transportAuthenticated','ownerAuthorizationVerified',
    'independentReviewerVerified','receiverSign','ledger']){
    const params=opts(ledger());params[field]=field==='receiverSign'||field==='ledger'?null:false;
    assert.equal(handleQl414OneTest(request(),params).state,'HOLD');
  }
});
test('QL414 rejects replay, foreign host, tampered signature and invalid receiver signer',()=>{
  const store=ledger();
  assert.equal(handleQl414OneTest(request(),opts(store)).state,'SIGNED_RECEIVER_ACK_FOR_REVIEW');
  assert.equal(handleQl414OneTest(request(),opts(store)).reason,'REPLAYED_EPISODE');
  const altered=request();altered.envelope.payload={...payload,hostId:'TEMPLAR'};
  assert.equal(handleQl414OneTest(altered,opts(ledger())).state,'HOLD');
  const bad=opts(ledger());bad.receiverSign=()=>Buffer.alloc(64);
  assert.equal(handleQl414OneTest(request(),bad).reason,'RECEIVER_SIGNER_PROOF_REJECTED');
});
test('QL414 owner review refuses forged ACK, missing reviewer and automatic connection',()=>{
  const signed=handleQl414OneTest(request(),opts(ledger())).ack;
  assert.equal(reviewQl414OwnerDecision(signed,{trustedReceiverPublicPin:receiverPin,
    expectedSourceRevision:sourceRevision,ownerApproval:true,
    independentReviewerApproval:false,nowMs}).state,'HOLD');
  const modified={...signed,payload:{...signed.payload,connection:'CONNECTED'}};
  assert.equal(reviewQl414OwnerDecision(modified,{trustedReceiverPublicPin:receiverPin,
    expectedSourceRevision:sourceRevision,ownerApproval:true,
    independentReviewerApproval:true,nowMs}).state,'HOLD');
});
