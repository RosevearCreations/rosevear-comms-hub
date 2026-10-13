# QL-111 Operations Checklist

Use this checklist to verify QL-111 stays a draft-only plan.

- Confirm the preview labels QL-111 as a bounded implementation plan draft.
- Confirm implementation permission is `not_granted`.
- Confirm implementation plan status is `draft_only_no_write_authority`.
- Confirm candidate ledger table, route contract, browser controls, dry-run/idempotency, rollback/purge, owner approval, and production gates are text-only.
- Confirm rejected private fields remain excluded.
- Confirm no migration, table, route, browser submit control, Supabase mutation, Phone/SMS runtime, callback, archive/audit/retention write, AI delivery, or live pilot behavior is introduced.
- Confirm all required final production checks pass on the exact `main` merge commit.
