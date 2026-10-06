# QL-036 — Phone/SMS Controlled Live Enablement Implementation Scaffold

## Purpose

QL-036 creates a disabled-by-default implementation scaffold for the controlled phone/SMS live enablement path after QL-035 planning.

This build does not enable live traffic. It defines safe implementation surfaces so the next build can verify the disabled behavior before any later manual go/no-go process.

## Required prior state

QL-036 assumes:

```text
QL-034 explicit live enablement decision gate = approved for controlled planning only
QL-035 controlled live enablement plan = ready for manual implementation design only
```

These approvals do not grant live enablement. They only allow this disabled scaffold build.

## Scaffold surfaces

The disabled scaffold covers these surfaces:

```text
provider_callback_route
phone_webhook_route
sms_send_adapter
call_recording_adapter
ai_draft_adapter
ai_auto_send_guard
persistence_adapter
live_customer_access_guard
operator_console_gate
audit_log_stub
rollback_switch
```

Each surface must remain disabled or manual-gate-only by default.

## Safe output shape

A safe QL-036 output must retain:

```text
scaffoldReadyForDisabledVerification: true
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
safeToPersist: false
implementationBuildOnly: true
disabledVerificationRequiredBeforeManualGoNoGo: true
manualGoNoGoRequiredBeforeLivePilot: true
```

## Default environment values

```text
PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_PLAN_STATUS=blocked_pending_controlled_live_enablement_plan
PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_IMPLEMENTATION_STATUS=blocked_pending_disabled_implementation_scaffold
PHONE_SMS_CONTROLLED_IMPLEMENTATION_SYNTHETIC_ONLY=true
PHONE_SMS_CONTROLLED_IMPLEMENTATION_REDACTED_ONLY=true
PHONE_SMS_CONTROLLED_IMPLEMENTATION_NO_PERSISTENCE_WRITES=true
PHONE_SMS_CONTROLLED_IMPLEMENTATION_LIVE_CUSTOMER_ACCESS_DISABLED=true
PHONE_SMS_CONTROLLED_IMPLEMENTATION_PROVIDER_CALLBACK_DISABLED=true
PHONE_SMS_CONTROLLED_IMPLEMENTATION_PHONE_WEBHOOK_DISABLED=true
PHONE_SMS_CONTROLLED_IMPLEMENTATION_SMS_SEND_DISABLED=true
PHONE_SMS_CONTROLLED_IMPLEMENTATION_CALL_RECORDING_DISABLED=true
PHONE_SMS_CONTROLLED_IMPLEMENTATION_AI_DRAFTS_DISABLED=true
PHONE_SMS_CONTROLLED_IMPLEMENTATION_AUTO_SEND_DISABLED=true
PHONE_SMS_CONTROLLED_IMPLEMENTATION_RESULT=not_run
PHONE_SMS_CONTROLLED_IMPLEMENTATION_DECISION=not_verified
PHONE_SMS_CONTROLLED_IMPLEMENTATION_READY_FOR_DISABLED_VERIFICATION=false
```

All existing live-off flags stay disabled:

```text
PHONE_SMS_PROVIDER_WEBHOOK_CONFIGURED=false
TELEPHONY_PROVIDER=
TELEPHONY_WEBHOOK_SECRET=
SMS_WEBHOOK_SECRET=
ENABLE_PHONE_WEBHOOKS=false
ENABLE_SMS=false
ENABLE_CALL_RECORDING=false
ENABLE_AI_DRAFTS=false
ENABLE_AI_AUTO_SEND=false
PHONE_SMS_PERSISTENCE_WRITES_DISABLED=true
PHONE_SMS_LIVE_CUSTOMER_READS_DISABLED=true
PHONE_SMS_LIVE_CUSTOMER_WRITES_DISABLED=true
PHONE_SMS_EXISTING_NUMBERS_PROTECTED=true
```

## Required blockers

QL-036 must block when:

- QL-034 planning approval is missing.
- QL-035 plan readiness is missing.
- Any provider callback, phone webhook, SMS send, call recording, AI draft, AI auto-send, persistence write, live customer read, or live customer write flag is enabled.
- Any required scaffold surface is missing.
- Any component contains an actual phone number, provider credential, webhook secret value, customer data, live payload, recording, or transcript.
- Any note includes unsafe text, phone-like numbers, or secret-like wording.

## Explicit non-goals

QL-036 does not:

- connect a provider account;
- configure provider webhooks;
- enable provider callbacks;
- enable phone webhooks;
- enable SMS sending;
- enable call recording;
- enable AI drafts;
- enable AI auto-send;
- enable persistence writes;
- enable live customer reads;
- enable live customer writes;
- store actual phone numbers;
- store provider credentials;
- store webhook secret values;
- store customer data;
- store live payloads;
- store recordings;
- store transcripts;
- add a Supabase migration;
- create any production live contact, conversation, task, audit, or journal record.

## Production GREEN definition

Production is GREEN only when:

1. The QL-036 branch changes are reviewed through a PR into `dev`.
2. App scaffold CI passes: `npm install`, `npm run check`, and `npm run build`.
3. The exact `dev` tree is promoted to `main` through a production PR.
4. The final `main` push CI passes.
5. The documented behavior remains disabled-by-default and does not grant live enablement.

## Next build

```text
QL-037 — Phone/SMS Controlled Live Enablement Disabled Verification
```
