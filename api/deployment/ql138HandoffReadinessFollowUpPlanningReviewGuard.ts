export const ql138ProductionGuard = {
  build: 'QL-138',
  title: 'Handoff Readiness Follow-Up Planning Review Readiness Decision Review Follow-Up Planning Review Readiness Decision Review Follow-Up Planning Review',
  reviewedBuild: 'QL-137',
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
    'QL-137 eight expected unique passing gates, matching recomputed counts and source outcome.',
    'Owner/consent, implementation, schema/API/Worker/Supabase/browser/ledger write locks remain closed.',
    'Exact feature PR-head app-build success before merging into dev.',
    'Exact promotion PR-head app-build success before merging into main.',
    'Exact final main app-build completed successfully.',
    'Exact final main Build disabled preview completed successfully.',
    'Exact final main Deploy disabled preview completed successfully.',
    'Exact final main Supabase Preview completed successfully.',
    'Exact final main Workers Builds: rosevear-comms-hub completed successfully.'
  ],
  stopConditions: [
    'Any QL-137 gate absent, duplicated, nonpassing or inconsistent with outcome/totals.',
    'Any real owner choice, signature, consent or implementation approval.',
    'Any schema, API, Worker, Supabase, browser, archive, audit or ledger mutation.',
    'Any live Phone/SMS, DTMF, callback, recording, AI sending or pilot.',
    'Any required final-main verification missing, pending, skipped or failing.'
  ],
  nextQueuedBuild: 'QL-139 — Handoff Readiness Follow-Up Planning Review Readiness Decision Review Follow-Up Planning Review Readiness Decision Review Follow-Up Planning Review Readiness Decision (proposed; confirm roadmap)'
} as const;
