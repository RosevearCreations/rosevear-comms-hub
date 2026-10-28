# QL-249 — Immutable proof publication retest, independent GitHub origin & held owner-test scheduling

**28 October 2026 · Rosevear Comms Hub · public GitHub source evidence only.**

The owner reports that the other six applications received the QL-248 two-commit handoff and are actively building. QL-249 independently queried each companion GitHub `main` SHA and the exact QL-246 public source-proof path at that immutable revision through the authenticated GitHub repository connection. **Every current proof path returned HTTP 404.** This is an observation while publication work is underway, not an allegation that a code build or gateway test failed.

| Source system | Repository | Observed `main` commit SHA | QL-246 public file at that SHA |
| --- | --- | --- | --- |
| AI Data Platform | `RosevearCreations/ai-data-platform` | `33240278b4143a637c717ce7143ddd383d0eb4c3` | MISSING (404) |
| Devil n Dove | `RosevearCreations/devilndove-site` | `46ecaea247498ad9bde8723d1c9721ce1d6b6e98` | MISSING (404) |
| Rosie Dazzlers | `RosevearCreations/rosiedazzlers` | `65bf778d77a39acb11f59677bd116aa8c6ceb774` | MISSING (404) |
| Yard Workers | `RosevearCreations/yw` | `ca8f120d19091cdd009aeefecf83f127863cdcc4` | MISSING (404) |
| iCamp | `RosevearCreations/iCamp` | `1a3c4a0dd3b95836c864dc71fdb3e1cbb4a91a47` | MISSING (404) |
| Rosevear AI Hub | `RosevearCreations/rosevear-ai-hub` | `4b4fb52cf1170e1f08084705b74258148df2ade2` | MISSING (404) |

All six changed since the QL-247 snapshot. Recheck after further promotions; never use a mutable branch label as the immutable evidence anchor.

## New source-only verification code

- `scripts/ql249-public-github-origin-retest.mjs` constructs **only** six known GitHub public API/raw-file origins. It refuses HTTP, userinfo, query strings, redirects, unknown repository slugs, dynamic hosts and arbitrary network destinations. Responses are bounded and credentials are omitted.
- With an explicit public GET operator choice, it fetches each GitHub `main` SHA and the raw QL-246 proof at that immutable SHA. On a 404, the app is reported **MISSING / HOLD**, and no source CI or unrelated runtime endpoint is queried.
- If a public proof appears, its existing Ed25519 self-signature, exact read-only QL-246 fields, one-hour challenge, tenant, signed earlier **source SHA**, and distinct later **proof SHA** are checked. A valid self-signature **does not** authenticate its public key out of band.
- The verifier then independently asks GitHub for the signed source commit, the source-to-proof commit ancestry, and the exact source CI run's success and SHA. It must see all three; any unexpected, unbounded, missing, stale, foreign or failed response remains HOLD. It never calls an application gateway.
- `scripts/ql249-retest-six-app-public-github.mjs` is zero-network by default; `--public-get` explicitly permits only the public source checks. Optional private report creation is `0600` and never overwrites a file. Local network proxy or anonymous GitHub rate limits must be reported honestly, not bypassed or relabeled as success.
- The QL-249 operator panel shows the observed six snapshot SHAs and a **NOT SCHEDULED** gate. It is static public metadata, not an API client or live scheduler.

Successful public CI/source observations would remain `SIX_PUBLIC_SOURCE_CI_ORIGINS_OBSERVED_INDEPENDENT_TRUST_AND_RUNTIME_HELD`: the separate Ed25519 key custody check, original nonproduction HMAC gateway receipts, seven genuine negative-test observations, actual durable audits, owner test authorization, and owner pilot release are **not** supplied by GitHub origin alone.

## Owner-scoped read-only GET schedule gate — no slots authorized yet

The six candidate test scopes are exactly `GET /api/integration/v1/health` and `GET /api/integration/v1/capabilities`, one distinct source/tenant at a time. These are **unscheduled readiness candidates**, not calendar events, automation tasks, approved requests or network connections.

Before any test slot may be scheduled or executed, an authenticated owner must separately approve:

1. The exact company/source/issued tenant and a nonproduction **server-side** destination, exchanged via an approved private channel; home AI Hub endpoints remain private.
2. A bounded UTC test time window and expiration, a named responsible operator and independent observer, and an explicit abort/rollback contact.
3. Independently verified public key pin, source+proof SHAs, source CI success, authenticated transport, *separate* per-app 256-bit random HMAC key custody and test-only key ID. No secret value in GitHub or a handoff.
4. A narrowly scoped GET-only allowlist, redacted original receipt/audit retention plan, nonce/replay, stale request, foreign business/tenant, revoked key, write and dispatch denials, plus rollback/revocation demonstration.
5. A clear distinction between **authorization to conduct a nonproduction test** and an entirely separate owner decision to release a reversible read-only pilot. This build grants neither.

Do not schedule or enable real public APIs, Etsy/Marketplace writes, gift deliveries, bookings/payments, payroll/jobs, campground gates, devices/vaults, live telephone, SMS or dispatch.

## Commands

Default makes zero requests:

```sh
node scripts/ql249-retest-six-app-public-github.mjs
```

Only on an explicitly approved operator machine with public GitHub access:

```sh
node scripts/ql249-retest-six-app-public-github.mjs --public-get --output ./private-ql249-origin-report.json
```

The output never includes a key value or raw proof body. A full public-origin status still leaves **independent trusted signer pins = 0, actual authenticated gateway GETs = 0, owner test authorization NOT GIVEN, owner pilot authorization NOT GIVEN, connections DISCONNECTED, 12/12 live communications gates HELD, and 0 writes/calls/SMS/dispatch**.

See the [QL-249 six-application return handoff](ROSEVEAR_QL249_SIX_APP_ORIGIN_RETEST_AND_OWNER_TEST_SLOT_HANDOFF.md).

**Next expected Comms Hub build: QL-250 — Independent Six-App Proof/CI Refresh, Key-Pin Custody Challenge & Owner-Approved Nonproduction GET Window Witnessing (HELD).**
