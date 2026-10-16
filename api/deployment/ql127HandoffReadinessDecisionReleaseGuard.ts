export const ql127ReleaseGuard = {
  build: 'QL-127',
  title: 'Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Persistence Bounded Implementation Owner Decision Packet Review Follow-Up Readiness Review Handoff Readiness Decision',
  reviewedBuild: 'QL-126',
  mode: 'read_only_handoff_readiness_decision',
  ownerDecisionStatus: 'handoff_readiness_only_owner_not_approved',
  implementationPermission: 'not_granted',
  ledgerWriteStatus: 'planned_not_implemented',
  candidateSchemaStatus: 'drafted_not_implemented',
  endpointImplementationStatus: 'not_implemented',
  browserWriteStatus: 'disabled',
  ownerChoiceCaptureEnabled: false,
  consentCaptureEnabled: false,
  ledgerPersistenceEnabled: false,
  livePhoneSmsEnabled: false,
  providerCallbacksEnabled: false,
  liveRecordingEnabled: false,
  aiDeliveryEnabled: false,
  livePilotEnabled: false,
  requiredChecks: [
    'QL-126 has eight unique passing gates and a consistent source tally and outcome.',
    'Keep owner, implementation, schema, API, browser and ledger writes locked.',
    'Feature-PR-head App CI success.',
    'Promotion-PR-head App CI success.',
    'Exact-final-main app-build success.',
    'Exact-final-main Build disabled preview success.',
    'Exact-final-main Deploy disabled preview success.',
    'Exact-final-main Supabase Preview success.',
    'Exact-final-main Workers Builds: rosevear-comms-hub success.'
  ],
  stopConditions: [
    'Any missing, repeated, blocked or inconsistent QL-126 source gate.',
    'Any inferred owner decision, consent, approval, status change or signature.',
    'Any schema, API, Worker, browser, Supabase, ledger or retention write.',
    'Any live provider, Phone/SMS, callback, recording, DTMF, AI delivery or pilot.',
    'Any missing, pending, skipped or failing required check on the final main commit.'
  ],
  nextQueuedBuild: 'QL-128 — Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Persistence Bounded Implementation Owner Decision Packet Review Follow-Up Readiness Review Handoff Readiness Decision Review'
} as const;
