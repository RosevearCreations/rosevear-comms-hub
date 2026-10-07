# QL-038 — Phone/SMS Controlled Live Enablement Manual Go/No-Go Gate

## Status

Implemented as a source-of-truth gate.

QL-038 is a manual decision gate after QL-037 disabled verification. It can approve only the next tiny monitored pilot planning build. It does not grant live enablement.

## Purpose

QL-038 records whether the controlled phone/SMS path should remain blocked, return to rework, or proceed to a later tiny monitored pilot planning build.

The approval boundary is intentionally narrow:

```text
approve_tiny_monitored_pilot_planning
```

means:

```text
QL-039 planning may be designed next.
```

It does not mean:

```text
provider callbacks enabled
phone webhooks enabled
SMS sending enabled
call recording enabled
AI drafts enabled
AI auto-send enabled
persistence writes enabled
live customer reads enabled
live customer writes enabled
live pilot started
```

## Required prior gates

QL-038 requires:

```text
QL-034 explicit live enablement decision gate approved for controlled planning
QL-035 controlled live enablement plan ready for manual implementation design
QL-036 disabled implementation scaffold ready for disabled verification
QL-037 disabled verification green
```

If QL-037 is not green, QL-038 must block.

## Allowed decisions

```text
approve_tiny_monitored_pilot_planning
continue_rework
remain_blocked
```

Only `approve_tiny_monitored_pilot_planning` can produce `approved_for_tiny_monitored_pilot_planning`, and that outcome only queues QL-039 planning.

## Required manual controls

```text
owner_approval
operator_training_acknowledgement
provider_boundary_acknowledgement
webhook_boundary_acknowledgement
sms_send_boundary_acknowledgement
call_recording_boundary_acknowledgement
ai_boundary_acknowledgement
persistence_boundary_acknowledgement
live_customer_data_boundary_acknowledgement
redaction_boundary_acknowledgement
rollback_boundary_acknowledgement
rate_limit_boundary_acknowledgement
replay_protection_boundary_acknowledgement
pilot_scope_boundary_acknowledgement
post_pilot_review_required
```

All controls must be acknowledged using synthetic, redacted, non-persistent evidence.

## Safe environment values

```text
PHONE_SMS_EXPLICIT_LIVE_ENABLEMENT_GATE_STATUS=approved_for_controlled_live_enablement_planning
PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_PLAN_STATUS=plan_ready_for_manual_implementation_design
PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_IMPLEMENTATION_STATUS=scaffold_ready_for_disabled_verification
PHONE_SMS_CONTROLLED_DISABLED_VERIFICATION_STATUS=disabled_verification_green
PHONE_SMS_CONTROLLED_MANUAL_GO_NO_GO_STATUS=blocked_pending_manual_go_no_go_gate
PHONE_SMS_CONTROLLED_MANUAL_GO_NO_GO_SYNTHETIC_ONLY=true
PHONE_SMS_CONTROLLED_MANUAL_GO_NO_GO_REDACTED_ONLY=true
PHONE_SMS_CONTROLLED_MANUAL_GO_NO_GO_NO_PERSISTENCE_WRITES=true
PHONE_SMS_CONTROLLED_MANUAL_GO_NO_GO_LIVE_CUSTOMER_ACCESS_DISABLED=true
PHONE_SMS_CONTROLLED_MANUAL_GO_NO_GO_PROVIDER_CALLBACK_DISABLED=true
PHONE_SMS_CONTROLLED_MANUAL_GO_NO_GO_PHONE_WEBHOOK_DISABLED=true
PHONE_SMS_CONTROLLED_MANUAL_GO_NO_GO_SMS_SEND_DISABLED=true
PHONE_SMS_CONTROLLED_MANUAL_GO_NO_GO_CALL_RECORDING_DISABLED=true
PHONE_SMS_CONTROLLED_MANUAL_GO_NO_GO_AI_DRAFTS_DISABLED=true
PHONE_SMS_CONTROLLED_MANUAL_GO_NO_GO_AUTO_SEND_DISABLED=true
PHONE_SMS_CONTROLLED_MANUAL_GO_NO_GO_PILOT_IMPLEMENTATION_REQUIRED=true
PHONE_SMS_PROVIDER_WEBHOOK_CONFIGURED=false
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

## Required outputs

Every QL-038 output must keep:

```text
safeToPersist: false
pilotPlanningOnly: true
tinyMonitoredPilotImplementationRequiredBeforeTraffic: true
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

## Stop conditions

Stop and do not promote if any of these are true:

```text
QL-037 disabled verification is not green
owner approval is missing
operator training acknowledgement is missing
rollback acknowledgement is missing
required manual controls are missing
provider callback is enabled
phone webhook is enabled
SMS sending is enabled
call recording is enabled
AI draft or auto-send is enabled
persistence writes are enabled
live customer reads or writes are enabled
existing numbers are not protected
evidence is not synthetic
evidence is not redacted
evidence is safeToPersist true
evidence contains actual phone numbers
evidence contains provider credentials
evidence contains webhook secret values
evidence contains customer data
evidence contains live payloads
evidence contains recordings or transcripts
```

## Non-goals

QL-038 does not:

```text
connect a provider account
configure a provider webhook
enable provider callbacks
enable phone webhooks
enable SMS sending
enable call recording
enable AI drafts
enable AI auto-send
enable persistence writes
enable live customer reads
enable live customer writes
start a live pilot
store actual phone numbers
store provider credentials
store webhook secrets
store customer data
store live payloads
store recordings or transcripts
add a Supabase migration
grant live enablement
```

## Verification target

```text
npm install
npm run check
npm run build
```

## Production GREEN definition

Production is GREEN only when:

```text
QL-038 branch PR passes CI
QL-038 branch PR merges to dev
dev promotion PR passes CI
promotion PR merges to main
main push CI passes
```

## Next build

```text
QL-039 — Phone/SMS Controlled Live Enablement Tiny Monitored Pilot Plan
```
