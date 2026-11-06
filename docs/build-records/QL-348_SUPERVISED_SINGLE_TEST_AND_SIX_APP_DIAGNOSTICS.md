# QL-348 — Supervised Single TEST Enrollment, Independent Receipt Validation & Six-App Diagnostics

## What this release actually proves

QL-348 supplies an **offline preflight, private read-only database verifier and
operator dashboard**. It does not sign on behalf of an owner, create a database
enrollment, enable a receiver, send a heartbeat, change Tailscale, or authorize
any of the six source applications. The initial Rosevear database inspection on
2026-11-06 found 6 HELD peers, 0 device enrollments and 0 relay receipts.

The existing QL-340B/340C and QL-342 procedures remain the separate,
owner-supervised pathway for a real single TEST enrollment. QL-348 independently
queries the dedicated PostgreSQL receiver role, original enrollment record,
one immutable TEST receipt, device signature, freshness and six HELD peer rows.
There is no public browser database access or privileged browser key.

## Step-by-step original-owner handoff

1. **Ree — original Windows Hub:** In the updated repository, run
   `node .\runtimes\hub-relay\ql348-supervised-test-diagnostics.mjs --help`.
   Run the existing `ql340c-windows-operator.ps1 -OwnerPreflight` and verify
   the genuine device candidate, encrypted original signer, receiver OFF,
   TLS certificate, Tailnet ACL and actual rollback capability. The earlier
   inert drill is **not** proof that the real receiver stopped.
2. **Jack — separate laptop:** Review the original issuer fingerprint and
   four field witness hashes via an independently trusted channel. Sign a
   separate exact-scoped QL-340B TEST approval only after independent review.
   QL-345 acknowledgements are not enrollment consent.
3. **Independent operator:** Verify the original issuer custody, both human
   decisions, exact request digest and private database role. Any genuine
   database enrollment is a **separate authorized procedure**, not this CLI.
   Do not insert rows merely because a local JSON field says approved.
4. **Ree — supervised single TEST only:** If and only if the separate
   authorization procedure has completed, use the existing signed, 90-second
   original-device health-only packet and dedicated private receiver.
   Do not enable phone, SMS, customer access or home-device effects.
5. **Independent verification:** On Ree's original Windows machine with the
   dedicated private receiver credential already securely configured, run:

   ```powershell
   node .\runtimes\hub-relay\ql348-supervised-test-diagnostics.mjs --preflight QL347_HANDOFF.json
   node .\runtimes\hub-relay\ql348-supervised-test-diagnostics.mjs --readback QL347_HANDOFF.json ORIGINAL_SIGNED_PACKET.json QL342_OWNER_REVIEW.json
   ```

   The second command uses the original Windows current-user evidence folder,
   independently held owner public pins, TLS-verified database connection,
   SELECT-only queries and a no-overwrite local JSON readback. It will fail
   closed without the expected original machine and private credential.
   **Do not paste DATABASE_URL, private keys or passphrases into the UI.**

6. **Operator dashboard:** Open *I.T. / Connections* → QL-348 and import only
   the nonsecret `ql348-supervised-readback-*.json` file. A browser import is
   display-only, must be corroborated on the original machine, and never
   upgrades the six source shell statuses.

## Six exact shell diagnoses

| Peer ID | Source shell | Initial state | Next independent proof |
| --- | --- | --- | --- |
| `rosiedazzlers` | Rosie Dazzlers | DISCONNECTED / HOLD | Scoped signed source TEST handshake |
| `devilndove` | Devil n Dove | DISCONNECTED / HOLD | Scoped signed source TEST handshake |
| `yw` | Yard Workers platform shell | DISCONNECTED / HOLD | Platform-shell signed TEST handshake |
| `icamp` | iCamp platform shell | DISCONNECTED / HOLD | Platform-shell signed TEST handshake |
| `ai-data-platform` | AI Data Platform | DISCONNECTED / HOLD | Broker-signed source TEST handshake |
| `rosevear-ai-hub` | Rosevear AI Hub | DISCONNECTED / HOLD | Original device receipt plus separately scoped source authorization |

One verified Hub heartbeat is NOT proof that all six peers are connected.
The dashboard deliberately renders 0/6 CONNECTED until distinct per-peer
signed handshakes and private authorization have been built and reviewed.

## Release checks and safety boundary

- Linux application required release gates and full frontend unit/build checks.
- Windows original-owner tests including QL-348 fail-closed receipt diagnostics.
- Production main push public Worker JS/CSS parity.
- Database reads only; no migrations, DDL, DML, recipient messages, provider
  credentials, API keys, customer records or home-device actions.
- A production GREEN release is a **software** status, never a connection claim.
