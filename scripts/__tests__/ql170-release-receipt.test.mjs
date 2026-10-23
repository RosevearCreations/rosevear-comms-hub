import test from 'node:test';
import assert from 'node:assert/strict';
import { assessQl170ReleaseReceipt, buildIdsFromRoadmap, REQUIRED_CHECK_NAMES, SCOPED_BUILD_IDS } from '../ql170-release-receipt.mjs';

const mainSha = 'a'.repeat(40);
const devSha = 'b'.repeat(40);
const featureSha = 'c'.repeat(40);
const treeSha = 'd'.repeat(40);

const check = (name, head_sha = mainSha) => ({ name, head_sha, status: 'completed', conclusion: 'success' });

function fixture() {
  return {
    expectedMainSha: mainSha,
    main: { sha: mainSha, tree: treeSha },
    dev: { sha: devSha, tree: treeSha },
    mainChecks: REQUIRED_CHECK_NAMES.map(name => check(name)),
    featureChecks: [check('app-build', featureSha)],
    devChecks: [check('app-build', devSha)],
    featurePr: { merged_at: '2026-10-22T20:00:00Z', base: { ref: 'dev' },
      head: { sha: featureSha }, merge_commit_sha: devSha },
    promotionPr: { merged_at: '2026-10-22T20:30:00Z', base: { ref: 'main' },
      head: { sha: devSha }, merge_commit_sha: mainSha },
    roadmapBuildIds: [...SCOPED_BUILD_IDS]
  };
}

const assess = change => {
  const source = fixture();
  change?.(source);
  return assessQl170ReleaseReceipt(source);
};

test('reconciles exact five-check release and exhausted seven-build queue', () => {
  const result = assess();
  assert.equal(result.status, 'GREEN');
  assert.deepEqual(result.blockers, []);
  assert.equal(result.releaseSha, mainSha);
  assert.equal(result.checks.length, 5);
  assert.ok(result.checks.every(item => item.accepted));
  assert.equal(result.queueReconciled, true);
  assert.equal(result.queueRemainingAfterRelease, 0);
  assert.equal(result.newPlanningBatchRequired, true);
  assert.equal(result.liveOperationsAuthorized, false);
  assert.equal(result.realOwnerDecisionRecorded, false);
  assert.equal(result.canWriteOrExport, false);
});

const tamper = [
  ['truncated main SHA', x => { x.expectedMainSha = mainSha.slice(0, 7); }],
  ['main ref moved', x => { x.main.sha = 'e'.repeat(40); }],
  ['branch trees differ', x => { x.dev.tree = 'e'.repeat(40); }],
  ['unverified tree', x => { x.main.tree = 'not-a-tree'; }],
  ['missing check', x => { x.mainChecks.pop(); }],
  ['duplicate success check', x => { x.mainChecks.push(check('app-build')); }],
  ['check from earlier SHA', x => { x.mainChecks[0].head_sha = 'e'.repeat(40); }],
  ['queued check', x => { x.mainChecks[0].status = 'queued'; x.mainChecks[0].conclusion = null; }],
  ['incomplete check', x => { x.mainChecks[0].status = 'in_progress'; x.mainChecks[0].conclusion = null; }],
  ['failed check', x => { x.mainChecks[0].conclusion = 'failure'; }],
  ['skipped check', x => { x.mainChecks[0].conclusion = 'skipped'; }],
  ['feature PR unmerged', x => { x.featurePr.merged_at = null; }],
  ['feature PR wrong target', x => { x.featurePr.base.ref = 'main'; }],
  ['feature PR lineage wrong', x => { x.featurePr.merge_commit_sha = 'e'.repeat(40); }],
  ['feature PR head check absent', x => { x.featureChecks = []; }],
  ['feature PR head check stale', x => { x.featureChecks[0].head_sha = mainSha; }],
  ['promotion PR unmerged', x => { x.promotionPr.merged_at = null; }],
  ['promotion PR head changed', x => { x.promotionPr.head.sha = 'e'.repeat(40); }],
  ['promotion PR wrong target', x => { x.promotionPr.base.ref = 'dev'; }],
  ['promotion PR merge changed', x => { x.promotionPr.merge_commit_sha = 'e'.repeat(40); }],
  ['promotion head check failed', x => { x.devChecks[0].conclusion = 'failure'; }],
  ['queue item missing', x => { x.roadmapBuildIds.pop(); }],
  ['queue duplicated', x => { x.roadmapBuildIds[1] = 'QL-164'; }],
  ['unapproved successor added', x => { x.roadmapBuildIds.push('QL-171'); }],
  ['queue reordered', x => { x.roadmapBuildIds.reverse(); }]
];

for (const [name, change] of tamper) {
  test(`fails closed for ${name}`, () => {
    const result = assess(change);
    assert.equal(result.status, 'HELD');
    assert.ok(result.blockers.length > 0);
    assert.equal(result.newPlanningBatchRequired, false);
    assert.equal(result.queueRemainingAfterRelease, 1);
    assert.equal(result.liveOperationsAuthorized, false);
    assert.equal(result.realOwnerDecisionRecorded, false);
    assert.equal(result.canWriteOrExport, false);
  });
}

test('ignores irrelevant checks but cannot substitute them for required check names', () => {
  const result = assess(x => { x.mainChecks.push(check('some-unrelated-check')); });
  assert.equal(result.status, 'GREEN');
  assert.deepEqual(result.checks.map(item => item.name), REQUIRED_CHECK_NAMES);
});

test('roadmap parser preserves exact queue order and detects missing or invented entries', () => {
  const roadmap = SCOPED_BUILD_IDS.map(id => `| ${id} | Scoped feature | Review gate |`).join('\n');
  assert.deepEqual(buildIdsFromRoadmap(roadmap), SCOPED_BUILD_IDS);
  assert.deepEqual(buildIdsFromRoadmap(roadmap.replace('| QL-168 |', '| QL-188 |')).includes('QL-168'), false);
});
