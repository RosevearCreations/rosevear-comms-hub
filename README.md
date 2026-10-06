# Rosevear Comms Hub

Shared Quo-lite communication hub for RosieDazzlers and DevilnDove.

This repository is the source of truth and first runnable scaffold for a shared customer communication platform: contacts, conversations, phone/SMS readiness, quote/custom-order intake, follow-up tasks, and AI-assisted summaries/drafts.

## Current stage

**QL-037 — Phone/SMS Controlled Live Enablement Disabled Verification**

QL-037 verifies that every QL-036 controlled live enablement implementation scaffold surface remains disabled by default. It confirms disabled/no-op/manual-gate responses for provider callbacks, phone webhooks, SMS sending, call recording, AI drafts, AI auto-send, persistence, live customer access, operator gating, audit stubs, and rollback stubs.

The expected safe behavior is:

```text
QL-034 planning approval
+ QL-035 controlled live enablement plan
+ QL-036 disabled implementation scaffold
→ QL-037 disabled verification
safeToPersist: false
disabledVerificationGreen: true only when every required surface remains disabled
manualGoNoGoRequiredBeforeLivePilot: true
livePilotRemainsBlocked: true
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

It does **not** connect a provider, does **not** configure provider webhooks, does **not** enable provider callbacks, does **not** enable phone webhooks, does **not** enable SMS sending, does **not** enable call recording, does **not** enable AI drafts or AI auto-send, does **not** enable live customer reads or writes, does **not** persist mapped evidence, human review outcomes, journal entries, retention entries, readiness evidence, decision evidence, planning evidence, scaffold evidence, or disabled verification evidence, does **not** commit provider credentials or webhook secret values, does **not** store real operator identities, does **not** store the actual purchased phone number, does **not** add a Supabase migration, and does **not** grant live enablement.

The protected intake endpoint and intake persistence both remain disabled by default. No public website is connected live yet. No public anonymous Supabase table policies are added. The frontend still does **not** perform live customer-data reads or writes.

## Repository

```text
RosevearCreations/rosevear-comms-hub
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

Use these GitHub Environment titles only when a deployment workflow requires environment-scoped settings:

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

Phone/SMS controlled live enablement disabled verification values:

```text
PHONE_SMS_EXPLICIT_LIVE_ENABLEMENT_GATE_STATUS=blocked_pending_explicit_live_enablement_decision_gate
PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_PLAN_STATUS=blocked_pending_controlled_live_enablement_plan
PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_IMPLEMENTATION_STATUS=blocked_pending_disabled_implementation_scaffold
PHONE_SMS_CONTROLLED_DISABLED_VERIFICATION_STATUS=blocked_pending_disabled_verification
PHONE_SMS_CONTROLLED_DISABLED_VERIFICATION_SYNTHETIC_ONLY=true
PHONE_SMS_CONTROLLED_DISABLED_VERIFICATION_REDACTED_ONLY=true
PHONE_SMS_CONTROLLED_DISABLED_VERIFICATION_NO_PERSISTENCE_WRITES=true
PHONE_SMS_CONTROLLED_DISABLED_VERIFICATION_LIVE_CUSTOMER_ACCESS_DISABLED=true
PHONE_SMS_CONTROLLED_DISABLED_VERIFICATION_PROVIDER_CALLBACK_DISABLED=true
PHONE_SMS_CONTROLLED_DISABLED_VERIFICATION_PHONE_WEBHOOK_DISABLED=true
PHONE_SMS_CONTROLLED_DISABLED_VERIFICATION_SMS_SEND_DISABLED=true
PHONE_SMS_CONTROLLED_DISABLED_VERIFICATION_CALL_RECORDING_DISABLED=true
PHONE_SMS_CONTROLLED_DISABLED_VERIFICATION_AI_DRAFTS_DISABLED=true
PHONE_SMS_CONTROLLED_DISABLED_VERIFICATION_AUTO_SEND_DISABLED=true
PHONE_SMS_CONTROLLED_DISABLED_VERIFICATION_MANUAL_GATE_REQUIRED=true
PHONE_SMS_PROVIDER_WEBHOOK_CONFIGURED=false
PHONE_SMS_PERSISTENCE_WRITES_DISABLED=true
PHONE_SMS_LIVE_CUSTOMER_READS_DISABLED=true
PHONE_SMS_LIVE_CUSTOMER_WRITES_DISABLED=true
ENABLE_PHONE_WEBHOOKS=false
ENABLE_SMS=false
ENABLE_CALL_RECORDING=false
ENABLE_AI_DRAFTS=false
ENABLE_AI_AUTO_SEND=false
```

Do not commit service-role keys, secret keys, database passwords, JWT secrets, connection strings, provider API keys, SIP passwords, webhook secrets or values, actual phone numbers, phone-number ownership documents, invoices, screenshots, customer data, live payloads, call recordings, transcripts, mapped live records, journaled live records, rollback evidence, readiness evidence, decision evidence, planning evidence, scaffold evidence, disabled verification evidence, pilot evidence, real operator identities, or existing phone numbers.

## Source of truth

Start here:

- [`docs/00_MASTER_SOURCE_OF_TRUTH.md`](docs/00_MASTER_SOURCE_OF_TRUTH.md)
- [`docs/01_DECISION_RECORD.md`](docs/01_DECISION_RECORD.md)
- [`docs/03_TELEPHONY_OPTIONS.md`](docs/03_TELEPHONY_OPTIONS.md)
- [`docs/08_BUILD_SEQUENCE.md`](docs/08_BUILD_SEQUENCE.md)
- [`docs/49_PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_IMPLEMENTATION_SCAFFOLD.md`](docs/49_PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_IMPLEMENTATION_SCAFFOLD.md)
- [`docs/50_PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_DISABLED_VERIFICATION.md`](docs/50_PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_DISABLED_VERIFICATION.md)

## Phone/SMS path

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
→ disabled verification
→ manual go/no-go gate
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

## QL-037 non-goals

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
- Do not persist synthetic evidence previews, human review outcomes, journal entries, retention entries, readiness evidence, decision evidence, planning evidence, scaffold evidence, disabled verification evidence, or pilot evidence.
- Do not create mapped live contact, conversation, task, journal, retention, readiness, decision, planning, scaffold, verification, pilot, or audit records.
- Do not store real operator identities.
- Do not add a Supabase migration.
- Do not grant live enablement.

## Next build

QL-038 — Phone/SMS Controlled Live Enablement Manual Go/No-Go Gate.
