# QL-185 — Private Data Minimization & Retention Blueprint

**Disposition:** PUBLIC SYNTHETIC DESIGN ONLY — QL-181's **12 live-pilot prerequisites remain HELD**. QL-185 is not a legal ruling, approved policy, customer-data migration, retention schedule, live service or a customer access/correction/export/deletion system. This document is a review artifact, not a claim of production privacy compliance. Exact-main GREEN and Pages publication are independently verified after promotion.

## Surface and acceptance

Open **Operator workspace → Safety & hold review → QL-185 Private data minimization & retention blueprint** and select a sample data category and future lifecycle action. Its results must remain `PLANNING_ONLY_HELD` with **no approved min/max retention, no exports or deletion, no data reads, no storage or network writes, no owner approvals**. Selecting another brand while keeping the current workspace returns `CROSS_BRAND_REJECTED` and hides the chosen category. Sidebar brand change resets the policy preview. Tampered category/action/role fields must fail closed.

QL-004 is an older browser-local demonstration, **not a secure production customer database**. Its public disabled preview warns not to enter real personal data. This design does not alter its import, export, save, reset or shared-device behavior; these continue to be risks until replaced and approved. No permission, provider, server database, Supabase or telephony change is made here.

## Source-traceable data inventory and minimization

The inventory mirrors `app/src/types.ts`, `app/src/storage/localRepository.ts` and the checked-in synthetic read models without inspecting customer contents:

| Category | QL-004/current source | Review outcome / proposed minimal data |
| --- | --- | --- |
| Contact identity | `Contact.name`, optional `phone`, `email`, `town`, `notes`, `primaryBrand` | Necessity of one contact channel, purpose and notice; prevent unnecessary raw notes and cross-brand contact sharing. |
| Conversation/message | `Message.body`, `Conversation.subject`, `summary`, `tags` | Avoid duplicating full text into dashboards, audits and tasks; limit authorized same-brand case access. |
| Intake | `IntakeRequest.rawAnswers`, `flags`, `recommendedService` | Purpose-specific typed field allowlist, no broad free-text collection for live use. |
| Follow-up tasks | `FollowUpTask.title`, `notes`, `dueAt`, linked contact ID | Minimal status and case reference; minimize personal content in notes. |
| Audit | `AuditEvent.details`, `entityId`, `eventType`, `createdAt` | Use event codes and opaque identifiers; currently manual lead audit details include names, so audit is not automatically non-personal. |
| Operational metadata | brand/contact/conversation IDs, statuses, timestamps | Keep needed linkage and tenant ownership; linkage metadata can identify a person when combined with other records. |
| Public synthetic fixtures | QL-173 mock voice/SMS, QL-087/090 public synthetic Supabase views | Intentionally public **fake** data, not a customer record or private API authorization precedent. Never silently mix with the classes above. |

## QL-004 threat register and migration stages

| Surface | Verified current behavior | Threat / control to stage |
| --- | --- | --- |
| `loadHubDb` / `saveHubDb` | Reads/writes full `HubDatabase` under `VITE_STORAGE_KEY` or `rosevear-comms-hub:v1` via browser `localStorage`. | Browser/profile/shared-device/script exposure; no verified private authorization, secure expiration, or central erasure. Permit disposable, synthetic demo records only. |
| `exportHubDb` | `JSON.stringify(db, null, 2)` exports **all** data arrays, unfiltered. | Entire-contact/message/intake/audit disclosure, copied downloads and cross-brand contamination. A future private export must be authenticated, brand/subject scoped, redacted, accountable and explicitly approved. |
| `importHubDb` | Checks array shape and calls `saveHubDb` with the parsed database. | Untrusted content may enter local storage. A future migration requires strict validated schema, category/purpose allowlists, owner-approved data mapping and isolated staging. |
| `resetHubDb` | Replaces local snapshot with `seedDb`. | **Not secure deletion:** downloads, synced profiles, browser/device backups and external systems remain beyond the function. |
| Audit free text | `manual_lead_created` event interpolates `input.name`. | Minimization must include logs/audits and derived copies; avoid pretending audit records are anonymous. |

Suggested *future*, separately authorized phases:

1. **Freeze and classify:** Keep preview synthetic-only; inventory each field, purpose, lawful basis, sensitivity, location, readers, linked copies and brand ownership. Approve notice and forms before real intake.
2. **Private staging boundary:** Choose secure backend-only secrets; verify authenticated user, active role, per-brand/per-record authorization, exposed-table grants, RLS, secure views, encrypted transit/storage, data recovery and negative tests. The QL-087/090 public synthetic read grants must not apply to customer tables.
3. **Minimized migration design:** Build strict schema/field mapping and quarantine of ambiguous/real-looking local JSON. Do not silently import historical browser files or merge records across businesses.
4. **Rights-request design:** Independently verify identity and exact brand/subject for access, correction, portability/export and erasure; log request provenance without reproducing the sensitive contents. Plan response ownership, exceptions/holds, staged deletion of derived records and backups, plus proof of completion. Real requests remain unavailable.
5. **Retention approval:** Privacy/legal and owner reviewers must set **purpose-specific minimum and maximum periods**, start trigger, exceptions/legal holds, backups, provider copies, auto-review cadence and disposal verification. **Current values = unset**, not arbitrary 30/90-day defaults. Only after review can code implementing expiry, export or deletion be separately proposed and tested.
6. **Independent sign-off:** Verify privacy, threat model, role/RLS tests, rollback, incident response, customer notices and all 12 QL-181 prerequisites before requesting out-of-band owner authorization for a precisely limited pilot.

## Lifecycle review contract

`collect` requires purpose, necessity, notice and reviewed consent basis; `view` requires real server identity, role, brand and field-scope checks; `export` requires scoped and redacted extraction with review/audit; `correct` requires identity, record linkage and changed-copy reconciliation; `delete` requires exception handling and deletion across primary/derived/backup stores; `retain` requires purpose-specific minimum/maximum and expiry evidence. Selecting any of these in QL-185 **does not perform it**. No preview button solicits real customer identity, performs bulk export or deletion, opens a live provider, calls a Supabase API or turns a hold green.

## Independent security/privacy references (reviewed 2026-10-24)

- Office of the Privacy Commissioner of Canada: [PIPEDA Principle 4 — Limiting collection](https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/p_principle/principles/p_collection/) and [Principle 5 — Limiting use, disclosure and retention](https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/p_principle/principles/p_use/). The OPC advises purpose-appropriate retention schedules, secure disposal and record-specific access procedures; applicability and exceptions must be reviewed before implementation.
- Supabase: [Securing your data](https://supabase.com/docs/guides/database/secure-data), [API security](https://supabase.com/docs/guides/api/securing-your-api) and [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security). Access to public synthetic fixtures is not access to private customer tables; check grants and RLS independently.
- [Supabase changelog](https://supabase.com/changelog.md), including 2026-10-12 notice of TLS 1.2 cipher deprecation (future client compatibility concern); QL-185 does not create connections or change client packages.
- Prior project boundaries: `docs/QL-181_PRIVACY_ROLES_LIVE_PILOT_DECISION_MATRIX.md`, `docs/QL-184_BRAND_WORKSPACE_PERMISSION_MAPPING.md` and `docs/QL-182_JOURNEY_ACCEPTANCE_AND_NEXT_BATCH_HANDOFF.md`.

## Verification and queue

Run `npm run check`, `npm test`, `npm run build`, `npm run pages:build` inside `app`; run `node scripts/ql171-operator-baseline.mjs`, `node --test scripts/__tests__/ql171-operator-baseline.test.mjs`, `node scripts/__tests__/ql170-release-receipt.test.mjs` in repository root. The deterministic suite checks each category × lifecycle action × both brands, malformed or foreign inputs, synthetic-only UI, zero storage and network calls, and all held decisions. Promotion requires reviewed feature → `dev` → `main`, all five exact-main checks (`app-build`, `Build disabled preview`, `Deploy disabled preview`, `Supabase Preview`, `Workers Builds: rosevear-comms-hub`) GREEN and deployed GitHub Pages asset containing `ql185-private-data-minimization-retention-blueprint-v1`.

After QL-185 GREEN, **five proposed builds remain** in the QL-183–190 roadmap: QL-186 consent/message classification, QL-187 provider/cost decision, QL-188 isolated auth/webhook/replay test harness, QL-189 operations safety controls, QL-190 independent pre-pilot review. The separate 12 live-pilot holds are **not** reduced by roadmap progress.
