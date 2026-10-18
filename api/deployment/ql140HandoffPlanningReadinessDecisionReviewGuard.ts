export const ql140ProductionGuard = {
  build: 'QL-140',
  title: 'Handoff Readiness Follow-Up Planning Review Readiness Decision Review Follow-Up Planning Review Readiness Decision Review Follow-Up Planning Review Readiness Decision Review',
  reviewedBuild: 'QL-139',
  ownerDecisionStatus: 'readiness_decision_review_only_owner_not_approved',
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
    'Exactly eight unique passing QL-139 gates, matching independent counts and source outcome.',
    'Owner, consent, implementation, schema, API, Worker, Supabase, browser and ledger write locks remain closed.',
    'Exact feature PR-head app-build success before merge into dev.',
    'Exact promotion PR-head app-build success before merge into main.',
    'Exact final main app-build success.',
    'Exact final main Build disabled preview success.',
    'Exact final main Deploy disabled preview success.',
    'Exact final main Supabase Preview success.',
    'Exact final main Workers Builds: rosevear-comms-hub success.'
  ],
  stopConditions: [
    'Any QL-139 source gate is missing, duplicated, nonpassing or inconsistent.',
    'Any real owner choice, approval, signature, consent or implementation permission.',
    'Any schema, Worker/API, Supabase, browser, archive, audit or evidence ledger write.',
    'Any live Phone/SMS, DTMF, provider callback, recording, AI send or pilot.',
    'Any final-main required check missing, skipped, pending or failed.'
  ],
  nextQueuedBuild: 'QL-141 — Handoff Readiness Follow-Up Planning Review Readiness Decision Review Follow-Up Planning Review Readiness Decision Review Follow-Up Planning Review Readiness Decision Review Follow-Up Planning (proposed; confirm roadmap)'
} as const;
