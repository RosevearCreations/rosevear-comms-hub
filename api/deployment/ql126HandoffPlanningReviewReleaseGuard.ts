export const ql126ReleaseGuard = {
  build: 'QL-126',
  title: 'Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Persistence Bounded Implementation Owner Decision Packet Review Follow-Up Readiness Review Handoff Planning Review',
  reviewedBuild: 'QL-125',
  mode: 'read_only_handoff_planning_review',
  ownerDecisionStatus: 'handoff_planning_review_only_owner_not_approved',
  implementationPermission: 'not_granted',
  ledgerWriteStatus: 'planned_not_implemented',
  candidateSchemaStatus: 'drafted_not_implemented',
  endpointImplementationStatus: 'not_implemented',
  browserWriteStatus: 'disabled',
  consentCaptureEnabled: false,
  ownerChoiceCaptureEnabled: false,
  ledgerPersistenceEnabled: false,
  livePhoneSmsEnabled: false,
  aiSendingEnabled: false,
  providerCallbacksEnabled: false,
  livePilotEnabled: false,
  requiredPromotionChecks: [
    'Recompute all eight unique QL-125 handoff planning gates and matching source outcome.',
    'Keep all owner-choice, schema, API, browser and ledger-write permissions closed.',
    'Require successful exact-head feature PR app-build.',
    'Require successful exact-head dev-to-main promotion PR app-build.',
    'Require successful exact-main app-build.',
    'Require successful exact-main Build disabled preview.',
    'Require successful exact-main Deploy disabled preview.',
    'Require successful exact-main Supabase Preview.',
    'Require successful exact-main Workers Builds: rosevear-comms-hub.'
  ],
  stopConditions: [
    'A QL-125 gate is missing, duplicated, nonpassing or incorrectly tallied.',
    'Approval, consent or any owner choice is captured or inferred.',
    'Any Supabase, API, schema, evidence-ledger or browser write is introduced.',
    'Any live call, SMS, DTMF, provider callback, recording, AI send or pilot is enabled.',
    'Any required production check is missing, pending, skipped or failed on exact final main SHA.'
  ],
  nextQueuedBuild: 'QL-127 — Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Persistence Bounded Implementation Owner Decision Packet Review Follow-Up Readiness Review Handoff Readiness Decision'
} as const;
