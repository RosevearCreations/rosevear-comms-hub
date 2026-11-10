import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,createHash,sign} from 'node:crypto';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {reviewQl412SignerCandidate,openQl412DurableReplayLedger,
  reviewQl412ThreeMasterTelemetry,reviewQl412IncidentAcceptance} from './ql412-protected-enrollment.mjs';

const {publicKey,privateKey}=generateKeyPairSync('ed25519');
const spki=publicKey.export({type:'spki',format:'der'});
const pin=spki.toString('base64');
const digest=createHash('sha256').update(spki).digest('hex');
const revision='1a52acf4fc756088d0a1ab38b350f96fccce2a1b';
const controller='4b45b435fa7b6fc83b94e31556648fe4190a9f53';
const candidate=()=>reviewQl412SignerCandidate({spkiBase64:pin,
  independentSha256:digest,originalHost:'DESKTOP-AE894KC',sourceRevision:revision,
  independentOwnerApproval:true});
const capturedAt='2026-11-10T18:00:00.000Z';
const payload={schema:'rosevear.ql411.ree-telemetry.v1',sourceId:'rosevear-ai-hub',
  hostId:'DESKTOP-AE894KC',sourceRevision:revision,capturedAt,
  episodeId:'episode_ql412_001',samples:[
    {observationId:'observe_ql412_001',service:'hub_api_8765',observedAt:'2026-11-10T17:59:00.000Z',reachable:true,latencyMs:10},
    {observationId:'observe_ql412_002',service:'hub_api_8765',observedAt:capturedAt,reachable:false,latencyMs:2000}]};
const signed={payload,signature:sign(null,Buffer.from(JSON.stringify(payload)),privateKey).toString('base64')};
const ledger=()=>openQl412DurableReplayLedger(mkdtempSync(join(tmpdir(),'ql412-ledger-')));
const opts=(store)=>({enrollment:candidate(),ledger:store,expectedRevision:revision,
  nowMs:Date.parse('2026-11-10T18:01:00.000Z'),aiDataControllerRevision:controller});

test('QL412 enrollment requires independent owner approval, host and digest',()=>{
  assert.equal(candidate().state,'CANDIDATE_REVIEWED');
  assert.equal(reviewQl412SignerCandidate({spkiBase64:pin,independentSha256:digest,
    originalHost:'TEMPLAR',sourceRevision:revision,independentOwnerApproval:true}).state,'HOLD');
  assert.equal(reviewQl412SignerCandidate({spkiBase64:pin,independentSha256:'0'.repeat(64),
    originalHost:'DESKTOP-AE894KC',sourceRevision:revision,independentOwnerApproval:true}).state,'HOLD');
  assert.equal(reviewQl412SignerCandidate({spkiBase64:pin,independentSha256:digest,
    originalHost:'DESKTOP-AE894KC',sourceRevision:revision,independentOwnerApproval:false}).state,'HOLD');
});
test('QL412 replay evidence persists across reopened ledger; duplicates fail closed',()=>{
  const directory=mkdtempSync(join(tmpdir(),'ql412-persistent-'));
  const first=openQl412DurableReplayLedger(directory);
  assert.equal(reviewQl412ThreeMasterTelemetry(signed,opts(first)).telemetry,'SIGNED_SOURCE_METADATA_VERIFIED');
  const reopened=openQl412DurableReplayLedger(directory);
  assert.equal(reviewQl412ThreeMasterTelemetry(signed,opts(reopened)).reason,'REPLAYED_EPISODE');
  assert.throws(()=>reopened.add('rosevear-ai-hub:episode_ql412_001'),{code:'EEXIST'});
});
test('QL412 malformed and stale evidence remains HOLD without granting receiver',()=>{
  const store=ledger();
  assert.equal(reviewQl412ThreeMasterTelemetry(signed,{...opts(store),
    aiDataControllerRevision:'0'.repeat(40)}).state,'HOLD');
  assert.equal(reviewQl412ThreeMasterTelemetry(signed,{...opts(store),
    nowMs:Date.parse('2026-11-10T19:00:00.000Z')}).state,'HOLD');
  assert.equal(reviewQl412ThreeMasterTelemetry(signed,opts(store)).connection,'HOLD');
  assert.equal(reviewQl412ThreeMasterTelemetry(signed,opts(ledger())).receiver,'OFF');
});
test('QL412 reviewed incidents never execute Windows recovery or open slave gate',()=>{
  const incident=reviewQl412ThreeMasterTelemetry(signed,opts(ledger())).incidents[0];
  const decision={sourceId:'rosevear-ai-hub',correlationKey:incident.correlationKey,
    status:'ACKNOWLEDGED'};
  const accepted=reviewQl412IncidentAcceptance(incident,decision,{ownerAuthorized:true,
    independentReviewer:'jack_review_001',sourceRevision:revision});
  assert.equal(accepted.incidentAcceptance,'SUPERVISED_READ_ONLY_ACCEPTANCE');
  assert.equal(accepted.connection,'HOLD');
  assert.equal(accepted.receiver,'OFF');
  assert.equal(reviewQl412IncidentAcceptance(incident,decision,{ownerAuthorized:false,
    independentReviewer:'jack_review_001',sourceRevision:revision}).incidentAcceptance,'HOLD');
});
