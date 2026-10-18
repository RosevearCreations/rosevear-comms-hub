export const ql133ProductionGuard = {
  build: 'QL-133',
  title: 'Handoff Readiness Follow-Up Planning Review Readiness Decision Review Follow-Up Planning',
  reviewedBuild: 'QL-132',
  ownerDecisionStatus: 'readiness_review_follow_up_planning_only_owner_not_approved',
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
    'Exactly eight passing unique QL-132 gates and independently reconciled outcome and counts.',
    'No owner/consent approval, implementation, schema, API, browser, Supabase or ledger writes.',
    'Exact feature PR-head App CI passes before merging into dev.',
    'Exact promotion PR-head App CI passes before merging into main.',
    'Exact-final-main app-build success.',
    'Exact-final-main Build disabled preview success.',
    'Exact-final-main Deploy disabled preview success.',
    'Exact-final-main Supabase Preview success.',
    'Exact-final-main Workers Builds: rosevear-comms-hub success.'
  ],
  stopConditions: [
    'Any QL-132 gate missing, duplicate, nonpassing or inconsistent.',
    'Any owner accept/reject/defer/revise, consent, signature or implementation authorization.',
    'Any schema, Worker/API/Supabase/browser/audit/evidence-ledger write.',
    'Any live Phone/SMS, DTMF, provider callback, recording, AI send or pilot.',
    'Any required final-main check missing, pending, skipped or failed.'
  ],
  nextQueuedBuild: 'QL-134 — Handoff Readiness Follow-Up Planning Review Readiness Decision Review Follow-Up Planning Review (proposed; confirm roadmap)'
} as const;
