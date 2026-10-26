# QL-208 — Secure Provider Webhook & Messaging Gateway Sandbox

Release marker: `ql208-secure-provider-webhook-gateway-sandbox-mock-v1`

## Outcome

The Connector centre now shows a per-company interactive rehearsal for fictional incoming provider notices and outbound delivery denial. The UI is consciously **not** a webhook receiver or cryptographic verifier. It uses canonical fictional QL-200–203 handoffs, QL-206 proposed role/tenant/property checks, and in-memory receipts. The browser can project the consequences of repeated IDs, bad signatures, stale timestamps, cross-company/tenant/property routing, unknown sources, and forbidden sending. Role switching filters visible receipts; switching company clears the rehearsal.

An independently testable Node-only gateway in `scripts/ql208-provider-gateway-sandbox.mjs` implements the mock verifier. It generates fresh 256-bit HMAC keys for the four companies, binds signature to an exact invented envelope and minimal UTF-8 body, checks timestamp freshness, matches fictional tenant/property scope, rejects unrecognized/held fixture IDs, uses constant-time digest comparison and stores one event-ID receipt in memory. Exact retries and even newly signed event-ID collisions are rejected. An outgoing request always returns `DENIED_OUTBOUND`.

## Explicit boundaries

- **No actual provider signature verified.** The HMAC format is invented; this is not Twilio, Telnyx, VoIP.ms, Bell, another carrier or email provider integration. No real provider secret exists in the app or scripts.
- **No network receiver or callback.** The Node mock is a plain in-process function with no HTTP listener. The browser UI only projects test outcomes; it never stores signing keys or attempts verification.
- **No outbound queue or delivery.** SMS, MMS, telephone calls, emails, IVR responses, automatic replies and dispatch remain disabled. No live customer data is read or written.
- **No database persistence.** Receipt deduplication and the browser review list live in process memory only. QL-207 did not enable any real Supabase migration, and this build does not change one.
- **No verified operator authentication.** Fictional persona/tenant/property matching is not an access token, real user membership or a grant.
- Only known fictional identifiers, event IDs, tenant IDs and review statuses are retained; no message bodies, names, phone numbers, audio or credentials in receipts.

## Verification

Run the isolated HMAC/nonce tests with `node scripts/__tests__/ql208-provider-gateway-sandbox.test.mjs` from the repository root. Run the UI tests from `app/` with `npm test -- --reporter=dot`, plus `npm run check`, `npm run build`, and `npm run pages:build`.

Before any private real-world pilot, implement a selected provider's **official** signature/authentication method server-side with protected secrets; verify authenticated tenant/organization ownership from trusted claims; enforce request size, timestamp, rate limits, privacy/consent and retention; use atomic durable idempotency; test concurrency and failure handling; obtain explicit owner approval. None of these gates is satisfied by the mock.

Next expected: **QL-209 — Reports, Analytics & Cost Controls**: fictional, per-company communications volume, response workflow performance, preview provider cost estimates and budget warnings, with no live provider billing or customer-data ingestion.
