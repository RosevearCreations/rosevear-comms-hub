# QL-347 — Independent Issuer Custody Decision Receipt, Dual-Owner Field Reconciliation & Single TEST Enrollment Operator Handoff

## Release boundary

This is an **offline, read-only operator handoff**, not an enrollment or a connection.
The original issuer identity, independent witness, real receiver-off state, database
role and fresh signed enrollment must be verified outside this code. A JSON record
cannot manufacture an independent person's testimony or grant owner consent.

The QL-347 utility compares a valid QL-346 preflight against one issuer custody
reference and two differently role-labelled decisions, each bound to the same
signed TEST request digest. It emits a digestible, nonsecret receipt. It accepts
only `HOLD`, `REJECT` or `REVIEW_ACKNOWLEDGED_NO_ENROLLMENT`; it has no approval
or activation command. Rejection remains explicit.

```powershell
node .\runtimes\hub-relay\ql347-custody-handoff.mjs --help
node .\runtimes\hub-relay\ql347-custody-handoff.mjs --reconcile QL346_READBACK.json ISSUER_CUSTODY_REFERENCE.json SOURCE_DECISION.json MASTER_DECISION.json
```

The QL-346 readback must contain the actual cryptographic preflight fields.
On Ree's original Windows host, keep the receiver OFF; Jack performs a separate
owner review on his own machine. Source and master owners must decide separately.
The real witness must authenticate original issuer provenance out of band.
Never copy private keys, passphrases, tokens, database credentials or real
customer data into this handoff.

Before a future, separately authorized **single** nonproduction TEST enrollment:

1. Independently verify the original issuer and the observed public-key fingerprint.
2. Recheck TLS, Tailnet policy, receiver OFF, rollback and fresh field evidence.
3. Obtain two separate original-owner TEST approvals for the exact request.
4. Have an independently authorized operator verify the private database role and
   execute a separate, monitored one-receipt workflow with a rollback plan.

No step above is claimed complete by this release. There is no DB migration,
network access, receiver start, six-app connection, customer message or device action.
