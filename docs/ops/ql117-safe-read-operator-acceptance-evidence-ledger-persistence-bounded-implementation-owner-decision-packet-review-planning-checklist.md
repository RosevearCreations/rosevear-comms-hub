# QL-117 operator checklist

- [ ] Confirm QL-116 readiness review outcome and no review/blocked findings.
- [ ] Review public-safe packet agenda and question list without input or submission.
- [ ] Verify rejected private fields are excluded from candidate ledger fields.
- [ ] Confirm owner decisions remain unapproved and unrecorded.
- [ ] Confirm permission `not_granted`, endpoint `not_implemented`, browser write `disabled`.
- [ ] Confirm fail-closed, emergency disable, rollback, purge, dry-run, idempotency and duplicate-prevention prerequisites remain documented.
- [ ] Verify PR-head app-build and all five exact-`main` gates before marking GREEN.

Any failed item is a STOP, not a silent approval.
