# QL-346 — Independent Issuer Trust Verification, Original-Owner Authorization & Controlled TEST Enrollment Readiness

## Scope and actual outcome

QL-346 adds a **read-only, offline cryptographic preflight** for the original Rosevear AI Hub TEST signer and its separately signed source/master owner enrollment decisions. It does **not** connect any app, issue a database credential, enroll any device, start the Windows receiver, change Tailscale Serve, send a heartbeat, or prove an external issuer's identity. It is possible for every cryptographic fixture to pass while the proper disposition remains **HOLD**.

The existing QL-345 review acknowledgement states explicitly that it **does not** approve TEST enrollment. QL-346 separately checks actual QL-340B `owner-approval.v1` signatures against the same original-device, four-witness, and distinct-owner public keys; these are not interchangeable. It also requires an observed OFF document and matching QL-345 challenge. The older inert-loopback rollback drill never represented stopping an active receiver; no receiver-stop claim is made.

## Original device signature (offline; no network)

On Ree's original `DESKTOP-AE894KC`, in the **Rosevear AI Hub** project, the already-enrolled local private signing key can produce a 90-second outbound-only TEST proof, with the existing interactive protected-key process:

```powershell
node .\scripts\ql339b-windows-signer.mjs --sign-once
```

This prints a public `envelope` / `keyId` / `signature` packet. **Do not use `--send-once`**, which would attempt an actual outbound network request. A TEST heartbeat is not user messaging or a device action.

Separately, Ree and Jack must compare the original device key's SHA-256 SPKI fingerprint from independent key-custody evidence. **A fingerprint copied solely from the same candidate JSON is not independent confirmation.** The output of the following command only checks whether the original public key, the supplied independently observed pin, the original expected issuer/device/workload, the 90-second TTL, and the cryptographic signature agree:

```powershell
node .\runtimes\hub-relay\ql346-issuer-test-readiness.mjs --help
node .\runtimes\hub-relay\ql346-issuer-test-readiness.mjs --verify-issuer .\heartbeat.json .\ql339b-hub.public-candidate.json INDEPENDENTLY_OBSERVED_DEVICE_SPKI_SHA256
```

Replace the final placeholder with the **real, independently checked public** SHA-256 value. A matching public key and signed packet provide cryptographic evidence of key possession; they **do not automatically establish original-issuer ownership or independent custody**. No PIN, password, signing private key, or database connection string goes into this command. The packet is deliberately short-lived and must be checked while fresh; if it expires, get a new packet from the original Windows signer.

## Separate two-owner TEST enrollment preflight

The read-only `--preflight` action accepts, in this precise order, the original QL-344 observed-OFF document, the QL-345 challenge, Ree's QL-345 review, Jack's QL-345 review, the QL-340B TEST request, Ree's original **QL-340B TEST approval**, Jack's original **QL-340B TEST approval**, the original device-signed TEST heartbeat packet, the original device public candidate, and the independently observed device signing-key SHA-256 SPKI fingerprint:

```powershell
node .\runtimes\hub-relay\ql346-issuer-test-readiness.mjs --preflight OFF.json CHALLENGE.json REE_REVIEW.json JACK_REVIEW.json TEST_REQUEST.json REE_TEST_APPROVAL.json JACK_TEST_APPROVAL.json HEARTBEAT.json DEVICE_PUBLIC.json INDEPENDENTLY_OBSERVED_DEVICE_SPKI_SHA256
```

No file is changed by this operation. The CLI exits with a neutral JSON status. Every output explicitly preserves `originalIssuerIndependentlyAuthenticated:false`, `readyForDatabaseEnrollment:false`, `databaseEnrollmentCreated:false`, `receiverActivated:false`, and `connected:false`. An invalid or missing signature, inconsistent original witness, expired challenge or heartbeat, swapped owner key, mismatched device, or rejected review is a HOLD/DENY. **No software-produced status substitutes for human issuer-custody verification.**

The actual QL-340B owner signing ceremony is a separate, supervised step which depends on original signer custody and witness review. No QL-346 routine generates a key, prompts for credentials, signs on an owner's behalf, or converts QL-345 review acknowledgement into consent.

## Remaining independent authority gates

1. Verify the issuer/device key provenance out of band, with a separately accountable original key custodian. A public candidate file or its hash is not its own witness.
2. Have Ree and Jack separately decide, under their own protected Windows keys, whether to authorize the exact short-lived QL-340B **TEST-only** request. Both must agree to the same payload; a QL-345 review signature is insufficient.
3. Independently verify the original Windows receiver is OFF on the correct computer, and reconcile the original TLS certificate, Tailnet grants, and real stop/rollback evidence. The QL-342A inert dummy drill is only an inert drill.
4. Independently authorize the exact private database role, row-level security and grant state, and verify one genuine append-only held TEST receipt **after** separately approved controlled activation. This build does not attempt this step.

The private six-app dashboard continues to show DISCONNECTED / HOLD. Repo `main` CI GREEN indicates code/test deployment only, **not** real network integration or independently witnessed source authority.

## Regression and safety gates

- The dedicated Node tests exercise real Ed25519 signature verification with **synthetic** keys, invalid signatures/pins, wrong environment/audience/capabilities, expired 90-second proofs, mismatched original witness hashes, distinct QL-345 and QL-340B owner signature types, and absence of network/DB effects.
- The operator-page tests reject fabricated connected/authorized status imports. The page never transmits files or performs private signing.
- QL-346 tests are added to the Linux required-gates script, Windows workflow, and existing relay test bundle without deleting, bypassing, or replacing prior protected checks.

Next: QL-347 — Independent Issuer Custody Decision Receipt, Dual-Owner Field Reconciliation & Single TEST Enrollment Operator Handoff (only when original evidence is truly present).
