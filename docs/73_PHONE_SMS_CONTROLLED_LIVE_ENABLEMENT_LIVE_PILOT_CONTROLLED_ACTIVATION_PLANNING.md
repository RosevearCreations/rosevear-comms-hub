# QL-060 — Phone/SMS Controlled Live Enablement Live-Pilot Controlled Activation Planning

QL-060 plans the controlled live-pilot activation path after the QL-059 explicit go/no-go decision gate.

This build is **planning-only**. It does not activate a provider, attach a live number, register callbacks, send SMS, record calls, enable AI handling, write persistence, read or write live customer records, execute dry-runs, or start a live pilot.

## Outcome

QL-060 can approve only one next step:

`approve_controlled_live_pilot_activation_plan_review`

That approval queues QL-061 for controlled activation plan review. It does not grant live enablement.

## Required prerequisite chain

QL-060 requires the post-closure prerequisite path to remain complete:

- QL-050 post-closure readiness decision gate.
- QL-051 prerequisite evidence intake.
- QL-052 prerequisite evidence review.
- QL-053 prerequisite gap closure plan.
- QL-054 prerequisite gap closure review.
- QL-055 gap evidence intake.
- QL-056 gap evidence review.
- QL-057 gap evidence closure gate.
- QL-058 prerequisite final readiness review.
- QL-059 explicit go/no-go decision gate.

## Runtime locks retained

The following remain disabled and must remain disabled through QL-060:

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

## Activation planning items

QL-060 plans these items for later review:

1. Manual activation boundary.
2. Environment variable plan.
3. Provider account step plan.
4. Provider live-number attachment plan.
5. Callback registration plan.
6. SMS consent enforcement plan.
7. STOP/START/HELP enforcement plan.
8. Call-recording notice plan.
9. Operator access plan.
10. Rollback and kill-switch plan.
11. Rate-limit and replay-control plan.
12. Monitoring and alerting plan.
13. Audit and redaction plan.
14. Customer-data boundary plan.
15. Production verification plan.
16. Help and manual-intervention plan.
17. QL-061 plan-review readiness.

Each item must be owner-reviewed, planning-only, review-only for the next build, synthetic, redacted, non-persistable, and must explicitly block live runtime, provider delivery, and persistence writes.

## Manual intervention plan

No manual intervention is performed in QL-060. The plan records what will be required in a later build:

1. Confirm provider console access without connecting the provider account.
2. Confirm deployment dashboard access without changing production routes.
3. Confirm where environment variables will be entered without setting live-enabled flags.
4. Confirm callback path names without registering provider callbacks.
5. Confirm live-number ownership path without attaching a live number.
6. Confirm rollback deployment link and kill-switch owner.
7. Confirm monitoring dashboard path.
8. Confirm operator checklist owner.
9. Confirm that the in-app Help system describes the manual steps and safety locks.
10. Confirm final production CI before any later activation review.

## Evidence restrictions

QL-060 evidence must remain synthetic, redacted, and `safeToPersist: false`.

Do not include live customer records, provider payloads, phone numbers, credentials, recordings, transcripts, screenshots, invoices, ownership documents, archive payloads, retention exports, or operator identities.

## Production rule

Production is GREEN only after the exact `main` merge commit passes:

- `npm install`
- `npm run check`
- `npm run build`
