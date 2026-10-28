# Rosevear Comms Hub QL-248 — six-app proof-commit clarification and offline review handoff

**Forward to all six other GitHub applications, including AI Data Platform. No credentials or personal data.** This is a **proposed clarification requiring consumer agreement**, not authority to connect. All real connections remain DISCONNECTED / HOLD.

## Why this additional document is necessary

The QL-246 handoff currently says the public signed file's own `payload.source_revision` must equal the Git SHA **of the commit containing that same file**. That creates a Git commit self-reference: writing the containing commit SHA into the file changes the SHA of the containing commit. Do not loop endlessly trying to solve this or fake matching values.

**Please agree to this source-proof transport clarification before attempting final QL-246 publication:**

| Identity | What it represents | Where to record it |
| --- | --- | --- |
| `source_revision` | Earlier audited/tested source code commit | Existing signed QL-246 payload field |
| `proofCommitSha` | Later immutable commit containing `docs/integration/ql246-source-proof.json` | Separate operator verification manifest; **not inside the signed file** |
| `proofSha256` | SHA-256 of the precise raw public proof JSON bytes fetched at `proofCommitSha` | Separately verified operator manifest |
| `publicKeySpkiSha256` | DER SPKI SHA-256 of that app's Ed25519 **public** key | Independent authenticated pin registry (not copied from the proof itself) |
| `ciRunUrl` | CI for the **earlier** `source_revision`, not a different test revision | Signed QL-246 payload and separately checked manifest |

The actual QL-246 signed payload field order, Ed25519 signing bytes, one-hour challenge, seven negative tests and read-only HOLD assertions remain unchanged. The AI Data Platform QL-246 consumer must explicitly accept this distinction. A later `proofCommitSha` is read from GitHub and must be pinned separately; the signature cannot by itself prove GitHub provenance.

## Application-by-application response

Send one public response per repo; never share a private key, HMAC key, user token or owner identity document in GitHub/ChatGPT.

| System | Repository | Special hold |
| --- | --- | --- |
| AI Data Platform | `RosevearCreations/ai-data-platform` | Update QL-246 proof consumer to compare signed *source* revision separately from proof-bearing commit; no direct DB access |
| Devil n Dove | `RosevearCreations/devilndove-site` | Source/test SHA and proof commit distinct; listing/Etsy/Marketplace writes off |
| Rosie Dazzlers | `RosevearCreations/rosiedazzlers` | Real gift/booking/payment/SMS writes off; no invented denial receipts |
| Yard Workers | `RosevearCreations/yw` | Independently confirmed company tenant; no job/payroll/dispatch actions |
| iCamp | `RosevearCreations/iCamp` | Independently confirmed campground tenant; no reservation/gate action |
| Rosevear AI Hub | `RosevearCreations/rosevear-ai-hub` | Keep LAN/private service and vault completely private; isolated authorized runner required |

### Safe phased steps

1. **Source:** inspect the intended source commit SHA and green CI run. Confirm all six source-revision/tenant combinations are exact; do not assert test evidence from mock output.
2. **Independent signer pins:** the application keeps its Ed25519 private key in its own secret store; an authorized reviewer independently obtains and authenticates its public SPKI fingerprint. Each app's source signing key must be distinct.
3. **Separately authorized nonproduction GET testing:** only after specific owner test authorization, provision separate per-app server-side least-privilege HMAC credentials; witness genuine signed GET health/capabilities receipts and seven rejection paths, audit durability and revocation. No broad customer data or writes. Do not enable Comms Hub live pilot.
4. **Proof:** with genuine witnessed evidence, obtain fresh one-hour QL-246 challenge, sign canonical fields referencing the *earlier* audited `source_revision`, commit the signed nonsecret file at a *later* proof-bearing SHA. Retrieve exact raw bytes from that later GitHub SHA and compute SHA-256; record both SHAs and the independently verified public pin in the operator manifest. If challenge expires, issue a new challenge and repeat; never backdate a signature.
5. **Consumer update:** AI Data Platform and other receiving validators must explicitly adopt the two-SHA clarification. Verify source-to-proof diff, CI identity, public Ed25519 signature, pins, raw digest and genuine operator evidence independently. A positive QL-248 offline check alone is not acceptance.
6. **Separate owner decision:** even after all six pass, obtain specific time-bounded, reversible, authenticated owner approval before a read-only pilot. In this handoff, approval is **NOT GIVEN**.

## Offline verification input for a designated operator

At Comms Hub, the verification tool takes two *local, public-metadata-only* JSON files. The first has six ordered entries; the second contains independently acquired public evidence. Do not put credentials in these files.

`--bundle` structure:

```json
{
  "schemaVersion": "rosevear.ql248.bundle.v1",
  "sources": [
    {
      "system": "ai-data-platform",
      "sourceRevisionSha": "<40-character earlier source commit SHA>",
      "proofCommitSha": "<40-character later proof commit SHA>",
      "rawProofBase64": "<base64 encoding of raw public JSON file bytes>"
    }
  ]
}
```

The example shows just the first row for brevity; an actual review **must include six rows in exactly this order:** `ai-data-platform`, `devilndove`, `rosiedazzlers`, `yw`, `icamp`, `rosevear-ai-hub`.

`--trusted-pins` structure (six entries in the same order):

```json
{
  "schemaVersion": "rosevear.ql248.pins.v1",
  "sources": [
    {
      "system": "ai-data-platform",
      "sourceRevisionSha": "<40-character earlier source commit SHA>",
      "proofCommitSha": "<40-character later proof commit SHA>",
      "proofSha256": "<64-character SHA-256 hex of raw proof bytes>",
      "ciRunUrl": "https://github.com/RosevearCreations/ai-data-platform/actions/runs/123456",
      "publicKeySpkiSha256": "<64-character SHA-256 hex of independently obtained public DER SPKI>",
      "businessId": "devilndove",
      "tenantId": null
    }
  ]
}
```

Again, the real input must contain six entries, not the single illustrative row.

Run from the Comms Hub repository on a trusted local operator workstation:

```sh
node scripts/ql248-verify-source-proof-bundle.mjs --bundle ./public-ql248-bundle.json --trusted-pins ./independently-obtained-ql248-pins.json
```

This verifies *only supplied offline material*. A PASS still reads `SIX_OFFLINE_SIGNATURES_MATCHED_REAL_GATEWAY_PROOF_PENDING_HELD`, **not CONNECTED or GREEN**. The tool never fetches GitHub/gateway endpoints, never provisions a key and never approves owner identity. Test fixtures must never be returned as independent application evidence.

### Return this truthful status

```text
Repository / exact tested source SHA / corresponding source CI URL:
Separate proof-bearing SHA / raw public file SHA-256: PRESENT / MISSING
Independently authenticated public SPKI pin: VERIFIED OUT OF BAND / NOT VERIFIED
Two-SHA QL-246 amendment accepted by source and AI Data Platform consumer: YES / NO
Seven genuinely witnessed nonproduction denials and original receipt IDs: VERIFIED / PENDING
Durable audit, revocation and rollback witnessed: VERIFIED / PENDING
Authenticated owner authorization for narrow read-only pilot: NOT GIVEN
Actual connection state: DISCONNECTED / HOLD
Remaining blockers:
```

**Next expected Comms Hub build: QL-249 — Six-App Immutable Proof Publication Retest, Independent GitHub Origin Attestation & Owner-Scoped Nonproduction GET Scheduling (HELD).**
