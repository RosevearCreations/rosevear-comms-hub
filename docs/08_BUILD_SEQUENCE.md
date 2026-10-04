# 08 — Build Sequence

## QL-001 — Structure and Documentation Foundation

Status: complete.

## QL-002 — Application Scaffold

Status: complete.

Decision: use Vite + React + TypeScript for the first local admin shell.

## QL-003 — Database and API Foundation

Status: complete.

Result: local repository layer, localStorage persistence, interactive lead/status/note/task actions, and draft API contracts.

## QL-004 — Admin Inbox MVP

Status: complete.

Result: inbox search/filters, contact and intake details, task dashboard, and local import/export.

## QL-005 — Shared Backend Decision and Foundation

Status: complete.

Decision: use a Postgres-compatible backend first, with Supabase/Postgres as the first managed provider path.

## QL-006 — Supabase Project Setup Gate

Status: complete.

Project:

```text
rosevearcreations
gxujcwpktaickcgzyvnu
https://gxujcwpktaickcgzyvnu.supabase.co
```

## QL-007 — Supabase Migration Application and Verification

Status: complete after connector reauthorization.

Result: development schema applied, expected tables verified, RLS verified, seed brands verified.

## QL-008A — Supabase Migration Verified and Types Generated

Status: complete.

Result: generated Supabase types and applied follow-up security/performance index migration.

## QL-008B — Auth and Safe Admin Access Decision

Status: complete.

Result: admin allowlist and safe auth/RLS decision prepared and later applied.

## QL-009 — Auth Boundary and Supabase Client Wiring

Status: complete.

Result: Supabase client boundary, private RLS helpers, and local-only default wiring.

## QL-010 — Admin Login UI and Session Verification

Status: complete.

Result: guarded admin login/session UI with live customer-data reads and writes disabled.

## QL-011 — Supabase Read Model and Local Fallback

Status: complete.

Result: safe reference reads for `public.brands` and signed-in admin allowlist row.

## QL-012 — Website Intake Integration Draft

Status: complete.

Result: website intake schema, TypeScript contract, integration notes, and environment guidance.

## QL-013 — Protected Intake Endpoint Skeleton

Status: complete.

Result: disabled-by-default provider-neutral protected intake endpoint skeleton.

## QL-014 — Intake Persistence Adapter Draft

Status: complete.

Result: provider-neutral persistence adapter plan without live writes.

## QL-015 — Protected Intake Deployment Readiness Gate

Status: complete.

Result: deployment readiness helper and release checklists; protected intake remains disabled.

## QL-016 — Deployment Runtime Wrapper Selection

Status: complete.

Result: selected Vercel serverless function wrapper template stored outside the live API path.

## QL-017 — Protected Intake Dry-Run Runtime Verification

Status: complete.

Result: dry-run verification helper for disabled, rejected, and dry-run response modes.

## QL-018 — Protected Intake Preview Deployment Wiring

Status: complete.

Result: preview-capable route at `api/intake.ts`, still disabled by default.

## QL-019 — Protected Intake Preview Disabled-Mode Check

Status: complete.

Result: disabled-mode checker and expected safe preview result: `HTTP 503`, `mode: disabled`, `accepted: false`.

## QL-020 — Protected Intake Preview Enablement Gate

Status: complete.

Result: enablement gate helper and blockers before dry-run endpoint enablement can be tested.

## QL-021 — Phone/SMS Provider Test Decision

Status: complete.

Result:

- Chose `new_test_number_first` as the first phone/SMS experiment path.
- Added decision helper at `api/deployment/phoneSmsProviderTestDecision.ts`.
- Added decision fixture at `api/contracts/phone-sms-provider-test-decision.example.json`.
- Added source-of-truth doc at `docs/34_PHONE_SMS_PROVIDER_TEST_DECISION.md`.
- Added build record, operator checklist, and telephony decision notes.
- Shortlisted VoIP.ms, Telnyx, and Twilio for a new test number.
- Deferred FreePBX/Asterisk and 3CX until after the simple test-number path is proven.
- Kept all existing numbers unported and unforwarded.
- Kept phone webhooks, SMS, call recording, and AI auto-send disabled.
- Did not add a Supabase migration.
- Did not connect a provider account.

## QL-022 — Phone/SMS Test Number Setup Gate

Goal:

- Turn the QL-021 decision into a setup gate.
- Record which provider will be used for the first new test number.
- Keep existing numbers protected until the test path is proven.

Setup will be needed here for a test number or phone provider account.
