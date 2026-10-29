# QL-256 — Original signer provisioning decisions, independent custody assignment and owner-safe TEST preparation

**Release mode: DISABLED PREVIEW. Integration: DISCONNECTED / HOLD.**

At the independently recorded 29 October 2026 14:09:17Z public GitHub snapshot, all six apps returned HTTP 404 for `docs/integration/ql246-source-proof.json` at their full immutable `main` SHAs. A fresh same-day GitHub check also returned 404 for all six at those SHAs. No independently trusted signer, verified custodian/witness, authenticated owner TEST-only approval or genuine gateway GET receipt has been supplied.

## QL-256 code changes

- `scripts/ql256-connection-readiness.mjs` strictly validates the six known source rows and signer provisioning decisions. An unassigned private role is honest; three proposed role aliases must be different, but their entry does **not** authenticate real people. A claimed verified signer or proof HTTP 200 is rejected until independently verified by the existing proof tools.
- The trial request inspector accepts only a future <=30-minute nonproduction window, GET `/api/integration/v1/health` and GET `/api/integration/v1/capabilities`, no approval claim, no live data, no running relay and documented rollback. Even accepted proposals are **not booked and do not authorize an HTTP request**.
- `npm run verify:ql256` tests the fail-closed behavior. `npm run integration:ql256-readiness` prints the dated offline snapshot without network activity.
- The disabled operator view links six specific handoffs and an owner walkthrough. It distinguishes production-green application code from disconnected integration.

## Owner decision sequence

1. Each source team responds **SIGNER_NOT_PROVISIONED**, **SIGNER_EXISTS_CUSTODY_NOT_VERIFIED**, or **SIGNER_STATUS_UNKNOWN**. No synthetic signature or test receipt substitutes for the missing authentic source proof.
2. If missing, authorize a real Ed25519 signer in the source app's approved private secrets process. Never upload private keys to a public repository, ChatGPT, or a central all-app secret store. Record only the public DER-SPKI SHA-256 fingerprint after independent verification.
3. Assign distinct authenticated custodial, witnessing and reviewing roles by a private, independently verified method. Comms Hub does not name or impersonate the people.
4. Agree on an evidence sequence: **preliminary signer trust / public source identity**, then a separately authenticated owner decision for a bounded nonproduction GET test, then genuine test/denial receipts and the **final** signed QL-246 proof. Where the previous QL-246 handoff requires test receipts before it allows the test, reviewers must formally accept this staged sequence; this build does not silently relax the gate.
5. Record exact source A with matching GREEN CI. Publish the genuine final signed proof at descendant proof B, not a self-referential SHA. Retrieve B's immutable raw file, check signature/byte digest/pin, audit and genuine denial receipts. Recheck after any source advance.
6. Only then request an independent reviewer decision on the separately authorized pilot. The 12 live communications gates stay HELD until their own evidence and owner approval exist.

See [master owner walkthrough](ROSEVEAR_QL256_MASTER_CONNECTION_WALKTHROUGH.md) and six individual documents in [`ql256-apps/`](ql256-apps/).

No signer was generated, no key entered, no real custodian assigned, no private request made, no server installed, no schedule booked, no live calls, SMS, Etsy edits, customer operations or payments triggered by QL-256.
