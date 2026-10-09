# QL-066 Ops Checklist — Disabled Operator Console Evidence Closure Gate

Use this checklist only for QL-066 closure-gate review.

## Allowed closure material

- Synthetic/redacted console screenshots.
- Synthetic/redacted operator notes.
- Variable names without values.
- Guidance-only service/application labels.
- Disabled button state confirmation.
- Production CI status confirmation.

## Not allowed

- Secret values.
- Callback tokens.
- Live phone numbers.
- Customer names or contact details.
- Message bodies.
- Transcripts.
- Recordings.
- Provider dashboard credentials.
- Live callback URLs.
- Persisted artifacts.
- Archive writes.
- Retention policy writes.
- Runtime delivery evidence.

## Required disabled checks

Confirm each remains disabled:

- provider account connection;
- provider live-number attachment;
- provider callbacks and webhooks;
- live phone webhook runtime;
- SMS sending;
- call controls;
- recording;
- transcripts;
- AI drafts;
- AI auto-send;
- persistence writes;
- live customer reads/writes;
- archive writes;
- retention policy writes;
- callback registration;
- live pilot runtime.

## Closure result

QL-066 may only approve QL-067 post-closure readiness review. It must not approve live-pilot activation.
