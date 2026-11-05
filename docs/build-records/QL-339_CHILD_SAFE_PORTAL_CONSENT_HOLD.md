# QL-339 — Child-safe client portal and consent-aware journey receipts

**Release definition:** source code + private Supabase migration + public read-only operator
visibility. **Actual connectivity:** `DISCONNECTED / HOLD`. Nothing in this build is a live
client portal or a production-activated service. **No calls, SMS, emails, exports, device
commands, customer rows, or automated customer case transitions occur.**

## What is genuinely installed

- The disabled-preview operator Connections screen includes a clearly marked QL-339 panel
  covering the four distinct business application ownership/tenant boundaries.
- `runtimes/client-portal/journey.mjs` is a **Node-only private library**, not a Cloudflare
  Worker endpoint or an already-running server. It inspects exact signed TEST-only metadata,
  separately verified original issuer/owner grants, consent, private child delegation, session
  and role revocation, bounded receipt expiry, and consent-revocation events. Unknown payload
  fields and direct PII are rejected; no customer record is copied from the source system.
- `public.master_client_portal_journeys_ql339` stores only minimal signed event/consent hashes,
  opaque subject/case references, exact shell/tenant/child ownership, a HOLD state, and a
  retention expiry. Append-only trigger, FORCE RLS, and revoked `anon`/`authenticated` grants.
  Source customers, login identities, consent text, and message content remain at their
  original application.
- The transaction wrapper performs exact-scope parameterized reads with retention expiry;
  any export/deletion request remains an owner-held workflow, even with permission present.
  **Expiry blocks reads; physical erasure/retention cleanup is not scheduled or enabled here.**
- Tests cover cross-shell/child/subject refusal, unverified signer, session/role/consent
  revocation, expired proofs, duplicate events/nonces, export refusal, and the HTTP-403 HOLD.

## What is not yet installed or authenticated

- No source-app portal identity federation, real source case event producer, independently
  signed source owner consent, approved TEST workload, broker endpoint, live data read, nor
  continuous reconciliation scheduler.
- The private Windows relay is not installed/running on the Rosevear AI Hub; Comms Hub is a
  Cloudflare Worker disabled-preview UI plus private metadata in the Supabase cloud. The
  Node-only private runtime must be deployed and authenticated separately before TEST events.
- The database starts with **zero** QL-339 customer/portal receipts; synthetic test signatures
  are not original-issuer trust evidence. QL-266/QL-338 `DISCONNECTED` is accurate.

## One pilot at a time: owner setup sequence

1. In **AI Data Platform** and **Comms Hub** owner I.T. pages, select **TEST / read-only**
   and review the exact workload, source app, tenant, authorized operation, intended expiry,
   independently pinned original signer and separate witness. Do not activate any live
   messaging, broad credentials, or customer record transfers. The source owner and Comms
   owner must authenticate their actual approvals in their own access control; a local test
   fixture or a ChatGPT statement is not an owner signature.
2. Set up the genuine server-to-server private runtime and secret custody with scoped
   workload identity and HTTPS. The currently deployed public Worker does **not** host this
   Node runtime. Prove `/health`/`capabilities` from source to destination and back with
   short-lived, signed TEST receipts. Verify original issuer, source tenant/child, audience,
   signer key and expiry. Only a separately witnessed test may move one source out of HOLD.
3. For the **Windows AI Hub**, on the actual Windows mini-server open a PowerShell session
   in the checked-out `rosevear-ai-hub` repository. Check `git status`, then run the repository's
   read-only `scripts/inspect-ql338-hub-readiness.ps1`. Review startup task, backend loopback
   port 8765, Tailscale/private TLS, identity/cert custody and recovery plan. We cannot
   remotely attest to that physical machine by merging GitHub code. Share **sanitized results
   only**; never paste private IPs, tokens, keys, usernames or device certificates into chat.
4. **Business pilot:** on one original source app, verify an authenticated owner/child grant,
   an unrevoked session, explicit event-specific consent, privacy/retention policy and
   independently signed minimal source receipt. Perform wrong-tenant/child/role denials and
   revocation/expiry replay. Accept one **TEST HOLD** event if and only if all original issuer
   proof checks succeed; Comms still must not send communications or export customer records.
5. Repeat the independent enrollment for iCamp, Rosie Dazzlers, and Devil n Dove only when
   the first end-to-end authenticated pilot has an operator witness. Do not combine a global
   customer table across businesses. Turn on retries, expiry, retention erasure and service
   notifications only after a separate, reviewed production/privacy approval.

**Immediate owner action:** run the Windows read-only inspection and supply a sanitized
status showing whether the startup task, local backend and private network are working. At
the same time, choose one AI Data Platform ↔ Comms Hub TEST-only cloud handshake for the
first trusted cross-app source. No new physical mini-server purchase is needed.

**References:** [AI Hub QL-338 source and diagnostic](https://github.com/RosevearCreations/rosevear-ai-hub/blob/main/scripts/inspect-ql338-hub-readiness.ps1),
[Comms Hub integration queue](../QL-331-340-AUTONOMOUS-INTEGRATION-DEEP-DIVE-QUEUE.md),
[GitHub Actions](https://github.com/RosevearCreations/rosevear-comms-hub/actions),
[Supabase row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security).
