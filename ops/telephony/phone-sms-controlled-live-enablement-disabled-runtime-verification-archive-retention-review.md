# QL-048 Ops Checklist — Disabled Runtime Verification Archive & Retention Review

Use this checklist only for the disabled archive and retention review path.

## Required confirmations

- QL-034 through QL-047 readiness is represented with synthetic/redacted proof only.
- Archive scope is reviewed without writing an archive record.
- Retention boundary is reviewed without writing or changing retention policy.
- Redaction requirements are reviewed.
- Deletion boundaries are reviewed.
- Access-control requirements are reviewed.
- Rollback archive readiness is reviewed.
- Observability retention readiness is reviewed.
- Operator review retention readiness is reviewed.
- Post-review archive readiness is reviewed.
- QL-049 final disabled closure gate is queued.

## Must remain disabled

- provider webhook configuration;
- provider callbacks;
- live phone webhooks;
- SMS sending;
- call recording;
- AI drafts;
- AI auto-send;
- persistence writes;
- live customer reads/writes;
- dry-run execution;
- provider delivery;
- archive writes;
- retention policy writes;
- live pilot runtime.

## Evidence exclusions

Do not commit actual phone numbers, real operator identities, provider credentials, SIP credentials, webhook secret values, customer data, mapped live records, journaled live records, retained live records, live payloads, provider payloads, archive payloads, retention exports, recordings, transcripts, invoices, screenshots, or ownership documents.

## Production closure

QL-048 is closed only after the exact `main` promotion commit passes production CI with `npm install`, `npm run check`, and `npm run build`.
