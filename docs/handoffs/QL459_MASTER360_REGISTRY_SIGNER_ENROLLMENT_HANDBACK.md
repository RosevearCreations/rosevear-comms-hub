# QL-459 — Canonical Seven-App Provenance Registry, Controller-to-Shell Enrollment & Handoff Verification

## Protected scope
QL-459 adds a runnable **read-only cryptographic contract verifier**, not a live signer enrollment service. It does **not** create credentials, install signer keys, call peer databases, change application permissions, start original Windows host receiver, or claim a runtime CONNECTED status. Original DESKTOP-AE894KC Comms receiver incident remains **OPEN / HOLD** in every path, including success. Neither CI GREEN nor signed historical review proves independent live physical OFF.

## Canonical registry v1
Topology: **rosevear-master-shell-seven-apps.v1**. Order: AI Data Platform → AI Hub → Comms Hub → iCamp → YW → Devil n Dove → Rosie Dazzlers. A deterministic fingerprint commits the exact ordered application IDs, application roles, seven security tiers, **one** permitted operation SOURCE_READ_ONLY, tenant policy DENY_CROSS_TENANT, original-receiver OPEN/HOLD and authorityTransfer=false. Registry is signed by the independent AI Data Platform controller key pin already admitted into the trusted pin set. External deployment configuration must independently supply the fingerprint and the verified SHA of every application's main commit.

### Enrollment challenge protocol
1. Verify exact protected QL-458 original incident summary and its fsynced one-use pending + final REVIEW/EXCEPTION receipts; never silently recover a previous exception.
2. Write fsynced exclusive 0600 QL-459 PENDING receipt in absolute 0700 protected custody. Reject linked files, corrupt data, replay and resumed reads after interrupted external intake.
3. Fetch controller-signed canonical registry bound to incident, unpredictable challenge nonce, batch, previous QL-458 final receipt, trusted fingerprint, exact controller SHA and finite signed freshness.
4. Require **seven ordered controller-signed certificates**, each with independently pinned app public key, proper role, repo, audience, exact app main SHA, scope SOURCE_READ_ONLY, generation >=2, prior enrollment digest, finite expiry, no authority transfer and isolated tenant boundary. Each app signs a separate ACK bound to the certificate digest. Credentials/pins are never taken from the incoming certificate as trust anchors.
5. Verify **seven separately app-signed source handoff records** with the same challenge, batch, canonical registry, certificate digest, expected externally pinned SHA, no privilege escalation, tenant isolation and UNVERIFIED_HOLD. Explicit DENIED_SOURCE becomes a durable OPEN exception. Missing, stale, forged, reordered or privileged records are HOLD.
6. Require **12 distinct pre-enrolled Ed25519 keys**: seven app signer keys (AI Data Platform also signs certificates), three independent Master governance reviewers and two distinct owners. Master reports and both owner signatures independently bind exact registry/enrollment/manifest digests and OPEN/HOLD classification.
7. Re-read trusted clock, protected QL-458 custody, source age, cert/registry expiries and dual-owner evidence before final exclusive durable REVIEW or EXCEPTION receipt. TOCTOU expiry during healthy review is HOLD. A prior signed exception or an expired certificate at intake stays EXCEPTION OPEN.

**No cross-app automatic activation:** An ACK of historical source enrollment is *not* a deployed credential or a runtime connection. Actual issuer pin/role provisioning and independently authenticated network handshake remain owner-governed future work.

## Security tiers used across seven applications
T0 repo and controller trust-root custody; T1 cryptographically authenticated workload pin/audience; T2 least-privilege tenant RBAC/ABAC; T3 consent, encrypted data and secret rotation; T4 signed replay-safe communications; T5 independent three-Master and dual-owner veto; T6 post-deployment source/asset integrity. Missing any tier is a blocker to operational acceptance, not a green check by implication.

## Test and promotion gates
Test: node --test runtimes/master-telemetry/ql459-registry-enrollment-handoff.test.mjs. Full protected QL-417–459 audit, app regression, QL-340 Windows safety, Supabase, Cloudflare Workers Production deployment and exact *merged main SHA* public JS/CSS SHA256 parity. Synthetic tests cover actual Ed25519 signatures, exact schema fingerprint, cloned/reordered certificates, forged ACKs, unauthorized audience, tenant leakage, source denial and replay, expiry at last instant, immutable private custody and unsupervised activation refusal.

## Ordered handoff
Keep seven existing GitHub handoff threads linked:
1. [AI Data Platform](https://github.com/RosevearCreations/ai-data-platform/issues/934)
2. [AI Hub](https://github.com/RosevearCreations/rosevear-ai-hub/issues/768)
3. [Comms Hub](https://github.com/RosevearCreations/rosevear-comms-hub/issues/917)
4. [iCamp](https://github.com/RosevearCreations/iCamp/issues/613)
5. [Yard Workers](https://github.com/RosevearCreations/yw/issues/800)
6. [Devil n Dove](https://github.com/RosevearCreations/devilndove-site/issues/920)
7. [Rosie Dazzlers](https://github.com/RosevearCreations/rosiedazzlers/issues/1080)

Each app must independently ACK the exact tested source SHA and verify signer issuer and tenant policy. No keys, secrets, customer data or database permissions are passed with this handoff. Previous iCamp/YW source identity/schema failures are historical until freshly retested, never silently cleared.

## Roadmap
The original 14-build proposed plan is [QL-459–472](../build-plans/QL459-472_SEVEN_APP_SECURITY_COMPLETION_ACCELERATION.md), tracked in [issue #925](https://github.com/RosevearCreations/rosevear-comms-hub/issues/925). QL-459 release is candidate until exact-main checks finish; **next proposed QL-460**: Cross-Application Zero-Trust Workload Identity Federation, Scoped Audience Authentication & Independent Signer Lifecycle Governance. Thirteen *planned* builds QL-460 through QL-472 follow this milestone; no verified finite overall product build count or measured 10-percentage-point completion gain.
