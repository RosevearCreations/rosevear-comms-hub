# QL-216 — Four-Company Escalation Review Replay & Owner-Safe Handoff Packet Audit

Release marker: `ql216-four-company-escalation-review-replay-owner-safe-handoff-audit-disabled-preview-v1`

## Purpose

Continue QL-211→QL-215 preview acceptance without converting simulated review activity into real approval. This release adds an operator workspace for a **local-only escalation replay** and **owner-safe handoff packet** covering Rosie Dazzlers, Devil n Dove, iCamp and Yard Workers (YW).

## Owner workflow

1. In the QL-211 owner trial, enter a **fictional** observed gap. Do not enter customer information.
2. In QL-212, execute a synthetic replay and draft fictional repair/retest evidence.
3. In QL-213, prepare an unverified comparison and local review checklist.
4. In QL-214, add at least one unresolved evidence gap and prepare the local reviewer intake.
5. In QL-215, start simulated tracking. Advance an explicit fictional review cycle until a gap requires escalation, or draft a fictional escalation follow-up.
6. In **Escalation replay & owner-safe handoff**, choose the scenario and start a local review replay. Save a fictional, unsent disposition and prepare the local packet.
7. Inspect four-company source status, open gap codes, the immutable QL-181 hold register and the PII-minimized local receipt.

## Reconciliation & safety contract

- No pre-seeded independent review, owner decision, actual repair, packet, signoff or closure exists. Fresh sessions show zero cases.
- A QL-216 packet requires a current QL-215 review with at least one escalation-due gap **or** a fictional escalation draft. A watch-only case cannot start a packet.
- The packet's change detector includes the QL-215 source token, simulated review cycle, priority/category codes, gap follow-up codes and last-review-cycle numbers. This is a **non-cryptographic, in-memory comparison**, never a signature.
- Subsequent QL-215 cycle advancement, follow-up edits, QL-214 intake changes or upstream invalidations freeze the old packet. A local reset explicitly discards that case's draft; another company is untouched. Withdrawn source cases count as stale, not closed.
- Packet phases are `review_draft` and `local_handoff_prepared`. They do not imply real delivery. No outbound email, phone, SMS/MMS, carrier operation, notification, webhook, Supabase write or privileged approval operation exists in this workspace.
- Local free-text notes are **not included** in the fixed-schema receipt. Neither source tokens, reviewer identities nor customer data are exported. Users are reminded to write fictional examples only.
- All 12 QL-181 live-pilot prerequisites stay `HELD_UNVERIFIED`, conditional release stays `BLOCKED`, and actual owner/independent approvals stay `false`. Software production GREEN is not permission to enable communications.

## Acceptance expectations

- Verify empty session and four-company overview; verify 12 immutable holds.
- Verify source-gated replay, explicit fictional packet drafting/preparation and no side effects.
- Verify source-revision freeze, stale/orphan accounting and company isolation.
- Verify receipt schema excludes free-text and fingerprints; check no live approval/dispatch fields become true.
- Verify desktop/mobile sizing, keyboard focus, status warnings and accessible form labels.
- Run `npm run check`, `npm test`, `npm run build` and `npm run pages:build` in `app/` before promotion to `dev`, then `main` and exact-main production gates.
