import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export const REQUIRED_CHECK_NAMES = Object.freeze([
  'app-build',
  'Build disabled preview',
  'Deploy disabled preview',
  'Supabase Preview',
  'Workers Builds: rosevear-comms-hub'
]);

export const SCOPED_BUILD_IDS = Object.freeze([
  'QL-164', 'QL-165', 'QL-166', 'QL-167', 'QL-168', 'QL-169', 'QL-170'
]);

const SHA = /^[0-9a-f]{40}$/;

export function buildIdsFromRoadmap(markdown) {
  return [...markdown.matchAll(/^\|\s*(QL-\d+)\s*\|/gm)].map(match => match[1]);
}

const checkPasses = (check, expectedSha) =>
  check?.head_sha === expectedSha && check?.status === 'completed' && check?.conclusion === 'success';

/**
 * Verify exact release evidence only. GREEN says nothing about owner approval,
 * customer consent, phone/SMS activation, durable audit, or private workflows.
 * A receipt on a different SHA, a missing/duplicated check or a stale PR fails.
 */
export function assessQl170ReleaseReceipt({
  expectedMainSha, main, dev, mainChecks, featureChecks, devChecks,
  featurePr, promotionPr, roadmapBuildIds
}) {
  const blockers = [];
  if (!SHA.test(expectedMainSha ?? '')) blockers.push('Expected main SHA must be a complete 40-character commit identity.');
  if (main?.sha !== expectedMainSha) blockers.push('main does not point to the exact requested commit.');
  if (!SHA.test(main?.tree ?? '') || !SHA.test(dev?.tree ?? '') || main?.tree !== dev?.tree) {
    blockers.push('main and dev must contain the same complete source tree identity.');
  }

  const checks = REQUIRED_CHECK_NAMES.map(name => {
    const matches = Array.isArray(mainChecks) ? mainChecks.filter(item => item?.name === name) : [];
    const accepted = matches.length === 1 && checkPasses(matches[0], expectedMainSha);
    if (!accepted) blockers.push(`Required exact-main check not uniquely completed/successful: ${name}.`);
    return { name, accepted, status: matches.length === 1 ? matches[0].status : 'missing_or_duplicate',
      conclusion: matches.length === 1 ? matches[0].conclusion : null };
  });

  if (!featurePr?.merged_at || featurePr?.base?.ref !== 'dev' ||
      featurePr?.merge_commit_sha !== dev?.sha || !SHA.test(featurePr?.head?.sha ?? '')) {
    blockers.push('Feature PR has no verified dev-merge lineage.');
  }
  if (!promotionPr?.merged_at || promotionPr?.base?.ref !== 'main' ||
      promotionPr?.head?.sha !== dev?.sha || promotionPr?.merge_commit_sha !== expectedMainSha) {
    blockers.push('Promotion PR has no verified exact-main merge lineage.');
  }

  const featureBuild = (Array.isArray(featureChecks) ? featureChecks : [])
    .filter(item => item?.name === 'app-build');
  if (featureBuild.length !== 1 || !checkPasses(featureBuild[0], featurePr?.head?.sha)) {
    blockers.push('Feature PR head did not have an independently successful app-build.');
  }
  const promotionBuild = (Array.isArray(devChecks) ? devChecks : [])
    .filter(item => item?.name === 'app-build');
  if (promotionBuild.length !== 1 || !checkPasses(promotionBuild[0], dev?.sha)) {
    blockers.push('Promotion PR head did not have an independently successful app-build.');
  }

  const queueExact = Array.isArray(roadmapBuildIds) &&
    roadmapBuildIds.length === SCOPED_BUILD_IDS.length &&
    roadmapBuildIds.every((id, index) => id === SCOPED_BUILD_IDS[index]);
  if (!queueExact) blockers.push('QL-164–QL-170 roadmap is missing, duplicated, reordered or unexpectedly expanded.');

  const green = blockers.length === 0;
  return {
    build: 'QL-170', releaseSha: expectedMainSha,
    status: green ? 'GREEN' : 'HELD', blockers, checks,
    queueReconciled: queueExact,
    queueRemainingAfterRelease: green ? 0 : 1,
    newPlanningBatchRequired: green,
    liveOperationsAuthorized: false,
    realOwnerDecisionRecorded: false,
    canWriteOrExport: false,
    notice: 'This verifies release checks and queue scope only; it never authorizes real communications, human decisions, private evidence intake, data writes, exports, dispatch or closure.'
  };
}

async function githubJson(path, token, repo) {
  const url = `https://api.github.com/repos/${repo}${path}`;
  const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'ql170-release-receipt' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(url, { headers, redirect: 'error' });
  if (!response.ok) throw new Error(`GitHub receipt query failed (${response.status}) at ${path}.`);
  return response.json();
}

export async function checkQl170LiveReceipt({ repo, sha, featurePrNumber, promotionPrNumber, token, roadmapMarkdown }) {
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) throw new Error('Provide an owner/repository GitHub name.');
  if (!SHA.test(sha ?? '')) throw new Error('Provide the full exact-main commit SHA.');
  if (![featurePrNumber, promotionPrNumber].every(n => Number.isSafeInteger(n) && n > 0)) {
    throw new Error('Provide both positive feature and promotion PR numbers.');
  }
  const paths = [
    '/branches/main', '/branches/dev', `/commits/${sha}/check-runs?per_page=100`,
    `/pulls/${featurePrNumber}`, `/pulls/${promotionPrNumber}`
  ];
  const [main, dev, mainChecks, featurePr, promotionPr] = await Promise.all(
    paths.map(path => githubJson(path, token, repo))
  );
  const [featureChecks, devChecks] = await Promise.all([
    githubJson(`/commits/${featurePr.head.sha}/check-runs?per_page=100`, token, repo),
    githubJson(`/commits/${dev.commit.sha}/check-runs?per_page=100`, token, repo)
  ]);
  return assessQl170ReleaseReceipt({
    expectedMainSha: sha,
    main: { sha: main.commit.sha, tree: main.commit.commit.tree.sha },
    dev: { sha: dev.commit.sha, tree: dev.commit.commit.tree.sha },
    mainChecks: mainChecks.check_runs,
    featureChecks: featureChecks.check_runs,
    devChecks: devChecks.check_runs,
    featurePr, promotionPr,
    roadmapBuildIds: buildIdsFromRoadmap(roadmapMarkdown)
  });
}

async function main() {
  const argv = process.argv.slice(2);
  const value = name => argv[argv.indexOf(name) + 1];
  if (argv.includes('--help') || !['--sha', '--feature-pr', '--promotion-pr'].every(name => argv.includes(name))) {
    process.stdout.write('Usage: node scripts/ql170-release-receipt.mjs --sha <exact-main-sha> --feature-pr <number> --promotion-pr <number> [--repo RosevearCreations/rosevear-comms-hub]\n');
    process.exitCode = 2;
    return;
  }
  try {
    const markdown = await readFile(new URL('../docs/QL-164-170-REQUIRED_BUILD_QUEUE.md', import.meta.url), 'utf8');
    const receipt = await checkQl170LiveReceipt({
      repo: argv.includes('--repo') ? value('--repo') : 'RosevearCreations/rosevear-comms-hub',
      sha: value('--sha'),
      featurePrNumber: Number(value('--feature-pr')),
      promotionPrNumber: Number(value('--promotion-pr')),
      token: process.env.GITHUB_TOKEN || process.env.GH_TOKEN,
      roadmapMarkdown: markdown
    });
    process.stdout.write(`${JSON.stringify(receipt, null, 2)}\n`);
    if (receipt.status !== 'GREEN') process.exitCode = 1;
  } catch (error) {
    process.stderr.write(`Release receipt HELD: ${error.message}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
