# Phone/SMS Disabled Dry-Run Rollback and Evidence Retention Review

Use this checklist before any later phone/SMS enablement planning.

## Confirm prior stages

- [ ] QL-028 runtime verification is GREEN.
- [ ] QL-029 evidence mapping review is GREEN.
- [ ] QL-030 human review gate is GREEN.
- [ ] QL-031 operator outcome journal is GREEN.

## Confirm QL-032 review shape

- [ ] Every source is synthetic-only.
- [ ] Every source is redacted-only.
- [ ] Every source is `safeToPersist: false`.
- [ ] Every retention note avoids actual phone numbers.
- [ ] Every retention note avoids provider credentials and webhook secrets.
- [ ] Every retention note avoids live customer data.
- [ ] Every retention note avoids recordings and transcripts.
- [ ] Every retention note avoids real operator identities.

## Confirm retention class

- [ ] Preview payloads that are no longer needed are marked `discard_preview`.
- [ ] Planning-only notes are marked `retain_redacted_planning_note`.
- [ ] Items requiring another pass are marked `hold_pending_review`.

## Confirm rollback scope

- [ ] Rollback scope is limited to synthetic preview artifacts and labels.
- [ ] Rollback scope does not reference live provider payloads.
- [ ] Rollback scope does not reference customer data.
- [ ] Rollback scope does not reference mapped live records.

## Must remain disabled

- [ ] Provider callbacks disabled.
- [ ] Live phone webhooks disabled.
- [ ] SMS sending disabled.
- [ ] Call recording disabled.
- [ ] AI drafts disabled.
- [ ] AI auto-send disabled.
- [ ] Persistence writes disabled.
- [ ] Live customer reads disabled.
- [ ] Live customer writes disabled.

## Do not do in QL-032

- Do not connect a provider account.
- Do not configure provider webhooks.
- Do not enter an actual phone number.
- Do not add credentials, webhook secret values, or SIP details.
- Do not upload screenshots, invoices, ownership documents, call recordings, or transcripts.
- Do not add a Supabase migration.
- Do not create live retention, audit, contact, conversation, task, or journal records.
- Do not enable phone/SMS, AI draft, or AI auto-send behavior.
