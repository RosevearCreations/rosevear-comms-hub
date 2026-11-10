import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,sign} from 'node:crypto';
import {reviewQl411ProtectedTelemetry,reviewQl411IncidentAcknowledgement}
  from './ql411-protected-telemetry.mjs';

const {publicKey,privateKey}=generateKeyPairSync('ed25519');
const pin=publicKey.export({format:'der',type:'spki'}).toString('base64');
const revision='a'.repeat(40);
const now=Date.parse('2026-11-10T17:00:00.000Z');
const payload={schema:'rosevear.ql411.ree-telemetry.v1',
  sourceId:'rosevear-ai-hub',hostId:'DESKTOP-AE894KC',sourceRevision:revision,
  capturedAt:'2026-11-10T16:59:00.000Z',episodeId:'episode_ql411_001',samples:[
    {observationId:'observe_api_001',service:'hub_api_8765',observedAt:'2026-11-10T16:58:00.000Z',reachable:true,latencyMs:12},
    {observationId:'observe_api_002',service:'hub_api_8765',observedAt:'2026-11-10T16:59:00.000Z',reachable:false,latencyMs:1200},
    {observationId:'observe_caddy_001',service:'hub_caddy_8443',observedAt:'2026-11-10T16:58:00.000Z',reachable:true,latencyMs:13},
    {observationId:'observe_caddy_002',service:'hub_caddy_8443',observedAt:'2026-11-10T16:59:00.000Z',reachable:true,latencyMs:11}]};
const envelope=(p=payload)=>({payload:p,
  signature:sign(null,Buffer.from(JSON.stringify(p)),privateKey).toString('base64')});
const options=()=>({publicKeySpkiBase64:pin,replayStore:new Set(),
  nowMs:now,expectedRevision:revision});

test('QL411 denies any un-enrolled or untrusted telemetry without side effects',()=>{
  assert.equal(reviewQl411ProtectedTelemetry(envelope()).reason,'PROTECTED_AUTHORITY_UNAVAILABLE');
  assert.equal(reviewQl411ProtectedTelemetry(envelope(),{...options(),publicKeySpkiBase64:''}).verified,false);
});
test('QL411 verifies source-bound original host signed metadata and produces bounded uptime models',()=>{
  const accepted=reviewQl411ProtectedTelemetry(envelope(),options());
  assert.equal(accepted.state,'VERIFIED_TELEMETRY_ONLY');
  assert.equal(accepted.connection,'HOLD');
  assert.equal(accepted.receiverEnabled,false);
  assert.equal(accepted.oneTestAuthorized,false);
  assert.deepEqual(accepted.readModel.find(r=>r.service==='hub_api_8765'),{
    service:'hub_api_8765',status:'DOWN',uptimePercent:50,observations:2});
  assert.equal(accepted.readModel.find(r=>r.service==='hub_client_5173').uptimePercent,null);
  assert.equal(accepted.incidents.length,1);
  assert.equal(accepted.incidents[0].sourceId,'rosevear-ai-hub');
});
test('QL411 rejects replay, stale, wrong source/host/revision and tampered signatures',()=>{
  const cfg=options(),signed=envelope();
  assert.equal(reviewQl411ProtectedTelemetry(signed,cfg).verified,true);
  assert.equal(reviewQl411ProtectedTelemetry(signed,cfg).reason,'REPLAYED_EPISODE');
  assert.equal(reviewQl411ProtectedTelemetry(signed,{...options(),nowMs:now+600_000}).reason,'STALE_OR_FUTURE_TELEMETRY');
  for(const p of [{...payload,sourceId:'yw'},
    {...payload,hostId:'TEMPLAR'},
    {...payload,sourceRevision:'b'.repeat(40)},
    {...payload,secret:'private'},
    {...payload,samples:[payload.samples[0],payload.samples[0]]}]){
    assert.equal(reviewQl411ProtectedTelemetry(envelope(p),options()).verified,false);
  }
  assert.equal(reviewQl411ProtectedTelemetry({...signed,payload:{...payload,sourceId:'yw'}},options()).verified,false);
  assert.equal(reviewQl411ProtectedTelemetry({...signed,signature:'bad'},options()).verified,false);
});
test('QL411 incident acknowledgement remains a source-scoped operator claim only',()=>{
  const incident=reviewQl411ProtectedTelemetry(envelope(),options()).incidents[0];
  const good=reviewQl411IncidentAcknowledgement(incident,{
    correlationKey:incident.correlationKey,sourceId:incident.sourceId,
    decision:'ACKNOWLEDGED',operatorReference:'operator_001'});
  assert.equal(good.status,'ACKNOWLEDGED');
  assert.equal(good.acknowledgement,'OPERATOR_CLAIM_ONLY');
  assert.equal(good.connection,'HOLD');
  assert.equal(reviewQl411IncidentAcknowledgement(incident,{
    correlationKey:incident.correlationKey,sourceId:'yw',decision:'ACKNOWLEDGED',
    operatorReference:'operator_001'}).status,'OPEN_UNACKNOWLEDGED');
});
