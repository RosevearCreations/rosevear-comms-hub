# Quo-lite next required build queue — QL-171 through QL-182

Status: **QL-171–176 promoted to exact-main GREEN** (QL-176 main commit `e6c365045eb14a24e9b6bc8dd9c42d7810415ed2`); **QL-177 is the current implementation/release candidate; QL-178–182 remain queued.** QL-177 may be called GREEN only after its own exact-main application, Pages, Supabase Preview and Workers checks succeed. Publication of a roadmap never authorizes live operations.

## Product objective

Make the existing disabled-preview Quo-lite application a coherent, genuinely reviewable **two-brand communications operator prototype** for **Rosie Dazzlers** and **Devil n Dove**. The next batch prioritizes visible operator workflows and reproducible synthetic acceptance tests rather than extending the synthetic owner-decision evidence chain indefinitely.

Current baseline to preserve and reconcile:

- `app/src/App.tsx` contains the older QL-004 local inbox, contact, intake and task workflows.
- `app/src/storage/localRepository.ts` currently uses browser localStorage and includes manual-lead import/export. It is **not** an approved private customer-data store. QL-171 must inventory this existing behaviour and the follow-on builds must not expand its real-data use.
- `app/src/operator/DisabledOperatorConsole.tsx` is a static disabled operator console, while `app/src/operator/Ql093SafeReadPreview.tsx` contains later QL-093–170 synthetic governance and review material.
- `app/src/types.ts` already defines both brands, messages, contacts, conversations, tasks and intakes. Reuse and reconcile these rather than introducing a conflicting second model.
- The GitHub Pages / Workers surface remains **disabled preview**; prior release-verification checks do not imply live service readiness.

## Prioritized implementation sequence

| Build | Scope and deliverable | Acceptance evidence / completion gate |
| --- | --- | --- |
| **QL-171 — Operator Workflow Baseline & Gap Register** | Inventory all current operator screens, existing user-visible features, data sources, browser writes, synthetic fixtures, unused modules, and live integration risks. Create a route/feature matrix for both brands and a small, testable operator journey. | Checked-in baseline and gap register; each feature marked *live-disabled*, *synthetic read*, *local prototype* or *future integration*; no new sends, writes, approvals or data collection. |
| **QL-172 — Unified Operator Shell & Accessible Navigation** | Bring the QL-004 inbox, disabled operator screen and later synthetic-review area under clear, coherent operator navigation. Add two-brand context, disabled-preview indicators and responsive, keyboard-accessible controls. | Screen and route tests for both brands, no misleading action enabled, visible disabled-preview boundary on each major surface; mobile/keyboard checks. |
| **QL-173 — Canonical Synthetic Conversation Model & Fixture Migration** | Reconcile contact, conversation, message, intake, task and audit shapes; add stable synthetic IDs, source/provenance and fixture versioning, deterministic sorting, and per-brand relation checks. | Migration/fixture tests detect orphan links, invalid brand references, missing provenance, schema drift and cross-brand leakage; no real database migration. |
| **QL-174 — Brand-Safe Inbox & Triage Preview** | Present useful conversation queues (new, needs reply, awaiting customer, quote, follow-up), filtering, search, priority and assigned-operator labels using fixtures. Simulate triage transitions without affecting customers. | Filter/sort/search tests and explicit brand isolation; state changes are preview-only and cannot dispatch messages or close real holds. |
| **QL-175 — Contact Context & Consent-State Preview** | Make a readable synthetic contact profile, linked conversation history, possible duplicates and consent/opt-out status. Distinguish unknown consent from granted consent; do not infer permission from a phone number. | Tests for duplicate candidates, ambiguous identity and consent-unknown safety; no real contact ingestion or permission updates. |
| **QL-176 — Conversation Timeline & Unsent Draft Workspace** | Show channel-aware events, internal notes, delivery-state examples and an accessible draft composition preview. An explicit **UNSENT / SIMULATED** state must follow every draft. | No send/provider/approval call path; automated tests cover failed deliveries, redaction and unsent draft states; no added browser persistence or export of private drafts. |
| **QL-177 — Brand-Specific Intake & Quote Handoff Preview** | Synthetic Rosie Dazzlers workflows for vehicle/service/condition/photo requests and Devil n Dove workflows for maker technique, materials, custom design/reference photos and time estimates. Link intake to conversation and review task. | Distinct brand templates and validated synthetic handoff fixtures; no quote, booking, payment, customer email or production commitment issued. |
| **QL-178 — Operator Task & Follow-Up Simulation** | Simulate assignments, priorities, due times, waiting states, escalation and handoff notes in the operator view, with separation between internal tasks and actual owner decisions. | Replayable synthetic task journeys; due/overdue/blocked tests; nothing triggers reminders, private approvals or hold closure. |
| **QL-179 — Provider-Neutral Phone/SMS Event Emulator** | Define inbound/outbound event, status, error, webhook validation and idempotency contracts in a mock-only harness. Use synthetic call, voicemail, missed-call and SMS events to feed the operator view. | Mock events pass contract and replay tests; production secrets, real provider webhooks, call origination, SMS dispatch and callbacks remain unconfigured/disabled. |
| **QL-180 — Multi-Line Routing & IVR Preview Simulator** | Diagram and exercise routing for a shared hub serving two business numbers and an optional personal line. Model hours, missed calls, voicemail and keypress decisions with safe fixtures. | Cross-brand routing/DTMF test suite, ambiguous-line fallback, error and no-answer paths; no change to Bell Fibe, cell accounts, forwarding, live numbers or carrier settings. |
| **QL-181 — Privacy, Roles & Live-Pilot Prerequisite Gate** | Review least-privilege roles, customer-data retention, consent, abuse prevention, source authentication, secret storage, operator identity and owner sign-off prerequisites. Keep gaps visibly held. | Written privacy/security decision matrix plus deny-by-default tests; no real owner approval represented, collected or bypassed; no authorization to connect live services. |
| **QL-182 — Synthetic Operator Journey Acceptance & Queue Closure** | Run a cross-brand end-to-end walkthrough: simulated contact/event → inbox → context → draft → intake → task → receipt. Reconcile the queue and produce exact-commit build/deployment evidence. | CI, accessibility, brand-isolation and disabled-integration tests pass; documented exact-main checks if promoted; queue counts and next-batch handoff are accurate. |

## Guardrails that apply to all QL-171–182 builds

1. **Disabled preview only.** No live phone calls, SMS, MMS, email sends, call recording, forwarding, provider callback/webhook activation, IVR operation or AI-generated external message delivery.
2. **Synthetic identities and evidence only.** Do not enter, fetch, export or persist actual customer/private owner decision evidence in public preview. Existing localStorage/import/export behaviour is a baseline risk for QL-171 review, not approval for new personal-data use.
3. **No owner-approval simulation may masquerade as a real approval.** Real sign-off, exception release and held-case closure stay blocked until separate human authorization and a security/privacy acceptance process.
4. **No hidden integrations.** Mock providers have no reachable production endpoints or credentials; any future real-provider pilot requires an explicit, separately approved build and rollout decision.
5. **Incremental, independently verifiable releases.** Each build gets focused tests, a build record, development review and only then any separately requested `dev` → `main` promotion with exact-main production checks. Do not call a build GREEN solely because files exist on a branch.

## Dependencies and work still outside this batch

QL-171 must precede UI refactoring; QL-173 supplies the fixture model used by QL-174–180; QL-181 records, but does **not grant**, future live-pilot authorization. Full provider provisioning, telecom integration, authenticated Supabase customer writes, actual owner decisions, real customer importing, paid numbers and live operations are **outside** QL-171–182.

**Queue accounting:** 12 original builds, QL-171–182 inclusive. QL-171–176 are promoted. QL-177 brand-specific intake and internal quote handoff preview is this release candidate. After QL-177 is promoted, **5 follow-on builds (QL-178–182)** remain for separately requested implementation. None of these builds grant live operating authority.
