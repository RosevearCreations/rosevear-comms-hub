export const ql134ProductionGuard = {
  build: 'QL-134',
  title: 'Handoff Readiness Follow-Up Planning Review Readiness Decision Review Follow-Up Planning Review',
  reviewedBuild: 'QL-133',
  ownerDecisionStatus: 'follow_up_planning_review_only_owner_not_approved',
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
    'Exactly eight unique passing QL-133 gates with independently reconciled outcome and totals.',
    'No owner approval, consent, implementation permission, schema/API/browser/Supabase/ledger writes.',
    'Exact feature PR-head app-build success before merge to dev.',
    'Exact promotion PR-head app-build success before merge to main.',
    'Exact-final-main app-build success.',
    'Exact-final-main Build disabled preview success.',
    'Exact-final-main Deploy disabled preview success.',
    'Exact-final-main Supabase Preview success.',
    'Exact-final-main Workers Builds: rosevear-comms-hub success.'
  ],
  stopConditions: [
    'Any QL-133 gate absent, duplicated, nonpassing or contradictory.',
    'Any owner choice, signature, consent or implementation permission collected or inferred.',
    'Any schema, database, API, Worker, Supabase, browser, archive, audit or ledger write.',
    'Any Phone/SMS, provider callback, DTMF, recording, AI send or live pilot.',
    'Any final-main check absent, pending, skipped or failed.'
  ],
  nextQueuedBuild: 'QL-135 — Handoff Readiness Follow-Up Planning Review Readiness Decision Review Follow-Up Planning Review Readiness Decision (proposed; confirm roadmap)'
} as const;
