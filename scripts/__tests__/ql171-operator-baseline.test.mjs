import assert from 'node:assert/strict';
import { before, test } from 'node:test';
import {
  assessQl171Baseline,
  loadQl171Snapshot,
  SURFACE_IDS,
  DATA_PATH_IDS,
  GAP_IDS
} from '../ql171-operator-baseline.mjs';

let baseline;

before(async () => {
  baseline = await loadQl171Snapshot();
});

function changeSource(path, transform) {
  return { ...baseline, sources: { ...baseline.sources, [path]: transform(baseline.sources[path]) } };
}

test('QL-171 baseline inventories all surfaces, data paths and gaps without authorizing live operations', () => {
  const report = assessQl171Baseline(baseline);
  assert.equal(report.status, 'PASS', report.issues.join('\n'));
  assert.equal(report.surfaces, 11);
  assert.equal(report.dataPaths, 7);
  assert.equal(report.gaps, 14);
  assert.equal(new Set(SURFACE_IDS).size, SURFACE_IDS.length);
  assert.equal(new Set(DATA_PATH_IDS).size, DATA_PATH_IDS.length);
  assert.equal(new Set(GAP_IDS).size, GAP_IDS.length);
  // QL-272 reviews two additional localStorage operations in the preexisting
  // allowlisted localRepository: one get and one set for versioned UI layouts.
  assert.equal(report.sinkCounts['browser-storage'], 5);
  assert.equal(report.sinkCounts['supabase-query'], 5);
  assert.equal(report.sinkCounts['supabase-mutation'], 0);
  assert.equal(report.sinkCounts['raw-network'], 0);
  assert.equal(report.liveCallsEnabled, false);
  assert.equal(report.smsEnabled, false);
  assert.equal(report.realOwnerApprovalsAuthorized, false);
});

test('QL-272 scoped local layout storage expands the reviewed boundary without introducing unreviewed operators', () => {
  const source = baseline.sources['app/src/storage/localRepository.ts'];
  assert.match(source, /rosevear-comms-hub:ql272-command-layouts:v1/);
  assert.match(source, /export function loadQl272LocalLayout\(/);
  assert.match(source, /export function saveQl272LocalLayout\(/);
  assert.match(source, /serialized\.length > 12000/);
  const report = assessQl171Baseline(baseline);
  assert.equal(report.status, 'PASS', report.issues.join('\n'));
  assert.equal(report.sinkCounts['raw-network'], 0);
  assert.equal(report.sinkCounts['supabase-mutation'], 0);
});

test('entrypoint drift fails if a mounted preview or the gate disappears', () => {
  const snapshot = changeSource('app/src/main.tsx', source => source.replace('<AdminSessionGate>', '<div>'));
  const report = assessQl171Baseline(snapshot);
  assert.equal(report.status, 'DRIFT');
  assert.ok(report.issues.some(issue => issue.includes('mounted-ui')));
});

test('unreviewed browser persistence in an operator panel fails closed', () => {
  const snapshot = changeSource('app/src/operator/DisabledOperatorConsole.tsx', source => `${source}\nwindow.localStorage.setItem('decision', 'yes');`);
  const report = assessQl171Baseline(snapshot);
  assert.equal(report.status, 'DRIFT');
  assert.ok(report.issues.some(issue => issue.includes('browser-storage')));
});

test('customer-table reads are not silently added to the synthetic read client', () => {
  const snapshot = changeSource('app/src/integrations/supabaseReadOnlyClient.ts', source => `${source}\nclient.from('contacts')`);
  const report = assessQl171Baseline(snapshot);
  assert.equal(report.status, 'DRIFT');
  assert.ok(report.issues.some(issue => issue.includes('unreviewed table contacts')));
});

test('new Supabase write APIs are not hidden inside an allowlisted read file', () => {
  const snapshot = changeSource('app/src/supabase/readModel.ts', source => `${source}\nclient.from('brands').insert({ id: 'fake' })`);
  const report = assessQl171Baseline(snapshot);
  assert.equal(report.status, 'DRIFT');
  assert.ok(report.issues.some(issue => issue.includes('supabase-mutation')));
});

test('an unreviewed fetch or WebSocket path is reported', () => {
  const snapshot = changeSource('app/src/App.tsx', source => `${source}\nfetch('https://example.invalid/sms');`);
  const report = assessQl171Baseline(snapshot);
  assert.equal(report.status, 'DRIFT');
  assert.ok(report.issues.some(issue => issue.includes('raw-network')));
});

test('removing a documented risk gap is detected', () => {
  const snapshot = { ...baseline, document: baseline.document.replace(/^\| G07 \|.*\n/m, '') };
  const report = assessQl171Baseline(snapshot);
  assert.equal(report.status, 'DRIFT');
  assert.ok(report.issues.some(issue => issue.includes('gap G07')));
});

test('turning on a preview deployment provider flag breaks the QL-171 baseline', () => {
  const snapshot = changeSource('.github/workflows/pages-disabled-preview.yml', source => source.replace("VITE_PHONE_SMS_PROVIDER_ENABLED: 'false'", "VITE_PHONE_SMS_PROVIDER_ENABLED: 'true'"));
  const report = assessQl171Baseline(snapshot);
  assert.equal(report.status, 'DRIFT');
  assert.ok(report.issues.some(issue => issue.includes('disabled-deploy')));
});

test('unexpected project-side query and client initialization are rejected', () => {
  const snapshot = changeSource('app/src/App.tsx', source => `${source}\ncreateClient(url, key).from('phone_calls')`);
  const report = assessQl171Baseline(snapshot);
  assert.equal(report.status, 'DRIFT');
  assert.ok(report.issues.some(issue => issue.includes('create-supabase-client')));
  assert.ok(report.issues.some(issue => issue.includes('supabase-query')));
});
