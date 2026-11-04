# QL-333 — Six-Source Contract Discovery, Signed Manifest Pinning & Identity Compatibility

**Release class:** public nonsecret contract discovery; **NOT** authentic peer authorization. No live customers, calls, SMS, dispatch, provider writes, private customer reads, or Windows relay connections are enabled.

## Source-owned contract surfaces

| Master shell/support key | Repository | Legacy v1 application identity | Boundary | Source manifest location |
| --- | --- | --- | --- | --- |
| `yw` | `yw` | `yard-workers` | existing multi-company platform shell | `public/.well-known/rosevear-integration-manifest.json` |
| `icamp` | `iCamp` | `icamp` | existing multi-campground platform shell | `public/.well-known/rosevear-integration-manifest.json` |
| `rosiedazzlers` | `rosiedazzlers` | `rosiedazzlers` | owned business; future shell design only | `.well-known/rosevear-integration-manifest.json` |
| `devilndove` | `devilndove-site` | `devilndove` | owned business; future shell design only | `.well-known/rosevear-integration-manifest.json` |
| `ai-data-platform` | `ai-data-platform` | `ai-data-platform` | broker, not a customer tenant | `apps/web/public/.well-known/rosevear-integration-manifest.json` |
| `rosevear-ai-hub` | `rosevear-ai-hub` | `rosevear-ai-hub` | local support; relay OFF | `apps/web/public/.well-known/rosevear-integration-manifest.json` |

Each descriptor defines the fixed v1 GET health and capabilities routes, issuer, audience, source role, tenant boundary, fixed manifest path, deny-redirects policy, pinned major version, minimal public scope, and failure HOLD behavior. It explicitly marks external signature and trust custody **AWAITING_INDEPENDENT_SOURCE_SIGNER**; producing a Git commit does not create a valid source-owned signature. The descriptors are immutable inputs from each source, not privileged configuration edits in the Comms browser.

The Node-only `runtimes/master-discovery/manifest.mjs` accepts only the exact six source identities, contract fields and major version. Its Ed25519 verification uses a **separately independently verified public-key pin** and rejects document-supplied or unverified trust. Even signed-manifest verification does not grant customer/tenant access. The public discovery job reads only SHA-pinned GitHub raw assets, never source-owned private `/api/integration/v1/*`, never follows redirects, and records nonsecret digest/drift. Incompatible changes are review HOLD; compatible changes become proposals, not automatic protocol rewrites.

## Database custody boundary

`master_source_manifest_pins` records SHA-pinned immutable GitHub public observations and their manifests' raw SHA-256, source issuer and version. Force RLS blocks browser clients; separate issuer, source and owner evidence is required before any VERIFIED record is possible. The table is not a credential store or a connector entitlement. No other application needs a new database table to publish public descriptors; protected source tenant models and signed gateway behavior remain unchanged.

## Acceptance criteria and true limits

- All six source-owned descriptors validate against the master matrix, including `yw` vs `yard-workers` and shell vs child distinction.
- Negative tests reject unknown issuer, tenant/child substitution, unpinned origin, redirect, extra privileged field, schema major drift, altered signature, HTTP 404/409/429/5xx, and replay-derived authorization.
- Application tests/build, source CI and exact production deployment must pass for the relevant commit.
- Periodic GitHub Actions public-only metadata audit may run every six hours; no secret or customer payload enters an artifact.
- **Actual signed peer handshakes and source writes remain zero.** An external owner/signer needs to present real Proof-B, approved key custody and scoped nonproduction TEST grants before QL-335 may attempt signed GETs. The local Windows relay remains OFF. Do not label 6/6 connected.

Next logical build: **QL-334 — Database-Driven Procedure Engine, Safe Workflow Scheduler & Approval Ledger** (procedures hold until QL-333 trust evidence arrives).
