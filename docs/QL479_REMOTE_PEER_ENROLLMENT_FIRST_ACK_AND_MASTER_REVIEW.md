# QL-479 — Supervised remote peer enrollment, authenticated delivery, independent durable first-ACK review

> Source code **does not** constitute original-host installation or genuine remote production acceptance. QL-479 has no Cloudflare public receiver, task, service registration, device scanning or automatic transmission. The original local port 8788 remains OFF. Never use CI test certificates, synthetic signatures or a browser claim as field proof.

## Relationship to the November 20 Three Master Application Review

The owner-provided *Rosevear Three Master Application Review*, pages 1, 4, 6, 8–10, is a **goal catalogue**, not a certification report. Three stable boundaries: **AI Data Platform** owns fleet measures and sources; **Comms Hub** owns operator cases, follow-up and verifiable delivery states; **Rosevear AI Hub** owns local workshop observation. Each business keeps ownership of customer data, accounting, consent and business decisions.

Reviewed current baseline: QL-478 already has local TLS1.3 mutual authentication, QL-477 original-host evidence export, SHA-256 run receipts and durable signed ACK. Missing were (a) a trusted *remote* endpoint, (b) owner and receiver-custodian enrollment signatures, (c) narrow remote certificate binding and one-message limits, (d) remote delivery proof and (e) independent offline field witness. QL-479 implements (a–d) as **opt-in portable source**, including real TCP loopback CI tests and manual entrypoints, but cannot obtain actual original-host credentials/field observation (e) through GitHub.

The review asks first for a full **Yard Workers** missing-heartbeat incident journey, then **iCamp** with matching case/receipt/recovery contract. QL-479 does not fake those complete incidents. Our next recommended Comms Hub package is QL-480 with an idempotent scoped private incident adapter, a durable intent + lease, an accessible source-to-case timeline and a YW/iCamp deterministic two-source rehearsal. A deployment commit is not an active incident or verified business outcome.

## Implemented boundaries

- `ql479-enrolled-remote-pilot.mjs`: independent owner and receiver-custodian Ed25519 signatures over **identical** narrow enrollment, current QL-477 field SHA, original host `DESKTOP-AE894KC`, exact `main` revision, sender and receiver signer pins, client and remote server X.509 **raw DER** SHA-256 pins, DNS host/port and `/internal/rosevear/sysop/telemetry/v1`. Enrollment expires after at most 15 minutes. It approves **one** message ID, not broad route activation. Simulator uses only `127.0.0.1`; supervised remote DNS is independently constrained.
- The sender validates CA and hostname, exact TLS server cert SHA-256, TLS 1.3, the enrolled client cert and host Ed25519 signature. It sends exactly one allowlisted **NON_SENSITIVE_AGGREGATE** status (uptime, process count and linked source/receipt hashes). No PII, private manuals, media, household events, tenants or customer orders. No redirect following, fallback to HTTP, automatic retry, or background send.
- Remote receiver is constructed but **unbound** until an owner expressly chooses to listen on the approved private interface. It requires mutual TLS client cert, matching signed source, pinned field digest, and exactly the preapproved message ID. Uses existing QL-478 owner-only private fsync write-once signed ACK and actual disk readback. Replay of identical bytes returns the same ACK; ID with changed bytes is a conflict.
- `reviewQl479IndependentFirstAck` correlates the signed owner/custodian enrollment, receiver-signed durable ACK, original field digest and separately pinned independent reviewer record. It reports **signed claims reviewed / field acceptance HELD**, not an independent physical certification.
- `ql479-supervised-remote-cli.mjs` provides two explicit one-time modes; never runs from CI/cloud deployments, never registers scheduled tasks, never reboots or deletes historical checkouts. Peer keys and private receipts must be supplied by the human operator in *owner-protected files*, never in repository or chat.
- Tests: real isolated TLS1.3 CA + server/client certs, first ACK, exact replay, changed-message conflict, wrong cert/key, bad fields, foreign message ID, expiry, malformed enrollment, offline-ack tamper, auditor claim consistency; synthetic cases clearly remain **SIMULATION**.

## How the owner actually uses the pilot

**Prerequisites:** The QL-475 independently witnessed offline archive/restore evidence, clean original Windows `C:\rc470` on the promoted `main` SHA, current QL-476 supervised on-demand first/recovery evidence, QL-477 export, QL-478 local readback, independent sender/receiver-custodian enrollment signers, a reachable and firewall-scoped PRIVATE remote receiver (not Cloudflare public Worker), trusted TLS CA, receiver cert/private key, sender client cert/private key and Ed25519 keys. All certificates are distinct from the synthetic CI fixtures and enrolled before the session. No installation or enrollment is automatically performed by this build.

1. Receiver operator manually provisions a private host and DNS name (TLS SAN must match). Choose an unused private interface and high port other than 8788. **Do not publicly expose the port or forward it to a household network.** Produce a short-lived enrollment manifest with the `QL479_ENROLL` fields signed by two distinct real owner/custodian keys. Share only the non-sensitive redacted QL-477 export and public pins, separately over a trusted channel.
2. On the private receiver, prepare an owner-protected JSON file referenced by `QL479_PRIVATE_CONFIG`, exactly these keys:
   `enrollmentPath`, `evidencePath`, `sourceMainSha`, `tlsCaPath`, `serverCertPath`, `serverKeyPath`, `receiverPrivateKeyPath`, `ledgerPath`, `bindAddress`.
   Enrollment JSON contains exactly `ownerPacket`, `receiverPacket`, `ownerPin`, `receiverCustodianPin`. Set filesystem permissions to owner-only. Bind only to an approved private RFC1918 interface, never `0.0.0.0`. Do not use public GitHub Secrets for the original private keys.
3. Start the receiver *manually while supervising*:
   ```sh
   QL479_OWNER_APPROVAL=SUPERVISED_ONE_TIME QL479_PRIVATE_CONFIG=/private/ql479-receiver.json node runtimes/master-telemetry/ql479-supervised-remote-cli.mjs --supervised-receiver
   ```
   It listens for at most 2 minutes and stops after the first authorized durable ACK. A timeout, certificate error or missing source proof is a HOLD.
4. On `DESKTOP-AE894KC` update only the **already clean** primary checkout using `git -C C:\rc470 pull --ff-only origin main`. Recollect the current-sha on-demand QL-476 receipts and private QL-477/478 review files. Do not clean or delete any other historical clone. Prepare original-host owner-only JSON `QL479_PRIVATE_CONFIG` exactly with `enrollmentPath`, `evidencePath`, `reconciliationPath`, `tlsCaPath`, `clientCertPath`, `clientKeyPath`, `sourcePrivateKeyPath`, `resultPath`. These paths must refer to files owned by the Windows operator and stored under `%LOCALAPPDATA%`. Record the returned SHA digest without exposing keys.
5. Only after explicit owner authorization and live human supervision, run on the original Windows host:
   ```powershell
   $env:QL479_OWNER_APPROVAL = 'SUPERVISED_ONE_TIME'
   $env:QL479_PRIVATE_CONFIG = Join-Path $env:LOCALAPPDATA 'RosevearCommsHub\QL479\sender-config.json'
   node C:\rc470\runtimes\master-telemetry\ql479-supervised-remote-cli.mjs --supervised-source-send
   ```
6. Verify **independently**, not by a self-asserted packet: source main SHA, private sender TLS peer cert, receiver database/filesystem ACK hash readback, original Windows machine, separate independent witness and retained source archives. Review a separately signed QL-479 first-ACK audit and retain the outcome as *FIELD HOLD* until original-host/remote peer truth is actually observed. A signed ACK proves the receiver persisted a payload, **not** operator acknowledgement, customer delivery, recovery or case closure.

## Operational acceptance and follow-on priorities from the review

| Scope | Implementation available | What proves runtime acceptance |
|---|---|---|
| GitHub source / Cloudflare release | CI and protected release checks | `main` SHA, app, Windows, deployment and public asset parity checks pass |
| Enrolled private remote peer | Short-lived independently signed manifest and mutual TLS code | Two genuine signer ceremonies and a real approved private receiver provisioned |
| First remote source-to-Comms ACK | Write-once recipient ACK, retransmission conflict, packet audit | Original-host `main` source and independently retrieved remote receipt digest |
| Verified system incident journey | **Not part of QL-479** | One YW incident opens/recovers/closes once, then iCamp repeat with ownership/evidence |
| Seven-source fleet health | **Not part of QL-479** | AIDP independently verifies source-specific signed receipt histories over time |
| Overall reliability | **Not currently measured** | Ordinary business-week baseline, deploy/restore, freshness and aggregate coverage measured |

**Next build proposed:** **QL-480 — Reusable Scoped Operator Incident Adapter, Yard Workers/iCamp Recovery Rehearsal & Durable Case-Transition Evidence**. Proposed follow-up: QL-481 actual authorized first two-source incident acceptance once AIDP and product owners have a verified signed source receipt and private operator identity. Avoid replacing or displacing AI Hub's existing Build 371 queue. Do not invent completion percentage gains: report implementation, measured production journeys and sustained field reliability separately (review pp. 9–10).
