# QL-119 operator checklist

- [ ] Verify QL-118 seven review criteria passed with none blocked/review.
- [ ] Confirm implementationPermission not_granted and owner not approved.
- [ ] Confirm owner decision options, signatures, consent and evidence cannot be captured.
- [ ] Verify packet questions, agenda, privacy field exclusions and no-write boundaries.
- [ ] Keep rollback, purge, dry-run, emergency disable, fail-closed, idempotency and duplicate prevention prerequisites.
- [ ] Verify PR-head app-build and final main app-build, disabled preview build/deploy, Supabase Preview and Workers builds.
- [ ] Log separately any later dev-sync-triggered failing Worker build; never hide a failed check.
