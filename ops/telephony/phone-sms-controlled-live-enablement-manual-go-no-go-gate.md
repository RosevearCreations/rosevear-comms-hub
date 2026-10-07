# Phone/SMS Controlled Live Enablement Manual Go/No-Go Gate — Ops Checklist

## Scope

QL-038 is a manual gate after disabled verification.

It can approve only QL-039 tiny monitored pilot planning. It cannot enable live phone/SMS behavior.

## Confirm prior gates

Confirm all are true:

```text
QL-034 approved controlled planning only
QL-035 plan ready for manual implementation design
QL-036 scaffold ready for disabled verification
QL-037 disabled verification green
```

## Confirm manual approvals

Confirm all are acknowledged using synthetic, redacted, non-persistent evidence:

```text
owner approval
operator training acknowledgement
provider boundary acknowledgement
webhook boundary acknowledgement
SMS send boundary acknowledgement
call recording boundary acknowledgement
AI boundary acknowledgement
persistence boundary acknowledgement
live customer data boundary acknowledgement
redaction boundary acknowledgement
rollback boundary acknowledgement
rate limit boundary acknowledgement
replay protection boundary acknowledgement
pilot scope boundary acknowledgement
post-pilot review requirement
```

## Confirm disabled runtime posture

These must remain disabled:

```text
provider callbacks
phone webhooks
SMS sending
call recording
AI drafts
AI auto-send
persistence writes
live customer reads
live customer writes
```

## Confirm forbidden material is absent

Do not proceed if any of these exist in repo files, fixtures, logs, or notes:

```text
actual phone numbers
existing business numbers
real operator identities
provider credentials
SIP credentials
webhook secret values
customer data
mapped live records
journaled live records
retained live records
readiness evidence
decision evidence
planning evidence
scaffold evidence
disabled verification evidence
pilot evidence
live provider payloads
call recordings
transcripts
invoices
screenshots
ownership documents
```

## Allowed outcome

The only allowed approval outcome is:

```text
approved_for_tiny_monitored_pilot_planning
```

This only queues:

```text
QL-039 — Phone/SMS Controlled Live Enablement Tiny Monitored Pilot Plan
```

## Stop conditions

Stop if any safety flag is enabled or if evidence is not synthetic, not redacted, or safeToPersist is true.

## Promotion gate

Do not promote unless:

```text
npm install passes
npm run check passes
npm run build passes
```
