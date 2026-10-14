export const ql113DeploymentGuard = {
  build: 'QL-113',
  title:
    'Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Persistence Bounded Implementation Owner Decision Planning',
  status: 'ready_for_promotion',
  ownerDecisionPlanningMode: 'display_only_bounded_implementation_owner_decision_planning',
  ownerDecisionStatus: 'planning_only_owner_not_approved',
  implementationPermission: 'not_granted',
  implementationCandidateStatus: 'not_approved',
  ledgerWriteStatus: 'planned_not_implemented',
  candidateSchemaStatus: 'drafted_not_implemented',
  endpointImplementationStatus: 'not_implemented',
  browserWriteStatus: 'disabled',
  expectedProjectUrl: 'https://gxujcwpktaickcgzyvnu.supabase.co',
  reviewedBuild: 'QL-112',
  nextQueuedBuild:
    'QL-114 — Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Persistence Bounded Implementation Owner Decision Planning Review',
  allowedScope: [
    'Display-only owner decision packet planning.',
    'Display-only owner questions, approval prerequisites, rejection/deferral dispositions, and no-write boundaries.',
    'Synthetic/public safe-read preview over existing QL-093 fallback and public validated-safe-read chain.',
    'No stored owner decision, no stored acceptance, no approval capture, no implementation enablement.'
  ],
  requiredFinalGates: [
    'PR-head app-build must pass before merge.',
    'Final main app-build must pass on the exact production commit.',
    'Final main Build disabled preview must pass on the exact production commit.',
    'Final main Deploy disabled preview must pass on the exact production commit.',
    'Final main Supabase Preview must pass on the exact production commit.',
    'Final main Workers Builds: rosevear-comms-hub must pass on the exact production commit.'
  ],
  prohibitedWriteTargets: [
    'Supabase schema, migrations, tables, views, policies, indexes, RPC functions, storage, inserts, updates, deletes, seed data, or acceptance rows.',
    'Worker/API write routes, queue producers/consumers, cron jobs, callbacks, Phone/SMS sends, inbound handlers, DTMF, recordings, consent writes, archives, audits, retention, cleanup, purge automation, AI generation/send, or live pilot runtime.',
    'Browser submit/save/approve/reject buttons, hidden forms, local persistence, stored owner decisions, stored approvals, or write-enabled controls.',
    'Private customer/provider/contact/phone/SMS/callback/recording/consent/archive/audit/retention/AI/live-pilot fields.'
  ],
  stopConditions: [
    'Stop if owner decision planning is treated as approval.',
    'Stop if any owner decision is stored or submitted.',
    'Stop if any implementation code, route, schema, migration, browser write, Supabase mutation, provider call, Phone/SMS runtime, callback, archive, audit, retention, AI delivery, or live pilot runtime appears.',
    'Stop if PR-head or final main production gates are not GREEN on the exact commit.'
  ]
} as const;
