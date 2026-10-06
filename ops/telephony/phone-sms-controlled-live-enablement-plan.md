# Phone/SMS Controlled Live Enablement Plan — Ops Checklist

## Purpose

This checklist keeps QL-035 planning-only. It defines controls for a later implementation scaffold without enabling live phone/SMS behavior.

## Before review

Confirm:

- QL-034 approved controlled live enablement planning.
- All QL-035 evidence is synthetic and redacted.
- No actual phone numbers are stored.
- No provider credentials are stored.
- No webhook secret values are stored.
- No screenshots, invoices, ownership documents, customer records, recordings, transcripts, or live provider payloads are stored.

## Required controls

Confirm every control is present:

```text
manual approval
provider boundary
webhook boundary
SMS send boundary
recording boundary
AI boundary
persistence boundary
customer data boundary
redaction boundary
rate limiting
replay protection
rollback / kill switch
deployment gates
operator training
```

## Required phases

Confirm the plan contains:

```text
implementation scaffold planning
disabled verification planning
manual go/no-go planning
```

## Live behavior lock

Confirm these remain false or disabled:

```text
ENABLE_PHONE_WEBHOOKS=false
ENABLE_SMS=false
ENABLE_CALL_RECORDING=false
ENABLE_AI_DRAFTS=false
ENABLE_AI_AUTO_SEND=false
PHONE_SMS_PROVIDER_WEBHOOK_CONFIGURED=false
PHONE_SMS_PERSISTENCE_WRITES_DISABLED=true
PHONE_SMS_LIVE_CUSTOMER_READS_DISABLED=true
PHONE_SMS_LIVE_CUSTOMER_WRITES_DISABLED=true
```

## Block the plan if

Block QL-035 if any of these occur:

- QL-034 approval is missing.
- A control area is missing.
- A phase is missing.
- Live SMS or phone webhooks are enabled.
- Provider callbacks are configured.
- Persistence writes are enabled.
- Live customer access is enabled.
- Unredacted or live evidence is present.

## Promotion rule

Do not promote unless the branch PR CI and final `main` push CI are both green.
