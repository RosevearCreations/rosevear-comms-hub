export const ql121DeploymentGuard = {
  build: 'QL-121',
  title: 'Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Persistence Bounded Implementation Owner Decision Packet Review Follow-Up Planning',
  status: 'planning_only_pr_checks_required',
  reviewedBuild: 'QL-120',
  planningMode: 'display_only_owner_packet_review_follow_up_planning',
  ownerDecisionStatus: 'follow_up_planning_only_owner_not_approved',
  implementationPermission: 'not_granted',
  implementationCandidateStatus: 'not_approved',
  ledgerWriteStatus: 'planned_not_implemented',
  candidateSchemaStatus: 'drafted_not_implemented',
  endpointImplementationStatus: 'not_implemented',
  browserWriteStatus: 'disabled',
  expectedProjectUrl: 'https://gxujcwpktaickcgzyvnu.supabase.co',
  nextQueuedBuild: 'QL-122 — Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Persistence Bounded Implementation Owner Decision Packet Review Follow-Up Planning Review',
  requiredGates: [
    'QL-120 source gate identity, summary and outcome reconcile.',
    'No owner decision recorded and no schema, API, Worker or browser write added.',
    'PR head app-build completed success before merges.',
    'Exact final main app-build completed success.',
    'Exact final main Build disabled preview completed success.',
    'Exact final main Deploy disabled preview completed success.',
    'Exact final main Supabase Preview completed success.',
    'Exact final main Workers Builds: rosevear-comms-hub completed success.'
  ],
  stopConditions: [
    'Prior QL-120 gate missing, duplicated, failing or inconsistent.',
    'Owner approval, acceptance, rejection or deferral recorded as a result of planning.',
    'Any Supabase/API/Worker/browser schema, write route or mutation added.',
    'Any Phone/SMS, DTMF, provider call, callback, recording, consent, archive, audit, retention, AI send or live pilot enabled.',
    'Any production check is failing, pending or missing on the exact final main commit.'
  ]
} as const;
