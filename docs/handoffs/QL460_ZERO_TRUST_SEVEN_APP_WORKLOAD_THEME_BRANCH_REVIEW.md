# QL-460 — Cross-Application Zero-Trust Workload Identity Federation, Scoped Audiences & Independent Signer Lifecycle

## Non-authorizing release boundary
This build adds a **read-only cryptographic federation verifier** and comprehensive negative tests. It does not create or rotate real keys, provision workload identities in other apps, send production messages, deploy peer services, authenticate a live remote peer, or change original physical Windows receiver state. Every result including a successful signed review is `connection=HOLD`, `incidentStatus=OPEN`, `activationAuthorized=false`, `closureAuthorized=false`, `physicalReceiverCurrentlyOff=false` and `runtimeConnected=false`. Source-level CI/deployment GREEN is not runtime CONNECTED.

## Canonical source identity and the seven-app Master order
Topology `rosevear-master-shell-seven-apps.v1`; read-only source manifest and exact branch SHA pinned from independently trusted inputs:
1. ai-data-platform — Master controller
2. rosevear-ai-hub — Master original-host witness
3. rosevear-comms-hub — Master communications
4. iCamp — campground SaaS slave shell
5. yw — Yard Workers SaaS slave shell
6. devilndove-site — Devil n Dove internal company
7. rosiedazzlers — Rosie Dazzlers internal company

**Source-ID crosswalk:** repository `iCamp` is signed source `icamp`; repository `devilndove-site` is signed source `devilndove`; all other application source IDs match their repository names. QL-460 cryptographically binds both the repository and the source ID; mismatches are HOLD, not an alias-based privilege grant.

**Strict signed audience expansion** is a data-only proof: each of seven app workload identities signs three separate short-lived audience-specific tokens (`7 × 3 = 21`) exclusively for the three named Masters, with `SOURCE_READ_ONLY`, `ISOLATED_READ_ONLY`, no authority transfer and `UNVERIFIED_HOLD`. The Devil n Dove and Rosie credentials must also have all three Master audiences in the signed issuer record, but **this does not establish an active network route or permit private business data exchange**.

## Seven-tier security and cryptographic governance
- **T0: independently pinned trust root.** Original QL-459 source OPEN/HOLD + exclusive 0600 protected PENDING/REVIEW/EXCEPTION receipt and original sealed registry digest; fail if historical prior exception, invalid source SHA or tampered custody.
- **T1: workload authentication.** Seven independently pre-enrolled Ed25519 issuer keys + seven distinct workload keys; issuer-signed credentials bind the workload pin, exact repository and `main` SHA, source audience list, role, tenant boundary, key generation, previous credential digest, independent revocation witness, finite expiry. Workload-sign each challenge, target audience, subject, token ID and no-write scope. Distinct from three Master voting and two owner signers: **19 distinct signers**.
- **T2: tenant/role policy.** No app may claim another repo, use another Master audience, escape `ISOLATED_READ_ONLY`, or introduce privileged writes. Deny spoofed authorizations, token JTI collisions and token mutation.
- **T3: data privacy.** Proof tokens have no customer data, payments, contact lists, business provider secrets or access tokens; no sharing of remote database credentials.
- **T4: cryptographic replay and source continuity.** 21 unique signed per-audience token identifiers, signed revocation/issuer lifecycle, bounded proof TTL ≤30 seconds, signed issue TTL ≤60 seconds, exact predecessor and per-app source SHA, one-use directory-backed receipt; no silent retries.
- **T5: independent Master and owner veto.** Three distinct signed Master reports bind issuer and 21-token digests plus classification. Two distinct owner signatures bind Master reports and incident OPEN/HOLD, never authorize original physical receiver activation.
- **T6: fail-closed operational/release attestation.** Commit-time trusted clock, original receipt and expiry reread, replay and TOCTOU denial, protected regression suite, original-host safety, cloud worker deployment, final-main public asset parity. A signed revoked issuer/previous exception or already-expired short token creates durable EXCEPTION OPEN, not healthy acknowledgement.

## User-requested theme, shell and branch review (source-only audit, not an automatic change)
- **Master identity:** shared `rosevear-master-instrument.v1` is present in AI Hub and Comms Hub with *identical* token declarations and no authority transfer; AI Data Platform master-instrument CSS uses the same palette (#050b16, #081625, #0b1c2d, #0d2135, #9a46ff, #31a9ff, #2ed58f). Its `.github/rosevear-master-theme.v1.json` was not found on `main` when checked. This supports **common palette implementation**, but does *not* prove the same exact active selected theme across all deployed routes/devices. Follow-up: configure active selection and independent visual regression in each Master repo; do not overwrite individual slave/company styles.
- **iCamp and YW:** source already contains the highly visible `SLAVE APPLICATION SHELL` banner, independent theme selector/standard-meadow-orbit on iCamp and blue/futuristic themes on YW. Original shell branding preserved. Actual live viewport rendering not independently checked.
- **Devil n Dove/Rosie:** existing read-only source-health/manifest integration and prior master communication contracts remain; QL-460 adds signed three-Master **proof format** but does not claim that the apps have successfully sent/received an authenticated production message.
- **Branches:** preexisting repos have numerous historical `build/*`, `codex/*`, `feature/*`, `release/*` refs. Do not remove *unmerged* work or rewrite history. Scope promotion to `dev` and `main`. GitHub connector does not expose a branch deletion action, so unused refs must be archived/deleted through an authorized repository-admin workflow only after merge/readiness audit. The temporary QL-460 feature and scoped-production refs are not intended to remain permanent.

## Acceptance tests
`node --test runtimes/master-telemetry/ql460-zero-trust-workload-federation.test.mjs` and protected QL-417–460 workflow. Synthetic Ed25519 fixtures test 7 issuer/21 audience positive historical review, prior exception, revocation, token expiry, issuer/role/tenant/rotation mismatches, impostor audience, duplicate JTI, signed Master/owner veto, stale/TOCTOU clock, corrupt custody and one-use replay.

## Ordered cross-repository handoff
Relay exact verified `main` SHA + source-only contract and post-merge CI links through existing issue threads in order: [AI Data Platform #934](https://github.com/RosevearCreations/ai-data-platform/issues/934) → [AI Hub #768](https://github.com/RosevearCreations/rosevear-ai-hub/issues/768) → [Comms #917](https://github.com/RosevearCreations/rosevear-comms-hub/issues/917) → [iCamp #613](https://github.com/RosevearCreations/iCamp/issues/613) → [YW #800](https://github.com/RosevearCreations/yw/issues/800) → [Devil n Dove #920](https://github.com/RosevearCreations/devilndove-site/issues/920) → [Rosie #1080](https://github.com/RosevearCreations/rosiedazzlers/issues/1080).

**Next proposed QL-461:** Seven-App Tenant RBAC/ABAC Authorization Matrix, Master-Audience Policy Enforcement & Independent Negative-Test Certification. **Planned successor count:** 12 items QL-461–472 in [the original fourteen-build queue](https://github.com/RosevearCreations/rosevear-comms-hub/issues/925); no asserted finite count until the product is finished or blanket +10pp completion improvement.
