# QL-488 — Original-Host Source Transport Enrollment and Durable Operator Receipts

QL-488 supplies a **private, explicit-owner-action transport probe** and a durable append-only operator decision receipt engine. No Cloudflare public listener, cron polling, customer message, source credentials or live source approval is created.

## Six independent original-source configurations
The original Ree Windows host may store a single restricted file:
`%LOCALAPPDATA%\\Rosevear\\CommsHub\\Private\\ql488-endpoints.json`
with exactly `{"endpoints":{"yw":...,"icamp":...,"rosiedazzlers":...,"devilndove":...,"ai-data-platform":...,"rosevear-ai-hub":...}}`. Each exact entry needs:
- `sourceId`: canonical application ID
- `url`: independently approved `https://<unique-private-dns-name>/internal/comms/source-release` on 443 or 8443, no credentials, query string or redirects
- `serverCertificateSha256`: a unique, separately verified lowercase 64-hex SHA-256 certificate fingerprint
- `caPem`, `clientCertificatePem`, `clientKeyPem`: private source-specific trust credentials; these remain in the local protected file, never in GitHub, ChatGPT or logs.

This does **not** generate source credentials, register a source app or establish that an endpoint exists. Use independently approved private DNS, client authentication and real valid CA-issued certificates. The system rejects missing/duplicate source entries, shared endpoint identities and keyless connections. The client enforces TLS 1.3, CA/hostname verification and exact server certificate fingerprint, bounded 5-second probe, 128 KB response limit and JSON-only read. A successful GET is a transport observation only: signed original-source runtime proof remains HOLD until QL-485/486/487 verifies the bundle.

## Windows original-owner commands
From an updated local checkout on DESKTOP-AE894KC (Ree account):

```powershell
node .\\runtimes\\master-discovery\\ql488-original-host-probe-cli.mjs --status
node .\\runtimes\\master-discovery\\ql488-original-host-probe-cli.mjs --probe "$env:LOCALAPPDATA\\Rosevear\\CommsHub\\Private\\ql488-endpoints.json" yw
```

The source ID can be one of the six canonical IDs. The probe requires the original host, interactive TTY, and exact typed confirmation. The status operation is inert, including in CI. Results never print signed source packets, passwords, private keys, source response data or customer information.

## Durable operator decision custody
`createQl488DecisionLedger` stores a locally scoped append-only private decision log (single-writer lock, 0600 file permissions on POSIX, SHA-256 previous-record chain, fsync and restart readback). Duplicate decision IDs are idempotent; conflicting replays, truncations and tampering fail closed. Decision recording supports only `ACKNOWLEDGE_HOLD` and `REQUEST_INDEPENDENT_REVIEW`. `createQl488OperatorCustody` requires QL-487's independently signed operator review and the exact current QL-486 durable receipt and registry digest. It cannot approve a source, change a signer pin, move Git branches, or dispatch customer work.

**Acceptance limitation:** tests use simulated source configuration and do not prove genuine external mTLS services, six-source integration or original Windows device acceptance. These require owner-provisioned private endpoints and supervised field witnesses.

Release gates: QL-488 dedicated tests, prior QL-336A/485/486/487 release checks, scoped `dev` and `main` PRs and post-merge public Worker JS/CSS parity.

**Next proposed: QL-489 — Six-App Independent Live Source Attestation Capture, Original Windows Transport Witness & Signed Operator Exception Closure.**
