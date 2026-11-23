import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,sign} from 'node:crypto';
import {mkdtempSync,readdirSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {SOURCES,canonicalize} from './manifest.mjs';
import {QL485_SCHEMA,QL485_REVIEW_SCHEMA,QL485_SOURCE_IDS,
 verifyQl485SourceNotice,verifyQl485IndependentReview,
 negotiateQl485SixSources,diagnoseQl485CrossAppDivergence,QL485_BOUNDARY}
 from './ql485-signed-release-negotiation.mjs';
import {createQl485PrivateContractReviewLedger}
 from './ql485-private-review-ledger.mjs';

const now=Date.now(),REV='a'.repeat(40),NEW='b'.repeat(40);
const identities=Object.fromEntries([...QL485_SOURCE_IDS,'reviewer','outsider']
 .map(id=>[id,generateKeyPairSync('ed25519')]));
const pem=id=>identities[id].publicKey.export({type:'spki',format:'pem'});
const signed=(payload,id)=>({payload,signature:sign(null,Buffer.from(canonicalize(payload),'utf8'),
 identities[id].privateKey).toString('base64url')});
const capabilities={
 yw:['health.read'],icamp:['health.read'],rosiedazzlers:['health.read'],
 devilndove:['health.read'],'ai-data-platform':['broker.case.review'],
 'rosevear-ai-hub':['device.status.read']
};
const eventSchemas=id=>id==='yw'||id==='icamp'?
 ['rosevear.comms.ql480.scoped-source-event.v1']:
 ['rosevear.comms.intake.v1'];
const notice=(id,extra={})=>({
 schema:QL485_SCHEMA,noticeId:'notice_'+id.padEnd(8,'0'),
 sourceId:id,repository:'RosevearCreations/'+SOURCES[id].repo,
 sourceRevision:REV,previousRevision:null,manifestMajor:1,
 contractVersion:'1.0.0',eventSchemas:eventSchemas(id),
 capabilities:capabilities[id],tenantBoundary:SOURCES[id].boundary,
 environment:'PRIVATE_STAGING',audience:'rosevear-comms-hub:private-negotiation',
 issuedAtMs:now-200,expiresAtMs:now+200000,
 requestedAction:'READ_ONLY_COMPATIBILITY_REVIEW',
 customerDataIncluded:false,authorityTransfer:false,...extra});
const pin=id=>({
 sourceId:id,publicKeyPem:pem(id),approvedRevision:REV,
 approvedContractVersion:'1.0.0',approvedEventSchemas:eventSchemas(id),
 approvedCapabilities:capabilities[id],
 independentlyVerified:true,sourceOwnerApproved:true});
function fixtures(){
 return {packets:Object.fromEntries(QL485_SOURCE_IDS.map(id=>[id,signed(notice(id),id)])),
  pins:Object.fromEntries(QL485_SOURCE_IDS.map(id=>[id,pin(id)]))};
}
test('QL485 six existing source identities have independent signed compatible read-only contracts',()=>{
 assert.equal(QL485_SOURCE_IDS.length,6);
 assert.equal(SOURCES.devilndove.repo,'devilndove-site');
 const f=fixtures();
 const r=negotiateQl485SixSources({...f,nowMs:now});
 assert.equal(r.state,'ALL_SIX_SIGNED_CONTRACTS_READ_ONLY_HELD');
 assert.equal(r.compatibleCount,6);assert.deepEqual(r.pendingSources,[]);
 for(const id of QL485_SOURCE_IDS){
  assert.equal(r.results[id].state,'SIGNED_COMPATIBLE_READ_ONLY_CONTRACT_HELD');
  assert.equal(r.results[id].sourceAuthorized,false);
  assert.equal(r.results[id].productionAcceptance,false);
  assert.equal(r.results[id].sourceRevision,REV);
 }
 assert.equal(QL485_BOUNDARY.networkRequests,0);
 assert.equal(QL485_BOUNDARY.automaticGitMerge,false);
});
test('QL485 denies invalid signatures, source impersonation, reused keys, escalated scopes, stale packets',()=>{
 for(const id of QL485_SOURCE_IDS){
  const check=(p,trust=pin(id),issuer=id)=>verifyQl485SourceNotice({
   packet:signed(p,issuer),pin:trust,nowMs:now});
  const baseline=notice(id);
  assert.equal(check(baseline).state,'SIGNED_COMPATIBLE_READ_ONLY_CONTRACT_HELD');
  assert.equal(check(baseline,{...pin(id),sourceOwnerApproved:false}).state,'HOLD');
  assert.equal(check(baseline,{...pin(id),independentlyVerified:false}).state,'HOLD');
  assert.equal(check(baseline,pin(id),'outsider').state,'HOLD');
  assert.equal(check({...baseline,repository:'RosevearCreations/fake'}).state,'HOLD');
  assert.equal(check({...baseline,audience:'customer'}).state,'HOLD');
  assert.equal(check({...baseline,tenantBoundary:'other-business'}).state,'HOLD');
  assert.equal(check({...baseline,customerDataIncluded:true}).state,'HOLD');
  assert.equal(check({...baseline,authorityTransfer:true}).state,'HOLD');
  assert.equal(check({...baseline,expiresAtMs:now-1}).state,'HOLD');
  assert.equal(check({...baseline,issuedAtMs:now-150000}).state,'HOLD');
  assert.equal(check({...baseline,requestedAction:'SEND_CUSTOMER_MESSAGE'}).state,'HOLD');
  assert.equal(check({...baseline,capabilities:['health.read','private.incident.review','write.customer']}).state,'HOLD');
  assert.equal(check({...baseline,secret:'extraneous'}).state,'HOLD');
  assert.equal(check({...baseline,sourceId:'unknown'}).state,'HOLD');
 }
});
test('QL485 source release, major schema, minor contract and capability drift are distinct HOLDs',()=>{
 const id='yw',p=pin(id);
 const next=verifyQl485SourceNotice({packet:signed(notice(id,{
  sourceRevision:NEW,previousRevision:REV}),id),pin:p,nowMs:now});
 assert.equal(next.state,'SIGNED_NEW_REVISION_OWNER_REENROLLMENT_REQUIRED');
 assert.equal(verifyQl485SourceNotice({packet:signed(notice(id,{
  sourceRevision:NEW,previousRevision:'c'.repeat(40)}),id),pin:p,nowMs:now}).state,'HOLD');
 assert.equal(verifyQl485SourceNotice({packet:signed(notice(id,{
  contractVersion:'2.0.0'}),id),pin:p,nowMs:now}).reason,'QL485_MAJOR_VERSION_INCOMPATIBLE');
 assert.equal(verifyQl485SourceNotice({packet:signed(notice(id,{
  contractVersion:'1.1.0'}),id),pin:p,nowMs:now}).state,'SIGNED_SEMVER_CHANGE_REVIEW_REQUIRED');
 assert.equal(verifyQl485SourceNotice({packet:signed(notice(id,{
  eventSchemas:['rosevear.comms.intake.v1']}),id),pin:p,nowMs:now}).state,'SIGNED_EVENT_SCHEMA_CHANGE_REVIEW_REQUIRED');
 assert.equal(verifyQl485SourceNotice({packet:signed(notice(id,{
  capabilities:['health.read','private.incident.review']}),id),pin:p,nowMs:now}).state,'SIGNED_CAPABILITY_CHANGE_REVIEW_REQUIRED');
 const reviewer={schema:QL485_REVIEW_SCHEMA,reviewId:'review_000000001',
  sourceId:id,noticeDigest:next.noticeDigest,reviewerId:'external_reviewer_1',
  reviewedAtMs:now,decision:'REVIEW_ONLY_OWNER_REENROLLMENT_PENDING',
  customerDataReviewed:false,authorityTransfer:false};
 const check=(packet,signerPin=pem('reviewer'))=>verifyQl485IndependentReview({
  release:next,reviewPacket:packet,reviewerPin:signerPin,
  sourcePin:pem(id),nowMs:now});
 assert.equal(check(signed(reviewer,'reviewer')).state,'INDEPENDENT_CONTRACT_CHANGE_REVIEW_HELD');
 assert.equal(check(signed(reviewer,'reviewer')).productionAcceptance,false);
 assert.equal(check(signed(reviewer,'reviewer'),pem(id)).state,'HOLD');
 assert.equal(check(signed(reviewer,'outsider')).state,'HOLD');
 assert.equal(check(signed({...reviewer,noticeDigest:'f'.repeat(64)},'reviewer')).state,'HOLD');
 assert.equal(check(signed({...reviewer,decision:'APPROVE_DEPLOYMENT'},'reviewer')).state,'HOLD');
});
test('QL485 six-source reconciliation preserves missing and wrong-origin holds',()=>{
 const {packets,pins}=fixtures();
 delete packets.icamp;
 packets.yw=signed(notice('icamp'),'icamp');
 const batch=negotiateQl485SixSources({packets,pins,nowMs:now});
 assert.equal(batch.compatibleCount,4);
 assert.equal(batch.results.icamp.reason,'QL485_SOURCE_NOTICE_MISSING');
 assert.equal(batch.results.yw.reason,'QL485_WRONG_SOURCE_ENVELOPE');
 assert.deepEqual(batch.pendingSources,['icamp','yw']);
});
test('QL485 diagnostics separate Git ancestry from source release and never auto-merge',()=>{
 const negotiation=negotiateQl485SixSources({...fixtures(),nowMs:now});
 const git={repository:'RosevearCreations/rosevear-comms-hub',
  mainSha:'f'.repeat(40),devSha:'e'.repeat(40),
  aheadBy:543,behindBy:522,checkedAtMs:now};
 const heads=Object.fromEntries(QL485_SOURCE_IDS.map(id=>[id,REV]));
 heads.yw=NEW;
 const r=diagnoseQl485CrossAppDivergence({git,sourceHeads:heads,negotiation});
 assert.equal(r.state,'READ_ONLY_CROSS_APP_DIAGNOSTICS');
 assert.equal(r.gitAncestry,'DIVERGED');
 assert.equal(r.sources.yw.headState,'EXTERNAL_SOURCE_HEAD_CHANGE_NEEDS_INDEPENDENT_REVIEW');
 assert.equal(r.sources.icamp.headState,'HEAD_MATCHES_SIGNED_CLAIM');
 assert.equal(r.externalSourceUpdatesCauseGitDivergence,false);
 assert.equal(r.automaticMerge,false);
 assert.equal(diagnoseQl485CrossAppDivergence({
  git:{...git,aheadBy:0,behindBy:0},negotiation}).gitAncestry,'IN_SYNC');
 assert.equal(diagnoseQl485CrossAppDivergence({
  git:{...git,aheadBy:-1},negotiation}).state,'HOLD');
});
test('QL485 signed private review receipt is write-once, readback-checked, refuses collision/tamper',ctx=>{
 const root=mkdtempSync(join(tmpdir(),'ql485-private-'));
 ctx.after(()=>rmSync(root,{recursive:true,force:true}));
 const ledger=createQl485PrivateContractReviewLedger({directory:join(root,'ledger')});
 const {packets,pins}=fixtures();
 assert.equal(ledger.read('session_00000001').state,'HOLD');
 const first=ledger.commit({sessionId:'session_00000001',packets,pins,nowMs:now});
 assert.equal(first.state,'DURABLE_SIGNED_CONTRACT_REPORT_COMMITTED_HELD');
 assert.equal(first.compatibleCount,6);
 assert.equal(first.productionAcceptance,false);
 assert.equal(ledger.read('session_00000001').summaryDigest,first.summaryDigest);
 assert.equal(ledger.commit({sessionId:'session_00000001',packets,pins,nowMs:now}).state,
  'DURABLE_PRIVATE_REPORT_REPLAY_HELD');
 const updated={...packets,yw:signed(notice('yw',{sourceRevision:NEW,previousRevision:REV}),'yw')};
 assert.equal(ledger.commit({sessionId:'session_00000001',
  packets:updated,pins,nowMs:now}).state,'HOLD');
 const file=join(root,'ledger',readdirSync(join(root,'ledger'))[0]);
 const original=readFileSync(file,'utf8');
 writeFileSync(file,original.replace('SIGNED_COMPATIBLE_READ_ONLY_CONTRACT_HELD','FALSELY_AUTHORIZED'));
 assert.equal(ledger.read('session_00000001').reason,'QL485_PRIVATE_RECONCILIATION_TAMPERED');
 assert.equal(ledger.publicRoute,false);
});
