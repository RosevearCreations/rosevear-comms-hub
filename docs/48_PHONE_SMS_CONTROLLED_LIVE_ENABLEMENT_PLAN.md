# QL-035 — Phone/SMS Controlled Live Enablement Plan

## Purpose

QL-035 plans the controlled implementation path that may follow the explicit QL-034 decision gate. It does not enable live traffic. It defines what must exist before any later implementation scaffold can even consider a tiny monitored live pilot.

QL-035 is a planning and safety-boundary build only.

## Required prior gate

QL-035 may only proceed when QL-034 has produced this planning-only outcome:

```text
approve_controlled_live_enablement_planning
```

Any other QL-034 outcome keeps QL-035 blocked:

```text
remain_blocked
continue_rework
not_reviewed
```

## Safe output

The only successful QL-035 output is:

```text
plan_ready_for_manual_implementation_design
```

That means the next build may design a disabled-by-default implementation scaffold. It does not mean live traffic is allowed.

## Safety locks

QL-035 keeps all of these disabled:

```text
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
```

## Required control areas

QL-035 must define every control area below before the plan can be considered ready:

1. Manual owner approval boundary.
2. Provider boundary.
3. Webhook boundary.
4. SMS sending boundary.
5. Call recording boundary.
6. AI draft and auto-send boundary.
7. Persistence boundary.
8. Live customer data boundary.
9. Redaction boundary.
10. Rate limiting boundary.
11. Idempotency and replay protection boundary.
12. Rollback and kill-switch boundary.
13. Deployment gate boundary.
14. Operator training boundary.

## Required phases

The plan must include at least these phases:

```text
implementation scaffold planning
→ disabled verification planning
→ manual go/no-go planning
```

Each phase must require manual approval and a later implementation build before any live traffic.

## Allowed evidence

Allowed evidence is limited to:

- synthetic readiness labels;
- redacted planning labels;
- owner/operator alias labels;
- non-secret provider labels;
- non-secret deployment gate labels;
- non-secret rollback labels.

## Prohibited evidence

Do not commit or store any of the following in the repository:

- actual phone numbers;
- existing phone numbers;
- provider credentials;
- SIP credentials;
- webhook secret values;
- invoices;
- screenshots;
- ownership documents;
- customer data;
- live provider payloads;
- recordings;
- transcripts;
- mapped live records;
- journaled live records;
- retained live records;
- real operator identities.

## Environment values

Use these placeholder values only. Do not paste real credentials, phone numbers, secrets, screenshots, invoices, provider artifacts, or customer data.

```text
PHONE_SMS_EXPLICIT_LIVE_ENABLEMENT_GATE_STATUS=approved_for_controlled_live_enablement_planning
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
PHONE_SMS_EXISTING_NUMBERS_PROTECTED=true
ENABLE_PHONE_WEBHOOKS=false
ENABLE_SMS=false
ENABLE_CALL_RECORDING=false
ENABLE_AI_DRAFTS=false
ENABLE_AI_AUTO_SEND=false
```

## Blocked outcomes

QL-035 must block the plan when:

- QL-034 did not approve controlled planning;
- any live feature is enabled early;
- any required control area is missing;
- any required phase is missing;
- any evidence contains unredacted secrets, phone numbers, customer data, live payloads, recordings, or transcripts;
- any control attempts to enable provider callbacks, phone webhooks, SMS sending, call recording, AI drafts, auto-send, persistence, or live customer access.

## Production GREEN definition

QL-035 is production-green only when:

- the helper compiles;
- the fixture documents ready and blocked outcomes;
- README and build sequence point to QL-035 as current;
- QL-036 is queued as the next build;
- no Supabase migration is added;
- no provider account is connected;
- no provider callback route is enabled;
- all CI checks pass on `dev` and on the final `main` push.

## Next build

```text
QL-036 — Phone/SMS Controlled Live Enablement Implementation Scaffold
```
