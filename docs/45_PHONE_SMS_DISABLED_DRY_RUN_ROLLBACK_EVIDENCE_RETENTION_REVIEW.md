# QL-032 — Phone/SMS Disabled Dry-Run Rollback and Evidence Retention Review

QL-032 defines the rollback and evidence-retention review for the disabled dry-run phone/SMS planning path.

This build remains planning-only. It reviews what should happen to synthetic evidence from QL-028 through QL-031, but it does not persist anything, enable any live feature, connect a provider, or create customer records.

## Purpose

The review answers four questions:

1. Which synthetic evidence previews should be discarded after review?
2. Which redacted planning notes may be carried forward to the next gate?
3. Which synthetic decisions must be held for another review pass?
4. What rollback scope must be documented before any future live enablement planning?

## Required prior gates

QL-032 assumes the following stages are already complete in the repository:

- QL-028 — disabled dry-run runtime verification.
- QL-029 — disabled dry-run evidence mapping review.
- QL-030 — disabled dry-run human review gate.
- QL-031 — disabled dry-run operator outcome journal.

## Accepted evidence types

Only these source types are allowed:

- synthetic disabled runtime response labels.
- synthetic mapped contact/conversation/task preview labels.
- synthetic human review decision labels.
- synthetic operator outcome journal preview labels.
- redacted retention reasons.
- redacted rollback-scope labels.

## Required preview shape

Every generated entry must remain:

```text
safeToPersist: false
futureEnablementPlanningOnly: true only for approved planning outcomes
liveEnablementAllowed: false
providerCallbackAllowed: false
smsSendAllowed: false
aiDraftAllowed: false
autoSendAllowed: false
persistenceWrites: false
liveCustomerRead: false
liveCustomerWrite: false
```

## Retention classes

QL-032 recognizes three retention classes:

```text
discard_preview
retain_redacted_planning_note
hold_pending_review
```

`discard_preview` means the preview shape may be used to prove the review happened, but the synthetic payload itself is not retained.

`retain_redacted_planning_note` means a redacted non-secret planning note can be carried forward to the next gate.

`hold_pending_review` means the synthetic item needs another review pass and cannot be used as future readiness evidence.

## Rollback scope

Rollback scope is limited to synthetic preview artifacts and planning labels. It must never include real customer data, provider payloads, or live phone/SMS records.

Allowed rollback-scope labels include:

```text
synthetic disabled response preview only
mapped contact preview
mapped conversation preview
mapped task preview
human review decision preview
operator outcome journal preview
```

## Forbidden evidence

Do not commit or paste:

- actual candidate, purchased, customer, business, personal, Bell Fibe, RosieDazzlers, DevilnDove, or existing phone numbers.
- provider credentials, SIP credentials, API keys, auth tokens, passwords, connection strings, webhook secrets, or secret values.
- provider invoices, receipts, screenshots, ownership documents, or portal evidence.
- live provider payloads, customer SMS, customer phone numbers, call recordings, transcripts, or mapped live records.
- real operator identities.
- live callback URLs containing secrets.
- any instruction that enables live provider callbacks, live phone webhooks, SMS sending, call recording, AI drafts, AI auto-send, persistence writes, live customer reads, or live customer writes.

## Environment guidance

Safe default values remain blocked:

```text
PHONE_SMS_DISABLED_DRY_RUN_ROLLBACK_RETENTION_STATUS=blocked_pending_rollback_retention_review
PHONE_SMS_ROLLBACK_RETENTION_SYNTHETIC_ONLY=true
PHONE_SMS_ROLLBACK_RETENTION_REDACTED_ONLY=true
PHONE_SMS_ROLLBACK_RETENTION_NO_PERSISTENCE_WRITES=true
PHONE_SMS_ROLLBACK_RETENTION_LIVE_CUSTOMER_ACCESS_DISABLED=true
PHONE_SMS_ROLLBACK_RETENTION_PROVIDER_CALLBACK_DISABLED=true
PHONE_SMS_ROLLBACK_RETENTION_AUTO_SEND_DISABLED=true
PHONE_SMS_ROLLBACK_RETENTION_AI_DRAFTS_DISABLED=true
PHONE_SMS_ROLLBACK_RETENTION_RESULT=not_run
PHONE_SMS_ROLLBACK_RETENTION_DECISION=not_reviewed
PHONE_SMS_ROLLBACK_RETENTION_WINDOW=undecided
```

The existing disabled flags remain required:

```text
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

## Production GREEN definition

QL-032 is GREEN only when:

- the rollback/retention helper exists in `api/deployment/`.
- the rollback/retention JSON fixture exists in `api/contracts/`.
- this source-of-truth document is present.
- README, `.env.example`, and `docs/08_BUILD_SEQUENCE.md` reflect QL-032.
- every generated entry is synthetic, redacted, and `safeToPersist: false`.
- provider callbacks, live phone webhooks, SMS sending, call recording, AI drafts, AI auto-send, persistence writes, live customer reads, and live customer writes remain disabled.
- no Supabase migration is added.
- no provider account is connected.
- no provider callback route is enabled.
- GitHub Actions App scaffold CI passes on the PR and on `main` after promotion.

## Next build

QL-033 — Phone/SMS Disabled Dry-Run Final Pre-Enablement Readiness Review.
