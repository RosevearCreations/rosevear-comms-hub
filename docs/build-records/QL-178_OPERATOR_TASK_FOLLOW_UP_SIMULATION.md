# QL-178 — Operator Task & Follow-Up Simulation

## Shipped scope

- Add a brand-scoped task simulator in the QL-172 **Synthetic conversations** operator workspace, following QL-174 triage, QL-175 contact context, QL-176 drafts and QL-177 intake review.
- Reuse two **real checked-in synthetic QL-004 follow-up task fixtures**, including their verified original titles and QL-173 provenance. Derive four additional task suggestions from verified QL-093 sample conversations without creating actual tasks.
- Link each row to its canonical synthetic conversation/contact and its QL-177 review-only intake handoff. Linked canonical intake ID is shown only where an actual pinned synthetic intake exists; missing source records are never invented.
- Simulate assignment to an *unassigned*, *brand demo operator* or *brand demo reviewer*; priority *low/normal/high*; due windows *unscheduled, past demo shift, next demo shift, later demo shift*; states *open, waiting on information, blocked authorization, internal escalation review*; and a redacted synthetic internal handoff note.
- Provide brand-safe queue filtering, priority/due sorting and accessible replay history. All changes are recomputed from 1–40 sequential `SIMULATED_ONLY` screen-memory events and reset on brand switch. The **QL-178 pinned demonstration clock is `2026-10-23T18:00:00Z`** for deterministic overdue and due-soon tests; these timestamps are not real scheduling deadlines.
- Keep the source fixtures completely immutable. A suggested task is not persisted, a task cannot be marked done or archived, a demo escalation does not contact a supervisor, and no real owner/exception decision can be recorded.

## Non-negotiable safety boundary

This is a **disabled preview** only. No calls, SMS/MMS, emails, reminders, provider sends, production task assignment, booking, payments, actual follow-up, task completion, real owner authorization, hold release, new Supabase or browser-storage writes. Operators must never type private customer details, secrets or actual owner evidence. The handoff note sanitizes recognizable private identifiers prior to keeping it in temporary React state.

Invalid canonical provenance/brand links, task IDs, forged states, unexpected event order, invalid assignments or out-of-range history fail closed. Allowed task states intentionally exclude `done`, `approved`, `closed`, `booked` or `sent`. The QL-004 local inbox remains separately inventoried as a legacy demonstration, not a real private-data store.

## Release and acceptance

1. Run `npm run check`, `npm test`, `npm run build`, `npm run pages:build` in `app/`.
2. Run `node scripts/ql171-operator-baseline.mjs`, `node --test scripts/__tests__/ql171-operator-baseline.test.mjs` and `node scripts/__tests__/ql170-release-receipt.test.mjs` at repository root.
3. Promote the reviewed QL-178-only files through PRs feature → `dev` → `main`, ensuring both branches have the expected identical tree.
4. Verify the exact `main` SHA has **success** for `app-build`, `Build disabled preview`, `Deploy disabled preview`, `Supabase Preview` and `Workers Builds: rosevear-comms-hub`. Confirm the live GitHub Pages HTML and bundle expose QL-178 while still displaying disabled-preview limitations.

**Release status:** candidate until all five exact-main checks and published Pages proof succeed.

**Following queue after QL-178 is GREEN:** Four builds QL-179–182 — mock provider-neutral phone/SMS event emulator; multiline routing and IVR simulation; privacy/roles/pilot prerequisite gate; cross-brand synthetic acceptance and queue closure.
