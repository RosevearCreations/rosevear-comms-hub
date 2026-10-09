# QL-062 — Phone/SMS Controlled Live Enablement Live-Pilot Disabled Operator Console Scaffold

## Status

Queued for promotion.

## Purpose

QL-062 adds the first phone/SMS-specific operator interface while keeping the entire phone/SMS runtime disabled. It is a scaffold for readiness review only.

## How to access the current interface

The current interface is the Rosevear Comms Hub admin web app deployed from `main`. It currently contains:

- Brand-aware inbox.
- Contacts.
- Tasks.
- Intakes.
- Local data tools.
- Manual lead creation.
- The QL-059 app-wide help system with circled `i` section help.

After QL-062 is deployed, the operator can open the new disabled phone/SMS console from the existing admin interface by clicking the floating **Phone/SMS console — disabled** button in the lower-right corner.

## What the QL-062 console includes

- Disabled phone/SMS console launcher.
- Stage status summary.
- Safety lock summary.
- Manual readiness checklist.
- Variables, services, and application-link guidance.
- Synthetic/redacted operator notes.
- Disabled future action buttons for SMS, calls, provider connection, and live-number attachment.
- Clear next-stage pointer to QL-063 console review.

## Safety boundary

QL-062 does not:

- Grant live enablement.
- Start a live pilot.
- Execute runtime verification.
- Connect a provider account.
- Attach or purchase a live number.
- Register callbacks or webhooks.
- Enable provider delivery.
- Send SMS.
- Place calls.
- Record calls.
- Generate transcripts.
- Enable AI drafts or AI auto-send.
- Read or write live customer data.
- Write persistence records.
- Write archive or retention records.
- Add a Supabase migration.

## Required disabled state

The following must remain false:

- Provider account connection allowed.
- Provider live-number attachment allowed.
- Provider callback registration allowed.
- Provider webhook configured.
- Provider callback allowed.
- Live phone webhook allowed.
- SMS sending allowed.
- Call recording allowed.
- AI draft allowed.
- AI auto-send allowed.
- Persistence writes allowed.
- Live customer reads or writes allowed.
- Dry-run execution allowed.
- Provider delivery allowed.
- Archive writes allowed.
- Retention policy writes allowed.
- Live pilot runtime allowed.

## Evidence rules

All QL-062 evidence is synthetic, redacted, review-only, and `safeToPersist: false`.

## Next build

QL-063 — Phone/SMS Controlled Live Enablement Live-Pilot Disabled Operator Console Review.
