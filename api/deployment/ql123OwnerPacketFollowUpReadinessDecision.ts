export const ql123DeploymentGuard = {
  build: 'QL-123',
  title: 'Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Persistence Bounded Implementation Owner Decision Packet Review Follow-Up Readiness Decision',
  status: 'readiness_only_production_checks_required',
  reviewedBuild: 'QL-122',
  readinessMode: 'display_only_owner_packet_follow_up_readiness_decision',
  ownerDecisionStatus: 'follow_up_readiness_only_owner_not_approved',
  implementationPermission: 'not_granted',
  implementationCandidateStatus: 'not_approved',
  ledgerWriteStatus: 'planned_not_implemented',
  candidateSchemaStatus: 'drafted_not_implemented',
  endpointImplementationStatus: 'not_implemented',
  browserWriteStatus: 'disabled',
  expectedProjectUrl: 'https://gxujcwpktaickcgzyvnu.supabase.co',
  nextQueuedBuild: 'QL-124 — Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Persistence Bounded Implementation Owner Decision Packet Review Follow-Up Readiness Decision Review',
  requiredGates: [
    'All eight QL-122 source gates exist exactly once and pass.',
    'QL-122 source tally agrees with stated outcome.',
    'All owner, evidence ledger, schema, endpoint and browser permissions remain locked.',
    'PR head app-build completes successfully before each merge.',
    'Exact final main app-build succeeds.',
    'Exact final main Build disabled preview succeeds.',
    'Exact final main Deploy disabled preview succeeds.',
    'Exact final main Supabase Preview succeeds.',
    'Exact final main Workers Builds: rosevear-comms-hub succeeds.'
  ],
  stopConditions: [
    'Missing, duplicate, failing or mismatched prior review gates.',
    'Any owner approval, consent or choice inferred or captured.',
    'Any schema/migration, persistence route, Supabase/browser/API write or evidence ledger storage.',
    'Any live Phone/SMS, DTMF, provider webhook/call, recording, AI delivery or pilot activation.',
    'Any production check is failing, skipped, pending or unverified on final main SHA.'
  ]
} as const;
