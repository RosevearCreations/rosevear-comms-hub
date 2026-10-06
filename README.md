# Rosevear Comms Hub

Shared Quo-lite communication hub for RosieDazzlers and DevilnDove.

This repository is the source of truth and first runnable scaffold for a shared customer communication platform: contacts, conversations, phone/SMS readiness, quote/custom-order intake, follow-up tasks, and AI-assisted summaries/drafts.

## Current stage

**QL-035 — Phone/SMS Controlled Live Enablement Plan**

QL-035 plans a tightly controlled live enablement implementation path after the explicit QL-034 decision gate. It defines manual approvals, rollback rules, provider boundaries, redaction rules, deployment gates, and operator training requirements for a later disabled-by-default implementation scaffold.

The expected safe behavior is:

```text
QL-034 planning approval + synthetic redacted planning labels
→ controlled live enablement plan
safeToPersist: false
readyForManualImplementationDesign: true only when all required controls are present
implementationBuildRequiredBeforeLiveTraffic: true
liveEnablementAllowed: false
providerCallbackAllowed: false
phoneWebhookAllowed: false
smsSendAllowed: false
callRecordingAllowed: false
aiDraftAllowed: false
autoSendAllowed: false
persistenceWrites: false
liveCustomerRead: false
liveCustomerWrite: false
```

It does **not** connect a provider, does **not** configure a provider webhook, does **not** enable provider callbacks, does **not** enable phone webhooks, does **not** enable SMS sending, does **not** enable call recording, does **not** enable AI drafts or AI auto-send, does **not** enable live customer reads or writes, does **not** persist mapped evidence, human review outcomes, journal entries, retention entries, readiness evidence, decision evidence, or planning evidence, does **not** commit provider credentials or webhook secret values, does **not** store real operator identities, does **not** store the actual purchased phone number, and does **not** grant live enablement.

The protected intake endpoint and intake persistence both remain disabled by default. No public website is connected live yet. No public anonymous Supabase table policies are added. The frontend still does **not** perform live customer-data reads or writes.

## Repository

```text
RosevearCreations/rosevear-comms-hub
```

GitHub repository page:

```text
https://github.com/RosevearCreations/rosevear-comms-hub
```

## Supabase project

```text
Project name: rosevearcreations Project
Project ref: gxujcwpktaickcgzyvnu
Project URL: https://gxujcwpktaickcgzyvnu.supabase.co
Status: ACTIVE_HEALTHY
```

Use this value for `VITE_SUPABASE_URL`:

```text
https://gxujcwpktaickcgzyvnu.supabase.co
```

Use the **Publishable key** from Supabase API Keys for `VITE_SUPABASE_PUBLISHABLE_KEY`. Do not use the secret/service-role key in the browser.

## GitHub environments and variables

For this repository, use these GitHub Environment titles only when a deployment workflow requires environment-scoped settings:

```text
preview
production
```

Repository variables/secrets location:

```text
Settings → Secrets and variables → Actions
```

Browser-safe Vite values for login/reference-read testing:

```text
VITE_ENABLE_HOSTED_DATABASE=true
VITE_ENABLE_SUPABASE_CLIENT=true
VITE_ENABLE_SUPABASE_LOGIN=true
VITE_SUPABASE_URL=https://gxujcwpktaickcgzyvnu.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable key from Supabase>
```

Protected intake values stay disabled until deployment review:

```text
ENABLE_PROTECTED_INTAKE_ENDPOINT=false
ENABLE_INTAKE_PERSISTENCE=false
ENABLE_RATE_LIMITING=false
ENABLE_INTAKE_IDEMPOTENCY=false
PROTECTED_INTAKE_ENABLEMENT_GATE_STATUS=hold
PROTECTED_INTAKE_ENABLEMENT_ALLOWED=false
```

Phone/SMS controlled live enablement plan values:

```text
PHONE_SMS_EXPLICIT_LIVE_ENABLEMENT_GATE_STATUS=blocked_pending_explicit_live_enablement_decision_gate
PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_PLAN_STATUS=blocked_pending_controlled_live_enablement_plan
PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_SYNTHETIC_ONLY=true
PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_REDACTED_ONLY=true
PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_NO_PERSISTENCE_WRITES=true
PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_LIVE_CUSTOMER_ACCESS_DISABLED=true
PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_PROVIDER_CALLBACK_DISABLED=true
PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_PHONE_WEBHOOK_DISABLED=true
PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_SMS_SEND_DISABLED=true
PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_CALL_RECORDING_DISABLED=true
PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_AI_DRAFTS_DISABLED=true
PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_AUTO_SEND_DISABLED=true
PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_IMPLEMENTATION_BUILD_REQUIRED=true
PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_READY_FOR_IMPLEMENTATION_DESIGN=false
PHONE_SMS_PROVIDER_WEBHOOK_CONFIGURED=false
PHONE_SMS_WEBHOOK_SECRET_VALUE_STORED_OUTSIDE_REPOSITORY=false
PHONE_SMS_PERSISTENCE_WRITES_DISABLED=true
PHONE_SMS_LIVE_CUSTOMER_READS_DISABLED=true
PHONE_SMS_LIVE_CUSTOMER_WRITES_DISABLED=true
ENABLE_PHONE_WEBHOOKS=false
ENABLE_SMS=false
ENABLE_CALL_RECORDING=false
ENABLE_AI_DRAFTS=false
ENABLE_AI_AUTO_SEND=false
```

Do not commit service-role keys, secret keys, database passwords, JWT secrets, connection strings, provider API keys, SIP passwords, webhook secrets or values, actual phone numbers, phone-number ownership documents, invoices, screenshots, customer data, live payloads, call recordings, transcripts, mapped live records, journaled live records, rollback evidence, readiness evidence, decision evidence, planning evidence, real operator identities, or existing phone numbers.

## Source of truth

Start here:

- [`docs/00_MASTER_SOURCE_OF_TRUTH.md`](docs/00_MASTER_SOURCE_OF_TRUTH.md)
- [`docs/01_DECISION_RECORD.md`](docs/01_DECISION_RECORD.md)
- [`docs/03_TELEPHONY_OPTIONS.md`](docs/03_TELEPHONY_OPTIONS.md)
- [`docs/08_BUILD_SEQUENCE.md`](docs/08_BUILD_SEQUENCE.md)
- [`docs/20_SUPABASE_MIGRATION_VERIFIED.md`](docs/20_SUPABASE_MIGRATION_VERIFIED.md)
- [`docs/21_AUTH_SAFE_ADMIN_ACCESS_DECISION.md`](docs/21_AUTH_SAFE_ADMIN_ACCESS_DECISION.md)
- [`docs/22_AUTH_BOUNDARY_SUPABASE_CLIENT_WIRING.md`](docs/22_AUTH_BOUNDARY_SUPABASE_CLIENT_WIRING.md)
- [`docs/23_ADMIN_LOGIN_SESSION_VERIFICATION.md`](docs/23_ADMIN_LOGIN_SESSION_VERIFICATION.md)
- [`docs/24_SUPABASE_READ_MODEL_LOCAL_FALLBACK.md`](docs/24_SUPABASE_READ_MODEL_LOCAL_FALLBACK.md)
- [`docs/25_WEBSITE_INTAKE_INTEGRATION_DRAFT.md`](docs/25_WEBSITE_INTAKE_INTEGRATION_DRAFT.md)
- [`docs/26_PROTECTED_INTAKE_ENDPOINT_SKELETON.md`](docs/26_PROTECTED_INTAKE_ENDPOINT_SKELETON.md)
- [`docs/27_INTAKE_PERSISTENCE_ADAPTER_DRAFT.md`](docs/27_INTAKE_PERSISTENCE_ADAPTER_DRAFT.md)
- [`docs/28_PROTECTED_INTAKE_DEPLOYMENT_READINESS_GATE.md`](docs/28_PROTECTED_INTAKE_DEPLOYMENT_READINESS_GATE.md)
- [`docs/29_DEPLOYMENT_RUNTIME_WRAPPER_SELECTION.md`](docs/29_DEPLOYMENT_RUNTIME_WRAPPER_SELECTION.md)
- [`docs/30_PROTECTED_INTAKE_DRY_RUN_RUNTIME_VERIFICATION.md`](docs/30_PROTECTED_INTAKE_DRY_RUN_RUNTIME_VERIFICATION.md)
- [`docs/31_PROTECTED_INTAKE_PREVIEW_DEPLOYMENT_WIRING.md`](docs/31_PROTECTED_INTAKE_PREVIEW_DEPLOYMENT_WIRING.md)
- [`docs/32_PROTECTED_INTAKE_PREVIEW_DISABLED_MODE_CHECK.md`](docs/32_PROTECTED_INTAKE_PREVIEW_DISABLED_MODE_CHECK.md)
- [`docs/33_PROTECTED_INTAKE_PREVIEW_ENABLEMENT_GATE.md`](docs/33_PROTECTED_INTAKE_PREVIEW_ENABLEMENT_GATE.md)
- [`docs/34_PHONE_SMS_PROVIDER_TEST_DECISION.md`](docs/34_PHONE_SMS_PROVIDER_TEST_DECISION.md)
- [`docs/35_PHONE_SMS_TEST_NUMBER_SETUP_GATE.md`](docs/35_PHONE_SMS_TEST_NUMBER_SETUP_GATE.md)
- [`docs/36_PHONE_SMS_MANUAL_SETUP_EVIDENCE_INTAKE.md`](docs/36_PHONE_SMS_MANUAL_SETUP_EVIDENCE_INTAKE.md)
- [`docs/37_PHONE_SMS_TEST_NUMBER_PURCHASE_REVIEW_GATE.md`](docs/37_PHONE_SMS_TEST_NUMBER_PURCHASE_REVIEW_GATE.md)
- [`docs/38_PHONE_SMS_TEST_NUMBER_PURCHASE_EVIDENCE_INTAKE.md`](docs/38_PHONE_SMS_TEST_NUMBER_PURCHASE_EVIDENCE_INTAKE.md)
- [`docs/39_PHONE_SMS_TEST_NUMBER_CONNECTION_READINESS_GATE.md`](docs/39_PHONE_SMS_TEST_NUMBER_CONNECTION_READINESS_GATE.md)
- [`docs/40_PHONE_SMS_DISABLED_DRY_RUN_CONNECTION_PLAN.md`](docs/40_PHONE_SMS_DISABLED_DRY_RUN_CONNECTION_PLAN.md)
- [`docs/41_PHONE_SMS_DISABLED_DRY_RUN_RUNTIME_VERIFICATION.md`](docs/41_PHONE_SMS_DISABLED_DRY_RUN_RUNTIME_VERIFICATION.md)
- [`docs/42_PHONE_SMS_DISABLED_DRY_RUN_EVIDENCE_MAPPING_REVIEW.md`](docs/42_PHONE_SMS_DISABLED_DRY_RUN_EVIDENCE_MAPPING_REVIEW.md)
- [`docs/43_PHONE_SMS_DISABLED_DRY_RUN_HUMAN_REVIEW_GATE.md`](docs/43_PHONE_SMS_DISABLED_DRY_RUN_HUMAN_REVIEW_GATE.md)
- [`docs/44_PHONE_SMS_DISABLED_DRY_RUN_OPERATOR_OUTCOME_JOURNAL.md`](docs/44_PHONE_SMS_DISABLED_DRY_RUN_OPERATOR_OUTCOME_JOURNAL.md)
- [`docs/45_PHONE_SMS_DISABLED_DRY_RUN_ROLLBACK_EVIDENCE_RETENTION_REVIEW.md`](docs/45_PHONE_SMS_DISABLED_DRY_RUN_ROLLBACK_EVIDENCE_RETENTION_REVIEW.md)
- [`docs/46_PHONE_SMS_DISABLED_DRY_RUN_FINAL_PRE_ENABLEMENT_READINESS_REVIEW.md`](docs/46_PHONE_SMS_DISABLED_DRY_RUN_FINAL_PRE_ENABLEMENT_READINESS_REVIEW.md)
- [`docs/47_PHONE_SMS_EXPLICIT_LIVE_ENABLEMENT_DECISION_GATE.md`](docs/47_PHONE_SMS_EXPLICIT_LIVE_ENABLEMENT_DECISION_GATE.md)
- [`docs/48_PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_PLAN.md`](docs/48_PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_PLAN.md)

## Phone/SMS path

The first phone/SMS experiment path is:

```text
new test number
→ disabled/dry-run connection plan
→ synthetic inbound call or SMS fixture
→ disabled/dry-run runtime verification
→ disabled/dry-run evidence mapping review
→ contact/conversation/task preview shape
→ human review gate
→ operator outcome journal
→ rollback and evidence-retention review
→ final pre-enablement readiness review
→ explicit live enablement decision gate
→ controlled live enablement plan
→ disabled-by-default implementation scaffold
→ no auto-send
```

Provider candidates for the first new test number:

```text
VoIP.ms
Telnyx
Twilio
```

PBX candidates deferred until after the simple test-number path is proven:

```text
FreePBX/Asterisk
3CX
```

## Repository structure

```text
app/                    Vite React admin shell with local persistence and guarded Supabase auth/reference-read wiring
api/contracts/           API contract drafts and schemas
api/deployment/          Deployment readiness, verification, enablement, and provider-decision helpers
api/endpoints/           Provider-neutral server-side endpoint skeletons
api/persistence/         Provider-neutral persistence adapter drafts
brand-configs/           Brand-specific settings and workflows
database/                Schema, migrations, seeds, and hosted-backend notes
docs/                    Source-of-truth documentation
integrations/            RosieDazzlers, DevilnDove, and future connectors
ops/                     Deployment and release-gate checklists
runtimes/                Runtime-specific wrapper templates that are not live by default
scripts/                 Local/helper scripts and remote-operator checklists
telephony/               Phone/SMS provider-neutral integration notes
```

## QL-035 non-goals

- Do not connect a provider account.
- Do not configure provider webhooks.
- Do not enable provider callbacks.
- Do not commit the actual purchased number.
- Do not commit provider credentials, SIP credentials, webhook secrets, webhook secret values, invoices, screenshots, receipts, or ownership documents.
- Do not port any number.
- Do not forward any existing number.
- Do not enable phone/SMS webhooks.
- Do not enable SMS sending.
- Do not enable call recording.
- Do not enable AI drafts.
- Do not auto-send AI replies.
- Do not enter real production customer data or live provider payloads.
- Do not enable live customer reads or writes.
- Do not persist synthetic evidence previews, human review outcomes, journal entries, retention entries, readiness evidence, decision evidence, or planning evidence.
- Do not create mapped live contact, conversation, task, journal, retention, readiness, decision, planning, or audit records.
- Do not store real operator identities.
- Do not add a Supabase migration.
- Do not grant live enablement.

## Next build

QL-036 — Phone/SMS Controlled Live Enablement Implementation Scaffold.
