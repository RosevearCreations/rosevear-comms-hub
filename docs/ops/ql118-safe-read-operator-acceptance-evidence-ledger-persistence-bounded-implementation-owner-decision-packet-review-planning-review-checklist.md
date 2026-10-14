# QL-118 operator checklist

- [ ] QL-117 planning outcome is ready and all source checks passed.
- [ ] QL-118 verifies at least seven review criteria without regressions.
- [ ] Owner decision capture remains prohibited; no approval is inferred.
- [ ] Planning candidate and rejected private fields remain separate.
- [ ] Browser and endpoint writes disabled, Supabase ledger unimplemented, implementation permission not_granted.
- [ ] No Phone/SMS, callbacks, provider messages, recordings, consent/archives/audits/retention, AI sends, or live pilot.
- [ ] PR-head app-build passes; final main app-build, Pages build/deploy, Supabase, Workers all GREEN.

Any failing check is a STOP rather than an approval.
