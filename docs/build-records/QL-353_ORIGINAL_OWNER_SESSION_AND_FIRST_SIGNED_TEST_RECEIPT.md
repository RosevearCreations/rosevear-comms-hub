# QL-353 — Original-owner enrollment verification, private operator session and first signed TEST receipt

**Software release scope:** independently check original-owner database enrollment, build a genuinely server-verified private session interface, and reconcile a single original Windows signed TEST receipt using the existing QL-342 verifier. **No original approval is minted, no credentials are generated, and no connection is activated.** GitHub `main` GREEN means this code passed its gates, not that the six apps became connected.

## What we already proved in the field (November 6, 2026)

Ree's original Windows computer `DESKTOP-AE894KC` successfully staged, validated and started the QL-352 separate Caddy transport on Tailscale `100.77.246.3:8443`; the original LAN Caddy at `192.168.68.74:8443` remained running. Jack's separate laptop **Templar** reached TCP `8443` (`TcpTestSucceeded=True`) and verified manual HTTPS (`HTTP=503 TLS_VERIFY=0`). `503` is the intended **unauthenticated HOLD** response. Ree then used the exact QL-352 `-Stop` command: `QL352_TAILNET_GATEWAY_STOPPED_ORIGINAL_LAN_PRESERVED`, with Tailnet listener OFF and LAN listener still running. This is genuine network/certificate evidence, **not a signed device or application handshake receipt**.

At the beginning of QL-353, an authorized **read-only** Supabase management query for project `gxujcwpktaickcgzyvnu` observed:

| Independent item | Observed value |
| --- | ---: |
| Original device enrollments | 0 |
| Original device revocations | 0 |
| Original signed relay receipts | 0 |
| Six peer rows still HOLD | 6 |
| Dedicated `ql340c_private_receiver` login | `NOLOGIN` |

The database has **not** received original enrollment authority. No application source permission is implied by an HTTPS test or public build. **Do not use the database management account as a substitute for the deliberately non-login receiver role.**

## Exactly where to work

| Device/application | Place | What to do |
| --- | --- | --- |
| Comms Hub frontend | **I.T. → Connections → Connections · six apps → QL-353 original-owner guide** | Review six held sources and the required proof chain; public disabled preview cannot grant access. |
| Ree's server `DESKTOP-AE894KC` | PowerShell in `C:\Users\ree\rosevear-comms-hub-ql340` | Original evidence presence and listener check; later supervised, explicit owner ceremony only. |
| Jack's laptop `Templar` | PowerShell in `C:\Users\jfros\rosevear-comms-hub-ql340` | Independent master-key custody and original issuer decisions; private keys remain on Jack's device. |
| Supabase project `gxujcwpktaickcgzyvnu` | Database / SQL Editor — private authorized administrator only | Verify exact enrollment/receipt table state and role permissions. Only an independently authorized process may persist reviewed originals. |
| Tailscale admin | **Access controls → Tests** | Preserve Jack → Ree `tcp:8443` ALLOW and `tcp:8788` DENY. No new broad grants. |
| AI Data Platform, Devil n Dove, Rosie Dazzlers, Yard Workers and iCamp | Their shell-level connection evidence areas | Remain on HOLD until the Hub proves one original receipt and each independent source TEST. **No repo changes in QL-353.** |

## Step-by-step owner handoff

### A. Read-only original Windows check — Ree

1. Confirm the checkout is clean and `main` has the exact newly promoted release. If clean, use the normal `git fetch origin` and `git pull --ff-only origin main` workflow. Never discard unrelated edits.
2. In the same PowerShell directory, run:

   ```powershell
   powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\runtimes\hub-relay\ql353-windows-original-readback.ps1 -Status
   ```

3. This reports presence of the original source/master/device **public candidate** files, independently signed enrollment file, approved public pins, DPAPI-encrypted private DB credential and local listener states. It **does not open or export keys, authenticate the issuer, insert enrollment or sign a TEST**.
4. If `originalSignedEnrollmentPresent` or `approvedPublicPinsFilePresent` is false, stop live-enrollment work. Complete the existing original QL-340B source/master decisions independently; do not synthesize approval flags or have one person sign for both.
5. The existing QL-351 and QL-352 manifests are pinned to their previous exact checkout SHA. Updating to QL-353 can **intentionally invalidate their old `-Validate`/`-Readback` provenance**. Do not delete or silently overwrite them. New activation requires an owner-supervised release-to-process reconciliation in a subsequent explicitly authorized procedure.

### B. Independently review original authority — Ree and Jack

1. Ree keeps her encrypted original **source** signing key on Ree's machine. Jack keeps the independently created encrypted original **master** signing key on Jack's laptop. Copy only the approved **public** candidates and independently reviewed nonsecret witness digests.
2. Compare the original device public candidate, both distinct owner keys and four original Windows/TLS/Tailnet/rollback witness bytes. The prior QL-344 readback had `ORIGINAL_BYTES_MATCH_REVIEW_DUAL_OWNER_DECISION_STILL_HELD` and **not** issuer approval.
3. A correctly verified Let's Encrypt certificate chain is TLS proof, **not** third-party original issuer authentication and not an owner decision.
4. The prior inert rollback drill was **not a real receiver stop**. QL-352's valid Tailnet gateway stop was **not a stop of the separate receiver on `8788`**. Neither should be relabelled as an original active receiver stop witness.
5. The QL-340B enrollment request expires after approximately 20 minutes. Recreate a fresh **original, reviewed** request at ceremony time; do not reuse yesterday's expired request or alter timestamps.

### C. Database authority — separate owner/admin decision

1. The existing database schema already has an append-only original enrollment table (`master_hub_device_enrollments_ql339b`), a revocation table, the relay receipt table and six held peer records. QL-353 **does not create a new table, widen RLS, create a role login or grant service_role access to clients**.
2. A dedicated original database custodian must independently verify both Ed25519 owner signatures, original device/public pin, expiry, original issuer review and physical witnesses **before authorizing a database enrollment transaction**. A row count or copied JSON file is not sufficient by itself.
3. The existing limited `ql340c_private_receiver` role is `NOLOGIN`. An authorized credential and original-host custody decision are still missing. QL-353's server-side verifier will refuse the `postgres` management role in place of this limited reader.
4. No database modification is made by this build. If the authorization remains missing, keep `databaseEnrollmentVerified=false` and all six peers on HOLD.

### D. Private operator session and exactly one signed TEST

1. The new server-only module `runtimes/hub-relay/ql353-original-owner-session.mjs` accepts **only** an externally issued opaque 256-bit session, looked up in a server-side session store. It requires an independent original issuer and dual-owner verifier, an original Windows host binding, an expiry window no longer than five minutes and revocation/replay checks.
2. The session is transmitted as a `Secure`/`HttpOnly`/`SameSite` `__Host-rosevear-ql353` cookie **only after** a separately authorized issuer provisions one; QL-353 itself does not issue a cookie or accept a browser-entered approval. Changing a user-editable browser claim cannot grant access.
3. `ql353:status` is a **GET-only** private loopback readback. It has no CORS allowance, no public login, enrollment or POST mutation route. QL-352's production Caddy remains **deny-all** and is deliberately **not** rewired to this service until an original owner independently approves that step.
4. The database verifier must independently observe one correct `REVIEWED_TEST` original device enrollment, **zero revocations**, **exactly one** immutable device TEST receipt, all six held peers and the correct limited reader role. It then invokes the existing QL-342 Ed25519 and signed receipt verifier against the original packet and owner decision.
5. Only `ONE_ORIGINAL_SIGNED_TEST_RECEIPT_INDEPENDENTLY_VERIFIED_STILL_HELD` reflects that combination. It explicitly retains `sourceTestAuthorized=false`, `connectedCount=0` and `connectionState='DISCONNECTED / HOLD'`.
6. Each application gets its own later one-at-a-time, independently authorized source handshake and durable witness. Neither the first device receipt nor a GREEN software release enables customer messages, data sync, equipment actions, or unattended retries.

## Acceptance and rollback

- Node tests verify honest zero-enrollment HOLD, rejects wrong DB role, original revocation, two receipts, missing owner decision, forged session cookies, CSRF replay, stale sessions, host/origin spoofing and all six peer status mismatches.
- Windows CI runs only the **read-only** `-Status` command on a non-original runner; it cannot use original owner keys, reach the private server, enroll an owner, or activate the receiver.
- The 43 pre-consolidation application gates remain unchanged. New checks run in addition.
- If an authenticated private operator service is later started under separate approval, stopping only that exact new loopback process is its own field handoff; QL-353 does **not** alter, restart or stop the already safe LAN Caddy or QL-352 Tailnet gateway.
- No changes are made to the other five source repositories. Future builds should consume this original private readback through source-scoped shell capabilities, not overwrite another application's work.

## Sources

- [Original QL-339B enrollment migration](../../supabase/migrations/20261105183936_ql339b_private_device_enrollment_and_revocation.sql)
- [QL-340C limited receiver role](../../supabase/migrations/20261105235404_ql340c_private_receiver_role_and_rls.sql)
- [QL-342 exact-one original signed receipt verifier](../../runtimes/hub-relay/ql342-owner-decision.mjs)
- [Supabase: Choose a safe server-side database connection](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Supabase: Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
