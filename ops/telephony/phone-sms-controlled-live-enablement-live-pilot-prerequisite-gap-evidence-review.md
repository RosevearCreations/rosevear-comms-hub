# QL-056 Ops Checklist — Gap Evidence Review

## Operator posture

QL-056 is review-only. Do not enable live traffic, provider delivery, live pilot runtime, provider connection, or live-number attachment.

## Required checks

- [ ] QL-050 decision gate is approved.
- [ ] QL-051 prerequisite evidence intake is ready.
- [ ] QL-052 prerequisite evidence review is ready.
- [ ] QL-053 prerequisite gap-closure plan is ready.
- [ ] QL-054 prerequisite gap-closure review is ready.
- [ ] QL-055 prerequisite gap evidence intake is ready.
- [ ] Every QL-055 gap evidence item has a QL-056 review result.
- [ ] Every review item is marked reviewed and passed.
- [ ] Every review item remains review-only.
- [ ] Every review item confirms no live enablement approval.
- [ ] Every review item confirms no live pilot runtime.
- [ ] Every review item confirms no provider connection.
- [ ] Every review item confirms no provider delivery.
- [ ] Every review item confirms no persistence writes.
- [ ] Evidence is synthetic only.
- [ ] Evidence is redacted only.
- [ ] Evidence remains `safeToPersist: false`.

## Must stay disabled

- Provider webhook configuration.
- Provider callbacks.
- Live phone webhooks.
- SMS sending.
- Call recording.
- AI drafts.
- AI auto-send.
- Persistence writes.
- Live customer reads.
- Live customer writes.
- Dry-run execution.
- Provider delivery.
- Archive writes.
- Retention policy writes.
- Provider account connection.
- Provider live-number attachment.
- Live pilot runtime.

## Block if found

- Missing prerequisite readiness.
- Missing evidence review item.
- Failed review item.
- Non-synthetic evidence.
- Non-redacted evidence.
- Persistable evidence.
- Live customer or provider data.
- Any enabled provider, runtime, messaging, recording, AI, persistence, archive, retention, or live customer flag.

## Promotion proof

Promotion is complete only after final `main` push CI passes:

- `npm install`
- `npm run check`
- `npm run build`
