import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {reviewQl412SignerCandidate,openQl412DurableReplayLedger} from './ql412-protected-enrollment.mjs';
import {handleQl414OneTest} from './ql414-one-test-transport.mjs';
import {reviewQl415PinCustody} from './ql415-runtime-acceptance.mjs';
import {reconcileQl416OriginalHostEvidence} from './ql416-operational-evidence.mjs';

const source=generateKeyPairSync('ed25519'),receiver=generateKeyPairSync('ed25519');
const pub=k=>k.publicKey.export({type:'spki',format:'der'});
const sha=x=>createHash('sha256').update(x).digest('hex');
const sourcePin=pub(source).toString('base64'),receiverPin=pub(receiver).toString('base64');
const sourceRevision='34e017dcf0586a7281d8726d5e8fb4a4a7054526';
const controller='4b45b435fa7b6fc83b94e31556648fe4190a9f53';
const nowMs=Date.parse('2026-11-11T12:00:00Z');
const payload={schema:'rosevear.ql411.ree-telemetry.v1',sourceId:'rosevear-ai-hub',
  hostId:'DESKTOP-AE894KC',sourceRevision,capturedAt:'2026-11-11T11:59:00.000Z',
  episodeId:'ql416_episode_0001',samples:[
    {observationId:'ql416_sample_0001',service:'hub_api_8765',observedAt:'2026-11-11T11:58:00.000Z',reachable:true,latencyMs:10},
    {observationId:'ql416_sample_0002',service:'hub_api_8765',observedAt:'2026-11-11T11:59:00.000Z',reachable:false,latencyMs:1800}]};
const envelope={payload,signature:sign(null,Buffer.from(JSON.stringify(payload)),source.privateKey).toString('base64')};
const enrollment=reviewQl412SignerCandidate({spkiBase64:sourcePin,
  independentSha256:sha(pub(source)),originalHost:'DESKTOP-AE894KC',
  sourceRevision,independentOwnerApproval:true});
const custody=reviewQl415PinCustody({sourcePin,receiverPin,
  independentlyWitnessedSourceSha256:sha(pub(source)),
  independentlyWitnessedReceiverSha256:sha(pub(receiver)),
  sourceHost:'DESKTOP-AE894KC',sourceRevision,
  ownerAuthorityVerified:true,independentReviewerAuthorityVerified:true});
const receiverAck=handleQl414OneTest({operation:'MASTER360_ONE_TEST_READ_ONLY',
  correlationId:'ql416_corr_0001',envelope},{transportAuthenticated:true,
  ownerAuthorizationVerified:true,independentReviewerVerified:true,enrollment,
  ledger:openQl412DurableReplayLedger(mkdtempSync(join(tmpdir(),'ql416-'))),
  expectedSourceRevision:sourceRevision,aiDataControllerRevision:controller,
  receiverKeyId:'ql416_receiver_001',receiverPublicPin:receiverPin,
  receiverSign:bytes=>sign(null,bytes,receiver.privateKey),nowMs}).ack;
const params=()=>({telemetryEnvelope:envelope,receiverAck,pinCustody:custody,
  installedSourceRevision:sourceRevision,aiDataControllerRevision:controller,
  expectedAiDataControllerRevision:controller,protectedTransportAuthenticated:true,
  ownerAuthorityVerified:true,independentReviewerVerified:true,
  protectedLedgerRecord:{state:'DURABLY_COMMITTED_ON_PROTECTED_RUNTIME',
    episodeId:payload.episodeId,sourceRevision,sourcePayloadSha256:sha(JSON.stringify(payload))},
  nowMs});

test('QL416 correlates one signed test and sampled incident without connection activation',()=>{
  const r=reconcileQl416OriginalHostEvidence({...params(),ownerIncidentAcceptance:true});
  assert.equal(r.state,'SIGNED_ONE_TEST_IMPORTED_FOR_REVIEW');
  assert.equal(r.services[0].sampledUptimePercent,50);
  assert.equal(r.services[1].sampledUptimePercent,null);
  assert.equal(r.incidents[0].classification,'SIGNED_SAMPLE_REACHABILITY_GAP');
  assert.equal(r.incidents[0].acceptance,'OWNER_REVIEWED');
  assert.equal(r.connection,'HOLD');assert.equal(r.receiver,'OFF');
});
test('QL416 fails closed for absent authority, controller drift and forged ledger',()=>{
  assert.equal(reconcileQl416OriginalHostEvidence({...params(),protectedTransportAuthenticated:false}).state,'HOLD');
  assert.equal(reconcileQl416OriginalHostEvidence({...params(),independentReviewerVerified:false}).state,'HOLD');
  assert.equal(reconcileQl416OriginalHostEvidence({...params(),expectedAiDataControllerRevision:'a'.repeat(40)}).state,'HOLD');
  assert.equal(reconcileQl416OriginalHostEvidence({...params(),protectedLedgerRecord:{...params().protectedLedgerRecord,sourcePayloadSha256:'f'.repeat(64)}}).state,'HOLD');
});
test('QL416 rejects edited signatures, episode collisions and expired observations',()=>{
  const p=params();
  assert.equal(reconcileQl416OriginalHostEvidence({...p,telemetryEnvelope:{...envelope,signature:'AAAA'}}).state,'HOLD');
  assert.equal(reconcileQl416OriginalHostEvidence({...p,receiverAck:{...receiverAck,payload:{...receiverAck.payload,sourceEpisodeId:'other_episode_001'}}}).state,'HOLD');
  assert.equal(reconcileQl416OriginalHostEvidence({...p,nowMs:nowMs+3600000}).state,'HOLD');
});
