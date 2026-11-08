# QL-368 — Dual-Owner Enrollment, MFA & Secure Account Recovery

## Purpose

QL-367's first-visit screenshot showed **"Owner verification is unavailable"**
when no Supabase session existed. That was a client state-classification bug:
`auth.getUser()` can report an absent session as an error. QL-368 first uses
`getSession()` to detect the **absence** of a stored session, then always uses
server-validated `getUser()` and UUID-scoped RLS for the identity decision.
A missing session now displays the password sign-in form, not a locked error.

## Working owner journey

Production portal: <https://rosevear-comms-hub.devilndovelive.workers.dev/#/master>

1. Ree signs in on Ree's computer. Jack signs in independently on Jack's
   computer, using their own Supabase Auth email and password.
2. Each sees their own verified identity and **pending original-owner approval**.
   No other member or tenant row is read.
3. **Set up authenticator:** each owner may enroll a Supabase TOTP factor on
   their personal device, using the QR or manual key and a six-digit code.
   Existing TOTP accounts must pass a fresh challenge after password sign-in.
   The UI displays **MFA verified (AAL2)** only when the Auth server reports
   both a verified factor and AAL2 for the current session.
4. **Forgot password:** a signed-out owner can request a Supabase-managed
   password recovery email. The callback is restricted to the first-party
   `/?owner_recovery=1#/master` route and uses PKCE. A valid recovery session
   may set a new password of 12+ characters and is signed out afterward.
5. **Dual-owner enrollment:** the portal shows separate source-owner (Ree) and
   master-owner (Jack) original-device signature requirements. The optional
   **offline** CLI prepares a narrowly scoped *enrollment-evidence intent*;
   Ree and Jack may review and sign it separately using the existing pinned
   original Windows owner keys. The portal itself does **not** generate,
   approve, upload, activate or impersonate either signature. QL-366's
   **separate** TEST-only approval scope remains required for private TEST.

If recovery email redirects do not reach the Worker, confirm the exact
callback URL is allowlisted in Supabase Auth URL Configuration. Do not use
an unverified redirect domain or paste tokens/passwords into chat or GitHub.

## Security boundaries

- Missing browser session = `SIGNED_OUT`; broken stored session, unverified
  Auth token, wrong UUID or RLS error = fail closed. Browser `getSession()`
  contents are never accepted as authority.
- AAL1 does not count as MFA. TOTP setup cannot mark a membership active.
- Recovery requests return generic language and reveal no account existence.
  Password update requires an authenticated recovery return; the new password
  is never retained in the component after submission.
- No service-role key, privileged RPC, customer-data access, browser
  `master_organization_owner_memberships` mutation, private source GET,
  or automatic owner enrollment is added.
- Both original owner memberships remain inactive until genuine signed
  enrollment receipts and **server-confirmed MFA**. Both owners must approve
  separately on their original devices. The unavailable external-reviewer
  pathway is not silently treated as completed.
- All six application shells remain `DISCONNECTED / HOLD` with no customer
  operations or child-tenant grants. Public GitHub Pages disabled preview
  still has owner Auth disabled.

## Original-device evidence commands (optional, never unattended)

The command is `node runtimes/hub-relay/ql368-owner-enrollment-cli.mjs` on a
trusted current source checkout. `--help` is read-only everywhere. All other
commands refuse non-original Windows hosts, noninteractive approval, foreign
keys and database credentials. File outputs must be **new** filenames within
`%LOCALAPPDATA%\RosevearAIHub\CommsRelay\Enrollment` on the signing host.

1. Ree's original PC prepares one 24-hour Auth UUID binding intent with
   `--prepare SOURCE_AUTH_UUID MASTER_AUTH_UUID NEW_INTENT`. The tool prints
   the canonical `intentSha256`. The two UUIDs must be the individually
   verified original Supabase identities, not the email addresses.
2. Ree and Jack each inspect the *identical* intent and hash with
   `--inspect INTENT`, then personally invoke
   `--sign INTENT REVIEWED_INTENT_SHA NEW_APPROVAL` on their respective
   original Windows PCs. Each confirmation is interactive; the original
   encrypted private key is decrypted only with a locally entered passphrase.
3. After securely returning Jack's separately signed approval, Ree uses
   `--assemble INTENT SOURCE_APPROVAL MASTER_APPROVAL SOURCE_PUBLIC
   MASTER_PUBLIC NEW_SIGNED` and verifies the result with
   `--inspect-signed SIGNED SOURCE_PUBLIC MASTER_PUBLIC`.

**Critical:** Even two valid signed bytes produce only
`TWO_ORIGINAL_SIGNATURE_BYTES_VERIFIED_MEMBERSHIP_STILL_INACTIVE`.
QL-368 does not write an enrollment receipt or mark `active=true`: the later
privileged enrollment review must independently check actual MFA AAL2 on both
original accounts, pinned signer custody, non-replay, and original owner
decisions before considering a one-time membership write. In particular,
QL-368's enrollment evidence is **not** a QL-366 private TEST permission.

## Acceptance

- Existing required release gate suite stays unchanged and fail-closed.
- Owner UI tests cover signed-out, unrelated identity, pending enrollment,
  AAL1 challenge, AAL2 verified and MFA errors.
- MFA unit tests cover no factor, unverified factor, fresh challenge, failed
  Auth endpoint, malicious QR URL and malformed code.
- Original-owner source and master signed receipts are not fabricated by CI.
- The Windows CI job executes offline signature and original-host rejection
  tests; no CI worker can sign an owner approval or modify Supabase.
- Verify exact final `main` commit, protected checks, Cloudflare Worker build,
  public asset SHA parity and Supabase RLS/owner HOLD status separately.

References:
- [Supabase MFA guide](https://supabase.com/docs/guides/auth/auth-mfa)
- [Supabase password recovery](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail)
- [QL-367 owner portal](./QL-367_REE_JACK_MASTER_AUTHENTICATION_PORTAL.md)
- [QL-366 owner policy](../handoffs/QL366_ROSEVEAR_CREATIONS_OWNER_CONTROLLED_TEST_ONLY.md)
