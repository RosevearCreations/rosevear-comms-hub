import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const root = fileURLToPath(new URL('../../', import.meta.url));
const read = (path) => readFileSync(new URL(path, `file://${root}/`), 'utf8');
const appCi = read('.github/workflows/app-ci.yml');
const manualParity = read('.github/workflows/ql328-public-assets.yml');
const pages = read('.github/workflows/pages-disabled-preview.yml');
const scheduledSourceAudit = read('.github/workflows/ql333-public-contract-discovery.yml');
const gates = read('scripts/ql336a-required-gates.sh');

test('QL-336A retains all 43 existing application checks in their original order', () => {
  const commands = gates.split('\n')
    .filter((line) => line.startsWith('run_gate ')
      && !line.includes('ql336a-ci-topology.test.mjs')
      && !line.includes('master-broker/event-inbox.test.mjs')
      && !line.includes('hub-relay/heartbeat.test.mjs'))
    .map((line) => line.slice('run_gate '.length));
  // SHA-256 of the 43 exact gate commands in origin/dev's pre-QL336A app-ci.yml,
  // excluding the npm ci step, which remains an independent workflow step.
  const fingerprint = createHash('sha256').update(commands.join('\n') + '\n').digest('hex');
  assert.equal(commands.length, 43);
  assert.equal(fingerprint, 'a8eca667fae03b9078cef1c701c09f41a49d1e1dea5a758efcaf4106bfd496ec');
  assert.match(gates, /set -euo pipefail/);
  assert.match(gates, /"\$@"/);
  assert.match(appCi, /npm ci --no-audit --no-fund/);
  assert.match(appCi, /bash \.\.\/scripts\/ql336a-required-gates\.sh/);
});

test('main and PR application CI retain required gate names and fail-closed dependency', () => {
  assert.match(appCi, /name: App scaffold CI/);
  assert.match(appCi, /on:\s*\n\s*pull_request:\s*\n\s*push:\s*\n\s*branches: \[main\]/);
  assert.match(appCi, /\n\s*app-build:\s*\n/);
  assert.match(appCi, /\n\s*public-worker-asset-parity:\s*\n\s*name: Public Worker JS\/CSS SHA-256 parity/);
  assert.match(appCi, /needs: app-build/);
  assert.match(appCi, /github\.event_name == 'push' && github\.ref == 'refs\/heads\/main'/);
  assert.match(appCi, /timeout-minutes: 12/);
  assert.match(appCi, /python3 scripts\/ql328-public-asset-parity\.py/);
  assert.match(appCi, /persist-credentials: false/);
  assert.match(appCi, /permissions:\s*\n\s*contents: read/);
});

test('production parity has one push trigger; an independently runnable manual proof remains', () => {
  assert.match(manualParity, /name: Public Disabled-Preview Asset Verification \(QL-328 onward\)/);
  assert.match(manualParity, /on:\s*\n\s*workflow_dispatch:/);
  assert.doesNotMatch(manualParity, /^\s+push:/m);
  assert.match(manualParity, /name: Public Worker JS\/CSS SHA-256 parity/);
  assert.match(manualParity, /python3 scripts\/ql328-public-asset-parity\.py/);
  assert.match(pages, /ENABLE_GITHUB_PAGES_DISABLED_PREVIEW == 'true'/);
  assert.match(pages, /name: Deploy disabled preview/);
  assert.match(scheduledSourceAudit, /schedule:/);
});

test('both parity jobs explicitly disable provider/customer integrations', () => {
  const flags = [
    'VITE_ENABLE_SUPABASE_CLIENT',
    'VITE_ENABLE_HOSTED_DATABASE',
    'VITE_PHONE_SMS_PROVIDER_ENABLED',
    'VITE_PHONE_SMS_LIVE_PILOT_ENABLED',
    'VITE_PHONE_SMS_CALLBACKS_ENABLED',
    'VITE_PHONE_SMS_PERSISTENCE_ENABLED',
  ];
  for (const flag of flags) {
    for (const workflow of [appCi, manualParity]) {
      assert.ok(workflow.includes(`${flag}: 'false'`), `Expected disabled ${flag}`);
    }
  }
});
