# QL-188 — Server Auth, Webhook & Replay Test Harness

**Scope:** An actual **Node-only cryptographic and fake-session test harness** plus a static, synthetic-only operator explanation. **No HTTP server was created.** Nothing accepts provider webhooks or authenticates real operators, talks to a telecom provider, captures credentials, stores real events, changes Supabase, sends calls/SMS, purchases numbers, or enables a live pilot. All **12 QL-181 prerequisites remain `HELD_UNVERIFIED`**; exact-main build and preview verification must be separately recorded after promotion.

## Two strictly separated surfaces

1. **Executable server-side regression:** `scripts/ql188-synthetic-server-harness.mjs` and `scripts/__tests__/ql188-synthetic-server-harness.test.mjs`. Run `node --test scripts/__tests__/ql188-synthetic-server-harness.test.mjs`. This uses Node's built-in `node:crypto`; it does **not** start a listener. A new independent random 256-bit key is generated for each business and harness instance in memory; fake session tokens are likewise ephemeral and never checked in. The signature format is an **invented test protocol**, not any actual provider's algorithm.
2. **Browser-only explanatory panel:** **Operator workspace → Phone/SMS safety → QL-188 Server auth, webhook & replay test harness**. Select a business and one of 11 checked-in test case descriptions. This screen presents **expected dispositions only**; it does not run the crypto suite, sign a request, accept a webhook or report real authentication. It contains no signing key, session, recipient, webhook URL or token.

The `app-ci` GitHub workflow runs the Node suite on PRs and exact-main commits. The GitHub Pages preview contains only the explanatory panel. It cannot perform server-side validation.

## Isolated crypto contract (not production provider verification)

The harness illustrates `HMAC-SHA256` over a hypothetical version, business ID, event ID, timestamp and **unchanged UTF-8 raw payload**. `timingSafeEqual` compares same-length digests after strict 64-character hex validation. Each harness has a separate key per business; another harness instance cannot use those keys or session tokens. Provider algorithms and signing inputs differ; **never reuse this implementation as a Twilio, Telnyx or VoIP.ms verifier**. Official Twilio webhook validation, for example, uses the provider-specific URL, parameters and `X-Twilio-Signature` format. Prefer each chosen provider's supported validation library in a future protected server implementation.

The mock operator session is created only by the Node test fixture factory, not by a real identity authority. An event can pass the mock review only when:

1. The expected business is recognized; the current fake clock is a valid integer.
2. The opaque session token exists in the same harness instance, is within its **three-minute synthetic lifetime**, is for the expected business, and carries fictional `owner` or `admin` review capability; `staff_readonly` is denied.
3. The incoming envelope contains exactly the five expected fields, a valid sample ID, valid hex digest, nonempty raw payload and no more than **8 KiB** of UTF-8 body.
4. Signed event business matches the trusted fake session's business.
5. The signed event timestamp is within the **five-minute synthetic freshness window**, in either direction.
6. The HMAC over the **exact bytes** validates against the local ephemeral key. Tampering with body, ID, time or key fails.
7. The `(brand,eventId)` has not already been processed in this **instance-local Set**. Once accepted, even a changed-but-valid signature with the same ID is rejected.

Only the in-memory `ACCEPTED_MOCK` outcome is possible; all results include `realServerIdentityVerified=false`, `realProviderAuthenticated=false`, `dispatchAllowed=false`, `livePilotAuthorized=false`, 12 held prerequisites and zero HTTP listeners, Supabase writes, external writes, calls, messages and owner approvals.

### Negative scenarios and expected mock results

| Check | Expected result | Key lesson |
| --- | --- | --- |
| Fresh signed fictional payload + valid fake owner/admin session | `ACCEPTED_MOCK` | Test-only acceptance, never live authorization. |
| Missing, guessed, expired or future-issued fake session | `DENIED_SESSION` | Never trust a browser selection as a server principal. |
| Read-only role | `DENIED_ROLE` | A recognized user is not necessarily authorized. |
| Session brand ≠ route, or envelope brand ≠ session | `DENIED_SCOPE` | Brand boundary checked before event consumption. |
| Invalid hex/wrong signature, wrong signing key or modified raw bytes | `DENIED_SIGNATURE` / `DENIED_PAYLOAD` | Authenticate bytes/identity before applying events. |
| Timestamp too old or too far ahead | `DENIED_TIME` | Freshness check is necessary but not sufficient. |
| Repeated event ID or same ID with new valid body | `DENIED_REPLAY` | Only one in-memory acceptance per test ID. |
| Extra properties, prototype abuse, empty or too-large payload | `DENIED_PAYLOAD` | Strict parsing and size bounds. |
| Different harness instance | `DENIED_SESSION` / `DENIED_SIGNATURE` | No reused credentials or implied cross-process replay protection. |

## Not implemented; required independently for a real pilot

The preview is **not** a production-authentication implementation. This is a constrained *test harness*, not an actual auth or webhook framework. The following cannot be inferred from successful tests:

- **Real operator identity:** server-side JWT/cookie verification, MFA/session freshness/revocation, role and business authority from protected source, no `user_metadata` authorization, CSRF and IDOR checks. Supabase guidance distinguishes server-side `getClaims()` for verified identity from `getSession()` data unsuitable for authorization decisions; role/brand permissions require separate enforcement.
- **Provider authentication:** provider selection (QL-187 did not choose one), its SDK verification algorithm, canonical URL/body behaviour, timestamps/nonce where specified, account-level secret storage, TLS and rotation. No keys are provisioned or embedded.
- **Durable idempotency:** database-enforced uniqueness, atomic transactions across workers/regions, event-ID collision treatment, provider retry semantics, expired replay windows, reordered callbacks, asynchronous failure rollback and exactly-once business effects. The in-memory Set provides none of these across a restart or concurrent workers.
- **Public HTTP routing:** request method and content-type policy, maximum read sizes, rate limiting, safe response codes, logs that redact personal data, alerting, WAF, threat model, production/staging separation and incident stop switch (QL-189 scope). No route is registered in QL-188.
- **Privacy and consent:** QL-185 retention/deletion blueprint, QL-186 channel consent review, independent line ownership, Canadian communications requirements, server-brand RLS, audit review and out-of-band owner signoff. **All twelve QL-181 holds stay held.**

### References checked October 24, 2026

- [Node.js Crypto: HMAC and timing-safe digest comparison](https://nodejs.org/api/crypto.html). Timing-safe comparison alone does not guarantee all surrounding code is timing-safe.
- [Twilio official security guide](https://www.twilio.com/docs/usage/security) and [webhook security](https://www.twilio.com/docs/usage/webhooks/webhooks-security). Provider-specific SDK validation, TLS and exact signing inputs must be followed if Twilio is independently chosen.
- [Supabase server-side Auth client guidance](https://supabase.com/docs/guides/auth/server-side/creating-a-client) and [verified claims](https://supabase.com/docs/reference/javascript/auth-getclaims). No live Supabase Auth calls or schema changes in this build.

## Release acceptance

Run `npm run check`, `npm test`, `npm run build`, `npm run pages:build` in `app`; `node --test scripts/__tests__/ql188-synthetic-server-harness.test.mjs`; QL-171 baseline and its test; QL-170 release receipt tests; `git diff --check`. Review mobile/keyboard display, brand reset, malformed and forged input negative cases, crypto body-tamper/session/role/clock/replay failures, no external calls and exact branch changes. Promote feature → `dev` → `main` in two reviewed PRs, verify identical final trees and all five named checks **on the exact final `main` SHA**, then verify published Pages JS contains `ql188-server-auth-webhook-replay-harness-v1` before declaring the disabled preview GREEN.

**Remaining proposed builds after QL-188 GREEN:** QL-189 Operations Safety Controls and QL-190 Independent Pre-Pilot Review Packet (**2 numbered builds**). The separate 12 live-pilot prerequisites remain outstanding.
