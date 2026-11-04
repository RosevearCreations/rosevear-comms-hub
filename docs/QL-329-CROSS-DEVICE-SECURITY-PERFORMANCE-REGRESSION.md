# QL-329 — Cross-Device Accessibility, Security, Performance & Failure Regression

**Scope:** Software-only release hardening plus the new canonical [Master/Shell/Child Source of Truth](ROSEVEAR_SOURCE_OF_TRUTH_V2_2026-11-03.md). No provider secrets, real nonproduction handshake, customer data, or remote mutation.

## Delivered checks

- A canonical four-application-shell and two-supporting-service registry. YW and iCamp are shell-level integration identities; their example companies/campgrounds are **child contexts**, not connection owners. Rosie and Devil n Dove are currently owned-business examples inside **future** multi-child shells, not falsely provisioned tenants.
- I.T. Command architecture map and six-row source/endpoint table, fully text-labelled, with fail-closed local shell/child scenario controls.
- Regression asserts denied child-as-connector, denied cross-shell child, denied support-as-customer, no implied master session, and no automatic authorization. The legacy six-source IDs remain compatible without rewriting existing signed v1 payload fields.
- Simulated 320 / 375 / 768 / 1024 / 1440-pixel DOM state checks, 44px touch minimum, keyboard focus styling, responsive grid media queries, forced-colours and reduced-motion CSS.
- Measured production bundle budgets enforced after build by [QL-329 budget script](../scripts/ql329-asset-budget.mjs). Limits: JS raw 3,500,000 bytes; CSS raw 550,000; JS gzip 780,000; CSS gzip 115,000. The script has explicit over-budget negative tests, and over-limit output fails CI.

## Baseline and acceptance limits

QL-328 pre-change CI reported ~3,084,840 JS bytes (~665,460 gzip) and ~435,250 CSS bytes (~78,330 gzip). QL-329 CI must report **actual** new sizes; merely enforcing a threshold is not proof of performance improvement. The existing large-bundle warning is a potential optimization task, not a GREEN performance score.

jsdom viewport checks validate DOM, labels and style tokens; **they are not screenshots, computed layout, a real keyboard/screen-reader session, or physical-device acceptance**. A genuine owner mobile/tablet/Windows acceptance remains pending. Existing static QL-171 safety scanning likewise cannot prove live server-side authorization.

Required release evidence: full Vitest suite; TypeScript; QL-171 and repository safety checks; actual raw/gzip bundle measurements; successful exact-main app-build, GitHub Pages disabled-preview build/deploy, Supabase and Cloudflare Workers; and independent public Worker HTML, JS/CSS SHA-256 parity on final release. Promote documentation through the same dev/main gates.

No QL-329 feature causes a real provider GET, dispatch, ACK, credential access, real business-tenant grant or remote rollback. All six integrations remain **DISCONNECTED / HOLD**; Windows relay OFF; ACK UNDER_REVIEW / PARKED_FOR_LATER. This build does **not** close the external integration workstream.

**Next build once QL-329 software is independently GREEN:** QL-330 — Final Setup Reconciliation, Owner Walkthrough Packet & Evidence-Led Next-Batch Handoff. No additional build should be autoqueued.
