# QL-349 — Six-Application Signed TEST Handshake Orchestration, Per-Shell Verification & Independent Recovery

## Verified starting point, 2026-11-06

The public `main` branches of all six source repositories **already contain**
`rosevear-integration-manifest.json` at the QL-333 prescribed paths. All six
report `DISCONNECTED / HOLD` and `AWAITING_INDEPENDENT_SOURCE_SIGNER`.

The Comms Hub project's private Postgres observation shows **zero** original
device enrollments in `master_hub_device_enrollments_ql339b`, **zero** relay
receipts in `master_hub_relay_receipts_ql338` and six `HOLD` peer rows in
`master_hub_private_peers_ql341`. Keys held in Ree's Windows DPAPI or Jack's
separate laptop are **not disproved** by these database counts. Those local keys
are also **not proof** that a database role or source-side signer has been
independently enrolled. Nothing in QL-349 rotates, extracts or recreates them.

## Implemented, with no source-repo overwrites

1. A default dark Operations Command appearance with a Dark/Light switch,
   preserving card density, contrast and visible keyboard focus. The main
   context, help cards, breadcrumb and operator panels no longer default to
   bright white/pale-blue backgrounds.
2. One **Refresh six source contracts** button in I.T. → Connections. It reads
   the six source-owned manifests from their current public GitHub `main` heads
   and then their immutable SHA-pinned raw files, sequentially. Each response
   is schema/identity/scope checked, size bounded, nonsecret, GET-only and
   fail-closed. It does not edit a repository, send a private GET or mark a
   source `CONNECTED`. It is a live public metadata refresh, not a signed
   handshake or a private database readback. If GitHub's shared anonymous API
   returns HTTP 403/429, it falls back to six explicit `main` raw-file reads.
   Those are displayed as **found but unpinned**, never as immutable SHA-pinned
   or independently trusted records. This field fallback addresses the real
   60-requests-per-hour public API exhaustion observed during production QA;
   the source signer and all six private connections stay HOLD.
3. Private Node `ql349-six-peer-orchestrator.mjs`: an exact six-source registry,
   strict HELD private peer queue, and a one-operation-at-a-time TEST executor.
   Its required callbacks must be supplied by an independently authorized
   private broker for original owner/source signer verification, bounded
   signed GET, and Ed25519 receipt verification. Without them it does not send.
   Each operation is replay-locked and 90 seconds at most; redirects, non-200
   responses, mismatched source/operation/path and unverified receipts fail
   closed. A failure becomes **RECOVERY_REVIEW_REQUIRED** without automatic
   retry, destructive rollback or effect on another peer.
4. Even one authentic source signed TEST receipt is reported as
   `ONE_SOURCE_SIGNED_TEST_VERIFIED_STILL_HELD`, **never** as a persistent peer
   connection or a customer-data authorization.
5. Future sources use `proposeFutureSource` to stage one registry proposal with
   a manifest digest and canonical repository identity. The new app is not
   fetched or granted privileges until a separate independent review. This
   avoids duplicating the original Windows/Jack key ceremony for each app.

## Why the source repos are intentionally not rewritten

Their QL-333 descriptors and source-owned QL-335/336/337/338 routes and
protocols are already present. Replacing those files while separate builds
are being promoted would risk source contract drift and cross-branch overwrite.
QL-349 consumes the existing immutable source manifests and keeps source-side
signing/tenant authority where it belongs. No source repository, customer
table, device, phone/SMS provider or production tenant is modified by this
Hub release. This is compatible with independently queued source updates.

## How to finish genuine TEST enrollment once, not six manual key ceremonies

1. On Ree's original Windows Hub, keep the existing QL-339B original-device
   key under current-user DPAPI and run the QL-342/348 private readback.
   Jack retains his existing separate original-owner key. Do not paste or
   rotate either key into the browser or GitHub.
2. Independently authenticate original key provenance, the issuer, the four
   field evidence digests, the receiver-off state, TLS/Tailnet policy and a
   genuine supervised rollback decision. This is not achieved by an existing
   key file alone.
3. An independently authorized database operator enrolls the **exact**
   source/master signed QL-340B TEST request using the dedicated private role
   and auditable procedure. No new browser variables or service-role key.
4. After one separately authorized original-device health-only TEST, use
   QL-348 to verify exactly one immutable private DB receipt. This is the
   shared Hub prerequisite; it is not repeated as six new owner key ceremonies.
5. For each source, independently approve its own nonproduction signer/Proof-B,
   source-owner TEST decision, broker workload and origin pin. The private
   QL-349 adapter then attempts one 90-second signed read-only GET, verifies
   the original source receipt and records an append-only witness through an
   existing authorized private broker. Failed attempts remain isolated HOLD.
6. Only after separately reviewed source grants and persistent transport
   evidence may any UI status be upgraded to `CONNECTED` by a future server-
   authenticated control-plane feature. A static GitHub Pages browser cannot
   become that private signer or write privileged database rows.

## Six exact source identities

| Peer | Repository | Boundary | Original public manifest |
| --- | --- | --- | --- |
| `rosiedazzlers` | `rosiedazzlers` | owned business | `.well-known/rosevear-integration-manifest.json` |
| `devilndove` | `devilndove-site` | owned business | `.well-known/rosevear-integration-manifest.json` |
| `yw` | `yw` | platform shell | `public/.well-known/rosevear-integration-manifest.json` |
| `icamp` | `iCamp` | platform shell | `public/.well-known/rosevear-integration-manifest.json` |
| `ai-data-platform` | `ai-data-platform` | support broker | `apps/web/public/.well-known/rosevear-integration-manifest.json` |
| `rosevear-ai-hub` | `rosevear-ai-hub` | original Windows support | `apps/web/public/.well-known/rosevear-integration-manifest.json` |

## Evidence-led release boundary

- No public browser secrets, owner approval, credential enrolment, KMS key
  generation, source-side writes, remote command execution or customer actions.
- No schema migration or RLS policy weakening. The existing private tables
  remain FORCE RLS and dedicated-role only.
- Verify new QL-349 Node and Vitest tests, full QL-336A required chain,
  Windows safety checks, production TypeScript build, main Worker asset
  SHA-256 parity and the GitHub Pages disabled-preview deployment.
- **Production code GREEN is separate from six private connections.** The
  honest initial private status is `0/6 CONNECTED · HOLD`.
