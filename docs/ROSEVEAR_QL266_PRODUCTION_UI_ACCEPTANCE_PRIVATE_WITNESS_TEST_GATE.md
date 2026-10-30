# Rosevear Comms Hub QL-266 — Production UI acceptance, private witness and conditional TEST gate

**29 October 2026 (Eastern) · All source and coordinator software on `main`; integration remains DISCONNECTED / HOLD.**

## What was verified from the public source, not from owner checkboxes

Read-only GitHub Contents API requests at these **exact QL-265 `main` commit SHAs** returned **HTTP 404** for `docs/integration/ql246-source-proof.json` in all six sources:

| Source | Immutable observed SHA | Original proof B |
| --- | --- | --- |
| AI Data Platform | `fefb13e63487e6685555ed52fcdb4573838513e7` | HTTP 404 |
| Devil n Dove | `93c09040d45e2b544270f7e77e633f4d8739bcef` | HTTP 404 |
| Rosie Dazzlers | `a5bd0ded1044a8ce5a0f394fa2266a1e1e495c6c` | HTTP 404 |
| Yard Workers | `531e7422b08e8f4836dfe5a5705e4aabd353e74a` | HTTP 404 |
| iCamp | `4e12312490e2c839fd2090128a2bf70570357bf8` | HTTP 404 |
| Rosevear AI Hub | `a2e8e1839cd54b7941121143b97b4d148a15c243` | HTTP 404 |

The observations apply only to these exact historical SHAs. A later source commit must be rechecked. A public HTTP 200 alone never proves signature validity or custody.

## QL-266 operator interface

Open **Six-app evidence & activation HOLD** in the Rosevear Comms Hub operator preview. QL-265 provides the local synthetic 54-case, zero-network simulation. The new **QL-266 production UI acceptance** panel adds:

1. Six source-specific owner walkthrough checkboxes for reviewing the I.T./Connections screens from QL-265. They are deliberately **in-memory owner self-reports**, not independently authenticated owner receipts. No checkbox grants access.
2. Exact QL-265 source SHA and HTTP 404 receipt references. Each still requires original signed proof B.
3. A sanitized report that always retains private roles `NOT_INDEPENDENTLY_VERIFIED`, signer proof `NOT_AVAILABLE`, isolated tenant `NOT_VERIFIED`, owner TEST `NOT_GIVEN`, and live-pilot holds `12`.
4. A conditional GET-only TEST review that remains **HELD_UNSCHEDULED** even if all six owner walkthrough checkboxes are selected.

The coordinator preview cannot verify off-platform human identity, sign a source proof, prove tenant isolation, issue credentials or make an authenticated gateway GET. No calls, SMS, payments, bookings, provider posts, home access or live dispatch can be enabled by this screen.

## The real independently verified prerequisites

In an approved **private channel, not GitHub, chat or a browser form**:

1. Owner separately appoints and authenticates a genuine signing-key custodian, **different** nonce witness and independent reviewer for each source, and approves a persistent restricted signer host. Determine signer existence there. Do not automatically generate or publish a key.
2. Witness issues a fresh bounded challenge; custodian proves real private-key possession; the independent reviewer verifies witness independence, nonce freshness and the public Ed25519 SPKI fingerprint from a separate trusted channel. Store private material only in approved restricted custody.
   - QL-266 provides an **optional offline cryptographic check**: `scripts/ql266-private-witness-crypto-check.mjs` accepts one private witness receipt file and an independently sourced public SPKI SHA-256 fingerprint via `QL266_TRUSTED_SPKI_SHA256`. It validates a fresh, signed Ed25519 nonce bound to the source and immutable SHA; it never prints the receipt contents, key material, private file path or challenge nonce.
   - Even when its output says `SIGNATURE_VALID_ONLY`, the human custodian/witness/reviewer remain `NOT_VERIFIED` and TEST stays `HELD_UNSCHEDULED`. The private reviewer must authenticate people and nonce uniqueness out of band. CI uses ephemeral **synthetic** signing keys only to test code and never creates a real source signer.
3. With real signed-source authorization, publish original immutable `docs/integration/ql246-source-proof.json` proof B and recheck at the **new exact `main` SHA**. Never equate source A, generated test keys or an owner status label with original signed proof B.
4. Independently verify **isolated nonproduction tenants**, least-privilege per-app read-only service identities, no production business/customer/home-data scope, and approved stop/rollback procedure.
5. Receive separately authenticated owner **TEST-only** authorization. Only an authorized operator may then schedule at most **two positive and seven denial GETs per app within 15 minutes**. No live actions.

Until all five are complete and independently reviewed, six-app integration is **DISCONNECTED / HOLD**. No network window is approved or scheduled by QL-266.

## Verification and next build

`npm run verify:ql266` checks the fail-closed source snapshot, owner-review behavior and cryptographic receipt validation against synthetic CI fixtures; full app Vitest and Vite build protect the software promotion. Source-app Green CI is separate from actual integration authorization.

**Next suggested: QL-267 — Six-App Owner Walkthrough Receipt Reconciliation, Private Witness Proof Return Intake & Independently Authorized Nonproduction Gateway Dry-Run Scheduling (HELD).**
