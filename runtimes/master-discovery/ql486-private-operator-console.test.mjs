import {test} from 'node:test';
import assert from 'node:assert/strict';
import {QL485_SOURCE_IDS} from './ql485-signed-release-negotiation.mjs';
import {createQl486PrivateOperatorRead,createQl486PrivateOperatorHttpsServer,
 QL486_CONSOLE_PATH,QL486_CONSOLE_JSON_PATH,QL486_CONSOLE_BOUNDARY}
 from './ql486-private-operator-console.mjs';

const cert='a'.repeat(64),other='b'.repeat(64);
function fakeRegistry(){
 return {summary:()=>({state:'PRIVATE_OPERATOR_REGISTRY_READ_ONLY_HELD',
  sourceCount:6,registryDigest:'c'.repeat(64),
  sources:Object.fromEntries(QL485_SOURCE_IDS.map(id=>[id,{
   state:'SOURCE_ATTESTATION_NOT_ENROLLED',
   approvedRevision:'1'.repeat(40),sourceRevision:null,
   contractVersion:null,evidenceDigest:null,
   originalRuntimeVerified:false,sourceConnected:false}]))})};
}
test('QL486 private console requires verified client cert and exact source-specific operator role',()=>{
 const reader=createQl486PrivateOperatorRead({registry:fakeRegistry(),acl:{
  [cert]:{operatorId:'ree-operator',role:'contract-reviewer',sources:['yw','icamp']}},
  now:()=>Date.UTC(2026,10,22,20,0)});
 assert.equal(reader.read({authorized:false,certificateFingerprint256:cert}).status,401);
 assert.equal(reader.read({authorized:true,certificateFingerprint256:other}).status,401);
 const response=reader.read({authorized:true,certificateFingerprint256:cert});
 assert.equal(response.status,200);
 assert.equal(response.body.visibleSources,2);
 assert.deepEqual(Object.keys(response.body.sources).sort(),['icamp','yw']);
 assert.equal(response.body.productionAcceptance,false);
 assert.equal(response.body.fieldAcceptance.startsWith('HOLD'),true);
 const html=reader.read({authorized:true,certificateFingerprint256:cert,format:'html'});
 assert.equal(html.status,200);
 assert.ok(html.body.includes('Six-application contract compatibility'));
 assert.ok(html.body.includes('SOURCE_ATTESTATION_NOT_ENROLLED'));
 assert.equal(html.body.includes('<script'),false);
 assert.equal(reader.mode,'PRIVATE_MUTUAL_TLS_READ_ONLY_COMPATIBILITY_CONSOLE');
 assert.equal(reader.publicRoute,false);
});
test('QL486 rejects tenant/source wildcard and unpinned/operator-reader role drift',()=>{
 for(const entry of [
  {operatorId:'ree-operator',role:'owner',sources:['yw']},
  {operatorId:'ree-operator',role:'contract-reviewer',sources:['*']},
  {operatorId:'ree-operator',role:'contract-reviewer',sources:['yw','yw']},
  {operatorId:'bad!',role:'contract-reviewer',sources:['yw']},
  {operatorId:'ree-operator',role:'contract-reviewer',sources:['yw'],tenant:'*'}
 ]){
  assert.throws(()=>createQl486PrivateOperatorRead({
   registry:fakeRegistry(),acl:{[cert]:entry}
  }),/QL486_EXACT_SCOPED_OPERATOR_CERTIFICATE_ROLE_REQUIRED/);
 }
 assert.throws(()=>createQl486PrivateOperatorRead({
  registry:fakeRegistry(),acl:{[other.toUpperCase()]:{
   operatorId:'ree-operator',role:'contract-reviewer',sources:['yw']}}
 }),/QL486_EXACT_SCOPED_OPERATOR_CERTIFICATE_ROLE_REQUIRED/);
});
test('QL486 operator output escapes untrusted content, and corrupt registry is a HOLD',()=>{
 const tainted={summary:()=>{const r=fakeRegistry().summary();
  r.sources.yw.state='<img src=x onerror=alert(1)>';return r}};
 const reader=createQl486PrivateOperatorRead({registry:tainted,acl:{
  [cert]:{operatorId:'ree-operator',role:'contract-reviewer',sources:['yw']}}});
 const content=reader.read({authorized:true,certificateFingerprint256:cert,format:'html'}).body;
 assert.equal(content.includes('<img src=x'),false);
 assert.ok(content.includes('&lt;img'));
 const invalid=createQl486PrivateOperatorRead({registry:{summary:()=>({state:'HOLD'})},acl:{
  [cert]:{operatorId:'ree-operator',role:'contract-reviewer',sources:['yw']}}});
 assert.equal(invalid.read({authorized:true,certificateFingerprint256:cert}).status,503);
});
test('QL486 HTTPS console has no autonomous listener, only exact protected paths',()=>{
 assert.throws(()=>createQl486PrivateOperatorHttpsServer(),/QL486_PRIVATE_TLS_CA/);
 // The TLS constructor requires an actual independently provisioned PEM
 // certificate. Never use fake bytes as a substitute for private owner keys.
 assert.equal(typeof createQl486PrivateOperatorHttpsServer,'function');
 assert.throws(()=>createQl486PrivateOperatorHttpsServer({tlsOptions:{
  key:'not-a-key',cert:'not-a-cert',ca:'not-a-ca'}}),
  /QL486_PRIVATE_TLS_CA_AND_OPERATOR_READER_REQUIRED/);
 assert.equal(QL486_CONSOLE_PATH,'/internal/comms/ql486/operator/contracts');
 assert.equal(QL486_CONSOLE_JSON_PATH,'/internal/comms/ql486/operator/contracts.json');
 assert.equal(QL486_CONSOLE_BOUNDARY.publicRoute,false);
 assert.equal(QL486_CONSOLE_BOUNDARY.autoListen,false);
});
