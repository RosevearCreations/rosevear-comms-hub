# Rosevear Comms Hub

Shared Quo-lite communication hub for RosieDazzlers and DevilnDove.

This repository is the source of truth and first runnable scaffold for a shared customer communication platform: contacts, conversations, phone/SMS readiness, quote/custom-order intake, follow-up tasks, and AI-assisted summaries/drafts.

## Current stage

**QL-029 — Phone/SMS Disabled Dry-Run Evidence Mapping Review**

QL-029 adds provider-neutral evidence mapping review for synthetic disabled/dry-run phone/SMS events. It maps synthetic runtime evidence into preview-only contact, conversation, and human-review task shapes.

The expected safe behavior is:

```text
synthetic runtime evidence → redacted contact preview → conversation preview → human-review task preview
safeToPersist: false
providerWebhookConfigured: false
persistenceWrites: false
liveCustomerRead: false
liveCustomerWrite: false
smsSending: false
callRecording: false
aiDrafts: false
aiAutoSend: false
```

It does **not** connect a provider, does **not** configure a provider webhook, does **not** enable phone webhooks, does **not** enable SMS sending, does **not** enable call recording, does **not** enable AI drafts or AI auto-send, does **not** enable live customer reads or writes, does **not** persist mapped evidence, does **not** commit provider credentials or webhook secret values, and does **not** store the actual purchased phone number.

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

Phone/SMS disabled dry-run evidence mapping review values:

```text
PHONE_SMS_TEST_DECISION_STATUS=new_test_number_first
PHONE_SMS_TEST_NUMBER_SETUP_GATE_STATUS=blocked_pending_manual_setup
PHONE_SMS_MANUAL_SETUP_EVIDENCE_STATUS=blocked_pending_manual_evidence
PHONE_SMS_PURCHASE_REVIEW_GATE_STATUS=blocked_pending_purchase_review
PHONE_SMS_PURCHASE_EVIDENCE_STATUS=blocked_pending_purchase_evidence
PHONE_SMS_CONNECTION_READINESS_STATUS=blocked_pending_connection_readiness
PHONE_SMS_DISABLED_DRY_RUN_PLAN_STATUS=blocked_pending_disabled_dry_run_plan
PHONE_SMS_DISABLED_DRY_RUN_RUNTIME_VERIFICATION_STATUS=blocked_pending_runtime_verification
PHONE_SMS_DISABLED_DRY_RUN_EVIDENCE_MAPPING_STATUS=blocked_pending_evidence_mapping_review
PHONE_SMS_TEST_PROVIDER=undecided
PHONE_SMS_TEST_NUMBER_REQUIRED=true
PHONE_SMS_TEST_NUMBER_TARGET_USE=undecided
PHONE_SMS_PURCHASED_NUMBER_ALIAS_LABEL=
PHONE_SMS_ACTUAL_CAPABILITY=undecided
PHONE_SMS_DRY_RUN_DEPLOYMENT_TARGET=undecided
PHONE_SMS_DRY_RUN_CONNECTION_MODE=undecided
PHONE_SMS_DRY_RUN_ENDPOINT_MODE=undecided
PHONE_SMS_DRY_RUN_EXPECTED_DISABLED_STATUS=503
PHONE_SMS_DRY_RUN_ROUTE_LABEL=
PHONE_SMS_RUNTIME_VERIFICATION_SYNTHETIC_ONLY=true
PHONE_SMS_RUNTIME_VERIFICATION_NO_PERSISTENCE_WRITES=true
PHONE_SMS_RUNTIME_VERIFICATION_LIVE_CUSTOMER_ACCESS_DISABLED=true
PHONE_SMS_RUNTIME_VERIFICATION_PROVIDER_CALLBACK_CONFIGURED=false
PHONE_SMS_RUNTIME_VERIFICATION_RESULT=not_run
PHONE_SMS_EVIDENCE_MAPPING_SYNTHETIC_ONLY=true
PHONE_SMS_EVIDENCE_MAPPING_NO_PERSISTENCE_WRITES=true
PHONE_SMS_EVIDENCE_MAPPING_LIVE_CUSTOMER_ACCESS_DISABLED=true
PHONE_SMS_EVIDENCE_MAPPING_CONTACT_SHAPE_REVIEWED=false
PHONE_SMS_EVIDENCE_MAPPING_CONVERSATION_SHAPE_REVIEWED=false
PHONE_SMS_EVIDENCE_MAPPING_TASK_SHAPE_REVIEWED=false
PHONE_SMS_EVIDENCE_MAPPING_HUMAN_REVIEW_REQUIRED=true
PHONE_SMS_PROVIDER_WEBHOOK_CONFIGURED=false
PHONE_SMS_WEBHOOK_SECRET_NAME_PLANNED=false
PHONE_SMS_WEBHOOK_SECRET_VALUE_STORED_OUTSIDE_REPOSITORY=false
PHONE_SMS_SYNTHETIC_VOICE_FIXTURE_PLANNED=false
PHONE_SMS_SYNTHETIC_SMS_FIXTURE_PLANNED=false
PHONE_SMS_DRY_RUN_PERSISTENCE_MODE=undecided
PHONE_SMS_PERSISTENCE_WRITES_DISABLED=true
PHONE_SMS_LIVE_CUSTOMER_READS_DISABLED=true
PHONE_SMS_LIVE_CUSTOMER_WRITES_DISABLED=true
PHONE_SMS_RATE_LIMIT_PLAN_REVIEWED=false
PHONE_SMS_IDEMPOTENCY_PLAN_REVIEWED=false
PHONE_SMS_REPLAY_PROTECTION_PLAN_REVIEWED=false
PHONE_SMS_LOGGING_REDACTION_PLAN_REVIEWED=false
PHONE_SMS_ROLLBACK_PLAN_REVIEWED=false
PHONE_SMS_OPERATOR_APPROVED_RUNTIME_VERIFICATION=false
PHONE_SMS_TEST_NUMBER_PURCHASED=false
PHONE_SMS_EXISTING_NUMBERS_PROTECTED=true
TELEPHONY_PROVIDER=
TELEPHONY_WEBHOOK_SECRET=
SMS_WEBHOOK_SECRET=
ENABLE_PHONE_WEBHOOKS=false
ENABLE_SMS=false
ENABLE_CALL_RECORDING=false
ENABLE_AI_DRAFTS=false
ENABLE_AI_AUTO_SEND=false
```

Do not commit service-role keys, secret keys, database passwords, JWT secrets, connection strings, provider API keys, SIP passwords, webhook secrets or values, actual phone numbers, phone-number ownership documents, invoices, screenshots, customer data, live payloads, call recordings, transcripts, mapped live records, or existing phone numbers.

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

## QL-029 non-goals

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
- Do not persist synthetic evidence previews.
- Do not create mapped live contact, conversation, or task records.

## Next build

QL-030 — Phone/SMS Disabled Dry-Run Human Review Gate.
