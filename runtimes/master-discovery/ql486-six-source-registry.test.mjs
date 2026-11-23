import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,sign,createHash} from 'node:crypto';
import {mkdtempSync,readdirSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {canonicalize,SOURCES} from './manifest.mjs';
import {QL485_SOURCE_IDS,QL485_SCHEMA} from './ql485-signed-release-negotiation.mjs';
import {QL486_SOURCE,QL486_OWNER,QL486_REVIEW,QL486_BOUNDARY,
 createQl486SixSourceRegistry} from './ql486-six-source-registry.mjs';
const T=Date.now()-1000,rev='a'.repeat(40),futureRev='b'.repeat(40);
const KEY=Object.fromEntries(QL485_SOURCE_IDS.flatMap(id=>
 [id,id+'_owner',id+'_review']).map(id=>[id,generateKeyPairSync('ed25519')]));
const pem=id=>KEY[id].publicKey.export({format:'pem',type:'spki'});
const digest=v=>createHash('sha256').update(canonicalize(v)).digest('hex');
const sig=(payload,id)=>({payload,signature:sign(null,Buffer.from(canonicalize(payload)),
 KEY[id].privateKey).toString('base64url')});
const capabilities=id=>id==='ai-data-platform'?['broker.case.review']:
 id==='rosevear-ai-hub'?['device.status.read']:['health.read'];
const schemas=id=>id==='yw'||id==='icamp'?['rosevear.comms.ql480.scoped-source-event.v1']:
 ['rosevear.comms.intake.v1'];
function trust(){
 const pins={},ownerPins={},reviewerPins={};
 for(const id of QL485_SOURCE_IDS){
  pins[id]={sourceId:id,publicKeyPem:pem(id),approvedRevision:rev,
   approvedContractVersion:'1.0.0',
   approvedEventSchemas:schemas(id),approvedCapabilities:capabilities(id),
   independentlyVerified:true,sourceOwnerApproved:true};
  ownerPins[id]=pem(id+'_owner');reviewerPins[id]=pem(id+'_review');
 }
 return {pins,ownerPins,reviewerPins};
}
function input(id,extra={}){
 const notice={schema:QL485_SCHEMA,noticeId:'notice_'+id.padEnd(8,'0'),
  sourceId:id,repository:'RosevearCreations/'+SOURCES[id].repo,
  sourceRevision:extra.newRevision??rev,
  previousRevision:extra.newRevision?rev:null,manifestMajor:1,
  contractVersion:'1.0.0',eventSchemas:schemas(id),
  capabilities:capabilities(id),tenantBoundary:SOURCES[id].boundary,
  environment:'PRIVATE_STAGING',audience:'rosevear-comms-hub:private-negotiation',
  issuedAtMs:T,expiresAtMs:T+100000,
  requestedAction:'READ_ONLY_COMPATIBILITY_REVIEW',customerDataIncluded:false,
  authorityTransfer:false};
 const noticePacket=sig(notice,id);
 const source={schema:QL486_SOURCE,
  attestationId:extra.attestationId??'attestation_'+id.padEnd(8,'0'),
  sourceId:id,repository:notice.repository,sourceRevision:notice.sourceRevision,
  noticeDigest:digest(noticePacket),evidenceDigest:'1'.repeat(64),
  deploymentInstanceId:'deployment_0000001',observedAtMs:T+5,
  originalSourceObserved:true,customerDataIncluded:false,authorityTransfer:false,
  ...(extra.source??{})};
 const sourceAttestationPacket=sig(source,extra.sourceSigner??id);
 const owner={schema:QL486_OWNER,attestationId:source.attestationId,
  sourceId:id,sourceAttestationDigest:digest(sourceAttestationPacket),
  sourceRevision:source.sourceRevision,ownerId:'owner_reviewer_0001',
  ownerWitnessDigest:'2'.repeat(64),witnessedAtMs:T+15,
  physicalSourceClaimed:true,customerDataIncluded:false,authorityTransfer:false,
  ...(extra.owner??{})};
 const ownerPacket=sig(owner,extra.ownerSigner??id+'_owner');
 const reviewer={schema:QL486_REVIEW,attestationId:source.attestationId,
  sourceId:id,sourceAttestationDigest:digest(sourceAttestationPacket),
  ownerPacketDigest:digest(ownerPacket),reviewerId:'external_reviewer_0001',
  reviewedAtMs:T+25,independentRuntimeObservation:true,
  customerDataReviewed:false,authorityTransfer:false,
  ...(extra.review??{})};
 const reviewerPacket=sig(reviewer,extra.reviewerSigner??id+'_review');
 return {sourceId:id,noticePacket,sourceAttestationPacket,
  ownerPacket,reviewerPacket};
}
function fixture(ctx,trustOverride={}){
 const dir=mkdtempSync(join(tmpdir(),'ql486-source-'));
 ctx.after(()=>rmSync(dir,{recursive:true,force:true}));
 const props={...trust(),...trustOverride};
 const instance=()=>createQl486SixSourceRegistry({
  directory:join(dir,'registry'),...props,now:()=>T+100});
 return {dir,instance,props};
}
test('QL486 all six sources cryptographically correlate into isolated durable registry, never live acceptance',ctx=>{
 const f=fixture(ctx),registry=f.instance();
 assert.equal(registry.summary().sourceCount,6);
 assert.equal(registry.summary().sources.yw.state,'SOURCE_ATTESTATION_NOT_ENROLLED');
 for(const id of QL485_SOURCE_IDS){
  const result=registry.commit(input(id));
  assert.equal(result.state,'DURABLE_PINNED_SOURCE_REVISION_CLAIM_RECORDED_HELD',JSON.stringify(result));
  assert.equal(result.durableReadback,true);
  assert.equal(result.originalRuntimeVerified,false);
  assert.equal(result.productionAcceptance,false);
 }
 const result=registry.summary();
 assert.equal(result.sourceCount,6);
 assert.equal(Object.keys(result.sources).length,6);
 assert.equal(result.sources.icamp.sourceRevision,rev);
 assert.equal(result.sources.yw.attestationCount,1);
 assert.equal(result.originalSourceCountVerified,0);
 assert.equal(result.productionAcceptance,false);
 const restarted=f.instance();
 assert.equal(restarted.summary().registryDigest,result.registryDigest);
 assert.equal(restarted.summary().sources.yw.evidenceDigest,result.sources.yw.evidenceDigest);
 assert.equal(QL486_BOUNDARY.sourceWrites,false);
 assert.equal(registry.autoListen,false);
 assert.equal(registry.publicRoute,false);
});
test('QL486 signed source revision drift creates durable pending owner review without pin mutation',ctx=>{
 const f=fixture(ctx),r=f.instance();
 const result=r.commit(input('yw',{newRevision:futureRev}));
 assert.equal(result.state,'DURABLE_SOURCE_CONTRACT_CHANGE_PENDING_OWNER_APPROVAL');
 assert.equal(r.summary().sources.yw.approvedRevision,rev);
 assert.equal(r.summary().sources.yw.sourceRevision,futureRev);
 assert.equal(r.summary().sources.icamp.state,'SOURCE_ATTESTATION_NOT_ENROLLED');
 assert.equal(r.summary().originalSourceCountVerified,0);
});
test('QL486 rejects source impersonation, cross-scope evidence, forged reviewer, stale/changed digest',ctx=>{
 const f=fixture(ctx),r=f.instance();
 for(const variation of [
  {source:{repository:'RosevearCreations/other'}},
  {source:{sourceRevision:'c'.repeat(40)}},
  {source:{customerDataIncluded:true}},
  {source:{originalSourceObserved:false}},
  {source:{evidenceDigest:'bad'}},
  {owner:{ownerWitnessDigest:'bad'}},
  {owner:{physicalSourceClaimed:false}},
  {owner:{sourceRevision:'f'.repeat(40)}},
  {ownerSigner:'yw_review'},
  {review:{independentRuntimeObservation:false}},
  {review:{reviewerId:'owner_reviewer_0001'}},
  {review:{authorityTransfer:true}},
  {reviewerSigner:'yw_owner'},
  {sourceSigner:'icamp'}
 ]){
  const packet=input('yw',variation);
  assert.equal(r.commit(packet).state,'HOLD',JSON.stringify(variation));
 }
 assert.equal(r.summary().sources.yw.attestationCount,0);
});
test('QL486 anti-replay, changed attestation ID, durable chain revision and tamper hold',ctx=>{
 const f=fixture(ctx),r=f.instance();
 const p=input('yw');
 assert.equal(r.commit(p).state,'DURABLE_PINNED_SOURCE_REVISION_CLAIM_RECORDED_HELD');
 assert.equal(r.commit(p).state,'DURABLE_ATTESTATION_REPLAY_HELD');
 const modified=input('yw',{source:{evidenceDigest:'3'.repeat(64)}});
 assert.equal(r.commit(modified).reason,'QL486_ATTESTATION_ID_REUSED_WITH_DIFFERENT_EVIDENCE');
 const second=input('yw',{attestationId:'attestation_yw_00002'});
 assert.equal(r.commit(second).sequence,2);
 assert.equal(f.instance().summary().sources.yw.attestationCount,2);
 const file=join(f.dir,'registry','yw.ndjson');
 writeFileSync(file,readFileSync(file,'utf8').replace('PINNED_SOURCE_REVISION_CLAIM_RECORDED_HELD','FALSELY_ACCEPTED'));
 assert.equal(r.summary().sources.yw.state,'PRIVATE_SOURCE_ATTESTATION_TAMPER_HOLD');
 assert.equal(r.commit(input('yw',{attestationId:'attestation_yw_00003'})).state,'HOLD');
});
test('QL486 requires six independent source keys and separate owner and reviewer trust anchors',ctx=>{
 const f=fixture(ctx),t=f.props;
 assert.throws(()=>createQl486SixSourceRegistry({directory:join(f.dir,'bad'),
  ...t,ownerPins:{...t.ownerPins,yw:t.pins.yw.publicKeyPem}}),/QL486_SIX_INDEPENDENT/);
 assert.throws(()=>createQl486SixSourceRegistry({directory:join(f.dir,'bad'),
  ...t,pins:{...t.pins,icamp:{...t.pins.icamp,publicKeyPem:t.pins.yw.publicKeyPem}}}),/QL486_SIX_INDEPENDENT/);
});
