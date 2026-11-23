import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,sign,createHash} from 'node:crypto';
import {canonicalize,SOURCES} from './manifest.mjs';
import {QL485_SCHEMA,QL485_SOURCE_IDS} from './ql485-signed-release-negotiation.mjs';
import {classifyQl487Drift,createQl487SupervisedSync,QL487_DECISION_SCHEMA} from './ql487-supervised-sync.mjs';
const at=Date.now(),revision='a'.repeat(40);
const keys=generateKeyPairSync('ed25519'),operator=generateKeyPairSync('ed25519');
const signPacket=(payload,key=keys.privateKey)=>({payload,signature:sign(null,Buffer.from(canonicalize(payload)),key).toString('base64url')});
const pins={yw:{sourceId:'yw',publicKeyPem:keys.publicKey.export({type:'spki',format:'pem'}),
 approvedRevision:revision,approvedContractVersion:'1.0.0',
 approvedEventSchemas:['rosevear.comms.ql480.scoped-source-event.v1'],
 approvedCapabilities:['health.read'],independentlyVerified:true,sourceOwnerApproved:true}};
function notice(rev=revision){
 return signPacket({schema:QL485_SCHEMA,noticeId:'ql487_notice_00001',sourceId:'yw',
 repository:'RosevearCreations/'+SOURCES.yw.repo,sourceRevision:rev,
 previousRevision:null,manifestMajor:1,contractVersion:'1.0.0',
 eventSchemas:pins.yw.approvedEventSchemas,capabilities:pins.yw.approvedCapabilities,
 tenantBoundary:SOURCES.yw.boundary,environment:'PRIVATE_STAGING',
 audience:'rosevear-comms-hub:private-negotiation',issuedAtMs:at-100,
 expiresAtMs:at+100000,requestedAction:'READ_ONLY_COMPATIBILITY_REVIEW',
 customerDataIncluded:false,authorityTransfer:false});
}
const sources=()=>Object.fromEntries(QL485_SOURCE_IDS.map(id=>[id,{
 state:'SOURCE_ATTESTATION_NOT_ENROLLED',approvedRevision:revision,sourceRevision:null,
 approvedContractVersion:'1.0.0',contractVersion:null,attestationCount:0}]));
function registry(){
 const state={state:'PRIVATE_OPERATOR_REGISTRY_READ_ONLY_HELD',sources:sources(),
 registryDigest:'a'.repeat(64)};
 return {summary:()=>structuredClone(state),
  commit:()=>({state:'DURABLE_PINNED_SOURCE_REVISION_CLAIM_RECORDED_HELD',
   recordDigest:'b'.repeat(64),sequence:1})};
}
function sync(fetchSource,reg=registry()){
 return createQl487SupervisedSync({registry:reg,pins,fetchSource,
 operatorPins:{yw:operator.publicKey.export({type:'spki',format:'pem'})},now:()=>at});
}
test('QL487 signed metadata categorizes missing attestation as HOLD with no authority',()=>{
 const n=notice();
 const result=classifyQl487Drift({sourceId:'yw',observedRevision:revision,
 registry:registry(),pins,noticePacket:n,nowMs:at});
 assert.equal(result.state,'OPERATOR_REVIEW_HOLD');
 assert.deepEqual(result.reasons,['NO_DURABLE_ATTESTATION']);
 assert.equal(result.productionAcceptance,false);
 assert.equal(result.automaticMerge,false);
});
test('QL487 cannot sync unless individually supervised, and never starts polling',async()=>{
 const s=sync(async()=>{throw Error('must not fetch')});
 assert.equal((await s.observe('yw')).state,'HOLD');
 assert.equal((await s.sweep({supervised:false,sourceIds:['yw']})).state,'HOLD');
 assert.equal((await s.sweep({supervised:true,sourceIds:['yw','yw']})).state,'HOLD');
 assert.equal(s.automaticPolling,false);
 assert.equal(s.publicRoute,false);
});
test('QL487 valid private bundle delegates cryptographic and journal verification to QL486',async()=>{
 const s=sync(async id=>({sourceId:id,noticePacket:notice(),
  sourceAttestationPacket:{},ownerPacket:{},reviewerPacket:{}}));
 const result=await s.observe('yw',{supervised:true});
 assert.equal(result.state,'SUPERVISED_PRIVATE_SYNC_RECORDED_HELD');
 assert.equal(result.sourceConnected,false);
 assert.deepEqual(result.drift,['NO_DURABLE_ATTESTATION']);
 const sweep=await s.sweep({supervised:true,sourceIds:['yw']});
 assert.equal(sweep.state,'SUPERVISED_SWEEP_FINISHED_HELD');
 assert.equal(sweep.sourceConnectionsVerified,0);
});
test('QL487 transport errors and signature or source mismatch fail closed',async()=>{
 const failed=sync(async()=>{throw Error('network')});
 assert.equal((await failed.observe('yw',{supervised:true})).reason,'QL487_PRIVATE_SOURCE_UNREACHABLE');
 const mismatched=sync(async()=>({sourceId:'icamp',noticePacket:notice(),
  sourceAttestationPacket:{},ownerPacket:{},reviewerPacket:{}}));
 assert.equal((await mismatched.observe('yw',{supervised:true})).state,'HOLD');
 const badSignature=notice();badSignature.signature='A'.repeat(86);
 assert.equal(classifyQl487Drift({sourceId:'yw',observedRevision:revision,
 registry:registry(),pins,noticePacket:badSignature,nowMs:at}).state,'HOLD');
});
test('QL487 operator decisions must be fresh separately signed and cannot authorize source',()=>{
 const n=notice(),noticeDigest=createHash('sha256').update(canonicalize(n)).digest('hex');
 const s=sync(async()=>null),p={schema:QL487_DECISION_SCHEMA,
 decisionId:'decision_00001',sourceId:'yw',observedRevision:revision,
 approvedRevision:revision,registryDigest:'a'.repeat(64),
 noticeDigest,decision:'ACKNOWLEDGE_HOLD',
 operatorId:'operator_00001',issuedAtMs:at-10,expiresAtMs:at+60000,
 authorityTransfer:false};
 assert.equal(s.reconcile(signPacket(p)).state,'HOLD');
 assert.equal(s.reconcile(signPacket(p,operator.privateKey),{noticePacket:n}).state,'HOLD');
 const reg=registry();reg.summary=()=>({state:'PRIVATE_OPERATOR_REGISTRY_READ_ONLY_HELD',
  registryDigest:'a'.repeat(64),sources:{...sources(),
   yw:{...sources().yw,sourceRevision:revision}}});
 const result=sync(async()=>null,reg).reconcile(signPacket(p,operator.privateKey),{noticePacket:n});
 assert.equal(result.state,'OPERATOR_DECISION_RECORDED_IN_MEMORY_HOLD');
 assert.equal(result.automaticMerge,false);
 assert.equal(result.authorityTransfer,false);
});
