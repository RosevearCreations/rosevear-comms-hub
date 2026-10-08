# QL-058 Ops Checklist — Live-Pilot Prerequisite Final Readiness Review

Use this checklist to review readiness only. Do not enable runtime behavior.

## Prerequisite review

Confirm the QL-050 through QL-057 chain is complete and synthetic/redacted:

- QL-050 readiness decision gate approved.
- QL-051 evidence intake ready.
- QL-052 evidence review ready.
- QL-053 gap closure plan ready.
- QL-054 gap closure review ready.
- QL-055 gap evidence intake ready.
- QL-056 gap evidence review ready.
- QL-057 gap evidence closure gate ready.

## Final readiness review items

Review readiness for:

- Owner/manual approval.
- Provider setup prerequisites.
- Provider disabled-mode boundary.
- Phone-number ownership.
- SMS consent policy.
- STOP/START/HELP policy.
- Call-recording notice policy.
- Staff access controls.
- Rollback and kill switch.
- Rate-limit and replay controls.
- Audit and redaction.
- Customer-data boundary.
- Provider callback disabled proof.
- Live phone webhook disabled proof.
- SMS sending disabled proof.
- Recording disabled proof.
- AI features disabled proof.
- Persistence disabled proof.
- Live-pilot runtime disabled proof.
- Production proof readiness.
- QL-059 explicit go/no-go gate readiness.

## Disabled locks

Keep disabled:

- Provider callback routing.
- Live phone routing.
- SMS sending.
- Call recording.
- AI drafting and auto-send.
- Persistence writes.
- Live customer reads/writes.
- Dry-run execution.
- Provider delivery.
- Archive writes.
- Retention policy writes.
- Provider account connection.
- Provider live-number attachment.
- Live pilot runtime.

## Evidence exclusions

Do not include live customer records, provider payloads, credentials, phone numbers, recordings, transcripts, screenshots, invoices, ownership documents, archive payloads, retention exports, or operator identities.

## Closure

QL-058 can only queue QL-059. It cannot enable live behavior.
