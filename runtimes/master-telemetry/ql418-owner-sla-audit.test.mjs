import test from 'node:test';
import assert from 'node:assert/strict';
import {buildQl418OwnerSlaAudit as run} from './ql418-owner-sla-audit.mjs';
const sha='95d5780f377c7e2fd3c357789cbc2566fcf03b6c';
const now=Date.parse('2026-11-11T16:00:00Z');
const episodeId='original_episode_001';
const base=()=>({protectedReadAuthorized:true,controllerRevision:sha,nowMs:now,
  episodes:[{sourceId:'rosevear-ai-hub',episodeId,sourceRevision:sha,
    observedAtMs:now-1_000_000,signatureStatus:'HOLD',replayStatus:'COMMITTED',
    receiverAckStatus:'MATCHED'}],
  decisions:[{sourceId:'rosevear-ai-hub',episodeId,outcome:'ACCEPTED_FOR_REVIEW',
    decidedAtMs:now-50_000,ownerVerified:true,independentReviewerVerified:true}],
  assignments:[{sourceId:'rosevear-ai-hub',episodeId,ownerId:'reviewer_001',
    ownerRole:'OWNER_REVIEWER',ownerVerified:true,independentReviewerVerified:true,
    assignedAtMs:now-800_000,custodyDigest:'a'.repeat(64),action:'ASSIGNED'}]});
test('critical discrepancy reports deterministic SLA and protected owner',()=>{
 const r=run(base());assert.equal(r.state,'PROTECTED_OWNER_SLA_WORKLIST');
 assert.equal(r.items[0].severity,'CRITICAL');
 assert.equal(r.items[0].slaState,'OVERDUE');
 assert.equal(r.items[0].overdueSeconds,100);
 assert.equal(r.items[0].ownerId,'reviewer_001');
 assert.equal(r.items[0].resolution,'NOT_CERTIFIED');
 assert.equal(r.auditExport,null);assert.equal(r.connection,'HOLD');
});
test('export requires both independent reviewer and protected export authorization',()=>{
 const b=base();b.protectedExportAuthorized=true;
 assert.equal(run(b).auditExport,null);
 b.independentAuditReviewerVerified=true;
 const result=run(b);const data=JSON.parse(result.auditExport);
 assert.equal(data.schema,'rosevear.ql418.three-master-acceptance-audit.v1');
 assert.equal(data.items[0].sourceRevision,sha);
 assert.equal(data.connection,'HOLD');
 assert.ok(!result.auditExport.includes('privateKey'));
 assert.equal(run(b).auditExport,result.auditExport);
});
test('unverified and duplicate custody fail closed',()=>{
 const a=base();a.assignments[0].ownerVerified=false;
 assert.equal(run(a).state,'HOLD');
 const b=base();b.assignments.push({...b.assignments[0]});
 assert.equal(run(b).reason,'NON_MONOTONIC_OR_DUPLICATE_ASSIGNMENT');
 const c=base();c.assignments[0].custodyDigest='not-a-digest';
 assert.equal(run(c).state,'HOLD');
 const d=base();d.protectedReadAuthorized=false;
 assert.equal(run(d).state,'HOLD');
});
test('unassigned discrepancies remain visible and cannot auto-accept',()=>{
 const b=base();b.assignments=[];
 b.episodes[0].observedAtMs=now-10_000;
 const r=run(b);assert.equal(r.items[0].slaState,'UNASSIGNED');
 assert.equal(r.counts.unassigned,1);
 assert.equal(r.items[0].acceptedForReview,true);
 assert.equal(r.items[0].resolution,'NOT_CERTIFIED');
});
