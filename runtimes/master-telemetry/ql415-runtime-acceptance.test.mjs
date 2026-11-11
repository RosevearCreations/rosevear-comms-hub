import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {reviewQl412SignerCandidate,openQl412DurableReplayLedger}
  from './ql412-protected-enrollment.mjs';
import {handleQl414OneTest} from './ql414-one-test-transport.mjs';
import {reviewQl415PinCustody,reviewQl415RuntimeUptime}
  from './ql415-runtime-acceptance.mjs';

const source=generateKeyPairSync('ed25519'),receiver=generateKeyPairSync('ed25519');
const pub=(key)=>key.publicKey.export({type:'spki',format:'der'});
const sourceBytes=pub(source),receiverBytes=pub(receiver);
const sourcePin=sourceBytes.toString('base64'),receiverPin=receiverBytes.toString('base64');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const sourceRevision='34e017dcf0586a7281d8726d5e8fb4a4a7054526';
const nowMs=Date.parse('2026-11-11T12:00:00.000Z');
const payload={schema:'rosevear.ql411.ree-telemetry.v1',sourceId:'rosevear-ai-hub',
  hostId:'DESKTOP-AE894KC',sourceRevision,capturedAt:'2026-11-11T11:59:00.000Z',
  episodeId:'ql415_episode_0001',samples:[
    {observationId:'ql415_sample_0001',service:'hub_api_8765',observedAt:'2026-11-11T11:58:00.000Z',reachable:true,latencyMs:10},
    {observationId:'ql415_sample_0002',service:'hub_api_8765',observedAt:'2026-11-11T11:59:00.000Z',reachable:false,latencyMs:1400}]};
const envelope={payload,signature:sign(null,Buffer.from(JSON.stringify(payload)),source.privateKey).toString('base64')};
const custody=()=>reviewQl415PinCustody({sourcePin,receiverPin,
  independentlyWitnessedSourceSha256:sha(sourceBytes),
  independentlyWitnessedReceiverSha256:sha(receiverBytes),
  sourceHost:'DESKTOP-AE894KC',sourceRevision,
  ownerAuthorityVerified:true,independentReviewerAuthorityVerified:true});
const enrollment=reviewQl412SignerCandidate({spkiBase64:sourcePin,
  independentSha256:sha(sourceBytes),originalHost:'DESKTOP-AE894KC',
  sourceRevision,independentOwnerApproval:true});
const createAck=()=>handleQl414OneTest({operation:'MASTER360_ONE_TEST_READ_ONLY',
  correlationId:'ql415_corr_0001',envelope},{transportAuthenticated:true,
  ownerAuthorizationVerified:true,independentReviewerVerified:true,enrollment,
  ledger:openQl412DurableReplayLedger(mkdtempSync(join(tmpdir(),'ql415-'))),
  expectedSourceRevision:sourceRevision,aiDataControllerRevision:
    '4b45b435fa7b6fc83b94e31556648fe4190a9f53',
  receiverKeyId:'ql415_receiver_001',receiverPublicPin:receiverPin,
  receiverSign:bytes=>sign(null,bytes,receiver.privateKey),nowMs}).ack;
const params=()=>({telemetryEnvelope:envelope,receiverAck:createAck(),pinCustody:custody(),
  actualInstalledSourceRevision:sourceRevision,
  protectedReplayAdmission:'DURABLY_COMMITTED_ON_PROTECTED_RUNTIME',
  ownerApproval:true,independentReviewerApproval:true,nowMs});

test('QL415 independently witnessed source and receiver public pins must match',()=>{
  assert.equal(custody().state,'PIN_CUSTODY_REVIEWED');
  assert.equal(reviewQl415PinCustody({sourcePin,receiverPin,
    independentlyWitnessedSourceSha256:'0'.repeat(64),
    independentlyWitnessedReceiverSha256:sha(receiverBytes),
    sourceHost:'DESKTOP-AE894KC',sourceRevision,
    ownerAuthorityVerified:true,independentReviewerAuthorityVerified:true}).state,'HOLD');
});
test('QL415 signed original-host samples and signed receiver ACK remain read-only',()=>{
  const r=reviewQl415RuntimeUptime(params());
  assert.equal(r.state,'OWNER_REVIEWED_RUNTIME_EVIDENCE');
  assert.equal(r.services[0].sampledUptimePercent,50);
  assert.equal(r.services[1].sampledUptimePercent,null);
  assert.equal(r.connection,'HOLD');
  assert.equal(r.receiver,'OFF');
});
test('QL415 cannot claim runtime acceptance with stale, tampered or missing authority',()=>{
  assert.equal(reviewQl415RuntimeUptime({...params(),ownerApproval:false}).state,'HOLD');
  assert.equal(reviewQl415RuntimeUptime({...params(),protectedReplayAdmission:'HOLD'}).state,'HOLD');
  assert.equal(reviewQl415RuntimeUptime({...params(),nowMs:nowMs+3600000}).state,'HOLD');
  const p=params();p.receiverAck={...p.receiverAck,payload:{...p.receiverAck.payload,sourceEpisodeId:'wrong'}};
  assert.equal(reviewQl415RuntimeUptime(p).state,'HOLD');
});
