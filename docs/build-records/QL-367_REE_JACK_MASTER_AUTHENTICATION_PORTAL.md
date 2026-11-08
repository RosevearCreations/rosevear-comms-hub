# QL-367 — Ree & Jack Master Authentication Portal

## Scope

This is the first **real, personal Supabase Auth sign-in** for Rosevear
Creations. It is not enrollment activation, private TEST authorization or a
claim that the six source connections are live.

- **Master organization:** `rosevear-creations` — not a third human or shared
  password account.
- **Ree:** original `source` owner; individually signed-in Auth UUID is checked
  against the exact `master_principals.user_id` and owner membership row.
- **Jack:** original `master` owner; checked the same way using his own Auth UUID.
- Both actual rows are currently `active=false` and lack original signed
  enrollment receipts. Successful authentication shows **PENDING**; it does
  not change these records or grant an operator session.

## Owner sign-in link

https://rosevear-comms-hub.devilndovelive.workers.dev/#/master

1. Open the link in Ree's browser or Jack's own browser. Use each owner's
   existing email/password in the **Master Owner Portal**. No shared credentials.
2. The browser verifies the Auth token with `supabase.auth.getUser()`, then
   reads only the exact signed-in UUID's `master_principals` and
   `master_organization_owner_memberships` records under RLS.
3. Look for **Authenticated: Ree** or **Authenticated: Jack** and **Pending
   original-owner approval**. The pending status is expected in QL-367.
4. Use the **Sign out** button after checking. Do not enter passwords, private
   keys, original signing receipts or OTPs into GitHub or ChatGPT.

The existing public disabled preview remains at the URL without `#/master`.
The separate GitHub Pages disabled-preview workflow explicitly disables owner
login; do not mistake that separate preview for the production portal.

## Security restrictions preserved

- Browser config uses only the known Supabase project URL and a **publishable**
  API key. No service-role or original owner signing key is bundled. The Auth
  client does not enable Supabase customer/reference reads.
- The new SELECT-only RLS policies expose only **the current Auth UID's own**
  principal and owner membership, including an inactive enrollment status.
- No browser policy allows database writes or self-activation. All six shell
  connections remain `DISCONNECTED / HOLD`, with no child-tenant or customer
  grant, no private source GET and no persistent operations.
- Invalid credentials, unverified Auth sessions, unrelated/incorrect UUIDs,
  missing owner rows, mismatched organization membership, RLS errors, missing
  enrollment signatures and partial activation all fail closed.
- The owner portal deliberately does not render the operator control shell,
  even after a future enrollment. QL-368/369 must separately authorize it.

## Verification and deployment boundaries

Check `app/src/auth/__tests__/ql367OwnerIdentity.test.ts` and required App CI.
Verify the two original accounts' genuine first sign-ins separately on their
own devices. CI uses fixtures only and cannot substitute for owner sessions.

GitHub `dev`/`main` GREEN certifies code gates, not two live signed-in owners,
signed enrollment receipts, or working six-source connections.

Reference: [QL-366 dual-owner TEST-only policy](../handoffs/QL366_ROSEVEAR_CREATIONS_OWNER_CONTROLLED_TEST_ONLY.md).
