export const ql139ProductionGuard = {
  build: 'QL-139',
  title: 'Handoff Readiness Follow-Up Planning Review Readiness Decision Review Follow-Up Planning Review Readiness Decision Review Follow-Up Planning Review Readiness Decision',
  reviewedBuild: 'QL-138',
  ownerDecisionStatus: 'planning_readiness_only_owner_not_approved',
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
    'Exactly eight unique passing QL-138 gates and independently reconciled totals/outcome.',
    'Owner/consent, implementation, schema/API/Worker/Supabase/browser/ledger writes remain locked.',
    'Feature PR exact-head App CI must pass before dev merge.',
    'Promotion PR exact-head App CI must pass before main merge.',
    'Exact final main app-build success.',
    'Exact final main Build disabled preview success.',
    'Exact final main Deploy disabled preview success.',
    'Exact final main Supabase Preview success.',
    'Exact final main Workers Builds: rosevear-comms-hub success.'
  ],
  stopConditions: [
    'Any QL-138 source gate missing, duplicated, nonpassing or inconsistent.',
    'Any real owner decision, approval, consent, signature or implementation permission.',
    'Any schema, API, Worker, Supabase, browser, archive, audit or ledger write.',
    'Any live Phone/SMS, DTMF, provider callback, recording, AI send or pilot.',
    'Any final-main success check missing, pending, skipped or failed.'
  ],
  nextQueuedBuild: 'QL-140 — Handoff Readiness Follow-Up Planning Review Readiness Decision Review Follow-Up Planning Review Readiness Decision Review Follow-Up Planning Review Readiness Decision Review (proposed; confirm roadmap)'
} as const;
