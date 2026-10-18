export const ql136ProductionGuard = {
  build: 'QL-136',
  title: 'Handoff Readiness Follow-Up Planning Review Readiness Decision Review Follow-Up Planning Review Readiness Decision Review',
  reviewedBuild: 'QL-135',
  ownerDecisionStatus: 'follow_up_readiness_decision_review_only_owner_not_approved',
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
    'Exactly eight unique passing QL-135 gates, independently recalculated totals and matching source outcome.',
    'Owner/consent, implementation, schema/API/Worker/Supabase/browser/ledger write locks remain closed.',
    'Exact feature PR-head app-build success before merge to dev.',
    'Exact promotion PR-head app-build success before merge to main.',
    'Exact final main app-build success.',
    'Exact final main Build disabled preview success.',
    'Exact final main Deploy disabled preview success.',
    'Exact final main Supabase Preview success.',
    'Exact final main Workers Builds: rosevear-comms-hub success.'
  ],
  stopConditions: [
    'Any QL-135 source gate missing, duplicate, nonpassing or inconsistent.',
    'Any real owner accept/reject/defer/revise, consent, signature or implementation authority.',
    'Any schema, API, Worker, Supabase, browser, archive, audit or evidence-ledger mutation.',
    'Any live Phone/SMS, DTMF, provider callback, recording, AI send or pilot.',
    'Any required exact final main check missing, pending, skipped or failing.'
  ],
  nextQueuedBuild: 'QL-137 — Handoff Readiness Follow-Up Planning Review Readiness Decision Review Follow-Up Planning Review Readiness Decision Review Follow-Up Planning (proposed; confirm roadmap)'
} as const;
