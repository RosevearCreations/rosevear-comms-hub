export const ql137ProductionGuard = {
  build: 'QL-137',
  title: 'Handoff Readiness Follow-Up Planning Review Readiness Decision Review Follow-Up Planning Review Readiness Decision Review Follow-Up Planning',
  reviewedBuild: 'QL-136',
  ownerDecisionStatus: 'follow_up_planning_only_owner_not_approved',
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
    'Exactly eight unique passing QL-136 gates, independently recalculated totals and matching source outcome.',
    'Owner, consent, implementation, schema/API/Worker/Supabase/browser/ledger write locks remain closed.',
    'Exact feature PR-head app-build success before merge to dev.',
    'Exact promotion PR-head app-build success before merge to main.',
    'Exact-final-main app-build success.',
    'Exact-final-main Build disabled preview success.',
    'Exact-final-main Deploy disabled preview success.',
    'Exact-final-main Supabase Preview success.',
    'Exact-final-main Workers Builds: rosevear-comms-hub success.'
  ],
  stopConditions: [
    'Any QL-136 source gate missing, duplicate, nonpassing or contradictory.',
    'Any real owner choice, signature, consent or implementation authorization.',
    'Any schema, Worker/API, Supabase, browser, archive, audit or evidence-ledger write.',
    'Any live Phone/SMS, DTMF, provider callback, recording, AI sending or pilot.',
    'Any required final-main check missing, pending, skipped or failing.'
  ],
  nextQueuedBuild: 'QL-138 — Handoff Readiness Follow-Up Planning Review Readiness Decision Review Follow-Up Planning Review Readiness Decision Review Follow-Up Planning Review (proposed; confirm against roadmap)'
} as const;
