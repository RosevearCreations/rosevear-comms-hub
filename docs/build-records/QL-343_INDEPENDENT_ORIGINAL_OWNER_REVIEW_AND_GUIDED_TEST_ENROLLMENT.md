# QL-343 — Independent Original-Owner Evidence Review & Guided Signed TEST Enrollment

## What was independently observed versus what remains held

The owner has reported the following **local** observations; repository source and CI cannot independently attest to the physical owners, current process, issuer or database:

| Source | Observed field readback | Not proved by the readback |
| --- | --- | --- |
| Ree's `DESKTOP-AE894KC` | Port `8788` not listening after QL-342A; public hub/source candidates exist | Genuine source-owner approval, active receiver stop |
| Jack's `jfros` Windows profile | Master encrypted private key and matching public candidate present; source key absent as expected | Jack's later consent to an exact TEST request |
| QL-342A inert drill | Private file `ql342a-inert-rollback-drill-2026-11-06T02-07-12-109Z.json`; fingerprint `6C81AB77A7F12E01AFA0E7175775A30B006D80241853D7CADEE781D1BFA48965`; structural check passed | **Not** a stop of the real receiver, not independent witness or enrollment authorization |

That evidence hash is a **reported reference fingerprint**, not a hardcoded authority pin, signature or automated authorization. Do not modify or replace the original evidence. If the file or hash changes, resolve that as a new independent finding before proceeding.

## First guided action on Ree's Windows PC

On `DESKTOP-AE894KC`, in the existing clean repository:

```powershell
cd C:\Users\ree\rosevear-comms-hub-ql340
git status -sb
git pull --ff-only origin main
node .\runtimes\hub-relay\ql343-owner-evidence-review.mjs --review-local
```

The helper resolves the existing three **public-only** candidates and original evidence paths under `%LOCALAPPDATA%\RosevearAIHub\CommsRelay` without exposing private signing keys, retrieving a credential, contacting a remote peer or starting a process. It refuses ambiguous rollback drill files until one is explicitly selected. It hashes four existing, distinct evidence files. Its successful state is still **`EVIDENCE_HASHED_ORIGINAL_OWNER_AND_ISSUER_REVIEW_REQUIRED`**, never approval.

After the owners have read the digest inventory and considered all discrepancies, stage a new **nonsecret, non-authorizing** review packet and file-path manifest with:

```powershell
node .\runtimes\hub-relay\ql343-owner-evidence-review.mjs --stage-local
```

This writes two new, no-overwrite files in the private `Evidence` folder: `ql343-owner-evidence-review-*.json` and `ql343-original-evidence-paths-*.json`. `--stage-local` is not a cryptographic signature and **does not certify that Ree or Jack approved anything**. Both documents remain HOLD.

If more than one inert drill is found, explicitly supply the known complete original drill file path as the final argument to `--review-local` or `--stage-local`. It must reside within the private Evidence directory.

## Original-owner review is separate from signing

1. Ree confirms the Windows process/task report, original device signer, TLS chain and public SPKI, restrictive Tailnet grant/deny policy, and current receiver-OFF observation. A hash or a locally claimed `WindowsChainVerified` flag alone does not authenticate those original issuers.
2. Jack independently reviews **copies of only the public TEST request and nonsecret review packet**, verifies their exact payload hash and four source evidence hashes, and retains his own encrypted master signing key on his own PC.
3. The QL-342A drill must always be called **inert-only**. It may contribute to a risk review of safe rollback readiness, but **cannot be relabelled as an active real-receiver stop**. If the field procedure requires an actual stop witness, original authorities must decide and document a defensible receiver-OFF alternative or preserve HOLD. Do not invent a stopped PID for port `8788`.
4. Only after an accountable original-issuer and owner review resolves the field requirements, Ree may use the existing `ql340b-ceremony.mjs --prepare` with the four-path manifest. Its request is valid for at most **20 minutes**. The helper does **not** call `--prepare` automatically.
5. Each owner individually runs the existing `ql340b-ceremony.mjs --inspect-request`, verifies the exact 64-character payload digest, then independently decides whether to use its `--sign source` (Ree) or `--sign master` (Jack). Their private keys and passphrases never leave the original Windows accounts.
6. Jack can **compare**, not sign, using:

   ```powershell
   node .\runtimes\hub-relay\ql343-owner-evidence-review.mjs --compare-request "C:\path\to\ql340b-request.json" "C:\path\to\ql343-owner-evidence-review.json"
   ```

   Supply the real paths only after independently receiving the exact public request and review packet. This command checks freshness, candidate key IDs and all four witness hashes but returns `sourceSigned:false`, `masterSigned:false`, `requestMayBeSigned:false`, `connected:false` **even when bytes match**. It cannot grant original-owner authorization.
7. Only independently created source/master approvals can be assembled by the existing `ql340b-ceremony.mjs --assemble`. The result is a held, short-lived private TEST enrollment candidate, not an active DB enrollment. A separately authorized database administrator must still review and enroll it before expiry. The receiver must remain OFF without that independent authority and a dedicated private database credential.

## Security/verification limits

- **No automatic signer:** QL-343 reads only public candidate records and nonsecret evidence, writes no-overwrite review/path manifests and compares public request metadata. It never invokes `--sign`, `--assemble`, `--Start`, Tailscale Serve or `pg`.
- **No public secret leakage:** no private PEM, owner passphrase, DSN or credential appears in browser UI, local review packet or code repository. Local helper refuses an inherited `DATABASE_URL` on the original Windows host.
- **No trust inflation:** malformed or forged review packets claiming source/master signed, field witness approved, real receiver stopped, customer/device effects or active connection fail format validation.
- **No silent stale approval:** QL-340B request freshness and 20-minute validity are checked when comparing a public request. Tampered evidence hashes or changed signer key IDs fail closed.
- **CI:** Linux and Windows tests cover public key verification, four file hashes, ambiguity, altered rollback drill claims, cross-computer comparison and no signing/DB/receiver side effects. All previously required gates remain.

**Production GREEN denotes shipped, verified code only.** The physical original-owner review and signatures remain **not performed by this build**; the private receiver remains **OFF** and six peer connections **HOLD** until separately and independently authorized.

Reference: [QL-340B owner signing ceremony](./QL-340B_OFFLINE_OWNER_SIGNING_AND_FIELD_HANDSHAKE.md), [QL-342A inert drill](./QL-342A_SUPERVISED_INERT_ROLLBACK_DRILL_AND_OWNER_REVIEW.md).
