# QL-180 — Multi-Line Routing & IVR Preview Simulator

Status: **release candidate** pending exact-main checks, disabled GitHub Pages publication and independent verification. Queue: QL-181–182 remain after this release.

## Delivered

- `app/src/operator/ql180RoutingIvr.ts` defines a deterministic, pure **local rehearsal** on top of verified QL-173 source records and pinned QL-179 inbound-call samples. No real phone numbers or call metadata are used.
- Four entirely fictitious line identities: Rosie Dazzlers business, Devil n Dove business, unresolved shared hub, and *optional isolated personal*. Personal preview is denied by default, and opting in never gives it a business destination.
- Explicit business identity guards: a business line belonging to another brand blocks before hours/answer/queue; a shared line requires keypad `1` (Rosie) or `2` (Devil). A mismatched selection blocks rather than changing the active operator context; `0`, `9`, and `#` rehearse replay, invalid key, and unresolved timeout respectively.
- Synthetic hours (`open`, `after hours`, `holiday closed`), call status (`answered`, `no answer`, `busy`, `mock provider error`) and direct-line keypad choices (`1` inquiry, `2` follow-up, `0` replay, `9` invalid, `#` timeout) determine a clear, human-readable trace and mock destination, never a live queue modification.
- `Ql180RoutingIvrPreview.tsx` adds accessible selectors, a synthetic decision path, a result and trace, prominent safety labels and zero-operation counters under **Phone/SMS safety**, next to QL-179. Switching business discards all local QL-180 choices/results. Styles scope to QL-180.
- A regression test suite covers both brands, shared/unresolved keys, personal-line isolation, cross-brand mismatch, after-hours/holiday voicemail, busy/no answer, simulated provider faults, source tampering, visible UI, disabled transport and state reset.

## Strictly disabled boundaries

**Not a routing service.** No carrier configuration, number provisioning, Bell Fibe or cell forwarding, call answering/origination/transfer, public IVR, DTMF capture, voicemail recording, SMS/MMS, callback, schedule synchronization, webhook, Supabase query/mutation or customer data. Displayed `VOICEMAIL_MOCK` and `ROUTED_MOCK` are merely simulation branch labels, not evidence of performed actions. Optional personal rehearsal cannot enter either brand's inbox or queue.

This code does not request, accept or imply permission to activate any live telecom lines. QL-181 remains the independent privacy, roles and real-world pilot-prerequisite gate.

## Verification and promotion

1. `cd app && npm run check && npm test && npm run build && npm run pages:build`.
2. `node scripts/ql171-operator-baseline.mjs`, `node --test scripts/__tests__/ql171-operator-baseline.test.mjs`, and `node scripts/__tests__/ql170-release-receipt.test.mjs`; preserve zero new external writes, provider calls and Supabase mutation.
3. Promote only seven QL-180 scope files (model, React UI, CSS, tests, operator shell integration, build record, queue status) to review branch → `dev` → `main`; do not publish unrelated dirty local checkout files.
4. Check `dev`/`main` tree equality; verify five required check runs for the *exact new main SHA* (`app-build`, `Build disabled preview`, `Deploy disabled preview`, `Supabase Preview`, `Workers Builds: rosevear-comms-hub`).
5. Check public disabled GitHub Pages responds HTTP200 and loaded JavaScript contains the QL-180 IVR UI plus explicit disabled routing boundary.

No status changes to GREEN until all verification is complete.
