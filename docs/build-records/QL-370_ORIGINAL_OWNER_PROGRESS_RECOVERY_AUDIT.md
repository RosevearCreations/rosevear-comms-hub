# QL-370 — Original Dual-Owner Progress, Safe Ceremony Recovery and Limited Audit

## Scope and unchanged trust boundaries

This release adds **read-only owner enrollment visibility**, not an enrollment shortcut. Ree and Jack continue to use **separate original Supabase Auth identities**, separate TOTP multi-factor authentication (MFA), the original Windows-held signing authorities and separately signed QL-368/369 packets. Original owner membership is activated only by the existing QL-369 server transaction after the independently verified, explicitly signed packet is submitted. Neither a status refresh nor clearing browser selections signs, approves, revokes, recovers, activates or connects anything.

The six application shells stay `DISCONNECTED / HOLD`: iCamp, Yard Workers, Devil n Dove, Rosie Dazzlers, AI Data Platform and Rosevear AI Hub. Owner membership is not permission for private TEST, customer operations, child-tenant access, SMS, email delivery or any peer integration. Each remains under its own independent source trust and acceptance gates.

## Original-owner use

1. Open the deployed Comms Hub Master Owner Portal at `/` → `#/master`, with the individual **Ree** or **Jack** Supabase login; do not use a shared organization account.
2. Complete the TOTP authenticator challenge so the **current Auth session reaches AAL2**. A signed-in password-only AAL1 session cannot request this protected server snapshot.
3. Open **Our enrollment progress**. Refresh server status to view the current owner enrollment and the other original owner's *redacted* matching attestation state.
4. To compare attestations for a specific ceremony, enter the **exact 64-character SHA-256 intent** from Ree's original Windows-device QL-368 intent. The UI never displays the hash; the server reads only attestations matching that exact hash. Without the hash, both attestation cards are intentionally not compared.
5. Review own and peer attestation states: `NOT_RECORDED`, `CURRENT`, `EXPIRED` or `REVOKED_OR_STALE`. A `CURRENT` attestation is bound to that owner, their original Auth session and verified TOTP factor, the matching intent and its remaining 30-minute window. It is **not** proof of offline approval or of a second signature.
6. Check the membership count, server receipt and limited activation audit. Before the original dual-signed activation packet is accepted, the dashboard must show **0/2 active**, no one-time activation receipt and no verified activation audit event. `Original offline decisions` remains **not observable until final signed submission**; do not infer a signature from a user login, SHA or attestation.
7. If the interrupted ceremony has expired, verify the **QL-368 evidence 24-hour window**, **QL-369 activation decision one-hour window** and **QL-369 MFA attestation 30-minute window** on the original devices. Obtain fresh evidence/signatures where required. Only Ree can explicitly submit the final separately signed packet from the source-owner authenticated session.
8. The **Clear this browser's ceremony selections** button only clears current local text inputs and file selections. It does **not** recover an account, invalidate a session, delete database evidence or restart the server ceremony. For actual account/password recovery, use QL-368 email recovery and repeat genuine TOTP MFA independently.

## Server trust and privacy controls

- The existing `ql369-owner-enrollment` Supabase Edge Function retains `verify_jwt=true`, exact same-origin CORS, a current `/auth/v1/user` check, JWT `aal2`/session/issuer/audience/expiry validation, request size controls and fail-closed errors. `status` adds a strictly exact-shape action; QL-369 `attest`/`activate` calls are unchanged.
- A separately permissioned PostgreSQL function `public.ql370_get_original_owner_progress` is executable by **`service_role` only**. `PUBLIC`, `anon` and `authenticated` have no execute privilege. The browser calls only the verified Edge Function, never privileged RPC or private database tables.
- The database rechecks that the authenticated user/session belongs to one of the **two original hard-pinned owner UUIDs**, the current Supabase session has `aal2`, the bound TOTP factor is verified, the account is confirmed and not banned/deleted, and the original principal/membership topology has not drifted. The peer's recorded attestation is also rechecked against its *own* verified current session and factor before `CURRENT` can display.
- The JSON is deliberately small and redacted: only owner role, active membership counts, matched intent attestation state/expiry, organization enrollment state, all-six HOLD counts, recorded activation time/event count and snapshot time. It contains no emails, UUIDs, tokens, factor or session IDs, secrets, signing material, offline packets, source receipts, IPs, raw digests, private TEST authorization or customer data.
- Audit visibility includes only the one immutable **QL-369 dual-owner activation receipt**, and the corresponding original-source-owned audit action, if recorded. It is **not** a complete sign-in-failure or security event log. Postgres service-only readback, UI contract validation and deliberate redaction preserve that distinction.
- All six shell counts must remain in the database-enforced `DISCONNECTED / HOLD` state. A drift makes the dashboard visibly warn and recovery guidance stop; it never attempts to repair protected state automatically.

## Verification and promotion evidence

- Negative-access tests cover AAL1/no MFA, revoked factors and sessions, unknown original owner/role, wrong SHA and extra response fields, direct browser RPC bans, no mutation SQL, and safe local-only reset.
- Required baseline and Windows CI must include the QL-370 protection test alongside all original QL-336A gates. `npm run check` and the existing operator data-access/sink inventory remain mandatory.
- Real authenticated AAL2 positive readback and actual signed dual-owner activation **cannot be simulated in CI**. Those require Ree and Jack to independently complete the original sign-in/MFA/approval procedure on their devices. The build must never manufacture security evidence or declare the ceremony complete based on a successful deployment.
- Production GREEN means source builds and required deployment checks passed. It does **not** assert that two human owners enrolled or that any of the six application HOLD restrictions were lifted.

### Primary references

- Existing trust/activation implementation: `supabase/migrations/20261108133530_ql369_authenticated_mfa_owner_activation.sql`, `supabase/functions/ql369-owner-enrollment/index.ts`, `docs/build-records/QL-369_AUTHENTICATED_DUAL_OWNER_ENROLLMENT_CEREMONY.md`.
- Supabase user authentication for Edge Functions: https://supabase.com/docs/guides/functions/auth-headers
- Supabase Auth MFA assurance levels: https://supabase.com/docs/guides/auth/auth-mfa
