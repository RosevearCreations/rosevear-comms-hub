export const ql122DeploymentGuard = {
  build: 'QL-122',
  title: 'Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Persistence Bounded Implementation Owner Decision Packet Review Follow-Up Planning Review',
  status: 'review_only_promotion_checks_required',
  reviewedBuild: 'QL-121',
  reviewMode: 'display_only_owner_packet_review_follow_up_planning_review',
  ownerDecisionStatus: 'follow_up_plan_review_only_owner_not_approved',
  implementationPermission: 'not_granted',
  implementationCandidateStatus: 'not_approved',
  ledgerWriteStatus: 'planned_not_implemented',
  candidateSchemaStatus: 'drafted_not_implemented',
  endpointImplementationStatus: 'not_implemented',
  browserWriteStatus: 'disabled',
  expectedProjectUrl: 'https://gxujcwpktaickcgzyvnu.supabase.co',
  nextQueuedBuild: 'QL-123 — Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Persistence Bounded Implementation Owner Decision Packet Review Follow-Up Readiness Decision',
  requiredGates: [
    'All eight QL-121 gates exist exactly once and all passed.',
    'QL-121 recomputed tally and stated ready outcome agree.',
    'Owner decisions remain deferred; implementation and write permissions are not granted.',
    'PR-head app-build completes successfully before merges.',
    'Exact main commit app-build completes successfully.',
    'Exact main commit Build disabled preview completes successfully.',
    'Exact main commit Deploy disabled preview completes successfully.',
    'Exact main commit Supabase Preview completes successfully.',
    'Exact main commit Workers Builds: rosevear-comms-hub completes successfully.'
  ],
  stopConditions: [
    'Missing, duplicated, failed or miscounted QL-121 gate.',
    'Any owner approval, consent, acceptance or rejection recorded or inferred.',
    'Any schema migration, Supabase write, API/Worker mutation or browser decision submit.',
    'Any live Phone/SMS, DTMF, provider callback, call recording, consent/retention writing, AI delivery or pilot activation.',
    'Any relevant check is missing, still running, skipped when required, or failing on exact final main commit.'
  ]
} as const;
