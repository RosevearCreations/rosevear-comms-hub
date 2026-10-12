# QL-097 — Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Plan

## Purpose

QL-097 plans the evidence ledger that may later record a manual operator acceptance event for the public disabled preview safe-read flow.

This build is intentionally plan-only. It does not create a database table, persist browser state, add a submit button, insert audit rows, upload files, call providers, send messages, or enable live communications.

## Planned ledger proof

The future ledger should only contain bounded proof fields:

- build and reviewed-build identifiers;
- selected brand label;
- active source label;
- review outcome;
- safe-read row counts;
- rejected-row diagnostic count;
- runtime lockout count;
- checkpoint summary;
- blocked-runtime summary;
- a manual acceptance reference;
- creation timestamp.

## Explicit exclusions

The ledger plan excludes:

- customer names, phone numbers, and email addresses;
- live customer/contact/provider payloads;
- raw rejected rows;
- message bodies outside the synthetic public preview;
- recordings and transcript/archive payloads;
- SMS/MMS content;
- audit, consent, admin, and retention payloads.

## Runtime boundary

All runtime categories remain disabled: browser writes, Supabase mutations, acceptance persistence, live customer/provider reads, Phone/SMS, callbacks, archive/consent/audit/retention writes, AI generation/send, provider delivery, and live pilot runtime.

## Verification target

- App scaffold CI green.
- Supabase Preview green on final main.
- GitHub Pages disabled preview green on final main.
- `Workers Builds: rosevear-comms-hub` green on final main.

## Next queued

QL-098 — Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Review.
