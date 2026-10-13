# QL-108 Ops Checklist — Bounded Implementation Decision Planning

Use this checklist before promoting QL-108.

- Confirm QL-108 reviews QL-107 only and does not implement persistence.
- Confirm implementation permission remains `not_granted`.
- Confirm ledger write status remains planned/not implemented.
- Confirm endpoint implementation status remains not implemented.
- Confirm browser write status remains disabled.
- Confirm rejected private fields remain excluded from candidate fields.
- Confirm rollback, purge, emergency disable, owner approval, and production gates are documented before later implementation work.
- Confirm Phone/SMS, callbacks, providers, live reads, archives, consent, audit/admin, retention writes, AI delivery, and live pilot runtime remain blocked.
- Confirm PR-head app-build passes before merge.
- Confirm final `main` app-build and Cloudflare Workers pass before declaring production green.
