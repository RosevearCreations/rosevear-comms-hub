# QL-486 — Durable Six-App Source Contract Registry, Revision Attestation and Protected Operator Console

## Implemented

QL-486 supplies an owner-operated, private, runnable Node registry and mutual-TLS operator console for six source applications. It is not wired to any public Cloudflare Worker API. See:
- runtimes/master-discovery/ql486-six-source-registry.mjs
- runtimes/master-discovery/ql486-private-operator-console.mjs
- runtimes/master-discovery/ql486-original-host-console-cli.mjs
- QL-486 automated tests in the same runtime folder

The source identities come from the existing QL-333/485 registry. Yard Workers = RosevearCreations/yw, iCamp = RosevearCreations/iCamp, Rosie Dazzlers = RosevearCreations/rosiedazzlers, Devil n Dove = RosevearCreations/devilndove-site, AI Data Platform = RosevearCreations/ai-data-platform, Rosevear AI Hub = RosevearCreations/rosevear-ai-hub.

## How original source revision attestation works

For each source, the original owner supplies five signed input fields: sourceId, noticePacket, sourceAttestationPacket, ownerPacket, reviewerPacket. Original QL-485 independently approved source signer keys, source revision, semantic contract version, exact schemas and capabilities must already be pinned outside Git. Trust-on-first-use and reuse of an app source signing key for another app are rejected.

The source-signed QL486_SOURCE observation includes exact source ID/repository/revision, a matching QL-485 notice digest, a non-sensitive original runtime observation digest, opaque deployment ID, freshness timestamp, no customer fields and no authority transfer.

A separately signed QL486_OWNER observation binds the original source observation hash to a revision and distinct original-host/owner evidence digest; a third, separately pinned QL486_REVIEW signature countersigns both source and owner digests. All three signatures and the original QL-485 release notice are cryptographically checked before a private write. Nonmatching source SHA, owner or reviewer, expiration, tenant/source scope, prohibited capability or payload results in HOLD.

A matching previously approved source revision is recorded as DURABLE_PINNED_SOURCE_REVISION_CLAIM_RECORDED_HELD. A changed revision, contract or schema is recorded as DURABLE_SOURCE_CONTRACT_CHANGE_PENDING_OWNER_APPROVAL. It cannot silently change the approved signer or revision.

The registry uses six separate private, append-only source logs, an exclusive writer lock, per-source previous-record hash chain, fsync, restart readback and full signature validation during reads; replayed event IDs cannot create new effects. Records are capped at 128 per source. Corruption fails closed; do not delete or modify a corrupt log without owner-managed evidence recovery.

**Attestation limitation:** The signed claims originalSourceObserved, physicalSourceClaimed and independentRuntimeObservation are not trusted physical-device provenance. The code has no way to independently observe a source's original Windows host or actual service. All stored claims retain originalRuntimeVerified:false, originalSourceCountVerified:0, productionAcceptance:false. Real device and source acceptance cannot be inferred from GitHub CI or test-generated signatures.

## Protected private operator console

The operator-only mutual TLS 1.3 server exposes:
- GET https://127.0.0.1:8846/internal/comms/ql486/operator/contracts
- GET https://127.0.0.1:8846/internal/comms/ql486/operator/contracts.json

An operator must present a valid trusted TLS client certificate whose exact SHA-256 certificate fingerprint is allowlisted with role contract-reviewer, a specific operator ID and the exact source IDs the operator may read. Browser headers, public login state, wildcard source access, cross-company delegation and unknown certificates are rejected. The no-JavaScript, HTML-escaped responsive console displays contract status, approved and observed release SHA prefixes, evidence hash and explicit original-runtime HOLD. The JSON projection returns redacted metadata only. No private signing keys, evidence packet bodies or customer records are returned. Cache and framing are disabled.

This private server never listens at import or during Cloudflare deployment. A supervised owner can open an opt-in 127.0.0.1 listener for at most 120 seconds; it does not install a background task or enable a customer-facing route.

## Original Windows owner operation

A private owner-restricted config file named ql486-config.json belongs under %LOCALAPPDATA%\Rosevear\CommsHub\Private and requires exactly the following keys:

- registryDirectory: absolute private subdirectory for the source journal
- pins: QL-485 independently owner-approved source trust pin records for all six canonical source IDs
- ownerPins and reviewerPins: each source's distinct, independent Ed25519 PUBLIC key PEM
- operatorAcl: mapping of authorized TLS client certificate SHA-256 fingerprint to {operatorId, role: contract-reviewer, sources: [explicit allowed IDs]}
- serverCaFile, serverCertFile and serverKeyFile: restricted absolute private file paths under the same local owner directory

The TLS certificate used by a browser for 127.0.0.1 must have an appropriate loopback IP subject alternative name and be issued by the independently trusted client/server CA. Keep all private keys in owner-controlled storage; do not paste them into ChatGPT or GitHub.

The source evidence input is a second private JSON file with exactly five signed fields mentioned above. It is signed by real separate source, owner and reviewer credentials and supplied only after independent checks.

On the original Ree Windows computer, in the source checkout, execute:

    node .\runtimes\master-discovery\ql486-original-host-console-cli.mjs --status
    node .\runtimes\master-discovery\ql486-original-host-console-cli.mjs --readback "$env:LOCALAPPDATA\Rosevear\CommsHub\Private\ql486-config.json"
    node .\runtimes\master-discovery\ql486-original-host-console-cli.mjs --register "$env:LOCALAPPDATA\Rosevear\CommsHub\Private\ql486-config.json" "$env:LOCALAPPDATA\Rosevear\CommsHub\Private\ql486-one-source-signed-evidence.json"
    node .\runtimes\master-discovery\ql486-original-host-console-cli.mjs --serve "$env:LOCALAPPDATA\Rosevear\CommsHub\Private\ql486-config.json"

Register and serve require typed explicit terminal approval. CI and nonoriginal Windows hosts are refused. The host/user checks are convenience guards, not TPM or independent device authentication. Do not count this source code release as real original-host operation.

## Git divergence and release governance

The six source apps release independently. Signed contracts and source revisions are business integration evidence, not new commits on rosevear-comms-hub. Git dev/main divergence measures repository ancestry only, and is not repaired by unreviewed source updates, automatic merges or force pushes. New Comms Hub features require scoped pull requests and independent protection gates on each branch.

The legacy QL-336A gates are unchanged. QL-486 Linux and Windows gates verify six-source signer proof, cross-app independence, signed revision drift, durable replay and tamper detection, scoped protected operator read, HTML escaping, and unattended activation rejection. Main post-merge source/public-worker parity verification is required before code production GREEN.

**Next proposed: QL-487 — Original Six-Source Provisioning Ceremony, Independent Runtime Evidence Capture and Operator-Signed Registry Field Certification.**
