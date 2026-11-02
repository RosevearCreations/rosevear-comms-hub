# Rosevear Comms Hub — Final Autonomous Setup, Visual & Connection-Readiness Queue (QL-311–330)

**Approved for scheduling on 2026-11-02 by owner direction:** twenty sequential **software-only** builds. The batch is authorized as a **queue and bounded scope**, not a blanket production release approval, external account authorization, permission to represent genuine owner acceptance, or an instruction to implement all twenty immediately.

**Queue:** 20 planned · **1 Production GREEN in this batch** · **19 remaining** · **next QL-312**. QL-311 is the first verified release in this scope; see the [QL-311 production record](build-records/QL-311_UNIFIED_COMMAND_NAVIGATION_CONFIG_HELP.md). Each QL item is individually implemented, tested, promoted to `dev`/`main`, and verified before changing its queue status. Do not count a draft, local test, PR, fixture, or approved plan as GREEN.

## Target outcome and autonomous authority

After QL-330, the disabled-preview application should feel like a coherent modern Operations Command Centre across **Front End / Operator, Admin, I.T. / Connections, Management, Statistical, and System Status**. Existing functionality must be genuinely usable, consistent, accessible and responsive rather than merely new mockup cards. Use the existing shell, card components, design tokens and synthetic data where possible; retire duplicate surface explanations only after preserving their evidence links.

**The assistant may autonomously:** improve UI, styles, help and navigation; refactor existing safe preview logic; maintain test-only data/contracts, public nonsecret source metadata and documentation; create credential-free configuration examples and unsent checklists; run local and CI tests; prepare release evidence and follow the existing code-promotion workflow when each build is requested. Public GitHub source metadata may be checked without credentials and must be labelled as a timestamped observation, not an authentication result.

**The assistant may not autonomously:** create or use provider credentials, store secrets, log into/modify any of the six other applications, publish signed source Proof-B on another owner's behalf, create a tenant, attach a phone number, register a webhook, connect a private gateway, issue private TEST requests, install or enable the Windows relay, send an SMS/call/email/ACK, consume real customer data, make Supabase mutations, activate an integration, accept a real owner device test or sign for management. These remain separately gated, even when the source code or Cloudflare deployment is GREEN.

**Four customer-facing business workspaces:** Rosie Dazzlers, Devil n Dove, Yard Workers and iCamp. **Two supporting services:** AI Data Platform and Rosevear AI Hub (not fifth/sixth customer tenants). All six integrations remain **`DISCONNECTED / HOLD`**; ACK Delivery Evidence remains **`UNDER_REVIEW / PARKED_FOR_LATER`**, out of this batch.

## Wave A — Visual completion and operator workflow (QL-311–320)

### QL-311 — Unified Command Navigation, Category Architecture & Screen Inventory Cleanup

**Release: Production GREEN** — [code PR #596](https://github.com/RosevearCreations/rosevear-comms-hub/pull/596) · [source/production/test receipt](build-records/QL-311_UNIFIED_COMMAND_NAVIGATION_CONFIG_HELP.md). Six colour-coded command categories, one searchable historical archive, actual breadcrumbs and contextual help, and optional Supabase config explanations shipped without live connections.

- **Deliver:** One understandable landing/navigation structure for Front End/Operator, Admin, I.T./Connections, Management, Statistical and System Status. Consolidate obsolete duplicate cards, consistent breadcrumbs, section descriptions and sensible back-navigation while preserving the existing functional routes.
- **Acceptance:** Every currently supported workspace has a discoverable entry and back path; direct navigation and company switching maintain scope; keyboard focus returns correctly; automated route census covers all six categories. No screen vanishes merely because a duplicate is removed.
- **Boundary:** Navigation is not a permission change; old evidence links remain reachable.

### QL-312 — Standard Theme Tokens, Graphic Cards, Typography & Visual Consistency

- **Deliver:** Coherent modern colour/typography/spacing/iconography, compact and comfortable card density, legible charts, status colours with text equivalents, and consistent button/form treatment across all six categories.
- **Acceptance:** Shared token/style review covers dark/bright contrast, 200–400% zoom, long labels and focus rings; no clipped navigation or status labels; screenshot comparison fixtures span the six areas.
- **Boundary:** Visual GREEN must not appear to mean live integration; retain explicit `DISCONNECTED / HOLD` and preview labels.

### QL-313 — Responsive Operator Shell, Touch Targets & Device Layout Recovery

- **Deliver:** Stable desktop/tablet/phone layouts, collapsible side navigation, mobile command-card grouping, safe overflow for dense tables and robust orientation/zoom changes.
- **Acceptance:** Automated 320/375/768/1024/1440-width regressions plus keyboard/touch-target checks; no hidden submit controls, horizontal page bleed or lost filter state after reflow; explicitly mark real-device acceptance as pending.
- **Boundary:** No claim of owner-tested physical devices; use virtual/device emulation evidence only.

### QL-314 — Unified Inbox Visual Triage, Clear Empty States & Saved Filters

- **Deliver:** Standard priority lanes, source/owner badges, search/filter chips, count summaries and recoverable in-tab saved triage views using existing QL-292 behaviour.
- **Acceptance:** Fictional inbox fixtures remain correctly company-scoped; search and reset results agree with lane counts; empty/loading/error states are accessible; no active queue action triggers a real message.
- **Boundary:** Existing reviewed preference persistence only; no real mailbox attachment or new customer storage.

### QL-315 — Conversation Timeline, Delivery-State Visual Language & Unsent Draft Recovery

- **Deliver:** Readable event timeline with distinct synthetic delivered/failed/retried states, accessible source provenance, contextual reply guidance and clearly labelled UNSENT draft recovery.
- **Acceptance:** QL-293/297 timelines retain deterministic order and replay semantics; draft recovery works in the same company/thread, exposes stale context and clears without cross-brand leakage; screen-reader chronological reading verified.
- **Boundary:** No SMS, email, call, MMS upload, provider retry or callback.

### QL-316 — Contact 360, Consent Readback & Four-Business Intake Visual Alignment

- **Deliver:** Unified customer-context layout for fictional company-specific contact details, restrictive consent labels, duplicate-review uncertainty, intake/quote handoff previews and clear contextual next steps.
- **Acceptance:** QL-295/296 linked cards show correct business context and UNSENT quote/handoff labels; a duplicate candidate cannot be shown as a confirmed merge; inaccessible/unknown consent fails closed in fixture tests.
- **Boundary:** No real contact ingestion, merge, quote delivery, booking or consent write.

### QL-317 — Multi-Line Routing, IVR Scenario Map & Safe Fallback Studio Polish

- **Deliver:** Visualize fictional line→business→menu→hours→fallback decisions in an accessible table/diagram pair, with conflict indicators, edit/revert controls and guided scenario comparisons.
- **Acceptance:** QL-298 fixture cases cover wrong brand, unknown line, closed hours, missing option and fallback loops; every unsafe route resolves to a documented disabled/held path; diagram/table parity tested.
- **Boundary:** No SIP, number purchase, live forwarding, DTMF or carrier configuration.

### QL-318 — Assignment Workboard, Follow-Up Cards & Safe Handoff Review

- **Deliver:** Consistent owner/due/severity cards, task history, attention states, shortcuts and accessible UNSENT handoff summaries across the existing synthetic queue.
- **Acceptance:** QL-294 worklist sorting/recovery preserves company isolation; keyboard shortcut help is discoverable and ignores editable fields; stale summaries must be refreshed before in-tab review.
- **Boundary:** No real assignment, external employee notification or automated follow-up delivery.

### QL-319 — Admin Preferences, Saved-View Recovery, Shortcuts & Contextual Help Finish

- **Deliver:** Consolidated Admin settings for visual density, navigation, help and safe saved-view recovery; clear descriptions of preview-only actions and account roles.
- **Acceptance:** QL-300 preferences retain validated persistence rules, reset/export decisions are explicit and safe, shortcuts are keyboard discoverable, incorrect or corrupt saved preferences fail to a default view; forms have labels/errors.
- **Boundary:** No new identity grant, password vault, secret field or unreviewed local storage of private data.

### QL-320 — Accessible Front-End Journey, Recovery States & Final Operator Visual Sweep

- **Deliver:** Cohesive four-business synthetic operator journey from inbox through contact, intake, routing, handoff and review, with consistent loading/empty/error/disabled states.
- **Acceptance:** Automated four-business journey matrix checks focus, navigation, company isolation, recovery of unsent local work and readable card layouts at supported viewport widths; publish a gap list without pretending a human owner accepted it.
- **Boundary:** No real-device owner pass, customer interaction or provider activation.

## Wave B — Management, statistics and system-status finish (QL-321–323)

### QL-321 — Management Command KPIs, Workload & Incident Drill-Through

- **Deliver:** One polished management cockpit for synthetic queue workload, incidents, owner responsibility and attention cards, with role-scoped cross-links into existing QL-301 source fixtures.
- **Acceptance:** KPI totals reconcile with drill-through rows for each company and empty/filter states; overdue and severity indicators include text, accessible tables and reproducible fixture provenance.
- **Boundary:** No invented real workforce analytics, actual incident closure or owner signature.

### QL-322 — Statistical Trend Explorer, Chart/Table Parity & Freshness Labelling

- **Deliver:** Coherent filtering, comparisons, legend/colour standards, data-source drill-down and last-observed labels from QL-302 fixture-backed series.
- **Acceptance:** Chart and table output agree for all supported time windows; null/zero/unknown are distinguished; dates and stale snapshots cannot be misread as live; export, if present, is synthetic and accessible.
- **Boundary:** No connection to real business performance, cross-tenant analytics or private data exports.

### QL-323 — System Status Health, Dependency Map & Guided Failure Recovery

- **Deliver:** Clear status cards for app/preview/build evidence and six held connectors, source freshness, user-facing incident explanations and non-destructive recovery steps.
- **Acceptance:** Offline/timeout/invalid/stale fixture states show truthful statuses; no health GREEN for an unobserved external source; accessible summary links to related I.T. diagnostics and exact release evidence.
- **Boundary:** No secret telemetry, private monitoring endpoint, automatic restart or Windows relay change.

## Wave C — Final credential-free connection details (QL-324–328)

### QL-324 — Six-App Connection Catalogue, Topology & Tenant-Scope Blueprint

- **Deliver:** One I.T. connection studio showing six source roles, public repository/deployment labels (where verified), proposed read-only information flow, per-business tenant boundaries and supporting-service separation.
- **Acceptance:** All six source cards have owner-safe scope descriptions, capability status, precise blockers and diagram/table equivalence; no fifth or sixth customer tenant is manufactured. Company selection never exposes another brand's fictional customer data.
- **Boundary:** Source metadata is a plan, not a usable configured integration or authority proof.

### QL-325 — Immutable Proof, Independent Authority & Connection Gate Readback

- **Deliver:** Simplified six-source five-gate checklist with dated original public proof snapshots, exact immutable commit/path links, source drift history and a clear independent custody/owner TEST decision gap.
- **Acceptance:** Missing/403/404/429/200 states are distinct; any public request made is credential-free GET only and recorded with time/SHA; 200 alone never advances the independent signature/tenant/owner gates; unverified claims remain labelled unverified.
- **Boundary:** No signed Proof-B creation or independent attestation performed by the app; ACK remains parked.

### QL-326 — Nonsecret Connection Configuration Matrix & Environment Preparation Guide

- **Deliver:** Per-source descriptive contract sheet listing *names* of required variables, environment (local/preview/TEST), allowed GET paths, tenant scope, expected response shape, failure fallback and human responsibility; safe downloadable checklist if useful.
- **Acceptance:** Validator accepts only nonsecret aliases and metadata; rejects URLs containing credentials, tokens, personal records and unknown tenant scopes; every source stays `DISCONNECTED / HOLD`; configuration examples cannot initiate a request.
- **Boundary:** Never create, reveal or copy API keys, configure live Cloudflare/Supabase secrets, write remote project settings or enable the private relay.

### QL-327 — Six-App Contract Compatibility, Fixture Handshake & Version Matrix

- **Deliver:** Reusable versioned synthetic GET-only capability contracts and response validators for four business sources plus two support roles, with mismatch and rollback explanations.
- **Acceptance:** Positive and negative mock cases cover field removal, schema version, wrong tenant, absent consent and unexpected privileges; no real gateway call; automated isolation suite verifies business and support roles cannot be confused.
- **Boundary:** Contract readiness is **not** a negotiated/authenticated peer handshake or real data permission.

### QL-328 — Nonproduction Dry-Run Orchestrator, Failure Matrix & Reversible NO-GO Packets

- **Deliver:** Credential-free sandbox-only sequence preview for proof→authority→scope→GET plan→fallback, including mock 401/403/404/409/429/5xx/timeout, offline/replay and clear rollback/stop conditions.
- **Acceptance:** Every failed or unknown prerequisite deterministically produces **NO-GO** and an UNSENT handoff; idempotent mock retries and cancellation tests are reproducible; nothing can flip a held connector to CONNECTED from a local button.
- **Boundary:** No real nonproduction TEST, credential submission, private GET, dispatch, ACK or owner sign-off.

## Wave D — Hardening and release handoff (QL-329–330)

### QL-329 — Cross-Device Accessibility, Security Boundary, Performance & Failure Regression

- **Deliver:** Consolidated automated regression covering navigation, visual focus, responsive layout, contrast, reduced motion, chart/table accessibility, brand separation, fixture-only communications and connection holds; optimize slow or oversized client paths with measured results.
- **Acceptance:** TypeScript, unit/integration/e2e-or-available browser tests, QL-171 safety baseline, release build, bundle budget and targeted 320–1440-width smoke pass; publish actual before/after measurements and remaining manual-device gaps rather than claiming an owner pass.
- **Boundary:** No weakening security, CSP, data minimization, missing evidence gates or production release rules to improve a score.

### QL-330 — Final Setup Reconciliation, Owner Walkthrough Packet & Evidence-Led Next-Batch Handoff

- **Deliver:** Reconcile each QL-311–329 source change to its exact verified `main` receipt, show completion/remaining gaps in Admin/I.T./Management/Statistical/Status, prepare a short owner-friendly cross-device walkthrough and explicit independent-evidence outstanding list.
- **Acceptance:** 20/20 may be claimed only after QL-330 itself passes exact `main` checks and live bundle verification; final packet distinguishes software checks from owner acceptance, authentic proof, private TEST permissions and connection activation; every item links to source/test/deploy evidence.
- **Boundary:** **Do not auto-queue QL-331 or later.** The next batch must be proposed from genuine owner acceptance findings plus independently verified external evidence, and requires a **new explicit owner authorization before implementation**.

## Order, proof and batch gate

| Sequence | Scope | Planned | Current completed | Remaining |
| --- | --- | ---: | ---: | ---: |
| QL-311–320 | Design, operator workflow and accessibility polish | 10 | 1 | 9 |
| QL-321–323 | Management, statistics and system status | 3 | 0 | 3 |
| QL-324–328 | Six-app nonsecret connection readiness and mock failure contracts | 5 | 0 | 5 |
| QL-329–330 | Regression, final reconciliation and owner packet | 2 | 0 | 2 |
| **Total QL-311–330** | **Final autonomous-setup batch** | **20** | **1** | **19** |

**Build-by-build release gate:** A build must have a source diff and focused regression, complete app suite, TypeScript, QL-171 safety check, production asset build, GitHub feature→`dev`→`main` receipt, all applicable **exact-main** successful checks (including `Workers Builds: rosevear-comms-hub`), and SHA-256 comparison of live Worker JS/CSS with tested artifacts. Document the exact code/main receipt in its individual `docs/build-records/` record; update the queue ledger from `1/20` one release at a time. A later documentation-only receipt commit must also pass its own applicable final checks. Cloudflare **production GREEN** means released preview code only.

**After QL-330:** No automatic batch. Gather real owner observations from physical devices, independently verified signed source evidence and source-owner/custodian decisions, and measured production results. The owner must choose/authorize a separate next roadmap. Do not remove the ACK `UNDER_REVIEW` classification or the six `DISCONNECTED / HOLD` gates by implication.
