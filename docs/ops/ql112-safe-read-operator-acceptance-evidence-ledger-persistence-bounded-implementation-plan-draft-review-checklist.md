# QL-112 Ops Checklist

## Review checks

- Confirm QL-111 draft outcome is `draft_ready_for_owner_review`.
- Confirm implementation permission remains `not_granted`.
- Confirm implementation candidate status remains `not_approved`.
- Confirm ledger write status remains `planned_not_implemented`.
- Confirm endpoint implementation status remains `not_implemented`.
- Confirm browser write status remains `disabled`.

## Draft sections reviewed

- Candidate ledger table draft.
- Candidate route contract draft.
- Candidate browser-control draft.
- Dry-run and idempotency draft.
- Rollback and purge draft.
- Owner approval draft.
- Verification gates and stop conditions.

## Stop immediately if any appear

- Migration, table, view, policy, index, RPC function, storage object, seed row, insert, update, or delete.
- Route handler, Worker write binding, browser submit, local persistence, hidden control, or acceptance save.
- Phone/SMS provider runtime, callback, send, inbound handler, recording, DTMF, consent write, or live pilot runtime.
- Archive, audit/admin, retention, cleanup, purge, rollback automation, or AI generation/send write.
- Rejected private fields in schema, route, browser copy, logs, archives, audit/admin views, retention workflows, exports, or evidence.

## Promotion gates

- PR-head app-build success before merge.
- Final `main` app-build success.
- Final GitHub Pages disabled-preview build success.
- Final GitHub Pages disabled-preview deploy success.
- Final Supabase Preview success.
- Final Cloudflare Workers Builds success.
