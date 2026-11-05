# QL-338 — Windows Hub local relay, device proofs and offline recovery

**Software only. The private Windows relay remains NOT INSTALLED / OFF, and 0/6 source connections remain `DISCONNECTED / HOLD`.** No live home-system, camera, customer, or messaging access is enabled by GitHub deployment.

## Implemented safety boundary

- The source-owned Windows Hub library prepares exact nonproduction metadata-only `rosevear.hub.relay.heartbeat.v1` receipts. Comms verifies independent Ed25519 SPKI pin, workload, device, sequence, origin/TLS/ACL field witness, source/master TEST grants, expiry, signature and no redirect. It returns `DISCONNECTED / HOLD` even for a synthetically valid packet.
- Source-side request verifier only allows signed TEST `GET /health` or `GET /capabilities`. Camera streaming, vault, MQTT, home automation, Windows process changes, customer data and public inbound access are expressly not permitted. Code verifies but never executes a network request.
- Windows-side AES-256-GCM offline metadata snapshot supports owner-protected persistence and post-crash reopen, expiry cleanup, max 100 metadata receipts and a 24-hour cap. Backoff max five attempts, circuit opens after three consecutive failures. No runtime persistence directory, Windows service, key, outbound sender or timer was installed.
- Private Comms receipt ledger `20261105144611_ql338_private_windows_hub_hold_receipts.sql` is deployed to Supabase project `gxujcwpktaickcgzyvnu`. Append-only trigger, FORCE RLS, zero browser privileges, unique device/session/sequence and nonce, `HOLD`-only states. SQL readback: **0 receipts**.
- Shared JSON protocol: `docs/integration/ql338-hub-relay-contract.v1.json`, byte-identical to the Hub source. Source and consumer tests use ephemeral **synthetic** test keys only. No original signer, device identity or owner authorization is inferred from fixtures.

## Why QL-266 still shows UNDER_REVIEW / REVIEW_DEFERRED / DISCONNECTED

The Comms database currently contains six public-manifest discovery links and **zero authenticated private connections**. AI Data Platform's QL-266 status records the separately deferred first-owner TEST witness. It is not a stale text label to overwrite: its transition requires genuine source-signed authorization, an independently controlled issuer pin and an original signed TEST readback. Source CI GREEN, a public link, or a synthetic signature cannot satisfy those conditions. Correct state remains `DISCONNECTED / HOLD`.

## One-time actions that cannot be authenticated by the development agent

| Who | One-time action / independent evidence | Why this cannot be silently completed |
| --- | --- | --- |
| Windows Hub owner | On the actual Windows mini-server, run the **read-only** `scripts/inspect-ql338-hub-readiness.ps1` from the checked-out Hub source; review startup task, loopback port 8765, private Tailscale state and client version. | A remote code build cannot inspect or restart the actual private machine. The diagnostic does **not** install, activate or change anything. |
| Windows / network owner | Confirm outbound-only permitted route, exact private TLS/Tailscale destination, restricted tailnet ACL, Windows firewall, patched machine, least-privilege service identity, and independent negative access checks. Do **not** enable Funnel or router forwarding. | Real device enrollment and private network control require authenticated owner access. |
| Source signer custodian + independent witness | Provision a dedicated restricted, recoverable Windows-held Ed25519 signing identity and independent nonsecret SPKI fingerprint; review source/Comms pins and rotation/revocation without pasting private keys into ChatGPT, GitHub, browser or ordinary SQL. | Code cannot lawfully mint or witness someone else's trust identity. |
| Master owner and Hub source owner | Approve a **separate, scoped TEST-only** read-only pilot (two GET paths, named device, authorized account, expiration ≤30 minutes), including rollback, kill switch and revocation. | Earlier owner instructions explicitly withheld permission for installation and authenticated TEST access. |
| Owner + independent reviewer | Perform and witness original TLS/cert, wrong-device, expired nonce, 401/403, reboot/offline retention, kill-switch and read-only GET tests. Return nonsecret signed receipts to the private evidence ledger. | GitHub Actions cannot prove physical Windows state, source permission or genuine network exchange. |

After those one-time trust receipts, separately authorized server-side automation **can** keep nonsecret discovery, health checks, bounded reconnection, queue expiry, key-rotation prompts, drift alerts and approved task status updates current. Production messaging, device operations, full client portals and cross-child customer access remain different grants.

## Acceptance and rollback

QL-338's current code checks cover schema/time, wrong machine, wrong signer, missing owner proof, redirected peer, denied camera/device paths, encrypted offline recovery and circuit breaker. SQL rows remain 0; rollback before pilot is to leave library unused and relay OFF. Database migration is additive and empty; retain audit schema unless separate cleanup approval exists. **Software `main` GREEN must never be reported as `NONPROD_CONNECTED`.**

Next build: **QL-339 — Unified Child-Safe Client Portal Tracking & Consent-Aware Case Journeys** (owner source/trust and original child approvals still required).
