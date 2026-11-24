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
import {QL490_EXCEPTION_OPEN_SCHEMA,
 readQl490PrivateFieldEvidence} from './ql490-independent-field-readback.mjs';
import {createQl489EvidenceJournal} from './ql489-evidence-journal.mjs';
import {createQl490DrillJournal} from './ql490-supervised-recovery-drill.mjs';
import {QL491_FIELD_FOLLOWUP_SCHEMA,createQl491ReviewJournal,
 createQl491ExceptionIntake} from './ql491-exception-intake.mjs';
import {readQl491DrillTrends} from './ql491-drill-trends.mjs';
const at=Date.now(),DAY=86400000;
const keys=Object.fromEntries(QL485_SOURCE_IDS.flatMap(id=>
 [id+'_operator',id+'_reviewer']).concat('wrong_signer')
 .map(name=>[name,generateKeyPairSync('ed25519')]));
const pem=name=>keys[name].publicKey.export({type:'spki',format:'pem'});
const sig=(payload,name)=>({payload,signature:sign(null,
 Buffer.from(canonicalize(payload)),keys[name].privateKey).toString('base64url')});
const hash=x=>createHash('sha256').update(canonicalize(x)).digest('hex');
const pins=Object.fromEntries(QL485_SOURCE_IDS.map(id=>[id,{
 operatorPublicKeyPem:pem(id+'_operator'),reviewerPublicKeyPem:pem(id+'_reviewer')
}]));
function fixture(ctx){
 const root=mkdtempSync(join(tmpdir(),'ql491-private-'));
 ctx.after(()=>rmSync(root,{recursive:true,force:true}));
 const evidenceDirectory=join(root,'case-evidence'),registryDirectory=join(root,'registry');
 let t=at-1000;
 const evidence=createQl489EvidenceJournal({directory:evidenceDirectory,now:()=>t});
 const sources=Object.fromEntries(QL485_SOURCE_IDS.map(id=>[id,{
  state:'SOURCE_ATTESTATION_NOT_ENROLLED',evidenceDigest:null,attestationCount:0
 }]));
 const registry={summary:()=>({
  state:'PRIVATE_OPERATOR_REGISTRY_READ_ONLY_HELD',sourceCount:6,
  registryDigest:hash('ql491-private-registry'),sources:structuredClone(sources)
 })};
 const journal=createQl491ReviewJournal({directory:evidenceDirectory,now:()=>at});
 let packets=[];
 const readCurrent=()=>readQl490PrivateFieldEvidence({
  evidenceDirectory,registry,journal:evidence,
  exceptionPins:pins,openCasePackets:packets,nowMs:at});
 const intake=createQl491ExceptionIntake({readCurrent,journal,now:()=>at});
 function addCapture(id='yw'){
  t=at-1000;
  const receiptDigest=hash('registry-'+id+'-'+t);
  const result=evidence.appendCapture({sourceId:id,receiptDigest,
   registryDigest:hash('registry-at-capture-'+id),
   witnessDigest:hash('windows-transport-'+id),
   endpointFingerprint:hash('endpoint-'+id),
   bundleDigest:hash('bundle-'+id)});
  assert.equal(result.state,'DURABLE_SIGNED_CAPTURE_HELD',JSON.stringify(result));
  sources[id]={state:'DURABLE_PINNED_SOURCE_REVISION_CLAIM_RECORDED_HELD',
   evidenceDigest:receiptDigest,attestationCount:1};
  return result.recordDigest;
 }
 function addClosed(id,cap,caseId){
  t=at-100;
  return evidence.appendClosure({sourceId:id,caseId,captureRecordDigest:cap,
   operatorDigest:hash('operator-'+id),reviewerDigest:hash('reviewer-'+id),
   reasonCode:'EVIDENCE_CUSTODY_REVIEW'});
 }
 function setPackets(next){packets=next}
 return {root,evidenceDirectory,registryDirectory,evidence,registry,sources,journal,
  readCurrent,intake,addCapture,addClosed,setPackets};
}
function openPacket(cap,changes={},signer='yw_operator'){
 return sig({schema:QL490_EXCEPTION_OPEN_SCHEMA,caseId:'case_ql491_00001',
  sourceId:'yw',captureRecordDigest:cap,reasonCode:'EVIDENCE_CUSTODY_REVIEW',
  operatorId:'operator_real_0001',openedAtMs:at-500,deadlineAtMs:at+DAY,
  customerDataIncluded:false,authorityTransfer:false,...changes},signer);
}
function followPackets(readback,sourceId='yw',overrides={}){
 const base={schema:QL491_FIELD_FOLLOWUP_SCHEMA,requestId:'proof_request_00001',
  sourceId,readbackDigest:readback.readbackDigest,
  captureDigest:readback.sources[sourceId].lastCaptureDigest,
  requestedAction:'INDEPENDENT_ORIGINAL_HOST_FIELD_PROOF_REVIEW_ONLY',
  role:'owner',actorId:'real_owner_0001',
  issuedAtMs:at-100,expiresAtMs:at+100000,
  reviewDeadlineAtMs:at+DAY,physicalWitnessCompleted:false,
  customerDataIncluded:false,authorityTransfer:false};
 const owner={...base,...overrides.owner},reviewer={...base,
  role:'independent-reviewer',actorId:'real_independent_0001',
  ...overrides.reviewer};
 return {sourceId,
  ownerPacket:sig(owner,overrides.ownerSigner??sourceId+'_operator'),
  reviewerPacket:sig(reviewer,overrides.reviewerSigner??sourceId+'_reviewer'),
  exceptionPins:pins};
}
test('QL491 empty real signed case inventory is six-source HOLD, durable only metadata',ctx=>{
 const f=fixture(ctx),result=f.intake.reconcile([]);
 assert.equal(result.state,'SIGNED_CASE_INTAKE_RECONCILED_REVIEW_HELD',JSON.stringify(result));
 assert.equal(result.caseCount,0);
 assert.equal(result.sourceHoldCount,6);
 assert.equal(result.fieldProofCertified,false);
 assert.equal(result.customerWrites,false);
 assert.equal(f.journal.summary().intakeReviews,1);
 assert.equal(f.journal.summary().followupRequests,0);
 assert.equal(f.intake.reconcile([]).state,'SIGNED_CASE_INTAKE_RECONCILED_REVIEW_HELD');
 assert.equal(f.journal.summary().records,1,'unchanged inventory must not spam custody');
});
test('QL491 genuine QL490 signed case OPEN and QL489 closure are reconciled as review-only',ctx=>{
 const f=fixture(ctx),cap=f.addCapture(),packet=openPacket(cap);
 f.setPackets([packet]);
 const opened=f.intake.reconcile([packet]);
 assert.equal(opened.state,'SIGNED_CASE_INTAKE_RECONCILED_REVIEW_HELD');
 assert.equal(opened.openCount,1);assert.equal(opened.closedCount,0);
 assert.equal(opened.sourceHoldCount,5);
 const closure=f.addClosed('yw',cap,'case_ql491_00001');
 assert.equal(closure.state,'DURABLE_SIGNED_EXCEPTION_CLOSED_HELD');
 const done=f.intake.reconcile([packet]);
 assert.equal(done.closedCount,1);
 assert.equal(done.unmatchedClosures,0);
 assert.equal(done.fieldProofCertified,false);
 assert.equal(f.journal.summary().intakeReviews,2);
});
test('QL491 intake rejects differently scoped/unsigned/forged signed-case inventory',ctx=>{
 const f=fixture(ctx),cap=f.addCapture();
 const original=openPacket(cap);f.setPackets([original]);
 assert.equal(f.intake.reconcile([original]).state,'SIGNED_CASE_INTAKE_RECONCILED_REVIEW_HELD');
 assert.equal(f.intake.reconcile([openPacket(cap,{sourceId:'icamp'})]).state,'HOLD');
 assert.equal(f.intake.reconcile([openPacket(cap,{},'wrong_signer')]).state,'HOLD');
 assert.equal(f.intake.reconcile([]).state,'HOLD');
 assert.equal(f.journal.summary().records,1);
});
test('QL491 independently signed manual missing-source proof followup remains HOLD, rejects replay',ctx=>{
 const f=fixture(ctx),report=f.readCurrent();
 const request=followPackets(report);
 const result=f.intake.requestFollowup({...request,signedOpenCasePackets:[]});
 assert.equal(result.state,'DURABLE_SIGNED_FIELD_PROOF_FOLLOWUP_HELD',JSON.stringify(result));
 assert.equal(result.physicalWitnessCompleted,false);
 assert.equal(result.fieldProofCertified,false);
 assert.equal(f.journal.summary().intakeReviews,1);
 assert.equal(f.journal.summary().followupRequests,1);
 assert.equal(f.intake.requestFollowup({...request,signedOpenCasePackets:[]}).state,'HOLD');
 assert.equal(f.journal.summary().followupRequests,1);
});
test('QL491 followup rejects wrong signer, stale deadline, inconsistent source and actor identity',ctx=>{
 const f=fixture(ctx),report=f.readCurrent();
 for(const overrides of [
  {reviewerSigner:'wrong_signer'},
  {owner:{issuedAtMs:at-400000}},
  {reviewer:{physicalWitnessCompleted:true}},
  {owner:{reviewDeadlineAtMs:at+9*DAY}},
  {reviewer:{actorId:'real_owner_0001'}},
  {reviewer:{sourceId:'icamp'}},
  {reviewer:{captureDigest:hash('false-claimed-capture')}}
 ]){
  const bad=followPackets(report,'yw',overrides);
  assert.equal(f.intake.requestFollowup({...bad,signedOpenCasePackets:[]}).state,
   'HOLD',JSON.stringify(overrides));
 }
 assert.equal(f.journal.summary().followupRequests,0);
});
test('QL491 changes to private QL489 journal invalidate stale signed proof followup',ctx=>{
 const f=fixture(ctx),prior=f.readCurrent(),signed=followPackets(prior);
 f.addCapture('yw');
 assert.equal(f.intake.requestFollowup({...signed,signedOpenCasePackets:[]}).state,'HOLD');
 assert.equal(f.journal.summary().followupRequests,0);
});
test('QL491 private review journal tamper fails closed',ctx=>{
 const f=fixture(ctx),r=f.intake.reconcile([]);
 assert.equal(r.state,'SIGNED_CASE_INTAKE_RECONCILED_REVIEW_HELD');
 const path=join(f.evidenceDirectory,'ql491-intake-field-followups.ndjson');
 writeFileSync(path,readFileSync(path,'utf8').replace('INTAKE_REVIEW','FORGED_REVIEW'));
 assert.equal(f.journal.summary().state,'HOLD');
 assert.equal(f.intake.reconcile([]).state,'HOLD');
});
test('QL491 independent drill trends count only signed no-send rehearsals',ctx=>{
 const f=fixture(ctx);
 let now=at-9*DAY;
 const drillJournal=createQl490DrillJournal({directory:f.evidenceDirectory,now:()=>now});
 const record=(id,name)=>drillJournal.append({drillId:name,sourceId:id,
  readbackDigest:hash('readback-'+name),
  ownerDigest:hash('owner-'+name),reviewerDigest:hash('reviewer-'+name)});
 assert.equal(record('yw','drill_ql491_a001').state,'DURABLE_NO_SEND_RECOVERY_DRILL_HELD');
 now=at-2*DAY;
 assert.equal(record('icamp','drill_ql491_b001').state,'DURABLE_NO_SEND_RECOVERY_DRILL_HELD');
 const result=readQl491DrillTrends({directory:f.evidenceDirectory,
  drillJournal,nowMs:at});
 assert.equal(result.state,'PRIVATE_INDEPENDENT_NO_SEND_DRILL_TRENDS_HELD',JSON.stringify(result));
 assert.equal(result.totalSignedNoSendDrills,2);
 assert.equal(result.last7Days,1);
 assert.equal(result.previous7Days,1);
 assert.equal(result.last30Days,2);
 assert.equal(result.sources.yw.rehearsalsAllTime,1);
 assert.equal(result.sources.icamp.rehearsalsLast7Days,1);
 assert.equal(result.realRestoresPerformed,0);
 assert.equal(result.evidenceOfLiveSourceRecovery,false);
 assert.equal(result.fieldProofCertified,false);
 assert.equal(readQl491DrillTrends({directory:f.evidenceDirectory,drillJournal,
  nowMs:at+DAY}).trendEvidenceDigest,result.trendEvidenceDigest);
});
test('QL491 drill evidence cannot be forged, replayed or future dated',ctx=>{
 const f=fixture(ctx);
 const drillJournal=createQl490DrillJournal({directory:f.evidenceDirectory,now:()=>at+50000});
 const r=drillJournal.append({drillId:'drill_ql491_c001',sourceId:'yw',
  readbackDigest:hash('readback'),ownerDigest:hash('owner'),
  reviewerDigest:hash('reviewer')});
 assert.equal(r.state,'DURABLE_NO_SEND_RECOVERY_DRILL_HELD');
 assert.equal(readQl491DrillTrends({directory:f.evidenceDirectory,
  drillJournal,nowMs:at}).state,'HOLD');
 const path=join(f.evidenceDirectory,'ql490-recovery-drills.ndjson');
 writeFileSync(path,readFileSync(path,'utf8').replace('SIMULATED_NO_SEND_HELD','ACTUAL_RESTORE'));
 assert.equal(readQl491DrillTrends({directory:f.evidenceDirectory,
  drillJournal,nowMs:at+100000}).state,'HOLD');
});
test('QL491 CI status never certifies Windows or runs automatic private field actions',()=>{
 const cli=fileURLToPath(new URL('./ql491-original-host-cli.mjs',import.meta.url));
 const status=JSON.parse(execFileSync(process.execPath,[cli,'--status'],{encoding:'utf8'}));
 assert.equal(status.state,'QL491_NO_SEND_OFF_BY_DEFAULT');
 assert.equal(status.realFieldProofsCertified,0);
 assert.equal(status.automatedFollowup,false);
 assert.equal(status.customerWrites,false);
 if(process.platform!=='win32'||process.env.CI==='true')
  assert.throws(()=>execFileSync(process.execPath,[cli,'--followup','bad','bad','bad'],
   {stdio:'pipe'}));
});
