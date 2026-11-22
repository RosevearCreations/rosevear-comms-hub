# QL-484 — Supervised Yard Workers source witness, private operator readback, original-host acceptance

## Implemented functionality

QL-484 extends QL-480 through QL-483 and adds a **supervised, private multi-signer case-proof ceremony** rather than a simulated public dashboard:

1. Source-signed observation binds a genuine-design Yard Workers heartbeat outage, recovery and operator-closed incident to source and Comms Hub release SHAs, source and operator TLS client fingerprints, current durable QL-483 enrollment, case receipt digest, journal digest, session and short-lived signed read request.
2. A separately pinned original Windows owner-host signer confirms a source packet digest, QL-482 redacted read-response digest and a fresh owner challenge. Presence is asserted by the host signer, NOT independently hardware attested.
3. An independently pinned reviewer countersigns the exact source, host and readback digests. Four keys (source, operator, host and reviewer) must be distinct. The independent signature cannot authorize customer/provider delivery or transfer source authority.
4. A write-once, owner-only private receipt stores bounded case and signer proof hashes with fsync and exact scope/session readback. Reused session IDs, journal changes, incorrect tenant or source/production revisions fail closed.
5. An opt-in private Node HTTPS mutual-TLS review endpoint reads operator certificate identity directly from the verified TLS socket. Its sole route is POST /internal/comms/ql484/field/review. It requires JSON containing exactly sourceObservationPacket, hostObservationPacket, reviewerPacket and operatorReadPacket. The server binds this request to the existing QL-482 signed protected case reader. It never exposes a public Cloudflare route.
6. An original owner Windows manual launcher provides --status and --serve, starts only on explicit interactive approval on candidate original host DESKTOP-AE894KC / Ree and binds to 127.0.0.1:8843 for at most 90 seconds. No unattended startup, scheduled task, public interface, source/customer writes or provider messages.
7. classifyQl484SourceUpdate categorizes Git ahead/behind history separately from an independently deployed Yard Workers source revision. An updated external source requires separate signer/contract review; it never authorizes a Git merge.

## Supervised original owner Windows procedure

The owner must separately verify and provision the real Yard Workers signing key, actual source revision, genuine signed HEARTBEAT_MISSED and HEARTBEAT_RECOVERED events, independently authorized operator CLOSE_CASE, original host signer, independently verified reviewer and private CA/server/operator certificates. Synthetic CI credentials do NOT count.

1. Ensure QL-483 original private signed enrollment and private QL-480 journal are genuine and current. QL-481 grants expire quickly, so obtain a fresh owner-approved binding if necessary.
2. Under %LOCALAPPDATA%\Rosevear\CommsHub\Private create owner-only ql484-witness-config.json, using the exact 24 property names in FIELDS of runtimes/master-telemetry/ql484-original-host-cli.mjs. Configure three separate directories for the journal, QL-483 enrollment and QL-484 sessions. Require real CA/server key/cert PEM files, authenticated source/operator client certificate SHA-256 fingerprints, operator identity, source and Comms Hub main revisions, four distinct public identity pins, owner-generated challenge and genuine QL-483 signed binding and proof packets. No secret material in GitHub or a browser.
3. On the approved original Windows host run the following in interactive PowerShell:

    node .\runtimes\master-telemetry\ql484-original-host-cli.mjs --status

    node .\runtimes\master-telemetry\ql484-original-host-cli.mjs --serve "$env:LOCALAPPDATA\Rosevear\CommsHub\Private\ql484-witness-config.json"

4. Type the exact prompted approval. Use a trusted separately pinned operator client certificate to deliver the four signed observation/read packets to https://127.0.0.1:8843/internal/comms/ql484/field/review and verify the private server certificate. The HTTPS handler derives authorization from the actual mutual-TLS session, not from JSON.
5. Record the redacted durable digest evidence privately, then independently confirm source provenance and physical original-host identity with suitable trusted device evidence. The module never promotes a crypto-only packet to genuine physical field acceptance. Field acceptance and original-host verification remain HOLD pending that independent observation.

The private listener is NOT installed, activated or connected by GitHub Actions. A Windows hostname and owner username check are merely a convenience safety guard, not TPM/device attestation.

## About divergence

GitHub commit divergence concerns the ancestry of Comms Hub dev/main Git branches. Messages from Yard Workers, iCamp, AI Data Platform and other applications do not change that ancestry on their own. Separate source deployments may change versioned source contracts and signed event schemas; do not treat those data messages as commits, automatically overwrite signers, or force-merge 500+ unrelated Git commits. Carry narrowly scoped code changes through separate PRs to dev and main; independently validate current external source SHA and signer changes.

## Release gates and honest scope

- Original unchanged QL-336A required gate suite preserved; QL-482 and QL-483 tests remain enabled.
- New Linux tests exercise four independent signers, source enrollment, signed private outage→recovery→closure journal, real QL-482 protected reader call, durable proof receipt, wrong operator TLS, source/host/reviewer spoofing, bad source revision, tampering and rejected fake physical attestation.
- Windows tests ensure manual launcher --status is inert and --serve on nonoriginal CI never opens network.
- Production main/source and Cloudflare static parity can be GREEN after passing GitHub checks, but they do NOT prove the original Windows runtime or source system were actually enrolled.
- Accepted private crypto-only state is DURABLE_SIGNED_YW_SESSION_CORRELATION_HELD. originalHostVerified stays false and fieldAcceptance remains HOLD for all CI-generated signed packets.

Next proposed: **QL-485 — Cross-Application Signed Contract Negotiation, Source-Release Compatibility & Git-Divergence Diagnostics.**
