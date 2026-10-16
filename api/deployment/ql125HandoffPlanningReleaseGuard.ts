export const ql125ReleaseGuard = {
  build: 'QL-125',
  title: 'Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Persistence Bounded Implementation Owner Decision Packet Review Follow-Up Readiness Review Handoff Planning',
  reviewedBuild: 'QL-124',
  mode: 'read_only_handoff_planning',
  ownerDecisionStatus: 'handoff_planning_only_owner_not_approved',
  implementationPermission: 'not_granted',
  ledgerWriteStatus: 'planned_not_implemented',
  candidateSchemaStatus: 'drafted_not_implemented',
  endpointImplementationStatus: 'not_implemented',
  browserWriteStatus: 'disabled',
  livePhoneSmsEnabled: false,
  liveAiDeliveryEnabled: false,
  consentCaptureEnabled: false,
  ownerChoiceCaptureEnabled: false,
  evidencePersistenceEnabled: false,
  releaseChecks: [
    'All eight QL-124 source review gates unique, passing and correctly tallied.',
    'No implementation, schema, browser, API or ledger-write permission was added.',
    'App CI successful on exact feature PR head.',
    'App CI successful on exact dev-to-main PR head.',
    'App CI successful on exact final main commit.',
    'Build disabled preview successful on exact final main commit.',
    'Deploy disabled preview successful on exact final main commit.',
    'Supabase Preview successful on exact final main commit.',
    'Workers Builds: rosevear-comms-hub successful on exact final main commit.'
  ],
  stopConditions: [
    'Missing or contradictory QL-124 review gate data.',
    'Any owner approval, consent or decision capture is enabled or inferred.',
    'Any schema, endpoint, Supabase, API, Worker or browser persistence is enabled.',
    'Any live Phone/SMS, callback, recording, DTMF, provider or AI sending is enabled.',
    'Any production check on exact main SHA is failing, pending, skipped or missing.'
  ],
  nextQueuedBuild: 'QL-126 — Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Persistence Bounded Implementation Owner Decision Packet Review Follow-Up Readiness Review Handoff Planning Review'
} as const;
