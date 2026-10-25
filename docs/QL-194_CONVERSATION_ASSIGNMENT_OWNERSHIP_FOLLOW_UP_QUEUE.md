# QL-194 — Conversation Assignment, Ownership & Follow-Up Queue

## Delivered

The QL-191 four-company operator console now includes **Assignments & follow-ups** beside Unified Inbox and Customer 360. Every example is fabricated and runs in memory only; this is not live task, notification, dispatch, or staff-management infrastructure.

### Four isolated business queues

| Business | Examples | Fictional roster |
|---|---|---|
| Rosie Dazzlers | Missed booking call, salt-stain SMS, ceramic coating estimate, fleet inquiry | Intake coordinator, detailing lead, estimator |
| Devil n Dove | Commission voicemail, keepsake timing, resin colour, workshop material handoff | Orders coordinator, maker, commission estimator |
| iCamp | Arrival gate, campsite inquiry, visitor pass, maintenance handoff | Front desk, maintenance, events |
| YW | Septic voicemail, plowing schedule, garbage stickers, fibre-site constraints | Dispatcher, crew lead, service estimator |

- Four seeded follow-up tasks and three **fictional** owners per business; all task IDs, source conversation IDs and owner IDs are scoped to one organization.
- Search by source, topic, contact or sample owner; filter all, attention, unassigned and completed tasks; further filter by owner. Tasks are sorted by simulated due bucket, completion, priority and stable ID.
- Manage assignment/unassignment, open/waiting/done status, high/normal priority, and **illustrative** overdue/today/soon/later windows. There is no actual clock, due date, timer, SLA, or reminder sent.
- Session-only action receipts label the edited task, sequence and change. They are **not** server audit records, actor-verified events or legal evidence.
- From any QL-192 inbox thread, open the queue for its exact source. If the sample thread has no task, create one explicit unassigned follow-up; duplicate task creation is blocked. From a QL-193 source, open its follow-up. From a queue task, reopen the exact inbox source and, where explicitly linked, the Customer 360 profile.
- Team/internal coordination threads may have assigned sample tasks, but must **not** gain fictitious customer identity from a staff-only note.
- State persists only while navigating inside the selected business during the current page session. Changing business resets queue changes and simulated receipts, with no cross-business leakage; reload resets everything.
- Responsive panels, keyboard focus indicators, high-contrast forced-colour rules, accessible labels and `ⓘ` help.

## No live operation or identity claims

The rosters are not real people, logins or role grants. Assigning a fictional member does **not** send a notification, generate a service work order, call a telephone, start a reminder, modify Supabase, update a customer record or establish permission to read tenant data. No personal information should be entered into the public disabled preview. The same restrictions apply to iCamp's future campground tenant model and YW's company tenant model.

Production deployment **GREEN** means GitHub Pages' disabled synthetic UI is published. All **12** QL-181/QL-190 pilot prerequisites remain **HELD**; none of QL-194's work enables live SMS, voice, webhooks, provider billing, customer data, owner approvals, database writes or internal staff authorization. A future real queue will need server-side membership/role controls, tenant-safe Supabase RLS, authenticated assignment receipts, retention and notification safeguards, and explicit approval before activation.

## Acceptance

1. `npm run check`, `npm test`, `npm run build`, `npm run pages:build` (from `app`). The `ql194FollowUpQueue.test.tsx` suite checks source validity, isolation, no-op rejection, receipts, assignment/reassignment, status/priority/due edits, existing/new inbox handoff, responsive accessibility and no browser/network writes.
2. Re-run the QL-170/171 release baseline and QL-188/189/190 safety harness tests and auditors.
3. Verify source-tree parity between promoted `dev` and `main`, the **five successful exact-main checks** (`app-build`, `Build disabled preview`, `Deploy disabled preview`, `Supabase Preview`, `Workers Builds: rosevear-comms-hub`) and the public asset marker `ql194-assignment-follow-up-queue-v1`.

After QL-194, **4 of 20** interface/integration roadmap milestones are delivered. Proposed next: **QL-195 — Safe Reply Drafting, Templates & Explicit Approval Gates**; still no provider sending until authorized.
