# QL-059 — Phone/SMS Controlled Live Enablement Live-Pilot Explicit Go/No-Go Decision Gate

Status: implemented on the QL-059 branch.

## Purpose

QL-059 records an explicit owner-reviewed go/no-go decision after QL-058 final readiness review. The approval is intentionally limited to the next planning build, **QL-060 — Phone/SMS Controlled Live Enablement Live-Pilot Controlled Activation Planning**.

QL-059 does **not** enable live traffic, connect providers, attach live numbers, start a pilot, or write production data.

## Decision allowed by this build

Allowed decision:

- `approve_controlled_live_pilot_activation_planning`

This means the chain is ready to plan a controlled activation path later. It does not authorize runtime activation.

Blocked decisions:

- `defer_live_pilot`
- `reject_live_pilot`
- any decision that grants live runtime behavior in this build

## Required prerequisite chain

QL-059 requires the full post-closure prerequisite chain:

1. QL-050 post-closure live-pilot readiness decision gate
2. QL-051 prerequisite evidence intake
3. QL-052 prerequisite evidence review
4. QL-053 prerequisite gap closure plan
5. QL-054 prerequisite gap closure review
6. QL-055 prerequisite gap evidence intake
7. QL-056 prerequisite gap evidence review
8. QL-057 prerequisite gap evidence closure gate
9. QL-058 prerequisite final readiness review

## Required go/no-go items

The gate reviews synthetic, redacted decision evidence for:

- owner go/no-go approval
- provider setup prerequisites
- provider disabled-mode boundary
- phone-number ownership readiness
- SMS consent policy
- STOP/START/HELP policy
- call-recording notice policy
- staff access controls
- rollback and kill-switch readiness
- rate-limit and replay controls
- audit and redaction
- customer data boundary
- production proof review
- manual intervention steps
- website help system readiness
- next-gate activation-planning-only boundary

Each item must be approved, owner-reviewed, decision-gate-only, activation-planning-only, provider-delivery-blocked, runtime-execution-blocked, provider-connection-blocked, persistence-write-blocked, synthetic-only, redacted-only, and `safeToPersist: false`.

## Runtime safety locks retained

QL-059 keeps all of the following disabled:

- provider webhooks
- provider callbacks
- live phone webhooks
- SMS sending
- call recording
- AI drafts
- AI auto-send
- persistence writes
- live customer reads
- live customer writes
- dry-run execution
- provider delivery
- archive writes
- retention policy writes
- provider account connection
- provider live-number attachment
- live pilot runtime

## Website help system requirement

The website now includes a reusable section help system:

- floating Help button
- circled “i” help trigger attached to major app sections
- help topics for overview, brand switcher, navigation, stats, inbox, conversation detail, contacts, tasks, intakes, data tools, manual lead, live-pilot decision safety, and manual intervention
- accessible labels for help buttons
- no external service calls
- no persistence writes

## Manual intervention guide

Before any later live activation planning can proceed, manual intervention must be documented outside source code:

1. **Variables** — provider keys, webhook secrets, Supabase service credentials, live phone numbers, and callback signing secrets must remain outside git.
2. **Services** — verify Supabase, hosting, DNS, GitHub Actions, deployment dashboard, and the selected phone/SMS provider in their own dashboards.
3. **Application links** — record redacted links to the production app, provider console, Supabase project, GitHub Actions run, and deployment dashboard.
4. **Evidence** — store only synthetic/redacted proof in source-controlled fixtures. Do not commit customer records, phone numbers, provider payloads, recordings, transcripts, invoices, screenshots containing real data, secrets, or credentials.
5. **Safety** — keep provider callbacks, phone webhooks, SMS send, call recording, AI auto-send, persistence writes, archive writes, retention policy writes, and live pilot runtime disabled in QL-059.

## Production proof

QL-059 can only be considered complete after the exact `main` production commit passes:

- `npm install`
- `npm run check`
- `npm run build`

## Next queued build

QL-060 — Phone/SMS Controlled Live Enablement Live-Pilot Controlled Activation Planning.
