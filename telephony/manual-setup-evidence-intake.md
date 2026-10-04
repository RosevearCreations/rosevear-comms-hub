# Manual Setup Evidence Intake

## Current status

```text
blocked_pending_manual_evidence
```

QL-023 is not a provider connection build. It is an intake checklist for safe, non-secret evidence.

## Manual facts to collect later

```text
provider selected
first target use
CAD test budget approved
provider account created outside repository
non-secret account reference label
credential storage location label
provider portal reviewed
Canadian test-number availability reviewed
SMS/compliance requirements reviewed
evidence stored outside repository
```

## Redaction rule

If a note includes any token, password, API key, SIP credential, webhook secret, customer data, screenshot content, invoice number, ownership proof, or existing phone number, it must not be added here.

Record only a redacted summary such as:

```text
Provider portal reviewed. Canadian local number availability was visible. Credentials stored outside repository.
```

## Next safe action

Collect the non-secret manual setup facts. Keep phone webhooks, SMS, call recording, and AI auto-send disabled.
