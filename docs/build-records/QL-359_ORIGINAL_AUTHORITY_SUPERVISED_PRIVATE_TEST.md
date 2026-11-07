# QL-359 — Original Authority Trust Establishment, Owner-Verified Credential Provisioning & First Supervised Private TEST

## Actual original field status (not a simulation)

The last independently observed original-host QL-357 snapshots showed Ree
`DESKTOP-AE894KC` and Jack `TEMPLAR` holding distinct encrypted signing keys and
public candidate files. **No independently authenticated issuer or witness,
no separate owner signatures, no approved original public pins, no original
signed enrollment, no DPAPI receiver credential and no receiver listener were
present.** An authenticated read-only database check on the RosevearCreations
project confirmed zero device enrollments, zero immutable receipts, and the
`ql340c_private_receiver` role still has `NOLOGIN`. Six sources remain HOLD.

**GitHub `main` GREEN is a software release result; it cannot establish live
original owner trust or manufacture one TEST receipt.** This build adds an
exact read-only Windows handoff and a fail-closed signed-receipt closeout
sequence. No CI test touches original machines or authorizes production traffic.

## One genuine owner-supervised TEST, step by step

1. **Ree and Jack, on their own original Windows accounts:** update a clean
   checkout of `main`. In PowerShell in the repository, each runs:

   ```powershell
   powershell.exe -NoProfile -ExecutionPolicy RemoteSigned -File .\runtimes\hub-relay\ql359-windows-supervised-test.ps1 -Status
   ```

   Ree must see original source on `DESKTOP-AE894KC`; Jack must see master on
   `TEMPLAR`. A public candidate or encrypted key **does not establish trust**.

2. **Outside the request's own trust domain:** the original issuer and a
   **different** independent field witness must prove their previously approved
   Ed25519 pins and original custody/revocation status through the separate
   trusted authority registry. This cannot be satisfied by copying a locally
   generated public key, an online form, self-attested JSON, or GitHub success.
   If either real identity cannot be authenticated: **STOP; receiver stays OFF**.

3. **Fresh exact owner decisions:** Ree prepares a fresh 20-minute unsigned
   original QL-340B one-device TEST request using the QL-356 handoff. Both
   independently compare the same request hash and their original public
   candidates with QL-359 `-OwnerReview -RequestPath <local-request.json>`.
   Ree **also** provides `-EvidencePathsFile <local-witness-paths.json>`;
   Jack never imports Ree's original witness files. After independently
   authenticating issuer/witness signatures, Ree signs the source decision
   and Jack signs the master decision **separately**, with the preexisting
   QL-340B `--sign source` / `--sign master` owner prompts on their own host.
   Only Ree assembles both into the exact signed enrollment, using QL-358
   `-ReviewSigned`; do not transfer private keys or passphrases.

4. **Original administrator enrollment:** after QL-355 verifies both external
   authority signatures and both QL-340B owner approvals, the authorized
   original administrator performs **one** atomic QL-357/354 enrollment.
   Independently read back the exact `REVIEWED_TEST` row, zero revocations,
   zero receipts, and all six sources in HOLD. If anything differs: **STOP**.
   Do **not** create an enrollment row or enable a database user solely because
   QL-359 is on `main`.

5. **Credential provisioning on Ree only:** the verified administrator
   separately provisions a uniquely scoped `ql340c_private_receiver` LOGIN
   secret with the already-defined minimum receiver rights. Ree reads:

   ```powershell
   powershell.exe -NoProfile -ExecutionPolicy RemoteSigned -File .\runtimes\hub-relay\ql359-windows-supervised-test.ps1 -CredentialReadback
   ```

   After independent approval of the dedicated receiver's role, host and URL,
   Ree enters the approved URL through **the existing hidden QL-340C prompt**:

   ```powershell
   powershell.exe -NoProfile -ExecutionPolicy RemoteSigned -File .\runtimes\hub-relay\ql340c-windows-operator.ps1 -StoreCredential
   ```

   The password is encrypted under Ree's current-user DPAPI. Never put it in
   chat, the repository, a terminal argument, Jack's machine or a file upload.
   Role currently has NOLOGIN; never enable it before the genuine ceremony.

6. **First controlled private TEST:** the authenticated original Ree operator
   verifies original enrollment and limited-role DB readback with QL-358,
   then independently authenticates the original Tailnet TLS path and uses
   existing owner-supervised QL-340C/QL-352 procedures to start the receiver
   **only for one 90-second health/capabilities TEST**. The original AI Hub
   device signs the fresh challenge using its **original local protected key**.
   This must be a real cross-device packet and one immutable matching DB receipt;
   an HTTP 200, test fixture or fake JSON does not count.

7. **STOP and independent closeout:** Ree explicitly stops the supervised
   receiver using the original QL-340C `-Stop` procedure, then runs:

   ```powershell
   powershell.exe -NoProfile -ExecutionPolicy RemoteSigned -File .\runtimes\hub-relay\ql359-windows-supervised-test.ps1 -StopWitness
   ```

   This only proves the local listener is absent; QL-359's private runtime
   additionally requires an independently authenticated original-host STOP
   observer, separately authenticated field witness bound to the signed
   transcript, exactly one immutable PostgreSQL receipt, zero revocations and
   six unchanged HOLD peers. Ree finally calls `-ReceiptReview
   -OriginalPacketPath <signed-packet.json> -OwnerReviewPath <owner-review.json>`
   to read back the actual signed receipt. An untrusted screenshot is not proof.

8. **Decision:** after a genuinely verified first TEST, only this one original
   health-only private session may be considered complete. **The six business
   integrations remain `DISCONNECTED / HOLD`** until separate source-side
   authorization is granted. Customer messaging, device actions and bulk
   synchronizations are never enabled by this ceremony.

## Fail-closed invariants and release verification

- `ql359-supervised-private-closeout.mjs` consumes the QL-358 single-use private
  receiver ticket and verifies the real device signature plus DB receipt before
  any STOP/witness acceptance. Its second call cannot replay the ticket.
- Original receiver STOP must be observed on `DESKTOP-AE894KC`/`Ree`, port
  `8788`, with listener count `0`, fresh timestamp and exact transcript digest.
  Independent field-witness readback must match the same digest and session.
- Post-TEST database role, exactly-one immutable receipt, no revocation and
  six HOLD sources must agree. False evidence, stale signatures, an extra
  receipt, incorrect role or an active receiver must all HOLD.
- `ql359-windows-supervised-test.ps1` performs **read-only** owner checks. It
  cannot run on a CI machine except `-Status`; it never changes a credential,
  database role, device, process, firewall or source repository.
- Required Linux/Windows CI gates include both QL-359 tests, all earlier
  original security gates and public JS/CSS parity. Production promotion
  verifies protected PR checks, `dev`/`main` matching trees, protected `main`
  jobs, and disabled public preview deployment separately.

## Next build

**QL-360 — Original-Host Independent Trust Receipt Archive, Time-Bound Receiver Shutdown Witness & Six-App Post-TEST Evidence Export.**
