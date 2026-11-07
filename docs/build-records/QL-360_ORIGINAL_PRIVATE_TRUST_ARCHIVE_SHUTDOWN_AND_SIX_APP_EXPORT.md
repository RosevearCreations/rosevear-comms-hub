# QL-360 — Original-Host Independent Trust Receipt Archive, Time-Bound Receiver Shutdown Witness & Six-App Post-TEST Evidence Export

## Proven live position

The last original Ree `DESKTOP-AE894KC` / Jack `TEMPLAR` field responses still
reported no independently authenticated original issuer/witness, no separate
signed owner enrollment, no approved pins, no Ree DPAPI receiver credential and
no private receiver listener. Read-only Supabase readback confirmed **zero
original enrollment rows, zero immutable signed receipts, `NOLOGIN` on
`ql340c_private_receiver` and six source peers HELD**.

QL-360 code being released to `main` is not a real trust receipt, a customer
connection or owner authorization. It never creates an issuer, signs for Ree or
Jack, grants a database role, or starts a server.

## Original owner runbook

1. **On original Ree and Jack Windows devices**, update a clean `main` and
   run this read-only status command in each repository:

   ```powershell
   powershell.exe -NoProfile -ExecutionPolicy RemoteSigned -File .\runtimes\hub-relay\ql360-windows-evidence-export.ps1 -Status
   ```

   The script rejects private exports on Jack or any unrecognized CI laptop.

2. **Do not proceed without genuine QL-359 closeout:** the independently
   authenticated issuer and distinct field witness must have approved the
   original pinned identities; Ree/Jack must have signed separate exact owner
   decisions; the original administrator must have enrolled one exact device
   and provisioned the restricted receiver credential. Ree must already have
   executed a genuine signed one-device TEST with exactly one immutable
   PostgreSQL receipt and a separately signed closeout-witness transcript.

3. **Ree alone stops the actual receiver** with the existing protected
   QL-340C `-Stop` action. Unlike `-Status`, that actual operation produces an
   original owner-only `ql340c-stopped-*.json` receipt with a verified process
   identity and listener count zero. If it reports `RECEIVER_ALREADY_OFF`, it
   did not witness a live stop: **HOLD**, do not invent a receipt.

4. **Within 90 seconds**, copy the exact returned `stopReceiptPath` locally
   and run on Ree (replace only the local path arguments):

   ```powershell
   powershell.exe -NoProfile -ExecutionPolicy RemoteSigned -File .\runtimes\hub-relay\ql360-windows-evidence-export.ps1 -ShutdownReadback -StopReceiptPath 'C:\path\to\original-stop-receipt.json'
   ```

   This checks the original file is inside Ree's private Evidence directory,
   has the original QL-340C schema, a real positive stopped PID, age below
   90 seconds, and that both private 8788 and Tailnet gateway 8443 listeners
   are now absent. Its output is **local observation**, not independent issuer
   authentication or a synthetic live TEST approval.

5. **Only if the genuine QL-359 signed packet and independent owner review
   already exist**, and the stop receipt is still fresh, Ree may export a
   protected private six-app readback:

   ```powershell
   powershell.exe -NoProfile -ExecutionPolicy RemoteSigned -File .\runtimes\hub-relay\ql360-windows-evidence-export.ps1 -ExportPostTest -ExportStopReceiptPath 'C:\path\to\original-stop-receipt.json' -OriginalPacketPath 'C:\path\to\signed-device-packet.json' -OwnerReviewPath 'C:\path\to\owner-review.json'
   ```

   This first verifies the original signed device packet against the exact
   immutable DB receipt through QL-359/QL-340C; then QL-340C writes a real
   owner-protected six-peer snapshot under Ree's Evidence directory. **Never
   copy DPAPI files, database URLs, private keys, or customer data.**

6. **Independent archival acceptance:** the server-only QL-360 runtime
   consumes the genuine **nonserializable, single-use** QL-359 closeout no
   later than 90 seconds after acceptance. It independently observes the
   authenticated original-host shutdown (fresh within 20 seconds), queries
   the minimum DB role and one receipt, verifies zero revocations and all six
   peers still HELD, then writes a redacted evidence document with a SHA-256
   digest to the original Ree Windows owner-ACL archive with atomic create-new.
   The archive must be read back and independently hashed before it is accepted.
   File presence, a copied JSON object, a screenshot or CI fixture is not proof.

7. **Result:** A valid archive verifies **only one original private health
   TEST**. It cannot set any six source app CONNECTED or enable customer
   messaging, device actions, broad synchronization, or public exports.

## Security / CI regression gates

- `ql360-original-evidence-archive.mjs` requires an unforgeable QL-359
  one-use closeout, fresh authenticated original-host STOP, exact limited
  receiver role, single immutable receipt, no revocation, six unchanged HELD
  records, owner-only create-new archive and actual SHA-256 readback.
- Archive only contains a small field allowlist: session ID, signed transcript
  digest, externally pinned independent witness digest, times, counts, exact
  six source IDs, and status. It excludes extra user data, credential fields,
  packet payloads and signing keys even if upstream DB rows contain them.
- `ql360-windows-private-storage.mjs` refuses non-Ree/nonoriginal hosts and
  enforces current-user Windows ACL via the existing original custody helper.
- `ql360-windows-evidence-export.ps1` allows CI only `-Status`; it never
  starts/stops any process itself, creates credentials, alters database roles,
  signs or changes a peer entitlement. A real private export is a separately
  supervised on-device operation only after strict evidence review.
- Protected workflow retains QL-336A's original 43 gates, every later
  security gate, Windows provenance and post-push public JS/CSS parity.

## Next proposed build

**QL-361 — Archived Original TEST Chain Verification, Independent Redaction
Audit & Owner-Controlled Six-App Connection Candidate Handoff.**
