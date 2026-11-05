# QL-340 owner-preflight — two distinct original-owner signing keys

**Purpose:** Prepare for the owner's real Rosevear AI Hub-to-Comms Hub TEST handshake. This release does **not** claim the TEST exchange has occurred, and it does not mark the remaining five apps connected. Two cryptographic keys with different fingerprints are necessary but do not by themselves establish independent original-owner custody.

The real Windows signer has already published the following reviewed **public candidate**:

- Device: `rosevear-windows-hub`; workload: `hub-probe`; key ID: `hub-ql339b`.
- Device Ed25519 SPKI SHA-256: `2e7f3902fd4312923276a7bf7a22a2c5ae18090a9a0fe4fb2337a955f9b62737`.
- Its encrypted **private** key remains on the Windows Hub. Never copy or replace it.

## Owner-supervised Windows setup

1. Open PowerShell under the actual authorized **source** owner account. Do not run PowerShell as another person merely to manufacture independent approval.

   ```powershell
   cd C:\Users\ree\rosevear-comms-hub
   git status -sb
   git pull --ff-only origin main
   node .\runtimes\hub-relay\owner-authority-custody.mjs --inspect
   node .\runtimes\hub-relay\owner-authority-custody.mjs --create source source-owner-ql340a
   ```

   Enter and repeat a new 16+ character passphrase privately. It is not printed or accepted on the command line. Store it in the authorized owner's offline vault; do not transmit it over chat. If the key already exists, the utility **refuses to overwrite**.

2. The separately authorized **Comms master** owner, preferably in a different Windows user profile with independent private storage, performs the command below from an independently checked-out copy of this repo (the current path is shown for the same profile only):

   ```powershell
   cd C:\Users\ree\rosevear-comms-hub
   node .\runtimes\hub-relay\owner-authority-custody.mjs --create master comms-master-ql340a
   ```

   A separate owner selects and privately retains a **different** passphrase. If both keys are generated in the same Windows user profile, cryptographic keys are distinct but independent owner custody **has not been proved**; remain on HOLD until the separate custodianship is reviewed and witnessed. Never imply an approval just because files exist.

3. Under each actual custodian account, read only a sanitized file-presence report:

   ```powershell
   node .\runtimes\hub-relay\owner-authority-custody.mjs --inspect
   ```

   Per-role files are stored under `%LOCALAPPDATA%\RosevearAIHub\CommsRelay\OwnerAuthorities\source` or `master`:

   | File | Treatment |
   | --- | --- |
   | `<role>.private.pem` | AES-256-CBC encrypted PKCS8 private key; keep local and secret. |
   | `<role>.public-candidate.json` | Public role, key ID, Ed25519 key and SPKI hash; may be transferred through the approved original-owner review channel. |

   The CLI attempts to remove broad Windows ACL inheritance before it writes private bytes and fails closed if that cannot be verified. No PowerShell script-execution-policy change is required.

## What this does **not** do

- Does **not** create a database enrollment row or source/master signed authority record.
- Does **not** sign the QL-339B enrollment payload, activate the receiver, configure Tailscale Serve, open a port, dispatch an event or touch customer/device data.
- Does **not** establish original owner identity just because an encrypted key exists. Each owner must explicitly approve the exact scoped TEST enrollment after witness review.
- Does **not** make local passing synthetic CI tests count as an original real-device field handshake.

The next field gate requires independently verified source/master **public** pins, actual Windows/TLS/Tailnet ACL/rollback evidence digests, short-lived separately signed enrollment payload, authorized private database insertion and one owner-supervised signed TEST POST. The Comms receiver remains `127.0.0.1:8788` loopback-only and OFF until its private credential/pin file is configured. Never enable Tailscale Serve before confirming restrictive Tailnet grants; default Tailnet policies can allow all devices.

## Verification

`node --test runtimes/hub-relay/owner-authority-custody.test.mjs` tests distinct encrypted owner key pairs, matching public SPKI hashes, bad-passphrase denial and no unattended key creation. It is included in the existing protected `QL-336A` application gate chain without removing any original check. The cryptographic fixtures are **synthetic** and are not original owner keys.

See [Supabase data security](https://supabase.com/docs/guides/database/secure-data), [Tailscale access controls](https://tailscale.com/docs/features/access-control/acls), and the [QL-339B private receiver acceptance checklist](./QL-339B_AUTHENTICATED_PRIVATE_RECEIVER_AND_TEST_HANDSHAKE.md).

**Next queued QL-340 field phase:** Original Owner Public-Pin Witness, Private Receiver Configuration and First Real Windows TEST Receipt. If the actual physical handshake remains held, report the named blocker without claiming full QL-340 acceptance.
