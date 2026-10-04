# Rosevear Comms Hub

Shared Quo-lite communication hub for RosieDazzlers and DevilnDove.

This repository is the source of truth and first runnable scaffold for a shared customer communication platform: contacts, conversations, phone/SMS readiness, quote/custom-order intake, follow-up tasks, and AI-assisted summaries/drafts.

## Current stage

**QL-024 — Phone/SMS Test Number Purchase Review Gate**

QL-024 adds the purchase-review gate for the first manual test-number purchase. It may allow the owner to manually purchase **one new disposable Canadian test number** only after QL-023 evidence is complete, provider/target/budget/cost details are reviewed, owner approval is recorded, and every safety/redaction lock remains true.

It does **not** buy a number, does **not** store the actual candidate or purchased number, does **not** connect a provider account, does **not** commit provider credentials or purchase documents, does **not** port or forward existing numbers, and does **not** enable phone webhooks, SMS, call recording, or AI auto-send.

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

Phone/SMS test-number purchase-review values:

```text
PHONE_SMS_TEST_DECISION_STATUS=new_test_number_first
PHONE_SMS_TEST_NUMBER_SETUP_GATE_STATUS=blocked_pending_manual_setup
PHONE_SMS_MANUAL_SETUP_EVIDENCE_STATUS=blocked_pending_manual_evidence
PHONE_SMS_PURCHASE_REVIEW_GATE_STATUS=blocked_pending_purchase_review
PHONE_SMS_TEST_PROVIDER=undecided
PHONE_SMS_TEST_NUMBER_REQUIRED=true
PHONE_SMS_TEST_NUMBER_TARGET_USE=undecided
PHONE_SMS_TEST_BUDGET_CAD_MONTHLY=
PHONE_SMS_TEST_ACCOUNT_CREATED=false
PHONE_SMS_TEST_ACCOUNT_REFERENCE_LABEL=
PHONE_SMS_CREDENTIAL_STORAGE_LOCATION=undecided
PHONE_SMS_PROVIDER_PORTAL_REVIEWED=false
PHONE_SMS_NUMBER_AVAILABILITY_REVIEWED=false
PHONE_SMS_SMS_COMPLIANCE_REVIEWED=false
PHONE_SMS_SETUP_EVIDENCE_STORED_OUTSIDE_REPOSITORY=false
PHONE_SMS_CANDIDATE_NUMBER_REGION_LABEL=
PHONE_SMS_EXPECTED_CAPABILITY=undecided
PHONE_SMS_ESTIMATED_MONTHLY_COST_CAD=
PHONE_SMS_ESTIMATED_SETUP_COST_CAD=
PHONE_SMS_PURCHASE_APPROVED_BY_OWNER=false
PHONE_SMS_TEST_NUMBER_PURCHASED=false
PHONE_SMS_EXISTING_NUMBERS_PROTECTED=true
ENABLE_PHONE_WEBHOOKS=false
ENABLE_SMS=false
ENABLE_CALL_RECORDING=false
ENABLE_AI_AUTO_SEND=false
```

Do not commit service-role keys, secret keys, database passwords, JWT secrets, connection strings, provider API keys, SIP passwords, webhook secrets, actual phone numbers, phone-number ownership documents, invoices, screenshots, customer data, or existing phone numbers.

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

## Phone/SMS path

The first phone/SMS experiment path is:

```text
new test number
→ inbound call or SMS event
→ contact/conversation/task evidence
→ human review
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

## QL-024 non-goals

- Do not buy a number through repository code.
- Do not commit the actual candidate or purchased number.
- Do not select a provider automatically.
- Do not create or connect a provider account.
- Do not port any number.
- Do not forward any existing number.
- Do not enable phone/SMS webhooks.
- Do not enable SMS sending.
- Do not enable call recording.
- Do not auto-send AI replies.
- Do not enter real production customer data.
- Do not commit provider tokens, API keys, SIP credentials, webhook secrets, ownership documents, invoices, screenshots, customer data, or existing phone numbers.

## Next build

QL-025 — Phone/SMS Test Number Purchase Evidence Intake.
