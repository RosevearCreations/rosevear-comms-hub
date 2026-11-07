import assert from 'node:assert/strict';
import {test} from 'node:test';
import {buildQl361RedactionReport,ql361Cli,QL361_SCHEMA,
  validateQl361HandoffShape,verifyQl361ArchivedTestAndPrepareHandoff}
  from './ql361-archived-chain-audit.mjs';

const candidates=[
  ['rosiedazzlers','business','rosiedazzlers'],
  ['devilndove','business','devilndove-site'],
  ['icamp','business','iCamp'],['yw','business','yw'],
  ['ai-data-platform','support','ai-data-platform'],
  ['rosevear-ai-hub','support','rosevear-ai-hub']
].map(([peerId,peerKind,repository])=>({peerId,peerKind,repository,
  state:'AWAITING_INDEPENDENT_SOURCE_OWNER_SIGNATURE',
  sourceTestAuthorized:false,customerDataAllowed:false,
  requestedScope:'HEALTH_READ_ONLY_TEST_PROPOSAL_NOT_AUTHORIZATION'}));
const body={schema:QL361_SCHEMA,kind:'OWNER_PRIVATE_OFFLINE_SOURCE_REVIEW_ONLY',
  archiveId:'ql360-synthetic-archive',archiveSha256:'a'.repeat(64),
  redactionAuditSha256:'b'.repeat(64),independentAuditorSpkiSha256:'c'.repeat(64),
  auditAttestation:{payload:{schema:'rosevear.hub.ql361.independent-redaction-audit.v1',
    role:'redaction_auditor',audience:'rosevear-comms-hub:original-archive:TEST',
    scope:'independent-redaction-review-owner-handoff-only',
    archiveId:'ql360-synthetic-archive',archiveSha256:'a'.repeat(64),
    redactionReportSha256:'b'.repeat(64),
    issuedAt:'2026-11-07T04:00:00.000Z',expiresAt:'2026-11-07T04:01:00.000Z'},
    signature:'A'.repeat(86)},
  receiverStopped:true,connectedCount:0,candidateCount:6,candidates,
  customerCommunications:false,deviceActions:false,
  nextAction:'SIX_SEPARATE_SOURCE_OWNER_SIGNED_TEST_DECISIONS_REQUIRED'};

test('QL-361 is only a held offline candidate handoff with exactly six known shell-level sources',()=>{
  assert.equal(validateQl361HandoffShape(body),true);
  assert.equal(validateQl361HandoffShape({...body,connectedCount:1}),false);
  assert.equal(validateQl361HandoffShape({...body,receiverStopped:false}),false);
  assert.equal(validateQl361HandoffShape({...body,customerData:'private'}),false);
  assert.equal(validateQl361HandoffShape({...body,candidates:[...candidates,candidates[0]]}),false);
  assert.equal(validateQl361HandoffShape({...body,candidates:candidates.map((p,i)=>
    i===0?{...p,sourceTestAuthorized:true}:p)}),false);
  assert.equal(validateQl361HandoffShape({...body,candidates:candidates.map((p,i)=>
    i===0?{...p,customerEmail:'person@example.invalid'}:p)}),false);
});

test('QL-361 auditor report exposes only allowlisted fields, not packets or secret values',()=>{
  const report=buildQl361RedactionReport({archiveId:body.archiveId,
    archiveSha256:body.archiveSha256,peers:candidates});
  assert.equal(report.peerCount,6);
  assert.equal(report.unexpectedFields.length,0);
  assert.equal(report.credentialsIncluded,false);
  assert.equal(report.customerDataIncluded,false);
  assert.doesNotMatch(JSON.stringify(report),/customerEmail|token|privateCredential|privateKey/);
  assert.throws(()=>buildQl361RedactionReport({archiveId:'../unsafe',
    archiveSha256:body.archiveSha256,peers:candidates}),/HOLD_EXACT/);
});

test('QL-361 arbitrary JSON archive booleans and unattended CLI never start TEST or connect sources',async()=>{
  assert.match((await verifyQl361ArchivedTestAndPrepareHandoff({
    originalArchive:{archiveAccepted:true,connected:false}})).state,/ORIGINAL_READBACK/);
  const args={originalArchive:{archiveAccepted:true},now:Date.now(),
    query:async()=>({rows:[]}),readOriginalPrivateArchive:async()=>({}),
    observeOriginalShutdown:async()=>({}),resolvePinnedAuthority:async()=>({}),
    verifyIndependentCustody:async()=>({}),writeOriginalPrivateHandoff:async()=>({}),
    readOriginalPrivateHandoff:async()=>({})};
  assert.match((await verifyQl361ArchivedTestAndPrepareHandoff(args)).state,/UNREPLAYED/);
  assert.equal(ql361Cli(['--help']).databaseWrites,0);
  assert.throws(()=>ql361Cli(['--activate-six-apps']),/DENY_UNSUPERVISED/);
});
