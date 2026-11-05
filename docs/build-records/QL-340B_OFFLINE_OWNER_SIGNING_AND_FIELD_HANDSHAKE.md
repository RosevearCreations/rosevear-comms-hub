# QL-340B — independent owner TEST signing and private receiver pinning

**Source release state:** offline ceremony implemented and testable. **Physical TEST state:** no real field witness, database enrollment, private receiver or signed heartbeat is implied by source promotion. No live communications, customer data or device effects.

## Original devices and trust boundary

- The original Rosevear AI Hub Windows server holds the **source** owner key and the separate **device** key. It is the only planned receiver host.
- Jack's laptop holds the **master** owner key. Only Jack can enter its passphrase and decide whether to sign the reviewed request.
- The older master key generated in Ree's Windows account is **not** an independent master authority. Never use its public candidate for the QL-340B enrollment.
- Ed25519 public candidates are transferable; private PEM, passphrases and database credentials must not be copied between machines or pasted into chat, GitHub, browser forms or public SQL.

## Commands on the Windows Hub — preparatory, not an activation

1. Update a **clean** Comms checkout. The owner previously used `C:\Users\ree\rosevear-comms-hub-ql340` because the older checkout has extensive local changes. Run `git status -sb` before any `git pull --ff-only origin main`.
2. Transfer **only** `master.public-candidate.json` from Jack's laptop over an owner-reviewed private channel. Do not replace Ree's earlier master key files. Put Jack's public file in a clearly named separate location, e.g. `%LOCALAPPDATA%\RosevearAIHub\CommsRelay\Imports\jack-master.public-candidate.json`.
3. Review four **actual** source records: Windows process/task and device signer mapping, private TLS certificate and SPKI, Tailnet ACL/approved-origin readback, and an effective receiver rollback/stop witness. Confirm issuer, device, timestamp and restrictive reachability. Save each nonsecret reviewed evidence record separately. **Do not invent fixture or zero hashes.** The CLI hashes the four supplied file bytes and rejects missing, reused or tiny files, but cannot authenticate a human witness for us.
4. Create a local `evidence-paths.json` whose four keys point to those files:

   ```json
   {
     "windows": "C:\\private-evidence\\windows-process-readback.json",
     "privateTls": "C:\\private-evidence\\private-tls-chain.json",
     "tailnetAcl": "C:\\private-evidence\\tailnet-grants-readback.json",
     "rollback": "C:\\private-evidence\\receiver-stop-proof.json"
   }
   ```

   These are **path examples only**; the files must exist and contain actual checked evidence. If TLS or restrictive ACL proof is missing, STOP and leave the receiver OFF.
5. After the real records exist, prepare a 20-minute TEST request (replace example paths):

   ```powershell
   node .\runtimes\hub-relay\ql340b-ceremony.mjs --prepare "C:\Users\ree\AppData\Local\RosevearAIHub\CommsRelay\ql339b-hub.public-candidate.json" "C:\Users\ree\AppData\Local\RosevearAIHub\CommsRelay\OwnerAuthorities\source\source.public-candidate.json" "C:\Users\ree\AppData\Local\RosevearAIHub\CommsRelay\Imports\jack-master.public-candidate.json" "C:\private-evidence\evidence-paths.json" "C:\private-evidence\ql340b-request.json"
   ```

   `--inspect-request REQUEST` prints the request hash, real expiry and public-key hashes. The files contain public enrollment metadata and no private keys.

## Each original owner signs independently

Ree, on the Windows Hub, reviews the exact payload, its four evidence digests and expiry. Run `--inspect-request "C:\private-evidence\ql340b-request.json"` to obtain the 64-character public payload hash. **Replace the placeholder below with that exact hash**; it is required so a copied or modified request cannot be signed by accident. Only if accurate:

```powershell
node .\runtimes\hub-relay\ql340b-ceremony.mjs --sign source "C:\private-evidence\ql340b-request.json" "PASTE_EXACT_64_CHARACTER_REVIEW_HASH" "C:\private-evidence\source-approval.json"
```

Jack, on **his own laptop**, receives a copy of the same public request, independently runs `--inspect-request`, verifies the **same** hash and evidence digest values, and enters his **own** encrypted key passphrase:

```powershell
node .\runtimes\hub-relay\ql340b-ceremony.mjs --sign master "C:\private-evidence\ql340b-request.json" "PASTE_EXACT_64_CHARACTER_REVIEW_HASH" "C:\private-evidence\master-approval.json"
```

Only the public `master-approval.json` returns to Ree. These commands do not run unattended; absence of owner consent must remain a HOLD.

On Ree's Windows Hub, with both genuine approvals and before expiry:

```powershell
node .\runtimes\hub-relay\ql340b-ceremony.mjs --assemble "C:\private-evidence\ql340b-request.json" "C:\private-evidence\source-approval.json" "C:\private-evidence\master-approval.json"
```

This independently verifies the two signatures against **the same exact payload** and writes two private local files under `%LOCALAPPDATA%\RosevearAIHub\CommsRelay\Enrollment` with Windows ACL hardening and no-overwrite behavior:

- `ql340b-signed-test-enrollment.json`: a nonsecret, short-lived, double-signed TEST record for an independently authorized DB operator to review.
- `ql340b-private-owner-public-pins.json`: verified public-only source/master pins for the receiver.

The CLI does **not** insert database rows, create a database connection secret, configure Tailscale, open a port, start the receiver, or send a heartbeat. Expired, mismatched and replayed requests fail closed. If time runs out, review the evidence again and prepare a new short-lived request; never alter a signed payload.

## Independent private TEST gate after signing

1. Verify the real Windows/TLS/Tailnet/rollback evidence from original issuers. Do not treat local hashes or chat copies as independent authorization.
2. Confirm the protected Supabase table `master_hub_device_enrollments_ql339b` has no conflicting record, then have an **authorized private DB operator** insert the exact signed `enrollment_record` as `REVIEWED_TEST`, respecting its immutable RLS/append-only controls.
3. Supply the receiver with a server-side managed PostgreSQL credential and the protected pin file. **Never** put a DSN in GitHub, browser settings or chat. The currently shipped receiver needs a `DATABASE_URL` from a server-private secret manager; it does not discover a credential merely from the public keys.
4. Verify private TLS chain/SPKI and deny-by-default Tailnet ACL before allowing any external reachability. Start only the loopback receiver on `127.0.0.1:8788` when explicitly approved. No public port forwarding.
5. Use the original **Windows device key** to issue one owner-supervised, metadata-only TEST heartbeat within enrollment validity, then independently read back **one** durable held receipt and demonstrate duplicate rejection and rollback.

Until steps 1–5 are completed on real equipment, `main` CI GREEN means **shipped source only**. The live connection is **DISCONNECTED / HOLD** and the other five application integrations remain separate acceptance work.

Verification: `node --test runtimes/hub-relay/ql340b-enrollment.test.mjs`. All test keys, witness files and signatures are synthetic; no test fixture is a real owner approval or a receipt.

Sources: [Supabase securing your data](https://supabase.com/docs/guides/database/secure-data), [Tailscale access control](https://tailscale.com/docs/features/access-control/acls), [QL-339B original receiver contract](./QL-339B_AUTHENTICATED_PRIVATE_RECEIVER_AND_TEST_HANDSHAKE.md).
