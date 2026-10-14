# QL-113 Remote Operator Guidance

QL-113 is an owner decision planning layer. It may help an operator understand what the owner must decide later, but it must not collect, store, submit, or act on an owner decision.

## Allowed

- Display owner decision questions.
- Display approval prerequisites.
- Display rejection and deferral dispositions.
- Display no-write runtime boundaries.

## Not allowed

- Store owner approval.
- Store owner rejection.
- Enable implementation.
- Create persistence.
- Add write routes.
- Add browser submit controls.
- Write to Supabase.
- Enable Phone/SMS, callbacks, archives, audits, retention, AI delivery, or live pilot behavior.
