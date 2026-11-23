import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,sign,createHash} from 'node:crypto';
import {mkdtempSync,rmSync,readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {canonicalize,SOURCES} from './manifest.mjs';
import {QL485_SCHEMA,QL485_SOURCE_IDS} from './ql485-signed-release-negotiation.mjs';
import {QL486_SOURCE,QL486_OWNER,QL486_REVIEW,
 createQl486SixSourceRegistry} from './ql486-six-source-registry.mjs';
import {QL489_EXCEPTION_SCHEMA,createQl489LiveCapture} from './ql489-live-source-capture.mjs';
import {createQl489EvidenceJournal} from './ql489-evidence-journal.mjs';
const at=Date.now(),revision='a'.repeat(40),HEX='3'.repeat(64);
const names=QL485_SOURCE_IDS.flatMap(x=>[x,x+'_owner',x+'_review',x+'_operator',x+'_independent']);
const keys=Object.fromEntries([...names,'windows_host'].map(x=>[x,generateKeyPairSync('ed25519')]));
const pem=id=>keys[id].publicKey.export({type:'spki',format:'pem'});
const hash=x=>createHash('sha256').update(canonicalize(x)).digest('hex');
const sig=(payload,id)=>({payload,signature:sign(null,Buffer.from(canonicalize(payload)),
 keys[id].privateKey).toString('base64url')});
const cap=id=>id==='ai-data-platform'?['broker.case.review']:
 id==='rosevear-ai-hub'?['device.status.read']:['health.read'];
const schemas=id=>['yw','icamp'].includes(id)?
 ['rosevear.comms.ql480.scoped-source-event.v1']:['rosevear.comms.intake.v1'];
const pins=Object.fromEntries(QL485_SOURCE_IDS.map(id=>[id,{
 sourceId:id,publicKeyPem:pem(id),approvedRevision:revision,approvedContractVersion:'1.0.0',
 approvedEventSchemas:schemas(id),approvedCapabilities:cap(id),
 independentlyVerified:true,sourceOwnerApproved:true
}]));
const ownerPins=Object.fromEntries(QL485_SOURCE_IDS.map(id=>[id,pem(id+'_owner')]));
const reviewerPins=Object.fromEntries(QL485_SOURCE_IDS.map(id=>[id,pem(id+'_review')]));
const exceptionPins=Object.fromEntries(QL485_SOURCE_IDS.map(id=>[id,{
 operatorPublicKeyPem:pem(id+'_operator'),reviewerPublicKeyPem:pem(id+'_independent')
}]));
const endpoints=Object.fromEntries(QL485_SOURCE_IDS.map((id,i)=>[id,{
 sourceId:id,url:'https://source'+i+'.private.example/internal/comms/source-release',
 serverCertificateSha256:hash('endpoint-'+id),caPem:'CA_'+'.'.repeat(75),
 clientCertificatePem:'CERT_'+'.'.repeat(75),clientKeyPem:'KEY_'+'.'.repeat(75)
}]));
function bundle(id){
 const n={schema:QL485_SCHEMA,noticeId:'notice_'+id.padEnd(8,'0'),sourceId:id,
  repository:'RosevearCreations/'+SOURCES[id].repo,sourceRevision:revision,
  previousRevision:null,manifestMajor:1,contractVersion:'1.0.0',
  eventSchemas:schemas(id),capabilities:cap(id),tenantBoundary:SOURCES[id].boundary,
  environment:'PRIVATE_STAGING',audience:'rosevear-comms-hub:private-negotiation',
  issuedAtMs:at-2000,expiresAtMs:at+100000,
  requestedAction:'READ_ONLY_COMPATIBILITY_REVIEW',customerDataIncluded:false,authorityTransfer:false};
 const noticePacket=sig(n,id);
 const s={schema:QL486_SOURCE,attestationId:'attestation_'+id.padEnd(8,'0'),
  sourceId:id,repository:n.repository,sourceRevision:revision,
  noticeDigest:hash(noticePacket),evidenceDigest:HEX,
  deploymentInstanceId:'deployment_00000001',observedAtMs:at-1000,
  originalSourceObserved:true,customerDataIncluded:false,authorityTransfer:false};
 const sourceAttestationPacket=sig(s,id);
 const o={schema:QL486_OWNER,attestationId:s.attestationId,sourceId:id,
  sourceAttestationDigest:hash(sourceAttestationPacket),sourceRevision:revision,
  ownerId:'owner_reviewer_0001',ownerWitnessDigest:HEX,witnessedAtMs:at-900,
  physicalSourceClaimed:true,customerDataIncluded:false,authorityTransfer:false};
 const ownerPacket=sig(o,id+'_owner');
 const r={schema:QL486_REVIEW,attestationId:s.attestationId,sourceId:id,
  sourceAttestationDigest:hash(sourceAttestationPacket),
  ownerPacketDigest:hash(ownerPacket),reviewerId:'external_reviewer_0001',
  reviewedAtMs:at-800,independentRuntimeObservation:true,
  customerDataReviewed:false,authorityTransfer:false};
 return {sourceId:id,noticePacket,sourceAttestationPacket,ownerPacket,
  reviewerPacket:sig(r,id+'_review')};
}
function fixture(ctx,changes={}){
 const dir=mkdtempSync(join(tmpdir(),'ql489-private-'));
 ctx.after(()=>rmSync(dir,{recursive:true,force:true}));
 const registry=createQl486SixSourceRegistry({directory:join(dir,'registry'),
  pins,ownerPins,reviewerPins,now:()=>at});
 const journal=createQl489EvidenceJournal({directory:join(dir,'journal'),now:()=>at});
 let probes=0;
 const capture=createQl489LiveCapture({endpoints,pins,exceptionPins,
  windowsHostPublicKeyPem:pem('windows_host'),registry,journal,now:()=>at,
  transport:changes.transport??(async entry=>{
   probes++;return {state:'MUTUAL_TLS_TRANSPORT_OBSERVED_UNVERIFIED',
    sourceId:entry.sourceId,bundle:bundle(entry.sourceId)}
  }),signWitness:changes.signWitness??(async p=>sig(p,'windows_host'))});
 return {dir,registry,journal,capture,probes:()=>probes};
}
test('manual-only scope rejects automatic or unknown source without network',async ctx=>{
 const f=fixture(ctx);
 assert.equal((await f.capture.captureOne('yw')).state,'HOLD');
 assert.equal((await f.capture.captureOne('unknown',{supervised:true})).state,'HOLD');
 assert.equal(f.probes(),0);
 assert.equal(f.capture.autoPoll,false);assert.equal(f.capture.publicRoute,false);
});
test('all six independently signed private mTLS observations create six durable HOLD captures',async ctx=>{
 const f=fixture(ctx);
 for(const id of QL485_SOURCE_IDS){
  const r=await f.capture.captureOne(id,{supervised:true});
  assert.equal(r.state,'DURABLE_SIGNED_LIVE_CAPTURE_HELD',JSON.stringify(r));
  assert.equal(r.originalWindowsPhysicallyCertified,false);
 }
 assert.equal(f.probes(),6);assert.equal(f.journal.summary().records,6);
 assert.equal(f.registry.summary().originalSourceCountVerified,0);
 for(const id of QL485_SOURCE_IDS)assert.equal(f.journal.summary().sources[id].captures,1);
 assert.equal((await f.capture.captureOne('yw',{supervised:true})).state,'HOLD');
});
test('wrong Windows witness signer and cross-source transport cannot attest',async ctx=>{
 const a=fixture(ctx,{signWitness:async p=>sig(p,'yw')});
 assert.equal((await a.capture.captureOne('yw',{supervised:true})).state,'HOLD');
 assert.equal(a.journal.summary().records,0);
 const b=fixture(ctx,{transport:async()=>({
  state:'MUTUAL_TLS_TRANSPORT_OBSERVED_UNVERIFIED',sourceId:'icamp',bundle:bundle('icamp')})});
 assert.equal((await b.capture.captureOne('yw',{supervised:true})).state,'HOLD');
});
function exception(digest,change={}){
 const base={schema:QL489_EXCEPTION_SCHEMA,caseId:'case_00001',sourceId:'yw',
  captureRecordDigest:digest,reasonCode:'SOURCE_EXCEPTION_REVIEW',
  disposition:'CLOSED_FOR_OPERATOR_REVIEW_HELD',role:'operator',
  actorId:'operator_00001',issuedAtMs:at-10,expiresAtMs:at+60000,
  authorityTransfer:false};
 return {sourceId:'yw',captureRecordDigest:digest,
  operatorPacket:sig({...base,...change.operator},change.opSigner??'yw_operator'),
  reviewerPacket:sig({...base,role:'independent-reviewer',
   actorId:'reviewer_00001',...change.reviewer},change.revSigner??'yw_independent')};
}
test('exception closure requires two fresh independent signatures and tamper-free custody',async ctx=>{
 const f=fixture(ctx),r=await f.capture.captureOne('yw',{supervised:true});
 assert.equal(r.state,'DURABLE_SIGNED_LIVE_CAPTURE_HELD');
 const input=exception(r.captureRecordDigest);
 assert.equal(f.capture.closeException(input).state,'DURABLE_SIGNED_EXCEPTION_CLOSED_HELD');
 assert.equal(f.capture.closeException(input).state,'DURABLE_EXCEPTION_CLOSURE_REPLAY_HELD');
 assert.equal(f.capture.closeException(exception(r.captureRecordDigest,
  {revSigner:'yw_operator'})).state,'HOLD');
 assert.equal(f.capture.closeException(exception(r.captureRecordDigest,
  {reviewer:{authorityTransfer:true}})).state,'HOLD');
 const path=join(f.dir,'journal','ql489-capture-exceptions.ndjson');
 writeFileSync(path,readFileSync(path,'utf8').replace('CAPTURE','FORGED_'));
 assert.equal(f.journal.summary().state,'HOLD');
 assert.equal(f.capture.closeException(input).state,'HOLD');
});
test('original Windows CLI CI status does not validate any source',()=>{
 const script=fileURLToPath(new URL('./ql489-original-host-cli.mjs',import.meta.url));
 const status=JSON.parse(execFileSync(process.execPath,[script,'--status'],{encoding:'utf8'}));
 assert.equal(status.state,'QL489_OFF_BY_DEFAULT');
 assert.equal(status.liveSourcesConfirmed,0);
 if(process.platform!=='win32'||process.env.CI==='true')
  assert.throws(()=>execFileSync(process.execPath,[script,'--capture','x','yw','x'],
   {stdio:'pipe'}));
});
