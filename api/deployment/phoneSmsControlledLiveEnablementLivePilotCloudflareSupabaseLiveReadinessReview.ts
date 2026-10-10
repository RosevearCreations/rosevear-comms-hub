export type Ql088CloudflareSupabaseReadinessInput = {
  buildId: 'QL-088';
  cloudflareWorkerCheckName: 'Workers Builds: rosevear-comms-hub';
  cloudflareWorkerCheckGreen: boolean;
  cloudflareAccountLabel: 'devilndovelive@gmail.com';
  supabaseProjectUrl: 'https://gxujcwpktaickcgzyvnu.supabase.co';
  supabaseWorkingDirectory: '.';
  supabaseProductionBranch: 'main';
  supabaseFolderPresent: boolean;
  supabaseConfigPresent: boolean;
  supabaseMigrationPresent: boolean;
  qlStatusFunctionPresent: boolean;
  browserSafeReadOnlyClientPlannedOnly: boolean;
  sendsSms: false;
  placesCalls: false;
  registersProviderCallbacks: false;
  readsLiveCustomers: false;
  writesLiveCustomers: false;
  writesArchive: false;
  writesRetention: false;
  enablesLivePilot: false;
};

export type Ql088CloudflareSupabaseReadinessResult = {
  status: 'approved-readiness-review' | 'blocked-runtime-scope' | 'blocked-infrastructure-not-ready';
  approvedNextBuild: 'QL-089 — Public Disabled Preview Browser-Safe Supabase Read-Only Client Plan' | 'Remediate Cloudflare/Supabase readiness before QL-089';
  notes: string[];
};

export function reviewQl088CloudflareSupabaseReadiness(
  input: Ql088CloudflareSupabaseReadinessInput
): Ql088CloudflareSupabaseReadinessResult {
  const runtimeBlocked =
    input.sendsSms ||
    input.placesCalls ||
    input.registersProviderCallbacks ||
    input.readsLiveCustomers ||
    input.writesLiveCustomers ||
    input.writesArchive ||
    input.writesRetention ||
    input.enablesLivePilot;

  if (runtimeBlocked || !input.browserSafeReadOnlyClientPlannedOnly) {
    return {
      status: 'blocked-runtime-scope',
      approvedNextBuild: 'Remediate Cloudflare/Supabase readiness before QL-089',
      notes: [
        'QL-088 cannot enable live Phone/SMS, provider callbacks, live customer access, archive writes, retention writes, or live pilot runtime.',
        'Browser-safe Supabase work remains planning-only until readiness checks are green.'
      ]
    };
  }

  const infrastructureReady =
    input.cloudflareWorkerCheckGreen &&
    input.supabaseFolderPresent &&
    input.supabaseConfigPresent &&
    input.supabaseMigrationPresent &&
    input.qlStatusFunctionPresent;

  if (!infrastructureReady) {
    return {
      status: 'blocked-infrastructure-not-ready',
      approvedNextBuild: 'Remediate Cloudflare/Supabase readiness before QL-089',
      notes: [
        'Cloudflare Worker static-assets deployment must be green on main.',
        'Supabase integration must be able to find the root supabase/ folder, config, migration, and ql-status function scaffold.'
      ]
    };
  }

  return {
    status: 'approved-readiness-review',
    approvedNextBuild: 'QL-089 — Public Disabled Preview Browser-Safe Supabase Read-Only Client Plan',
    notes: [
      'Cloudflare Worker deployment check is the production-readiness signal for the connected devilndovelive@gmail.com project.',
      'Supabase repository layout is ready for GitHub integration review using working directory . and production branch main.',
      'Next work may plan browser-safe Supabase read-only access without enabling live communications.'
    ]
  };
}
