# QL-101 Operator Checklist

Use this checklist before any future persistence work is proposed.

- Confirm QL-101 displays `plan only no persistence`.
- Confirm candidate ledger fields do not include private payload fields.
- Confirm rejected private fields remain visible.
- Confirm rollback requirements are present.
- Confirm no browser submit or save action exists.
- Confirm no Supabase migration, RPC, storage upload, insert, update, or delete route exists.
- Confirm Phone/SMS, callbacks, archives, consent, audit/admin/retention writes, AI delivery, and live pilot runtime remain disabled.

QL-101 is not an operator acceptance record. It is a planning checkpoint only.
