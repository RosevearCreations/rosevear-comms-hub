# QL-369 — Authenticated Owner Enrollment Ceremony, Server-Side MFA Enforcement & One-Time Activation

**Organization:** Rosevear Creations. Two and only two original human owners:
Ree (`source`) and Jack (`master`). They authenticate separately; the
organization is NOT a shared login. **No activation is seeded by this build.**

## Deployment boundaries

- [QL-368 original signed evidence](./QL-368_DUAL_OWNER_MFA_SECURE_RECOVERY.md)
  is retained unchanged and still begins on Ree's original Windows PC.
- Supabase Edge Function `ql369-owner-enrollment` is deployed with
  `verify_jwt=true`, fixed Worker origin and no browser-visible admin key.
  The Edge Function calls Supabase Auth `/auth/v1/user` to validate the
  access token. AAL2, `session_id`, real Auth UUID, issuer and token expiry
  are checked before any request can enter the privileged RPC.
- `public.ql369_record_original_owner_mfa` and
  `public.ql369_activate_original_dual_owner_once` are EXECUTE-only to
  `service_role`; authenticated browser users receive **no direct RPC or
  table-write grant**. The original signed packet is verified by the server
  using the exact pinned Ed25519 public key bytes and its 24-hour scope.
- Postgres independently rechecks `auth.sessions` AAL2, original user UUID,
  a verified TOTP `auth.mfa_factors` record, and active/unrevoked session;
  ignores browser-provided metadata. Each original owner has a separate
  short-lived **30-minute**, intent-bound attestation.
- **QL-368 evidence-only signatures cannot activate membership.** After
  their verification, QL-369 requires a NEW source-owner and master-owner
  signature over an explicit one-time activation decision, bound to the exact
  original evidence SHA-256 and a one-hour decision window.
- The privileged transaction locks Rosevear Creations, rejects repeats,
  enforces exactly two inactive original owner principals/memberships,
  and preserves six separate `DISCONNECTED / HOLD` shells. It writes one
  private immutable-eligible activation receipt and security audit, then
  activates only the **two master owner records**. No shell grants, child
  tenants, source transports, receivers, private TEST, customer messages,
  devices or payments are enabled.
- Failed or incomplete ceremonies remain on HOLD. No tests may invent real
  owner signatures, authenticated AAL2 sessions or activation receipts.

## Ree and Jack — first genuine enrollment (only after GREEN deployment)

1. On Ree's original PC, open a current trusted Comms Hub checkout and the
   existing QL-368 original-device CLI instructions. Confirm the two
   Supabase Auth user UUIDs, then prepare **one** enrollment intent:

   `node runtimes/hub-relay/ql368-owner-enrollment-cli.mjs --prepare SOURCE_AUTH_UUID MASTER_AUTH_UUID NEW_INTENT`

   The intent lasts 24 hours. Securely share **the SHA-256 digest and intent
   JSON** with Jack. These are not passwords.
2. On their own original Windows machines, Ree and Jack inspect and sign the
   exact same intent with the original encrypted Ed25519 private key using
   QL-368 `--inspect` / `--sign`. Each enters their own key passphrase locally.
   Never paste a key, password, authenticator secret, token or private signed
   content into ChatGPT or GitHub.
3. Ree safely receives Jack's **QL-368 evidence-only** approval and original
   **public** candidate file; Ree assembles QL-368 evidence with `--assemble`
   and confirms `--inspect-signed`. **These approvals still cannot activate a
   membership.** No private key is copied or uploaded.
4. Ree runs the NEW QL-369 original-device tool to prepare a one-hour,
   **explicit membership activation** intent, bound to the signed QL-368
   evidence packet:

   `node runtimes/hub-relay/ql369-owner-activation-cli.mjs --prepare QL368_SIGNED SOURCE_PUBLIC MASTER_PUBLIC NEW_ACTIVATION_INTENT`

   Both owners independently review that same file/hash (`--inspect`) and
   separately sign the **ACTIVATE_ONLY_TWO_OWNER_MEMBERSHIPS** decision
   (`--sign`), interactively on their respective original computers. Ree
   combines the two *new* approvals using `--assemble`, then confirms
   the final packet with `--inspect-signed`. Run `--help` for exact arguments.
5. Ree opens the [Master Owner Portal](https://rosevear-comms-hub.devilndovelive.workers.dev/#/master)
   on Ree's PC, signs in as Ree and verifies a fresh authenticator TOTP code
   until **MFA verified (AAL2)** appears.
6. Jack opens the same portal on Jack's *separate* laptop, signs in as Jack
   and independently completes an AAL2 authenticator challenge.
7. Within 30 minutes of intended activation, each owner types or pastes the
   exact same prepared **QL-368 intent SHA-256** into **Verified owner
   enrollment ceremony** and clicks **Verify my current MFA session with the
   server**. A displayed short-lived receipt means *that one account* is
   attested; it does **not** mean either membership is active.
8. On Ree's MFA-verified portal, choose three JSON files:
   **QL-369 assembled signed activation packet**, **Ree's original public candidate**, and
   **Jack's original public candidate**. Read the confirmation and explicitly
   click **Review and activate TWO owner memberships once**. This is the
   only possible enrollment write route; it cannot run unattended.
9. The portal re-reads Ree's active membership under self-only RLS. Jack
   independently refreshes his portal to verify the matching result. Check
   Supabase's private activation receipt and the six unchanged HOLD states.

If an owner session is AAL1, a factor is unverified/revoked, the 30-minute
attestation expires, a signature or public file differs, or any receipt was
already used, **start over with a fresh, deliberately approved intent.**
Never bypass the MFA or signature check to clear an error.

## Acceptance / safety tests

- Ed25519 test-generated source/master keys verify only under their matching
  test pins; production original pins reject test keys.
- Wrong owner, changed UUID, swapped public file, expired intent, changed
  privilege field, missing signer and malformed upload are denied.
- Browser receives only owner-scoped Edge calls. No browser service-role key,
  `.from()` mutation or privileged PostgREST RPC is introduced.
- Migration leaves membership and principal rows inactive until a valid
  server-only transaction. Even successful activation keeps all six apps on
  `DISCONNECTED / HOLD` and all prior original issuer and TEST-specific
  independent approvals separate.
- Production GREEN requires App CI, Windows key custody, Cloudflare Worker
  and exact public JS/CSS SHA-256 parity. Authenticated owner activation
  itself requires the future *human* ceremony above, not CI.

Official references: [Supabase MFA and AAL](https://supabase.com/docs/guides/auth/auth-mfa) ·
[Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) ·
[Edge Function authentication](https://supabase.com/docs/guides/functions/auth).
