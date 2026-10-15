export const ql120DeploymentGuard = {
  build: 'QL-120',
  title: "Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Persistence Bounded Implementation Owner Decision Packet Review Readiness Decision Review",
  status: 'ready_for_promotion',
  reviewedBuild: 'QL-119',
  reviewMode: 'display_only_owner_packet_readiness_decision_review',
  ownerDecisionStatus: 'readiness_review_only_owner_not_approved',
  implementationPermission: 'not_granted',
  implementationCandidateStatus: 'not_approved',
  ledgerWriteStatus: 'planned_not_implemented',
  candidateSchemaStatus: 'drafted_not_implemented',
  endpointImplementationStatus: 'not_implemented',
  browserWriteStatus: 'disabled',
  expectedProjectUrl: 'https://gxujcwpktaickcgzyvnu.supabase.co',
  nextQueuedBuild: "QL-121 — Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Persistence Bounded Implementation Owner Decision Packet Review Follow-Up Planning",
  requiredGates: [
    'PR head app-build complete success before dev/main merge.',
    'Exact final main commit app-build completed success.',
    'Exact final main commit Build disabled preview completed success.',
    'Exact final main commit Deploy disabled preview completed success.',
    'Exact final main commit Supabase Preview completed success.',
    'Exact final main commit Workers Builds: rosevear-comms-hub completed success.'
  ],
  stopConditions: [
    'Any QL-119 source check missing, duplicated, failing or inconsistent.',
    'Any owner approval or decision recorded instead of discussed.',
    'Any Supabase/API/Worker/browser schema or write behavior created.',
    'Any Phone/SMS, provider, DTMF, callback, recording, consent, archive, audit, retention, AI send or live pilot enabled.',
    'Any exact final production gate fails or is unverified.'
  ]
} as const;
