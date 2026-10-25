# QL-197 — Tasks, Reminders & Calendar

## Delivered

- Tenth operator workspace for all four businesses: a three-week **fictional calendar** and a filtered task agenda drawing directly from the in-memory QL-194 assignment queue.
- Four fixed illustrative due dates (October 25, 26, 28 and November 2, 2026) mapped to overdue/today/soon/later demonstration windows. Dates do not advance with time and are **not real deadlines**.
- Previous/reset/next example-week buttons and clickable calendar entries; active/all/done filters; sample owner, source, priority and status context.
- Task due-bucket editing through the existing QL-194 guarded reducer, with session-only receipt and matching queue/calendar state. Navigation to the exact task's follow-up queue or QL-192 source conversation.
- Local reminder flags for active sample tasks, with explicit toggle, count, and disabled delivery/invite/synchronization controls. Flags are held only in the parent operator component while navigating the selected company; switching company or reloading resets them. Completed and foreign tasks cannot receive a flag.
- Responsive cards, fixed-date warning and `ⓘ Help`.

## Safety boundary

The planner has no real clock triggers, scheduling service, calendar provider, invites, email, SMS, work dispatch, retention, authenticated staff, service-level promise, customer or tenant data, server request, local storage, or notifications. Demo reminder flags are not scheduled jobs. The twelve live-pilot prerequisites remain held. A future real calendar/reminder integration requires verified tenant roles, timezone policy, server-side scheduling with idempotency and retries, consent/notification preferences, logging, retention, and owner approval.

## Acceptance

Run `npm run check`, `npm test`, `npm run build`, `npm run pages:build` from `app/` and retain existing QL-170/171/188/189/190 safety CI. The QL-197 suite checks four-company isolation, immutable example weeks, fixed date mapping, guarded reminder changes, week navigation, queue sharing and company reset. Certify Production GREEN only with five exact-main checks, identical `dev`/`main` source trees and a published `ql197-tasks-reminders-calendar-v1` marker.
