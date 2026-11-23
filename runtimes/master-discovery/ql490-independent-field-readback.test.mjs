import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,sign,createHash} from 'node:crypto';
import {mkdtempSync,rmSync,readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {canonicalize} from './manifest.mjs';
import {QL485_SOURCE_IDS} from './ql485-signed-release-negotiation.mjs';
import {createQl489EvidenceJournal} from './ql489-evidence-journal.mjs';
import {QL490_EXCEPTION_OPEN_SCHEMA,
 readQl490PrivateFieldEvidence} from './ql490-independent-field-readback.mjs';
import {QL490_DRILL_SCHEMA,createQl490DrillJournal,
 createQl490SupervisedRecoveryDrill} from './ql490-supervised-recovery-drill.mjs';

const at=Date.now();
const pairs=Object.fromEntries(QL485_SOURCE_IDS.flatMap(id=>[
 id+'_operator',id+'_reviewer']).concat(['recovery_owner','recovery_reviewer','impostor'])
 .map(name=>[name,generateKeyPairSync('ed25519')]));
const pem=name=>pairs[name].publicKey.export({type:'spki',format:'pem'});
const sig=(payload,name)=>({payload,signature:sign(null,
 Buffer.from(canonicalize(payload)),pairs[name].privateKey).toString('base64url')});
const sha=x=>createHash('sha256').update(typeof x==='string'?x:canonicalize(x)).digest('hex');
const exceptionPins=Object.fromEntries(QL485_SOURCE_IDS.map(id=>[id,{
 operatorPublicKeyPem:pem(id+'_operator'),reviewerPublicKeyPem:pem(id+'_reviewer')
}]));
function fixture(ctx,{withCaptures=false,clock=at-1000}={}){
 const root=mkdtempSync(join(tmpdir(),'ql490-test-'));
 ctx.after(()=>rmSync(root,{recursive:true,force:true}));
 let atJournal=clock;
 const evidenceDirectory=join(root,'evidence');
 const journal=createQl489EvidenceJournal({directory:evidenceDirectory,now:()=>atJournal});
 const status=Object.fromEntries(QL485_SOURCE_IDS.map(id=>[id,{
  state:'SOURCE_ATTESTATION_NOT_ENROLLED',evidenceDigest:null,
  attestationCount:0
 }]));
 const snap={state:'PRIVATE_OPERATOR_REGISTRY_READ_ONLY_HELD',sourceCount:6,
  registryDigest:sha('registry-staged-001'),sources:status};
 const registry={summary:()=>structuredClone(snap)};
 const captureDigests={};
 function addCapture(id,when=at-1000){
  atJournal=when;
  const receiptDigest=sha('source-registry-receipt-'+id+'-'+when);
  const r=journal.appendCapture({sourceId:id,receiptDigest,
   registryDigest:sha('registry-at-capture-'+id),
   witnessDigest:sha('windows-'+id+'-'+when),
   endpointFingerprint:sha('endpoint-'+id),
   bundleDigest:sha('signed-packet-'+id)});
  assert.equal(r.state,'DURABLE_SIGNED_CAPTURE_HELD',JSON.stringify(r));
  status[id]={state:'PINNED_SOURCE_REVISION_CLAIM_RECORDED_HELD',
   evidenceDigest:receiptDigest,attestationCount:1};
  captureDigests[id]=r.recordDigest;
  return r.recordDigest;
 }
 if(withCaptures)QL485_SOURCE_IDS.forEach(id=>addCapture(id));
 const read=(extras={})=>readQl490PrivateFieldEvidence({
  evidenceDirectory,registry,journal,exceptionPins,nowMs:at,...extras});
 return {root,evidenceDirectory,journal,registry,status,snap,
  captureDigests,addCapture,read,setJournalTime:x=>{atJournal=x}};
}
function openCase(captureRecordDigest,overrides={},signer='yw_operator'){
 const payload={schema:QL490_EXCEPTION_OPEN_SCHEMA,caseId:'case_ql490_00001',
  sourceId:'yw',captureRecordDigest,reasonCode:'SIGNED_RECEIPT_REVIEW',
  operatorId:'owner_operator_00001',openedAtMs:at-900,
  deadlineAtMs:at+60000,customerDataIncluded:false,authorityTransfer:false,
  ...overrides};
 return sig(payload,signer);
}
function closeCase(f,cap,when=at-100){
 f.setJournalTime(when);
 const r=f.journal.appendClosure({sourceId:'yw',caseId:'case_ql490_00001',
  captureRecordDigest:cap,operatorDigest:sha('operator-proof'),
  reviewerDigest:sha('reviewer-proof'),reasonCode:'SIGNED_RECEIPT_REVIEW'});
 assert.equal(r.state,'DURABLE_SIGNED_EXCEPTION_CLOSED_HELD');
 return r.recordDigest;
}
function drillPackets(review,sourceId='yw',overrides={}){
 const base={schema:QL490_DRILL_SCHEMA,drillId:'drill_ql490_00001',
  sourceId,readbackDigest:review.readbackDigest,
  expectedCaptureDigest:review.sources[sourceId].lastCaptureDigest,
  mode:'PRIVATE_OFFLINE_REHEARSAL',requestedAction:'VERIFY_RECOVERY_STEPS_NO_SEND',
  role:'owner',actorId:'owner_reviewer_0001',
  issuedAtMs:at-200,expiresAtMs:at+100000,customerDataIncluded:false,
  authorityTransfer:false};
 const owner={...base,...overrides.owner};
 const reviewer={...base,role:'independent-reviewer',
  actorId:'independent_reviewer_0001',...overrides.reviewer};
 return {sourceId,ownerPacket:sig(owner,overrides.ownerSigner??'recovery_owner'),
  reviewerPacket:sig(reviewer,overrides.reviewerSigner??'recovery_reviewer'),
  supervised:true};
}
function drill(f,readCurrent){
 const drillJournal=createQl490DrillJournal({directory:f.evidenceDirectory,now:()=>at});
 const instance=createQl490SupervisedRecoveryDrill({readCurrent:readCurrent??f.read,
  drillJournal,ownerPublicKeyPem:pem('recovery_owner'),
  reviewerPublicKeyPem:pem('recovery_reviewer'),now:()=>at});
 return {instance,drillJournal};
}
test('QL490 new isolated private installation reports all six missing sources as HOLD',ctx=>{
 const f=fixture(ctx),result=f.read();
 assert.equal(result.state,'PRIVATE_SIX_SOURCE_READBACK_HELD',JSON.stringify(result));
 assert.equal(result.sourceCount,6);assert.equal(result.sourceMatchCount,0);
 for(const id of QL485_SOURCE_IDS){
  assert.equal(result.sources[id].state,'SOURCE_CAPTURE_NOT_ENROLLED_HOLD');
  assert.equal(result.sources[id].originalRuntimePhysicallyVerified,false);
 }
 assert.equal(result.productionAcceptance,false);
 assert.equal(result.signerPacketsReverified,false);
});
test('QL490 independent second-parser crosschecks six signed-capture metadata digests',ctx=>{
 const f=fixture(ctx,{withCaptures:true});
 const report=f.read();
 assert.equal(report.sourceMatchCount,6,JSON.stringify(report));
 assert.equal(report.allSourcesMetadataCurrent,true);
 for(const id of QL485_SOURCE_IDS){
  assert.equal(report.sources[id].state,'SOURCE_RECEIPT_DIGEST_MATCH_HELD');
  assert.equal(report.sources[id].lastCaptureDigest,f.captureDigests[id]);
 }
 assert.equal(report.originalWindowsPhysicallyCertified,false);
 assert.equal(report.sourceAuthority,false);
});
test('QL490 modified custody chain and mismatched registry source receipt fail closed',ctx=>{
 const f=fixture(ctx,{withCaptures:true});
 f.status.yw.evidenceDigest=sha('wrong-registry');
 assert.equal(f.read().sources.yw.state,'SOURCE_REGISTRY_RECEIPT_MISMATCH_HOLD');
 f.status.yw.evidenceDigest=sha('source-registry-receipt-yw-'+(at-1000));
 assert.equal(f.read().sources.yw.state,'SOURCE_RECEIPT_DIGEST_MATCH_HELD');
 const file=join(f.evidenceDirectory,'ql489-capture-exceptions.ndjson');
 writeFileSync(file,readFileSync(file,'utf8').replace('"CAPTURE"','"IMPERSONATED"'));
 assert.equal(f.read().state,'HOLD');
});
test('QL490 signed open exception aging does not infer every capture is an incident',ctx=>{
 const f=fixture(ctx,{withCaptures:true}),cap=f.captureDigests.yw,op=openCase(cap);
 assert.equal(f.read().caseCount,0);
 const open=f.read({openCasePackets:[op]});
 assert.equal(open.caseCount,1);
 assert.equal(open.cases[0].status,'OPEN_OPERATOR_REVIEW_HOLD');
 assert.equal(f.read({openCasePackets:[op],nowMs:at+90000}).cases[0].status,
  'OVERDUE_OPERATOR_REVIEW_HOLD');
 const c=closeCase(f,cap);
 const closed=f.read({openCasePackets:[op]});
 assert.equal(closed.cases[0].status,'CLOSED_REVIEW_ONLY_HELD');
 assert.equal(closed.cases[0].closureDigest,c);
 assert.equal(closed.unmatchedClosures,0);
 assert.equal(f.read().unmatchedClosures,1);
});
test('QL490 aged source receipts and unsigned, cross-source, invalid deadline case fail closed',ctx=>{
 const f=fixture(ctx,{withCaptures:true}),cap=f.captureDigests.yw;
 assert.equal(f.read({nowMs:at+70000,receiptMaxAgeMs:60000}).sources.yw.state,
  'CAPTURE_METADATA_AGED_REVIEW_HOLD');
 for(const op of [
  openCase(cap,{},'impostor'),
  openCase(cap,{sourceId:'icamp'}),
  openCase(cap,{deadlineAtMs:at+10*86400000}),
  openCase(sha('capture-never-recorded'))
 ])assert.equal(f.read({openCasePackets:[op]}).state,'HOLD');
 const same=openCase(cap);
 assert.equal(f.read({openCasePackets:[same,same]}).state,'HOLD');
});
test('QL490 supervised two-signer drill records durable no-send receipt and denies replay',ctx=>{
 const f=fixture(ctx,{withCaptures:true}),review=f.read(),d=drill(f);
 const packet=drillPackets(review);
 assert.equal(d.instance.run({...packet,supervised:false}).state,'HOLD');
 const result=d.instance.run(packet);
 assert.equal(result.state,'DURABLE_OWNER_SUPERVISED_RECOVERY_REHEARSAL_HELD',JSON.stringify(result));
 assert.equal(result.restorePerformed,false);
 assert.equal(result.productionFieldAcceptance,false);
 assert.equal(d.drillJournal.summary().drillCount,1);
 assert.equal(d.instance.run(packet).state,'HOLD');
});
test('QL490 recovery refuses wrong reviewer, stale approval and changed current digest',ctx=>{
 const f=fixture(ctx,{withCaptures:true}),review=f.read(),d=drill(f);
 assert.equal(d.instance.run(drillPackets(review,'yw',
  {reviewerSigner:'impostor'})).state,'HOLD');
 assert.equal(d.instance.run(drillPackets(review,'yw',
  {owner:{issuedAtMs:at-300000}})).state,'HOLD');
 assert.equal(d.instance.run(drillPackets(review,'yw',
  {reviewer:{authorityTransfer:true}})).state,'HOLD');
 let count=0;
 const changing=drill(f,()=>{
  count++;
  const r=f.read();
  return count===1?r:{...r,readbackDigest:sha('changed-during-review')};
 });
 assert.equal(changing.instance.run(drillPackets(review)).state,'HOLD');
 assert.equal(changing.drillJournal.summary().drillCount,0);
});
test('QL490 original-host CLI never certifies Windows or performs unattended recovery from CI',()=>{
 const script=fileURLToPath(new URL('./ql490-original-host-cli.mjs',import.meta.url));
 const status=JSON.parse(execFileSync(process.execPath,[script,'--status'],{encoding:'utf8'}));
 assert.equal(status.state,'QL490_NO_SEND_OFF_BY_DEFAULT');
 assert.equal(status.liveSourcesIndependentlyCertified,0);
 assert.equal(status.automaticRecovery,false);
 if(process.platform!=='win32'||process.env.CI==='true')
  assert.throws(()=>execFileSync(process.execPath,[script,'--drill','bad','bad','bad'],
   {stdio:'pipe'}));
});
