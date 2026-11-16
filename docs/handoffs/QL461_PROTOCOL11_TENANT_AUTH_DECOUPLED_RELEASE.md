# Rosevear Comms Hub QL-461 — Tenant RBAC/ABAC, Protocol 1.1, Independent Application Releases

## Source-of-truth: AI Data Platform Build 408

Build 408 establishes independent synchronization protocol **1.1**, backward-compatible with **1.0**: [Build 408 specification](https://github.com/RosevearCreations/ai-data-platform/blob/main/docs/BUILD_408_FINE_GRAINED_AUTHORIZATION_CONSENT_INDEPENDENT_SYNC.md). It requires seven app IDs × six canonical tiers = **42 policy rules**, **28 directional relationships**, purpose-bound revocable consent, exact capability delegation ≤24h, no subdelegation, original-host T5 nondelegation, and **no simultaneous seven-app release**.

The QL-461 Comms source-only policy evaluator implements local review for those rules without changing any other application. AI Data Platform, iCamp and YW remain on their existing Vercel deployment SHAs while rate-limited; **zero writes, commits, PRs or releases are required in those repositories** to develop or promote this additive Comms change.

## Protocol negotiation

- Local QL-461 contract advertises protocol **1.1** and retains **1.0** as a supported peer format.
- A signed 1.0 peer can use known existing `source.health.read` and `source.capabilities.read` capabilities, subject to signature, tenant/role, consent, TLS and source SHA checks. A 1.1-only new feature cannot be negotiated with a 1.0 peer until that peer explicitly upgrades.
- Additive 1.1 capabilities: `source.security-evidence.read`, `source.correlation-evidence.read`, `source.workflow-handoff.read`. A missing or incompatible peer holds **only that cross-app feature**. It does not block independent application-local work with its own owner approval, or create a synthetic CONNECTED status.
- Unknown capability is DENY/HOLD; breaking changes require a **new major version** and explicit peer handoff. No ambiguous 'auto-upgrade' or fallback that widens permissions.
- No raw-secret synchronization, direct peer database sync, delegated authority, cross-tenant operations or remote receiver start.

## Policy and security contract

- The controller-signed 42-rule matrix is cryptographically verified against a **pre-enrolled** Ed25519 pin and independently verified controller `main` SHA. Every 7×6 exact resource namespace, action allowlist, resource binding, deny-by-default flag, owner/independent verification and tenant/workspace policy must match. No wildcards, duplicate policies or missing rows.
- Tiers: `T0_PUBLIC_READ`, `T1_USER_SCOPED`, `T2_TENANT_SCOPED`, `T3_OPERATOR_SCOPED`, `T4_MASTER_GOVERNANCE`, `T5_ORIGINAL_HOST_OWNER_CEREMONY`. T5 remains **nondelegable and unavailable through ordinary app-to-app transport**.
- Directional access uses Build 405/407 canonical **14 undirected relationships × 2 = 28 exact directions**, not automatically a full mesh. Required source identity alias crosswalk: `icamp ↔ iCamp` repo and `devilndove ↔ devilndove-site` repo; local sources have no authority over another application's data.
- Review of cross-app signed source proof binds independently pinned source issuer signature, exact `main` SHA, one Master audience, selected compatibility format, explicit read action, tenant and workspace IDs matching target resource, transport/TLS evidence, finite 5-minute proof expiry and prior replay-JTI detection. This is **non-authorizing proof review**, not a request transport implementation. A production transport still needs an **atomic shared-original nonce/JTI custody** and independently verified actual TLS and live source enrollment.
- Personal data require an independent Ed25519 owner-signed, explicit purpose/tenant/subject/workspace/capability scoped consent; withdrawal or expiration immediately holds the capability. Consent cannot create capabilities.
- Optional delegation requires independently signed audience, exact capability, tenant, workspace, owner approval, no T5, no subdelegation, revocation false, expiry ≤24h and **no consequential write without separate owner gating**. The Comms cross-app reviewer itself only permits read-only scope.
- Read-only decisions explicitly return `runtimeConnected=false`, `activationAuthorized=false`, `closureAuthorized=false`, `physicalReceiverCurrentlyOff=false`, original-host incident OPEN, connection HOLD and `peerDeployRequired=false`.

## Application release decoupling

| App | Local release in Comms QL-461 | Vercel dependency |
| --- | --- | --- |
| AI Data Platform | No files changed | Controller protocol 1.1 source specification, existing runtime may remain on prior deployment |
| Rosevear AI Hub | No files changed | Can continue releases independently |
| Rosevear Comms Hub | QL-461 code, tests and protected CI | Cloudflare and GitHub exact SHA CI, no Vercel lockstep |
| iCamp | No files changed | Continue to use supported prior 1.0 peer contract while Vercel-limited |
| YW | No files changed | Continue to use supported prior 1.0 peer contract while Vercel-limited |
| Devil n Dove | No files changed | Existing three-Master `CONTRACT_READY` only; signed live connectivity still HOLD |
| Rosie Dazzlers | No files changed | Existing three-Master `CONTRACT_READY` only; signed live connectivity still HOLD |

Do **not** claim this build has independently installed signers, cured prior source-identity denials, or synchronized database data with external applications. Software release Production GREEN means only code/deployment passed. It never changes original physical receiver status or other application production SHA.

## Test and Production acceptance
`node --test runtimes/master-telemetry/ql461-protocol11-tenant-policy.test.mjs`; protected QL-417–461 workflow with 42-rule/28-direction signed fixtures, v1.0/v1.1 known/unknown capabilities, peer absence holding only cross-app feature, independent local operation, original-host T5 refusal, malformed/wildcard/unsigned policy and mutable matrix denial, exact issuer+audience, tenant/workspace/consent/withdrawal/delegation, replay/TTL and zero raw secrets. Preserve pre-existing QL-417–460 suite, original Windows safety, app build, Cloudflare Workers and final merged-`main` public JS/CSS SHA-256 parity.

## Handoff and next build
Post **source-only** Comms release result and protocol compatibility to existing threads in order: [AI Data Platform #934](https://github.com/RosevearCreations/ai-data-platform/issues/934) → [AI Hub #768](https://github.com/RosevearCreations/rosevear-ai-hub/issues/768) → [Comms #917](https://github.com/RosevearCreations/rosevear-comms-hub/issues/917) → [iCamp #613](https://github.com/RosevearCreations/iCamp/issues/613) → [YW #800](https://github.com/RosevearCreations/yw/issues/800) → [Devil n Dove #920](https://github.com/RosevearCreations/devilndove-site/issues/920) → [Rosie #1080](https://github.com/RosevearCreations/rosiedazzlers/issues/1080). No writes to the code in those six peers.

**Next proposed QL-462:** Signed Secure Outbox/Inbox, Idempotent Delivery Contracts, Peer-Version Negotiation & Independent Local-Operation Continuity. The original [QL-459–472 roadmap](https://github.com/RosevearCreations/rosevear-comms-hub/issues/925) has **11 proposed steps QL-462–472** following QL-461; no verified finite total-to-finish or measured 10-point increase in all domains.
