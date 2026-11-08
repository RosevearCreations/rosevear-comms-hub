# QL-371 — Guided Original-Owner Checklist, Expiry Warnings & Accessible Handoff

## What changed

The Rosevear Comms Hub **Master Owner Portal** now places a seven-step
guided checklist below the existing QL-370 protected read-only enrollment
snapshot. It is **presentation and instructions only**, not a new Auth, SQL,
Edge, enrollment, signature, TEST or application-connection procedure.

The checklist clearly distinguishes **Server verified**, **Original-device
review**, **Not yet server verified**, and **Renew or recheck**. It cannot
mark an offline QL-368 evidence-only signature or a separate QL-369 activation
signature as verified just because a browser is authenticated or an intent
hash was entered. Those original-device signatures are only validated
retrospectively by the *actual original* atomic QL-369 server activation and
its matching private one-time receipt and security audit.

## Guided sequence for Ree and Jack

1. **Ree's original Windows computer:** create and inspect the QL-368
   original evidence intent, then both owners separately inspect/sign it on
   their own original devices. Original evidence has a **24-hour** window.
2. **Both original devices:** separately review/sign the *new, explicit*
   QL-369 owner-membership-only activation decision. Its window is **one hour**.
   The earlier QL-368 evidence-only approvals are NOT activation approvals.
3. **Their separate Comms Hub accounts:** Ree and Jack each sign in, complete
   their own authenticator challenge, and verify their current AAL2 session.
4. **Same original intent:** enter the exact SHA-256 from the offline intent
   in the existing QL-369 form. A hash is *not* approval or proof the offline
   24-hour evidence is current.
5. **Own attestation:** each owner deliberately invokes the unchanged
   QL-369 MFA attestation. The server grants no longer than **30 minutes**.
6. **Peer attestation:** check the other original owner's separate, matching
   still-current attestation through the redacted server snapshot.
7. **One-time membership activation:** only Ree may review the three original
   JSON inputs and explicitly submit the original signed packet. Postgres and
   Supabase Auth independently verify the genuine two-identity, two-factor,
   two-signature requirements. Check that both owner memberships are recorded
   and **all six application shells remain `DISCONNECTED / HOLD`**.

Every actual write continues through the previously reviewed QL-369 action.
QL-371 adds zero new server endpoints, tables, migrations, grants, write
routes, browser persistence, background signing or automatic activation.

## Expiry visibility and recovery

- The existing QL-370 redacted AAL2 status readback supplies only each
  matching MFA attestation state and expiry, plus the server snapshot time.
- The browser refreshes its **approximate countdown every 15 seconds** using
  its own clock. Warnings appear with **10 minutes** and **5 minutes** left.
  An elapsed, revoked or stale attestation is never rendered as current.
- A protected snapshot more than **two minutes old**, an incorrect local
  clock, a missing expiry or a drifted original-owner receipt forces
  **refresh/review**. The client never claims to extend a timer or renew MFA.
- No countdown is offered for the original **24-hour evidence** or
  **one-hour signed activation decision** because those windows have no
  independently validated timestamps in the public browser contract. Their
  true expiry must be checked by the *original signer* and the final QL-369
  server validation. Do not estimate or self-certify them in the UI.
- If the ceremony is interrupted, reopen each owner's personal portal,
  complete current MFA if necessary, re-enter the same valid original intent
  and use **Refresh server status**. If the offline packet has expired,
  prepare and independently sign **fresh** original evidence.

## Accessibility and safe handoff

- Semantic, numbered `<ol>` checkpoints use visible text labels for their
  statuses, with `aria-current="step"` identifying a pending action when
  possible. Time urgency is visible in words, not colour alone. Focus styles
  and minimum 44px touch target support keyboard and mobile use.
- **Share safe instructions with the other owner** reveals a selectable,
  read-only text note and a user-clicked **Copy safe handoff instructions**
  action. If clipboard access is unavailable, select and copy the note.
  The generic note contains **no original hash, signature, account email,
  token, Auth/session/factor ID, private key, passphrase, signed packet or
  live progress**. It grants no authorization or connectivity.
- Original sensitive evidence remains with the trusted Windows-device
  procedure; QL-371 never places original signatures into ChatGPT, GitHub,
  shared clipboard material or another application's chat window.
- The screen retains the QL-370 **Clear this browser's ceremony selections**
  option. Clearing local input does not revoke Auth evidence, create offline
  signatures or change server membership.

## Release verification

- Vitest pure logic tests: expiry thresholds, local clock skew, stale
  snapshots, previously expired/revoked factors, unchanged offline steps,
  original activation receipt and audit coherence, original owner role
  separation, six-application HOLD.
- React/DOM tests: semantic seven-step checklist, visible deadline warning,
  lack of phantom AAL2 verification, copy-safe handoff, exactly one existing
  QL-370 `status` readback, no browser activation.
- Node security tests: zero new database mutations, privileged RPC or
  network operations; original QL-369 JWT AAL2 enforcement remains intact;
  Windows negative-access checks and unchanged 43-gate QL-336A fingerprint.
- The complete app tests, type check, QL-171 browser sink inventory,
  protected `dev` and `main` PR checks, public Worker JS/CSS byte parity and
  GitHub Pages checks remain mandatory for production GREEN.

## Sources

- [QL-368 original owner evidence and recovery](./QL-368_DUAL_OWNER_MFA_SECURE_RECOVERY.md)
- [QL-369 genuine signed activation procedure](./QL-369_AUTHENTICATED_DUAL_OWNER_ENROLLMENT_CEREMONY.md)
- [QL-370 original owner status and limited security audit](./QL-370_ORIGINAL_OWNER_PROGRESS_RECOVERY_AUDIT.md)
- [Supabase MFA assurance levels](https://supabase.com/docs/guides/auth/auth-mfa)
- [Supabase TOTP authenticator flow](https://supabase.com/docs/guides/auth/auth-mfa/totp)
