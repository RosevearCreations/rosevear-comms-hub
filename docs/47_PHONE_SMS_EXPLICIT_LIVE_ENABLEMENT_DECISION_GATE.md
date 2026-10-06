# 47 — Phone/SMS Explicit Live Enablement Decision Gate

Build: QL-034

## Purpose

QL-034 is the explicit human decision gate after the disabled dry-run phone/SMS path has reached final pre-enablement readiness review.

This build decides whether the path should:

1. remain blocked;
2. continue synthetic rework; or
3. proceed only to a later controlled live enablement planning build.

QL-034 does not enable live traffic.

## Required previous gates

QL-034 requires redacted synthetic planning evidence from:

- QL-028 runtime verification;
- QL-029 evidence mapping review;
- QL-030 human review gate;
- QL-031 operator outcome journal;
- QL-032 rollback and evidence-retention review;
- QL-033 final pre-enablement readiness review.

Every prerequisite artifact must remain synthetic, redacted, non-persistent, and planning-only.

## Allowed decisions

### remain_blocked

The phone/SMS path remains blocked. No planning approval is granted.

### continue_rework

The phone/SMS path returns to synthetic planning or readiness work before another decision-gate attempt.

### approve_controlled_live_enablement_planning

The owner/operator decision approves only the next controlled planning build.

This is not permission for live traffic.

A later implementation build must still define and prove the controlled live plan before any provider callback, phone webhook, SMS send, call recording, AI draft, auto-send, persistence write, or live customer access can change.

## Safety locks retained

QL-034 keeps all of these locked:

```text
liveEnablementAllowed: false
implementationBuildRequiredBeforeLiveTraffic: true
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

## Safe default environment

```text
PHONE_SMS_EXPLICIT_LIVE_ENABLEMENT_GATE_STATUS=blocked_pending_explicit_live_enablement_decision_gate
PHONE_SMS_EXPLICIT_LIVE_ENABLEMENT_SYNTHETIC_ONLY=true
PHONE_SMS_EXPLICIT_LIVE_ENABLEMENT_REDACTED_ONLY=true
PHONE_SMS_EXPLICIT_LIVE_ENABLEMENT_NO_PERSISTENCE_WRITES=true
PHONE_SMS_EXPLICIT_LIVE_ENABLEMENT_LIVE_CUSTOMER_ACCESS_DISABLED=true
PHONE_SMS_EXPLICIT_LIVE_ENABLEMENT_PROVIDER_CALLBACK_DISABLED=true
PHONE_SMS_EXPLICIT_LIVE_ENABLEMENT_PHONE_WEBHOOK_DISABLED=true
PHONE_SMS_EXPLICIT_LIVE_ENABLEMENT_SMS_SEND_DISABLED=true
PHONE_SMS_EXPLICIT_LIVE_ENABLEMENT_CALL_RECORDING_DISABLED=true
PHONE_SMS_EXPLICIT_LIVE_ENABLEMENT_AI_DRAFTS_DISABLED=true
PHONE_SMS_EXPLICIT_LIVE_ENABLEMENT_AUTO_SEND_DISABLED=true
PHONE_SMS_EXPLICIT_LIVE_ENABLEMENT_DECISION=not_reviewed
PHONE_SMS_EXPLICIT_LIVE_ENABLEMENT_RESULT=not_run
PHONE_SMS_EXPLICIT_LIVE_ENABLEMENT_APPROVED_FOR_PLANNING=false
ENABLE_PHONE_WEBHOOKS=false
ENABLE_SMS=false
ENABLE_CALL_RECORDING=false
ENABLE_AI_DRAFTS=false
ENABLE_AI_AUTO_SEND=false
```

## Forbidden evidence

Do not put any of the following in the repository or the decision-gate artifact:

- actual phone numbers or phone-like numbers;
- existing phone numbers;
- real operator identities;
- provider credentials;
- SIP credentials;
- webhook secret values;
- invoices;
- screenshots;
- receipts;
- ownership documents;
- customer data;
- mapped live records;
- journaled live records;
- retained live records;
- readiness evidence containing live data;
- live provider payloads;
- recordings;
- transcripts;
- persistent contact, conversation, task, audit, journal, readiness, or retention rows.

## Production GREEN definition

QL-034 is production green only when:

1. the decision-gate helper accepts safe synthetic approvals for planning only;
2. the decision-gate helper returns blocked status for reject and rework decisions;
3. every outcome keeps `liveEnablementAllowed: false`;
4. every outcome keeps persistence writes and live customer access disabled;
5. unsafe environments are rejected;
6. unredacted, live, customer, phone-number, provider-secret, recording, transcript, or persistence evidence is rejected;
7. no provider account is connected;
8. no provider webhook route is enabled;
9. no phone webhook, SMS sending, call recording, AI drafts, or AI auto-send is enabled;
10. no Supabase migration is added;
11. App scaffold CI passes on pull request, dev, and main.

## Next build

QL-035 — Phone/SMS Controlled Live Enablement Plan.

QL-035 may plan the controlled implementation path, but it must remain explicit about what is still disabled and what manual approval is required before any live behavior changes.
