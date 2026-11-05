# QL-339B — Authenticated private receiver and original-device TEST enrollment

## Shipped source and important boundary

QL-339B provides a **separate Node.js, loopback-only HTTP receiver** (`runtimes/hub-relay/`) and a private, append-only Supabase enrollment/revocation ledger. It is **not** a route in the public Cloudflare Pages/static Worker, and a green production build does **not** install a Windows service, establish a Tailscale tunnel or attest a physical machine. No calls, SMS, customer records, or devices are accessible through this receiver.

The receiver accepts only `POST /private/ql339b/hub/heartbeat` on `127.0.0.1:8788` and only a 4 KiB maximum metadata-only, signed `TEST` envelope. The HTTP request cannot grant itself authority. A private server-side PostgreSQL lookup must find an unrevoked `REVIEWED_TEST` enrollment, which must verify with two **separate pre-pinned Ed25519 original-owner authority public keys**, one for source and one for Comms master. The signed payload pins the device key and includes reviewed Windows, private TLS, Tailnet ACL and rollback-witness SHA-256 digests. The device signature is then independently verified. One valid envelope yields an atomic, immutable receipt in `master_hub_relay_receipts_ql338`; duplicates or replays yield no effect. All receipts remain `DISCONNECTED / HOLD` pending independent field readback.

## What is verified versus outstanding

| Item | State |
| --- | --- |
| Synthetic signed enrollment, local loopback HTTP POST, one immutable receipt and replay rejection | Automated local tests |
| Private DB enrollment/revocation migration with forced RLS and no browser insert/write grants | Applied and read back in Rosevear Comms Supabase project |
| Real Windows key generated on the owner's physical machine | **Owner action required** |
| Independent original source/master signatures and physical witness evidence | **Not supplied; do not invent** |
| Private host, verified TLS endpoint, Tailscale ACL, secret-managed DB connectivity | **Not deployed by this source change** |
| Signed field POST and independent database receipt readback | **Not performed** |
| Live cross-app exchange, calls, SMS, device actions | **OFF / NOT AUTHORIZED** |

The private SQL tables `master_hub_device_enrollments_ql339b` and `master_hub_device_revocations_ql339b` have no anonymous/authenticated browser policies, enforce RLS, and prevent updates/deletes. Revocation is a **new append-only row**, never an overwrite. Operations staff must not insert a guessed, fake, synthetic, self-approved or unverified owner enrollment.

## Operator-controlled bring-up — no automatic activation

1. On the physical Windows Hub, follow `RosevearCreations/rosevear-ai-hub` guide `docs/integration/QL339B_WINDOWS_DEVICE_SIGNER_FIELD_HANDSHAKE.md`. Keep the generated encrypted **private** key and its passphrase strictly on the Windows machine. Export **only** the public candidate for independent review.
2. Independently validate the actual Windows process/signing witness, the private HTTPS certificate SPKI pin, Tailscale ACL denying other clients, and the ability to revoke/stop the receiver. The digest fields must be SHA-256 digests of actual reviewed private evidence, not zeroes or fixtures.
3. Prepare the exact `rosevear.hub.relay.enrollment.v1` record with issuer `rosevear-ai-hub`, audience `rosevear-comms-hub:nonproduction`, environment `TEST`, matching public device key/SPKI and **30-minute or shorter** validity. Source original owner and Comms master original owner independently sign `source:${canonicalize(payload)}` and `master:${canonicalize(payload)}` using their **separate** original authority keys. Never put either private signing key into the app, GitHub, public SQL, chat or browser. The server's protected authority-pins JSON contains only independently verified **public** owner keys and IDs.
4. An authorized private database operator verifies the exact nonsecret signatures and evidence, then inserts `REVIEWED_TEST` into `public.master_hub_device_enrollments_ql339b`. The stored `enrollment_record` is `{ "payload": { ... }, "approvals": { "source": { "keyId": "...", "signature": "..." }, "master": { "keyId": "...", "signature": "..." } } }`. `device_id`, `workload_id`, `key_id` columns must equal the signed payload IDs. If the original authorizations are absent, **leave the table empty**.
5. Only on a private, approved host with valid PostgreSQL TLS trust, secret-managed server `DATABASE_URL`, and protected read-only owner public authority pin file, run `npm ci --prefix runtimes/hub-relay` and `node runtimes/hub-relay/server.mjs --serve /private/path/to/public-authority-pins.json`. It binds `127.0.0.1:8788`, **not** a public network interface. The pin-file schema is `rosevear.hub.ql339b.owner-authorities.v1` with `source` and `master` each containing only `keyId` and `publicKeyPem`. Never use a browser `VITE_` variable or commit a DSN.
6. An independently reviewed TLS-terminating private sidecar may forward **only** this POST route to localhost. Issue an actual valid `.ts.net` private HTTPS certificate and verify its SPKI SHA-256 on Windows. Tailnet grants must limit the source device and the exact authorized host/port. Do **not** configure a public tunnel, port forward, or anonymous internet ingress.
7. After everything above is complete and still within enrollment validity, the owner can explicitly send **one** signed TEST heartbeat with `--send-once` from the Windows signer CLI. Verify the one returned held receipt in the private ledger and independently match its device, time, nonce/session and SHA-256 against field evidence. An accepted packet is **not** automatic activation or permission to send customer data.
8. To revoke the device, stop the private host and append one row to `master_hub_device_revocations_ql339b` with matching IDs and a permitted `reason_code` such as `OWNER_REVOKED`. The server will deny subsequent heartbeats. Perform independent readback before any later reenrollment under a new `key_id`.

## Operational notes and source verification

- `node --test runtimes/hub-relay/heartbeat.test.mjs runtimes/hub-relay/private-receiver.test.mjs runtimes/hub-relay/server.test.mjs` exercises local real HTTP, negative cases and synthetic signatures. A passing synthetic test cannot establish owner custody.
- The protected CI script `scripts/ql336a-required-gates.sh` includes these tests **in addition to** all previous gates; security checks are not disabled.
- Supabase background: [Securing your API](https://supabase.com/docs/guides/api/securing-your-api) and [RLS guidance](https://supabase.com/docs/guides/database/postgres/row-level-security).
- Original physical field evidence cannot be generated by Cloudflare/Supabase CI. **This is the explicit final handoff blocker, not another missing application build.**

**Next recommended build after witnessed field pairing:** QL-340 — Six-App Connection State Reconciliation, First Real Nonproduction Evidence Exchange and Operations Acceptance. It must not claim connected or production-green integration without independently verified field receipts.
