# QL-363 — Six-Source Health GET Contract Compatibility, Source-Signed Read-Only Receipt Adapters & Independent Private TEST Closure Verification

## Release scope versus original-host connection

This software release adds a strict **private Node-only** health compatibility
and signer verifier for all six Rosevear application shells. A GREEN code
release does **not** mean any application has connected, signed an original
contract, enrolled the Windows receiver, completed a live private TEST or
approved customer data. The last original database readback was **0 original
enrollments, 0 signed TEST receipts, 6 source peers held, and receiver role
`NOLOGIN`**. Never replace those missing records with synthetic fixture output.

## Exact source-shell compatibility map

| Private source ID | Original source repo | Boundary | Allowed health request |
| --- | --- | --- | --- |
| `rosiedazzlers` | `RosevearCreations/rosiedazzlers` | Owned-business shell, not a customer subtenant | `GET /api/integration/v1/shell/health` |
| `devilndove` | `RosevearCreations/devilndove-site` | Owned-business shell | Same GET |
| `yw` | `RosevearCreations/yw` | Platform shell, not landscaping tenant | Same GET |
| `icamp` | `RosevearCreations/iCamp` | Platform shell, not campground tenant | Same GET |
| `ai-data-platform` | `RosevearCreations/ai-data-platform` | Support broker, no customer tenant | Same GET |
| `rosevear-ai-hub` | `RosevearCreations/rosevear-ai-hub` | Local support, no customer tenant | Same GET |

This build does **not** make changes in those six source repositories and does
not assert that their private handlers are already deployed. It defines the
contract each source must independently implement, sign and prove. There is
no public/browser connection or new listener in the Comms Hub.

## Private owner procedure

1. **Ree and Jack retain separate original hosts.** On a clean Comms Hub
   `main` revision, review QL-362's owner procedure first:
   `docs/build-records/QL-362_SOURCE_OWNER_OFFLINE_AUTHORIZATION_AND_FIRST_GET_GATE.md`.
   Never copy encrypted signing keys, DPAPI credentials or private database
   tokens between the hosts, into GitHub or into chat.
2. **Source owner, one application at a time:** produce a source-controlled
   Ed25519-signed QL-363 health contract bound to its exact source ID, repo,
   source app, shell/tenant boundary, immutable 40-character commit, separately
   pinned source manifest hash, independently approved private HTTPS origin,
   explicit `GET`, `TEST`, no redirects, 4096-byte cap, and schema
   `rosevear.hub.ql362.source-health-receipt.v1`. It must name the source
   receipt schema `rosevear.hub.ql363.source-signed-health-receipt.v1`.
   The signer key is **not** the original master-owner key or a copied peer key.
3. **Independent source signer custody:** the original private operator
   supplies trusted out-of-band pinned Ed25519 source signer keys and custody
   witnesses. `certifyQl363SixSourceCompatibility` requires all six distinct
   signatures and a restricted readback of exactly six unchanged HELD peers.
   A signed contract confirms compatibility **only**; it grants no GET,
   persistent connection, tenant access or authentication.
4. **Original QL-362 dual-owner TEST approval:** for *one* exact fresh 90-second
   unsigned request, the matching source owner signs the digest and Jack
   independently signs the same digest as master owner. Ree's original
   private operator independently verifies original issuer, QL-360/361
   archive, QL-362 immutable dual-owner proof, one enrolled TEST device,
   one original signed TEST receipt, zero revocations and receiver STOP.
   `createQl362FirstSourceGetGate` still owns all these checks and the
   persistent one-use operation claim.
5. **Original private signed GET adapter:**
   `createQl363SourceSignedReadOnlyAdapter` may be injected into QL-362 as
   `sendSignedGet` and `verifySignedSourceReceipt` **only from a trusted
   original server**. Its `privatePinnedHttpsGet` adapter must independently
   enforce actual TLS certificate pinning, exact URL, GET-only, 4-second
   timeout, 4096-byte limit, `redirects=DENY`, no raw customer/device data,
   and no automatic retry. The separately authenticated transport attestation
   must match the source-specific previously pinned TLS public key.
6. **Source response:** the source returns one bounded JSON envelope with
   exactly `schema`, `health`, and `receipt`. `health` has only QL-362's
   `sourceId`, `operationId`, `health: ok`, `connected: false`,
   `customerDataAllowed: false`, `deviceActions: false`, and schema.
   The detached Ed25519 source receipt signature covers the *exact* SHA-256
   hashes of the approved request and health body, source ID, operation ID,
   immutable commit, pinned origin, method, path and expiry. Forged or expired
   receipts and changed source signer pins are denied. The adapter can send
   **one GET maximum** per operation; no automatic retry.
7. **Independent private closeout:** after the actual GET, reread original
   QL-362 immutable dual-owner signed authorization, durable operation claim,
   signed source receipt and append-only witness. Independently confirm
   the original Ree receiver and Tailnet gateway are both OFF, six database
   peers are still `DISCONNECTED / HOLD`, and an independent *different*
   closure auditor has signed the exact receipt/operation hash. Call
   `verifyQl363IndependentClosure` only from the original protected server.
   A real closure returns a TEST evidence record, **not `CONNECTED`**.

## Verification and failure behavior

- `runtimes/hub-relay/ql363-six-source-health-adapters.mjs` is server-only.
  It cannot run a GET from its CLI and exposes no new public endpoint.
- `runtimes/hub-relay/ql363-six-source-health-adapters.test.mjs` uses only
  synthetic in-memory Ed25519 keys, HTTPS transport stubs and fake database
  rows. Its positive TEST result **does not** imply any real app is signed,
  approved or accessible. It tests forged contracts, expired pins, source
  identity drift, missing original approval, TLS mismatch, redirects,
  unexpected customer fields, forged receipt signatures, replay, changed
  database state, missing STOP, missing original QL-362 proof and forged
  independent closure signature.
- The existing QL-336A unchanged required gates and independent Windows
  owner-key job remain mandatory for `dev`/`main`; production push retains
  the SHA-256 public Worker asset-parity and disabled Pages preview checks.
- No schema migration, new login, source repository write, real GET, real
  signed source artifact, shared customer access, messaging or device action
  is performed by this build.

## Next proposed build

**QL-364 — Source-Owned Read-Only Health Handler Implementations,
Cross-Repository Signed Contract Distribution & Original-Owner TEST
Integration Acceptance.** Implement each source's actual compatible handler
in its own shell and verify only independently signed original-host evidence.
