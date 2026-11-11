import test from 'node:test';
import assert from 'node:assert/strict';
import {buildQl417MasterDiscrepancyWorklist as review} from './ql417-discrepancy-worklist.mjs';
const rev='95d5780f377c7e2fd3c357789cbc2566fcf03b6c';
const now=Date.parse('2026-11-11T16:00:00Z');
const base=()=>({controllerRevision:rev,nowMs:now,protectedReadAuthorized:true,
  episodes:[{sourceId:'rosevear-ai-hub',episodeId:'original_episode_001',
    sourceRevision:rev,observedAtMs:now-400000,signatureStatus:'VERIFIED',
    replayStatus:'COMMITTED',receiverAckStatus:'MATCHED'}],
  decisions:[{sourceId:'rosevear-ai-hub',episodeId:'original_episode_001',
    outcome:'ACCEPTED_FOR_REVIEW',decidedAtMs:now-50000,
    ownerVerified:true,independentReviewerVerified:true}]});
test('QL417 flags aging and preserves read-only owner continuity',()=>{
  const r=review(base());
  assert.equal(r.state,'READ_ONLY_DISCREPANCY_WORKLIST');
  assert.equal(r.items[0].ageSeconds,400);
  assert.deepEqual(r.items[0].reasons,['STALE_TELEMETRY']);
  assert.equal(r.items[0].latestOwnerDecision,'ACCEPTED_FOR_REVIEW');
  assert.equal(r.connection,'HOLD');assert.equal(r.receiver,'OFF');
});
test('QL417 rejects unauthenticated, duplicate, future and untrusted decisions',()=>{
  assert.equal(review({...base(),protectedReadAuthorized:false}).state,'HOLD');
  const a=base();a.episodes.push(a.episodes[0]);
  assert.equal(review(a).reason,'DUPLICATE_EPISODE_ID');
  const b=base();b.episodes[0].observedAtMs=now+1;
  assert.equal(review(b).state,'HOLD');
  const c=base();c.decisions[0].independentReviewerVerified=false;
  assert.equal(review(c).state,'HOLD');
});
test('QL417 prioritizes missing signature and ledger before owner decision',()=>{
  const a=base();a.episodes[0].signatureStatus='HOLD';
  a.episodes[0].replayStatus='REPLAYED';
  a.decisions[0].outcome='REOPENED';
  const r=review(a);
  assert.equal(r.items[0].severity,'CRITICAL');
  assert.ok(r.items[0].reasons.includes('REPLAY_LEDGER_NOT_COMMITTED'));
  assert.ok(r.items[0].reasons.includes('OWNER_DECISION_PENDING_OR_REOPENED'));
  assert.equal(r.runtimeUptime,'UNKNOWN');
});
