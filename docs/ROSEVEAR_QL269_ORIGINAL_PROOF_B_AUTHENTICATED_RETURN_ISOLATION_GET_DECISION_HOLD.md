# Rosevear Comms Hub QL-269 — original signed Proof-B acceptance, six isolated tenants and conditional GET trial decision

**30 October 2026 Eastern — software build may be GREEN; integration is DISCONNECTED / HOLD.**

## Operator interface

Navigate to the Comms Hub's disabled-preview **Six-app evidence & activation HOLD → QL-269**.
The QL-269 panel provides six dated public source observations, six nonproduction preparation checklists and strict optional intake of a *sanitized, status-only* return. The browser only generates a HOLD ledger. The page makes no network requests, does not save inputs, and cannot authenticate a signer, witness, reviewer, tenant, owner or gateway.

The QL-269 return parser accepts only the exact JSON schema `rosevear-comms-ql269-sanitized-evidence/v1` and exactly six ordered rows. Every row must contain the matching immutable `observedMainSha`, `source`, nullable public `publicProofSha256` and `isolatedTenantFingerprintSha256` values (lowercase 64-character SHA-256 hex), and six boolean preparation fields. No extra keys, private values, owner authorizations, identities, hostnames or credentials are allowed. An accepted packet is an **unauthenticated claim**, never cryptographic acceptance or gateway release. A repeated tenant fingerprint is flagged as a collision, not treated as proof of cross-tenant leakage.

Blank schema template: the `ql269BlankSanitizedPacket()` helper in `app/src/operator/ql269AuthenticatedProofReview.ts`. An operator can use the graphical checkboxes without writing JSON. External evidence must remain in the independently controlled private custody system, not in a browser or GitHub file.

## Six immutable original-Proof-B rechecks

GitHub's contents endpoint was queried at the **exact `main` SHA** shown below. Each returned **HTTP 404** for `docs/integration/ql246-source-proof.json`. These facts apply to the checked commit, not any newer commits.

| Application | Checked `main` SHA | Signed Proof B |
| --- | --- | --- |
| `RosevearCreations/ai-data-platform` | `ad958eee57fc02a1cd6753126e29e7e9a650fda2` | HTTP 404 |
| `RosevearCreations/devilndove-site` | `2f63fee9a251547550f74566041375ca1e140e2e` | HTTP 404 |
| `RosevearCreations/rosiedazzlers` | `717798f3f298f5239078917c938587931703ff27` | HTTP 404 |
| `RosevearCreations/yw` | `642aef0c5936c5b7792fa56f72e15c9f6ca1d27d` | HTTP 404 |
| `RosevearCreations/iCamp` | `f1a57c72c7125a7518f3d44eba76884b8f29e479` | HTTP 404 |
| `RosevearCreations/rosevear-ai-hub` | `8faeafbfe72339a26319361ad204819e48927304` | HTTP 404 |

## Actual authenticated acceptance requirements

1. Independently authenticate the *real* source signing-key custodian, a **distinct** challenge witness, a **separate** reviewer and the owner-appointed restricted persistent signing host. Witness and pin verification require a private out-of-band process; the existing offline QL-266 verifier verifies Ed25519 mechanics only, not people.
2. With proper authorization, publish each genuine signed A→B proof to the expected source path. An authorized independent reviewer must re-fetch proof B at the **new immutable main commit**, compare signed source revision A, proof commit B, public digest, CI provenance and separately trusted Ed25519 SPKI pin using the existing offline QL-248 verifier. HTTP 200, a syntactically valid signature or self-published pin does **not** alone establish authenticity.
3. Independently attest **six isolated nonproduction tenants/projects**, separately scoped GET-only identities, the seven denial scenarios, no real customer/billing/Etsy/home/camera/vault data, and validated stop/rollback. **Never** use Yard Workers production Rosevear Landscaping, live iCamp or Rosie Dazzlers customer data, Devil n Dove Etsy store, or Rosevear AI Hub private equipment as TEST fixtures.
4. Separately authenticate the owner's **TEST-only** authorization and independent reviewer release decision. Only after all gates are genuine may a controlled operator schedule at most two positive and seven denial-only GETs per source within fifteen minutes. That later authorization is **not part of QL-269** and cannot be granted from UI checkboxes.

Current authentic proof-B count: **0/6**. Independently authenticated tenant proofs and owner TEST approval: **not received**. Actual gateway GETs: **0**. Trial windows: **0**. Live-pilot holds: **12**. Integration: **DISCONNECTED / HOLD**.

## Validation and promotion

The `app/src/operator/__tests__/ql269AuthenticatedProofReview.test.ts` suite tests exact historical SHA and 404 classifications, strict schema, stale or forged fields, self-report-only counting, fingerprint collisions, data non-echo and fail-closed release. `npm run verify:ql269` runs the focused suite; app TypeScript/Vite build and full tests must pass before remote promotion. GitHub workflows on the exact promoted SHA are the separate software deployment acceptance checks.

**Next proposed: QL-270 — Verified Original Proof-B Intake Recovery, Independent Role/Pin Revalidation and Six-App Nonproduction GET Preflight Exception Closure (HELD).**
