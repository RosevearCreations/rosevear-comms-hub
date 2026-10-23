import { readFile, readdir } from 'node:fs/promises';
import { relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const DEFAULT_ROOT = fileURLToPath(new URL('../', import.meta.url));
export const BASELINE_DOCUMENT = 'docs/build-records/QL-171_OPERATOR_WORKFLOW_BASELINE_GAP_REGISTER.md';

export const SURFACE_IDS = Object.freeze(Array.from({ length: 11 }, (_, i) => `S${String(i + 1).padStart(2, '0')}`));
export const DATA_PATH_IDS = Object.freeze(Array.from({ length: 7 }, (_, i) => `D${String(i + 1).padStart(2, '0')}`));
export const GAP_IDS = Object.freeze(Array.from({ length: 14 }, (_, i) => `G${String(i + 1).padStart(2, '0')}`));

// These are the accepted QL-171 source fingerprints. Any movement or expansion
// of a trust boundary requires a reviewed inventory update, not a silent pass.
export const SOURCE_ANCHORS = Object.freeze([
  { id: 'mounted-ui', path: 'app/src/main.tsx', needles: ['<AdminSessionGate>', '<OperatorShell />', '<SiteHelpSystem />'] },
  { id: 'unified-shell', path: 'app/src/operator/OperatorShell.tsx', needles: ['<App activeBrandId', '<DisabledInterfacePreview embedded', '<Ql093SafeReadPreview embedded', '<DisabledOperatorConsole embedded', 'DISABLED PREVIEW'] },
  { id: 'two-brands', path: 'app/src/data/brands.ts', needles: ["id: 'rosiedazzlers'", "id: 'devilndove'"] },
  { id: 'local-inbox', path: 'app/src/App.tsx', needles: ["'inbox'", "'contacts'", "'tasks'", "'intakes'", "'data'", 'createManualLead', 'exportHubDb', 'resetHubDb'] },
  { id: 'local-persistence', path: 'app/src/storage/localRepository.ts', needles: ['window.localStorage.getItem', 'window.localStorage.setItem', 'export function importHubDb', 'export function saveHubDb'] },
  { id: 'api-local-facade', path: 'app/src/api/hubApi.ts', needles: ['createLocalHubApi', 'updateConversationStatus', 'addInternalNote'] },
  { id: 'admin-auth-gate', path: 'app/src/auth/AdminSessionGate.tsx', needles: ['signInWithOtp', ".from('app_admins')"] },
  { id: 'auth-flags', path: 'app/src/supabase/client.ts', needles: ['VITE_ENABLE_SUPABASE_CLIENT', 'VITE_ENABLE_HOSTED_DATABASE', 'VITE_SUPABASE_PUBLISHABLE_KEY'] },
  { id: 'synthetic-supabase-allowlist', path: 'app/src/integrations/supabaseReadOnlyClient.ts', needles: ['VITE_QL_ENABLE_SUPABASE_READS', 'expectedSupabaseProjectUrl', 'ql_public_synthetic_conversations', 'ql_public_system_status'] },
  { id: 'synthetic-view-rls', path: 'supabase/migrations/20261010205200_ql090_public_read_only_views.sql', needles: ['security_invoker = true', 'is_synthetic = true', 'is_live_enabled = false'] },
  { id: 'read-fallback', path: 'app/src/operator/ql093ValidatedSyntheticSafeReads.ts', needles: ['loadSyntheticConversationRows', 'loadSyntheticSystemStatusRows', 'getLocalFallbackSafeReadResult'] },
  { id: 'operator-safe-read', path: 'app/src/operator/Ql093SafeReadPreview.tsx', needles: ['loadValidatedSyntheticSafeReads', 'summarizeQl168UnresolvedHolds', 'reviewQl169PrivateOwnerPrerequisites'] },
  { id: 'static-preview', path: 'app/src/operator/DisabledInterfacePreview.tsx', needles: ['brandSamples', 'disabledActions', 'readOnlyFallbackRules'] },
  { id: 'disabled-console', path: 'app/src/operator/DisabledOperatorConsole.tsx', needles: ['safetyLocks', 'Live pilot runtime: disabled'] },
  { id: 'help', path: 'app/src/help/SiteHelpSystem.tsx', needles: ['SiteHelpSystem'] },
  { id: 'disabled-deploy', path: '.github/workflows/pages-disabled-preview.yml', needles: ["VITE_PHONE_SMS_PROVIDER_ENABLED: 'false'", "VITE_PHONE_SMS_LIVE_PILOT_ENABLED: 'false'", "VITE_PHONE_SMS_CALLBACKS_ENABLED: 'false'", "VITE_PHONE_SMS_PERSISTENCE_ENABLED: 'false'"] },
  { id: 'status-scaffold', path: 'supabase/functions/ql-status/index.ts', needles: ['phoneSmsRuntime: false', 'providerCallbacks: false', 'persistenceWritesFromFunction: false'] }
]);

// Explicitly tracked code sinks. These describe existing browser behaviour;
// being allowlisted here does NOT authorize personal-data use or communication.
const SINK_RULES = Object.freeze([
  { id: 'browser-storage', pattern: /window\.localStorage\.(?:getItem|setItem|removeItem|clear)\s*\(/g, allowed: ['app/src/storage/localRepository.ts'] },
  { id: 'create-supabase-client', pattern: /\bcreateClient(?:<[^>]*>)?\s*\(/g, allowed: ['app/src/supabase/client.ts', 'app/src/integrations/supabaseReadOnlyClient.ts'] },
  { id: 'supabase-query', pattern: /\.from\(\s*['"]([^'"]+)['"]\s*\)/g, allowedTables: {
    'app/src/auth/AdminSessionGate.tsx': ['app_admins'],
    'app/src/supabase/readModel.ts': ['brands', 'app_admins'],
    'app/src/integrations/supabaseReadOnlyClient.ts': ['ql_public_synthetic_conversations', 'ql_public_system_status']
  } },
  { id: 'supabase-mutation', pattern: /\.(?:insert|upsert|delete|update|rpc|invoke)\s*\(/g, allowed: [] },
  { id: 'raw-network', pattern: /\b(?:fetch\s*\(|new\s+WebSocket\s*\(|new\s+EventSource\s*\(|navigator\.sendBeacon\s*\()/g, allowed: [] },
  { id: 'auth-magic-link', pattern: /\.auth\.signInWithOtp\s*\(/g, allowed: ['app/src/auth/AdminSessionGate.tsx'] }
]);

async function walk(directory, root, output) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== '__tests__' && entry.name !== 'node_modules') await walk(path, root, output);
    } else if (/\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) {
      output[relative(root, path).replaceAll('\\', '/')] = await readFile(path, 'utf8');
    }
  }
}

export async function loadQl171Snapshot(root = DEFAULT_ROOT) {
  const sources = {};
  await walk(resolve(root, 'app/src'), root, sources);
  for (const { path } of SOURCE_ANCHORS) {
    if (!(path in sources)) {
      try { sources[path] = await readFile(resolve(root, path), 'utf8'); }
      catch { /* Treat a missing source as a baseline drift issue below. */ }
    }
  }
  const document = await readFile(resolve(root, BASELINE_DOCUMENT), 'utf8');
  return { sources, document };
}

export function assessQl171Baseline({ sources = {}, document = '' } = {}) {
  const issues = [];
  for (const { id, path, needles } of SOURCE_ANCHORS) {
    const source = sources[path];
    if (typeof source !== 'string') {
      issues.push(`${id}: required source missing: ${path}`);
      continue;
    }
    for (const needle of needles) {
      if (!source.includes(needle)) issues.push(`${id}: source anchor missing in ${path}: ${needle}`);
    }
  }

  for (const [kind, ids] of [['surface', SURFACE_IDS], ['data path', DATA_PATH_IDS], ['gap', GAP_IDS]]) {
    for (const id of ids) {
      const occurrences = [...document.matchAll(new RegExp(`^\\| ${id} \\|`, 'gm'))].length;
      if (occurrences !== 1) issues.push(`${kind} ${id} must have exactly one table row (got ${occurrences}).`);
    }
  }
  for (const phrase of ['disabled preview', 'real owner approvals', 'QL-172', 'synthetic', 'localStorage']) {
    if (!document.includes(phrase)) issues.push(`Documentation safety/context anchor missing: ${phrase}.`);
  }

  const sinkCounts = {};
  for (const rule of SINK_RULES) sinkCounts[rule.id] = 0;
  for (const [path, source] of Object.entries(sources)) {
    if (!path.startsWith('app/src/') || !/\.tsx?$/.test(path)) continue;
    for (const rule of SINK_RULES) {
      for (const match of source.matchAll(rule.pattern)) {
        sinkCounts[rule.id]++;
        if ('allowedTables' in rule) {
          const table = match[1];
          if (!rule.allowedTables[path]?.includes(table)) issues.push(`${rule.id}: unreviewed table ${table} in ${path}.`);
        } else if (!rule.allowed.includes(path)) {
          issues.push(`${rule.id}: unreviewed data sink in ${path}.`);
        }
      }
    }
  }

  return {
    build: 'QL-171',
    status: issues.length ? 'DRIFT' : 'PASS',
    surfaces: SURFACE_IDS.length,
    dataPaths: DATA_PATH_IDS.length,
    gaps: GAP_IDS.length,
    sourceFilesScanned: Object.keys(sources).filter(path => path.startsWith('app/src/') && /\.tsx?$/.test(path)).length,
    sinkCounts,
    issues,
    liveCallsEnabled: false,
    smsEnabled: false,
    realOwnerApprovalsAuthorized: false,
    note: 'Inventory source-drift verification only. Not a runtime penetration test or authorization to process personal data.'
  };
}

async function main() {
  try {
    const report = assessQl171Baseline(await loadQl171Snapshot());
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    if (report.status !== 'PASS') process.exitCode = 1;
  } catch (error) {
    process.stderr.write(`QL-171 inventory DRIFT: ${error.message}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await main();
