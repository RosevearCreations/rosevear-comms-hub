# QL-171 — Operator Workflow Baseline & Gap Register

Scope: inventory and drift checks only. **QL-171 does not unify the UI, change runtime behaviour, change database schema, activate live communications, or collect real owner approvals.** The public application remains a disabled preview for two brands.

## 1. Runtime entrypoints and visible operator surfaces

**Snapshot before QL-172:** `app/src/main.tsx` mounted the components separately in one React root inside `AdminSessionGate`. There was no shared route-based operator shell: QL-004 navigation was component state, and later previews were separate expand/collapse panels. **After the QL-172 implementation**, `OperatorShell` mounts these existing components as embedded views with shared brand context and accessible navigation. The inventory below records the legacy behaviour and its trust boundaries (unchanged by the shell).

| ID | Surface / source | Trust classification | Brands | Actual current behaviour |
| --- | --- | --- | --- | --- |
| S01 | `app/src/auth/AdminSessionGate.tsx` | `local-prototype` / guarded auth | Shared | Local-only banner when Supabase config gates are off; optional magic-link login, `app_admins` allowlist check and reference reads if specifically configured. This does not authorize customer-data use. |
| S02 | `app/src/App.tsx` — inbox | `local-prototype` | Both | Local conversations, filters by status/tag/channel/text, selectable conversation details, local status changes. |
| S03 | `app/src/App.tsx` — contacts | `local-prototype` | Both | Brand-filtered local contact list and contact detail. Shared local database; not a security isolation boundary. |
| S04 | `app/src/App.tsx` — tasks | `local-prototype` | Both | Local task queue and completion changes. |
| S05 | `app/src/App.tsx` — intakes | `local-prototype` | Both | Local quote/custom-order intake listings and synthetic answer fields. |
| S06 | `app/src/App.tsx` — data tools / manual lead | `local-prototype` | Both | Manual lead form, JSON import/export, and reset can write/export browser-local records. **Use synthetic demonstration data only.** |
| S07 | `app/src/operator/DisabledInterfacePreview.tsx` | `synthetic-read` | Both | Static synthetic conversations, draft and timeline tabs, read-only client readiness/fallback information, blocked action examples. |
| S08 | `app/src/operator/Ql093SafeReadPreview.tsx` | `synthetic-read` | Both | Guarded synthetic-view reads with fallback; large QL-093–169 governance evidence chain and hold/prerequisite display. No owner approval action. |
| S09 | `app/src/operator/DisabledOperatorConsole.tsx` | `live-disabled` | Shared | QL-068 static pathway decision panel; phone/SMS and provider actions are documented as locked. Its old future-hosting language is now stale. |
| S10 | `app/src/help/SiteHelpSystem.tsx` | `local-prototype` | Shared | Help interface mounted independently of the QL-004 navigation. |
| S11 | Live phone, SMS, provider callbacks, IVR, owner approvals | `future-integration` | Both | No authorized interactive provider/approval service in the audited frontend; proposed future adapters remain out of scope. |

## 2. Data paths and trust boundaries

| ID | Source → consumer / file | Current storage or side effect | Classification and constraint |
| --- | --- | --- | --- |
| D01 | `app/src/data/seedData.ts` → `app/src/storage/localRepository.ts` → QL-004 `App` | Demo database copied into browser localStorage; `saveHubDb` updates it | `local-prototype`; values entered here can persist across visits in that browser, so do not enter real customer/owner evidence. |
| D02 | `app/src/api/hubApi.ts` → local repository | Lead, status, note and task mutations; import/reset/export | `local-prototype`; no network send, but client-side persistence and JSON disclosure are real browser effects. |
| D03 | `app/src/supabase/client.ts`, `app/src/auth/AdminSessionGate.tsx`, `app/src/supabase/readModel.ts` | Flag-gated Supabase Auth magic-link and allowed admin/brand reference reads; auth may persist a session | Guarded *separately* from the public synthetic-read client. Never equate an authenticated session with approved live communications. |
| D04 | `app/src/integrations/supabaseReadOnlyClient.ts` → `app/src/operator/ql093ValidatedSyntheticSafeReads.ts` | Optional anon-key reads from `ql_public_synthetic_conversations` and `ql_public_system_status`, with project allowlist and fail-closed fallback | `synthetic-read` only. The SQL views use `security_invoker = true`; live customer tables remain outside the allowlist. |
| D05 | `app/src/operator/DisabledInterfacePreview.tsx` and QL-093+ operator logic | Local constants / synthetic evidence calculations | `synthetic-read` and in-memory display, not a durable owner decision ledger. |
| D06 | `supabase/functions/ql-status/index.ts` | GET-only status scaffold; no persistence or send | `live-disabled` readiness endpoint, not a phone/SMS runtime. |
| D07 | `.github/workflows/pages-disabled-preview.yml` / `wrangler.jsonc` | Static preview build and Worker asset build | `live-disabled`; GitHub Pages job explicitly fixes provider, persistence and live-pilot env flags to false. Release checks certify deployment only. |

**Important distinction:** Supabase Auth's optional session persistence (D03) and the QL-004 localStorage demo (D01/D02) are separate from the browser-safe public synthetic-view reader (D04). No status badge, historical synthetic owner field, or `humanApproved: true` property in demo messages constitutes a real owner decision.

## 3. Prioritized gap register

| ID | Priority | Gap / observed evidence | Next planned build |
| --- | --- | --- | --- |
| G01 | P0 | QL-004 accepts and persists free-text names, phones, notes and imports; there is no production-grade private data retention/consent model. Public preview must carry synthetic-only warning. | QL-172/173/181 |
| G02 | P0 | QL-004 brand scope is client-side filtering of one local database, not tenant authorization. | QL-173/174/181 |
| G03 | P0 | QL-004, QL-068, static synthetic preview and QL-093–169 review panel have independent navigation and inconsistent age/terminology. | QL-172 |
| G04 | P0 | `Message.humanApproved` in local demo records is not a verified owner sign-off; synthetic governance panels must not be mistaken for approval evidence. | QL-173/181 |
| G05 | P1 | Local contact/thread/task/intake types and public-view synthetic rows have different shapes/identities and no unified provenance migration. | QL-173 |
| G06 | P1 | Current inbox has basic filters but no consolidated triage queue, assignment or consistent priority interpretation across both preview surfaces. | QL-174 |
| G07 | P1 | Contact view has no complete consent/STOP/HELP ledger or safe duplicate/identity resolution flow. | QL-175/181 |
| G08 | P1 | Static preview drafts are samples only; QL-004 internal notes are not a channel-aware unsent composer. | QL-176 |
| G09 | P1 | The two brands have intake types but no guided, preview-only detailing/custom-maker handoff journeys. | QL-177 |
| G10 | P1 | Local task completion is not a replayable cross-brand ownership, escalation or blocked-hold simulation. | QL-178 |
| G11 | P2 | No provider-neutral emulator exercises inbound SMS, missed-call, voicemail and delivery failure contracts end to end. | QL-179 |
| G12 | P2 | No multi-line routing/IVR simulator represents the two business lines and optional personal line. | QL-180 |
| G13 | P0 | Real deployment authorization, RLS/tenant review, secrets, carrier consent, retention policy and human sign-off prerequisites remain open. | QL-181 |
| G14 | P1 | Full synthetic two-brand operator journey is not yet an independently verified accessibility and disabled-integration acceptance suite. | QL-182 |

P0 marks a prerequisite or current safety concern, **not** a request to enable that capability early. The QL-171 release addresses inventory and detection of drift, not these later remediation items.

## 4. Testable operator journey (fixtures only)

1. Load the disabled preview with its local-only banner and synthetic samples. Confirm there is no live send/call action.
2. Select **Rosie Dazzlers** in the QL-004 shell; view the sample SUV/pet-hair conversation, linked intake, status and task.
3. Change to **Devil n Dove**; only that brand's local conversation and custom maker request should appear in the QL-004 filtered view. This is *display filtering*, not server-side tenancy proof.
4. Open the independent synthetic preview and QL-093 safe-read panel. Select both brands, inspect synthetic draft/timeline/evidence and their fallback states; real provider delivery and owner approval stay unavailable.
5. Treat any QL-004 change, import or export as a **local demo mutation**. Never use actual names, phone numbers, customer conversations or owner decisions in this public preview.

## 5. Drift verification and acceptance boundary

Run from the repository root (the source anchor recognizes the subsequent QL-172 shell, so the inventory stays testable when both builds ship together):

```bash
node scripts/ql171-operator-baseline.mjs
node --test scripts/__tests__/ql171-operator-baseline.test.mjs
cd app && npm run check && npm test && npm run build
```

The QL-171 validator checks the documented UI mounts, localStorage and Supabase read/auth anchors, source-file trust classifications, exact gap IDs, and **new unexpected frontend data sinks** against an allowlist. A new sink or a moved entrypoint fails closed until this register is reviewed. This static test is a drift alarm, **not** a substitute for runtime security review, Supabase RLS audit, consent verification, or live-provider acceptance.

**Authorization state after QL-171:** live calls = off; SMS/MMS = off; callback/webhook runtime = off; real customer data use = not approved; real owner approvals = not recorded/accepted; held-case closure = blocked. QL-172 implements navigation only; the unresolved G01/G02/G04–G14 safety/data gaps remain for later builds.
