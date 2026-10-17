export const ql130ProductionGuard = {
  build: 'QL-130',
  title: 'Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Persistence Bounded Implementation Owner Decision Packet Review Follow-Up Readiness Review Handoff Readiness Decision Review Follow-Up Planning Review',
  reviewedBuild: 'QL-129',
  ownerDecisionStatus: 'follow_up_planning_review_only_owner_not_approved',
  implementationPermission: 'not_granted',
  ledgerWriteStatus: 'planned_not_implemented',
  candidateSchemaStatus: 'drafted_not_implemented',
  endpointImplementationStatus: 'not_implemented',
  browserWriteStatus: 'disabled',
  decisionCaptureEnabled: false,
  consentCaptureEnabled: false,
  evidencePersistenceEnabled: false,
  phoneSmsLiveEnabled: false,
  providerCallbacksEnabled: false,
  recordingsEnabled: false,
  aiSendingEnabled: false,
  livePilotEnabled: false,
  requiredReleaseChecks: [
    'Exactly eight unique passing QL-129 gates with reconciled outcome and summary.',
    'Owner, implementation, ledger, schema, API and browser writes remain locked.',
    'Feature PR-head App CI succeeds before merge to dev.',
    'Promotion PR-head App CI succeeds before merge to main.',
    'Exact final main app-build succeeds.',
    'Exact final main Build disabled preview succeeds.',
    'Exact final main Deploy disabled preview succeeds.',
    'Exact final main Supabase Preview succeeds.',
    'Exact final main Workers Builds: rosevear-comms-hub succeeds.'
  ],
  stopConditions: [
    'Missing, duplicate, nonpassing or contradictory QL-129 planning gate.',
    'Any actual owner accept/reject/defer/revise, signature, approval or consent capture.',
    'Any database, schema, Supabase, Worker, API, browser, archive, audit or evidence-ledger write.',
    'Any live Phone/SMS, DTMF, provider callback, recording, AI send or pilot.',
    'Any required exact-final-main success check missing, pending, skipped or failing.'
  ],
  nextQueuedBuild: 'QL-131 — Handoff Readiness Follow-Up Planning Review Readiness Decision (scope to be confirmed against roadmap)'
} as const;
