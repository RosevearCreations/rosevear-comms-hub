export const ql135ProductionGuard = {
  build: 'QL-135',
  title: 'Handoff Readiness Follow-Up Planning Review Readiness Decision Review Follow-Up Planning Review Readiness Decision',
  reviewedBuild: 'QL-134',
  ownerDecisionStatus: 'follow_up_planning_readiness_only_owner_not_approved',
  implementationPermission: 'not_granted',
  ledgerWriteStatus: 'planned_not_implemented',
  candidateSchemaStatus: 'drafted_not_implemented',
  endpointImplementationStatus: 'not_implemented',
  browserWriteStatus: 'disabled',
  ownerDecisionCaptureEnabled: false,
  consentCaptureEnabled: false,
  ledgerPersistenceEnabled: false,
  phoneSmsLiveEnabled: false,
  providerCallbacksEnabled: false,
  recordingsEnabled: false,
  aiSendingEnabled: false,
  livePilotEnabled: false,
  requiredReleaseChecks: [
    'Exactly eight unique passing QL-134 review gates with independently recalculated outcome and summary.',
    'No real owner consent, approval, implementation, schema/API/browser/Supabase/ledger write.',
    'Exact feature PR-head app-build success before merge into dev.',
    'Exact promotion PR-head app-build success before merge into main.',
    'Exact final main app-build success.',
    'Exact final main Build disabled preview success.',
    'Exact final main Deploy disabled preview success.',
    'Exact final main Supabase Preview success.',
    'Exact final main Workers Builds: rosevear-comms-hub success.'
  ],
  stopConditions: [
    'Any QL-134 gate absent, duplicate, nonpassing or contradictory with summary/outcome.',
    'Any real owner choice, consent, signature or implementation approval captured or inferred.',
    'Any schema, database, API, Worker, Supabase, browser, audit, archive or evidence-ledger write.',
    'Any live Phone/SMS, provider callback, recording, DTMF, AI send or pilot.',
    'Any final-main required check missing, pending, skipped or failed.'
  ],
  nextQueuedBuild: 'QL-136 — Handoff Readiness Follow-Up Planning Review Readiness Decision Review Follow-Up Planning Review Readiness Decision Review (proposed; confirm roadmap)'
} as const;
