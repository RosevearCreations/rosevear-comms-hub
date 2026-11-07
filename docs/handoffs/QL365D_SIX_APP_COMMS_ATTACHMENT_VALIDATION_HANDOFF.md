# Rosevear Comms Hub — Six-App Attachment and Validation Handoff

**Protocol:** QL-333/QL-362/QL-363/QL-364/QL-365D

**Audience:** The development/operator agent for each of the six source applications.

**Comms repository:** `RosevearCreations/rosevear-comms-hub`
**Status:** IMPLEMENT/VERIFY SOFTWARE ONLY. **Do not mark CONNECTED or activate a private receiver.**

> **Instruction to the receiving app:** Use the row for your repository and complete
> the checklist below. Return an evidence report with exact commits, signature
> verification and remaining HOLD gaps. Do not fabricate owner approval, external
> issuer/witness identity, production credentials, source keys, source-signed
> contracts, HTTPS/TLS observations or TEST receipts. Keep the app's `main`
> production release gates intact. If genuine field evidence is absent, ship
> the safe code but leave Comms integration `DISCONNECTED / HOLD`.

## 1. Find your exact source identity (do not create a child-tenant connection)

| Source ID | GitHub repository | QL-364 source-owned handler | Identity/boundary |
| --- | --- | --- | --- |
| `yw` | `RosevearCreations/yw` | `server/ql364-source-health.mjs` | Yard Workers **platform shell**, not Rosevear Landscaping or another business tenant |
| `icamp` | `RosevearCreations/iCamp` | `lib/integration-v1/ql364-source-health.mjs` | iCamp **platform shell**, not Camp Rosevear or a campground tenant |
| `rosiedazzlers` | `RosevearCreations/rosiedazzlers` | `functions/api/_lib/ql364-source-health.mjs` | Owned-business shell; customer records are not an integration identity |
| `devilndove` | `RosevearCreations/devilndove-site` | `functions/api/_lib/ql364-source-health.mjs` | Owned-business shell; Etsy/Meta channels are separate permissions |
| `ai-data-platform` | `RosevearCreations/ai-data-platform` | `apps/web/lib/ql364-source-health.mjs` | Support broker/module boundary, no customer tenant |
| `rosevear-ai-hub` | `RosevearCreations/rosevear-ai-hub` | `server/src/rosevear_ai_hub/api/ql364_source_health.py` | Original local support server, no customer tenant |

The Comms Hub's source-of-truth identity mapping is
`runtimes/master-discovery/manifest.mjs` (`SOURCES`). The source-handler
distribution mapping is `docs/QL364_SOURCE_OWNED_HEALTH_DISTRIBUTION.md`.

For each source, preserve its **own** source signer; never reuse Ree's, Jack's,
the Comms master key, another application's signing key or a synthetic CI key.

## 2. Code and manifest checklist — each app executes independently

1. Check `git status -sb`, current protected `dev` and `main` commits, existing
   source-owned QL-364 handler, tests and `.well-known` discovery manifest.
   Preserve any unmerged work; do not overwrite a different app's code.
2. Confirm the source manifest path defined by QL-333:

   | Source | Repository-relative discovery manifest |
   | --- | --- |
   | Yard Workers | `public/.well-known/rosevear-integration-manifest.json` |
   | iCamp | `public/.well-known/rosevear-integration-manifest.json` |
   | Rosie Dazzlers | `.well-known/rosevear-integration-manifest.json` |
   | Devil n Dove | `.well-known/rosevear-integration-manifest.json` |
   | AI Data Platform | `apps/web/public/.well-known/rosevear-integration-manifest.json` |
   | Rosevear AI Hub | `apps/web/public/.well-known/rosevear-integration-manifest.json` |

   Check `source_id`, `source_app_id`, `repository`, `tenant_boundary`, the
   immutable 40-character source revision and the `rosevear-master` audience.
   Unsigned public discovery is allowed only as a **HELD capability listing**;
   a GitHub file or a manifest by itself is not authenticated connectivity.
3. Confirm the source's private, source-owned handler implements **only**
   `GET /api/integration/v1/shell/health`. The older
   `/api/integration/v1/health` is **not** a credential or owner approval.
   The request header `x-rosevear-ql362-request` is a request identifier, not
   a signed owner decision. The private `approveOriginalGet` step must
   independently verify pinned original issuer, exact source revision,
   environment, owner source+master signatures, signer custody and a durable
   **one-use** claim before returning HTTP 200.
4. Verify a separately pinned Ed25519-signed QL-363 source health contract
   (`rosevear.hub.ql363.six-source-health-contract.v1`) bound to the exact
   source ID, repository, shell/tenant boundary, immutable commit, source
   manifest SHA-256, approved HTTPS origin, `TEST`, `GET`, the path above,
   4096-byte maximum, no redirect, no persistent connection and no customer
   or device data. An untrusted contract may be inspected but cannot self-pin.
5. The source's TEST-only response must contain **exactly** three top-level
   keys: `schema`, `health`, `receipt`. For a permitted operation, the
   `health` body must contain only the exact fields below (substitute the
   actual source ID and approved operation UUID):

   ```json
   {
     "schema": "rosevear.hub.ql362.source-health-receipt.v1",
     "sourceId": "SOURCE_ID_FROM_TABLE",
     "operationId": "APPROVED_ONE_USE_OPERATION_UUID",
     "health": "ok",
     "connected": false,
     "customerDataAllowed": false,
     "deviceActions": false
   }
   ```

   The enclosing envelope schema is
   `rosevear.hub.ql363.source-health-envelope.v1`. Its `receipt` is a
   detached **source-owned** Ed25519 signed envelope, schema
   `rosevear.hub.ql363.source-signed-health-receipt.v1`, bound to the
   exact request/body SHA-256, source ID, operation ID, immutable commit,
   pinned HTTPS origin, method, path and expiry. Never put a private key,
   passphrase, token, customer payload or arbitrary action in this response.
6. Tests must reject unauthorized/replayed IDs, forged/revoked signer,
   changed tenant/source, wrong immutable SHA, missing owner signatures,
   customer/device fields, non-GET, redirect, excessive body, expired
   signature and extra/missing response properties. Run each repository's
   existing release checks; retain branch protections and fail-closed tests.

## 3. Comms-side validation sequence — one source at a time

Follow this sequence only after each application has independently completed
the **code-level** checklist and returned its signed source evidence.

1. The Comms operator reads the source's exact protected `main` commit and
   handler bytes, then independently pins manifest, signer, source commit,
   private origin and TLS public key. Use
   `verifyQl364DistributedSourceHandlers` and
   `verifyQl363SourceHealthContract`. **Public GitHub readback alone is not
   original issuer/source signer custody.**
2. The original Ree and Jack computers complete the QL-365A/B/C first-time
   owner and external reviewer evidence process. On Ree's original Windows
   server (`DESKTOP-AE894KC`, account `ree`) and Jack's independently
   controlled computer (`TEMPLAR`, account `jfros`), verify the same public
   digest and sign **one named source** under QL-365D within the 90-second
   request window. Owner signatures grant *offline review only*.
3. The original protected Comms operator separately verifies the **actual**
   QL-355 original issuer and field witness, QL-354 restricted enrollment,
   receiver/Tailnet isolation, original device signed TEST receipt and
   QL-362 one-use private operation claim. These approvals are still missing
   until original field records prove them. Never interpret a QL-365D
   signature as a substitute for legacy issuer/witness verification.
4. Only under those original trusted controls may the existing QL-362/363
   operator execute **one** private TLS-pinned source `GET`, exactly once,
   with a 4-second timeout, at most 4096 bytes, no redirect or automatic
   retry. Verify the source's signed receipt, archived one-use operation,
   original receiver STOP, independent closure auditor and six still-HELD
   peers. The TEST receipt is **not** a persistent connection grant.
5. Repeat the one-source owner-authorized process separately for the remaining
   sources, respecting each shell boundary and independent signer.
   Do **not** batch six GETs or use one source's owner consent for another.

The Comms Hub has no authority to claim a connection because CI passed,
the URL responds, the manifest exists, one QL-365D review is signed or one
TEST receipt was returned. Persistent live connection would require a
**different**, explicit owner-governed production grant and evidence.

## 4. What each receiving app must return

Copy this compact report for your own source. Use real values from protected
readbacks; leave missing proof `HOLD`, not `PASS`.

```yaml
schema: rosevear.hub.ql365d.source-attachment-handoff.v1
sourceId: "YOUR_EXACT_SOURCE_ID"
repository: "RosevearCreations/YOUR_EXACT_REPO"
shellBoundary: "YOUR_EXACT_TENANT_BOUNDARY"
mainCommitSha: "ACTUAL_PROTECTED_40_CHAR_SHA"
handlerPath: "EXACT_SOURCE_OWNED_QL364_HANDLER_PATH"
handlerSha256: "ACTUAL_64_CHAR_READBACK_SHA_OR_HOLD"
manifestSha256: "ACTUAL_PINNED_SHA_OR_HOLD"
ql363ContractSha256: "ACTUAL_INDEPENDENTLY_VERIFIED_SHA_OR_HOLD"
sourceSignerIndependentlyAuthenticated: false
originalOwnerQl365dReviewVerified: false
originalIssuerAndWitnessVerified: false
oneUsePrivateGetReceiptVerified: false
sixAppPersistentConnectionAuthorized: false
connectionState: "DISCONNECTED / HOLD"
outstandingEvidence:
  - "LIST_MISSING_ORIGINAL_FIELD_ITEMS"
sourceRepositoryWritesForConnection: 0
customerCommunications: false
deviceActions: false
```

The two booleans for source code changes and user/customer effects are not
interchangeable: a receiving app may update and promote its own source code
under its normal protected review, but it must not write customer data,
change device state or publish a connected status without original authority.
The `sourceRepositoryWritesForConnection` field describes *runtime* connector
writes; it does not prohibit ordinary owner-authorized GitHub PRs.

## 5. Source-specific acceptance notes

- **Yard Workers (`yw`)** — verify the **platform** shell identity. Never use
  the Rosevear Landscaping business workspace, employee HR records, routes
  or customer data as the Comms identity.
- **iCamp (`icamp`)** — validate the **platform** shell identity rather than
  Camp Rosevear, a campground tenant, reservation, camper or gate controller.
- **Rosie Dazzlers (`rosiedazzlers`)** — use only the owned-business shell.
  Do not expose bookings, Stripe/PayPal, customer vehicles or detailer data.
- **Devil n Dove (`devilndove`)** — use only the owned-business shell.
  Etsy/Meta listings, shopper data and orders are not granted by this health
  contract and must stay separately consented.
- **AI Data Platform (`ai-data-platform`)** — validate the support-broker
  module boundary. This is no permission to broker customer data among apps
  or infer identities across tenants.
- **Rosevear AI Hub (`rosevear-ai-hub`)** — the original Windows server's
  Python handler remains a local-support shell, not a public Caddy listener.
  Do not enable Tailscale Serve, cameras, smart devices, MQTT, local prompts
  or a private receiver as part of this handoff.

## 6. Stop conditions and references

**Stop and return `DISCONNECTED / HOLD`** on any missing independent signer,
uncertain original host, unauthorized original database role, missing signed
owner evidence, drifted manifest/handler SHA, unexpected customer/device
field, HTTP redirect, TLS pin change, replay, lost source permission or
failure to prove receiver STOP. Never weaken required CI to finish a merge.

Authoritative repository references:

- `runtimes/master-discovery/manifest.mjs` — six exact source IDs and boundaries.
- `docs/QL364_SOURCE_OWNED_HEALTH_DISTRIBUTION.md` — original six handler paths.
- `runtimes/hub-relay/ql363-six-source-health-adapters.mjs` — exact signed
  contract and GET receipt verifier.
- `runtimes/hub-relay/ql362-source-owner-first-get.mjs` — one-use private GET gate.
- `runtimes/hub-relay/ql365a-first-time-trust.mjs` through
  `ql365d-first-test-ceremony.mjs` — original-owner and reviewer controls.
- `docs/build-records/QL-365C_INDEPENDENT_REVIEWER_IDENTITY_SIGNED_CUSTODY_AND_SUPERVISED_TEST_PREFLIGHT.md`
  — original reviewer and independent custody prerequisites.

**Acceptance boundary:** `main` software GREEN is a protected build/deployment
result. Six-source `CONNECTED` requires separate real operational authorization;
no instruction in this document may turn a synthetic or held proof into one.
