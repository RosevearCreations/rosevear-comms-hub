# QL-189 — Operations Safety Controls (synthetic rehearsal)

Status: **disabled-preview implementation**, for development and owner review only. This does not install operational controls for live calls, text messages, webhooks, provider billing or Supabase writes.

## Delivered in this build

1. **Node-only, isolated mock operations controller** in `scripts/ql189-operations-safety-harness.mjs`. It checks trusted *fictional* operator/business scope, three simulated events per rolling 60 seconds, a fabricated 250-cent per-operation projection and 500-cent rolling 24-hour projection cap, duplicate event IDs, clock reversal, brand-isolated incident STOP/RESUME and restricted audit metadata. These amounts are test fixtures, **not pricing or owner-approved budgets**.
2. **Executable negative tests** in `scripts/__tests__/ql189-operations-safety-harness.test.mjs`, included in `.github/workflows/app-ci.yml`. They assert isolation, rate/cost boundary conditions, incident precedence, owner-only mock restoration, preserved replay/spend history, bounded privacy-minimized telemetry and zero external effects.
3. **Browser-only training panel** at **Operator workspace → Phone/SMS safety → QL-189 Operations safety controls**. Dropdowns illustrate rate, fictional spend and incident scenarios; their outcomes are deterministic descriptions only. This browser component never imports, invokes or impersonates the Node harness.
4. **Accessible help and sample playbook**, plus UI test coverage for branded isolation and absence of network/storage actions.

## Safety truth contract

| Dimension | QL-189 test state | Prerequisite for any real system |
| --- | --- | --- |
| Operator identity and brand | Caller passes invented role/brand parameters to an in-process function | Server-verified identity and current tenant grant; browser selection or `user_metadata` must not be authority |
| Rate quota | Local array, three accepted mock IDs in a 60-second rolling window | Centralized atomic quota across instances/regions, route/identity/IP dimensions, bounded concurrency and provider retry/backoff policy |
| Cost | Test-only estimate cents held in RAM; no payment or provider account | Owner-approved CAD budget, provider/segment/voice/number charges, taxes/FX, pessimistic cost reservation and independent invoice reconciliation |
| Idempotency | Local set of synthetic IDs | Durable atomic uniqueness, retention policy, provider event identity, concurrent delivery and at-least-once replay resilience |
| Incident stop | In-memory switch per business, controlled by fictional owner string | Independently controlled fail-closed service-side stop and provider-side suspension, confirmed incident contacts and audited multi-party restore |
| Rollback/restart | RESUME_MOCK preserves fictitious replay and spend | Versioned release rollback, tested recovery, key revocation/rotation, provider status, debt/retry drain checks and explicit owner authorization |
| Telemetry | Maximum 32 RAM rows, only fixed brand/disposition/minuteBucket | Minimal redacted logs/metrics, restricted access, defined retention, risk-classified alerts, out-of-band notification and emergency evidence hold |
| Public access and data | **No routes, secrets, DB access, billing or transport** | Reviewed protected server, actual privacy/RLS and data minimization, transport protection, monitored limits and independent pre-pilot review |

## Fail-closed incident workflow (design only)

1. **Detect:** Alert on signature/authorization denial spikes, repeated retry IDs, quota abuse, unexpected provider spending, processing latency and service saturation. Record only redacted category/count/time/tenant metrics; never log message bodies, names, phone numbers, secrets or full webhook URLs.
2. **Stop:** A designated incident owner invokes a **future protected** stop switch *before dispatch*. Halt affected tenant and routes, preserve customer-facing error handling and verify provider-side suspension. In QL-189 only `STOPPED_MOCK` is possible; it does nothing outside memory.
3. **Contain:** Revoke or rotate affected credentials, block external sends at provider level, preserve an access-restricted and time-limited incident evidence record; inventory pending duplicates and charge reservations.
4. **Rollback:** Restore the last verified protected server configuration through an audited deployment process; do **not** remove outstanding idempotency or cost holds by rolling back. Verify consent and message classification before replay.
5. **Recover:** Owner and independent reviewer confirm incident cause, provider status, privacy exposure, spend, deliverability and queue drains, then authorize a staged service restore. QL-189's `RESUMED_MOCK` is deliberately **not** such approval.
6. **Learn:** Record alert precision, time-to-stop, recovery drill evidence and gaps for QL-190 pre-pilot review.

## Verification

From the repository root:

```bash
node scripts/__tests__/ql189-operations-safety-harness.test.mjs
cd app
npm run check
npm test
npm run build
npm run pages:build
```

The independent QL-171 baseline must continue to show zero live network calls, Supabase mutations, SMS, voice operations and approvals. The UI test suite also asserts `fetch`, `localStorage` writes and cross-business review are not used by QL-189.

## Holds and next build

All **12 QL-181 real-pilot prerequisites remain HELD**. QL-187 provider choice, actual rates/costs, owner budget and production hosting are unresolved. QL-188 is an invented HMAC and in-memory replay harness, not vendor-valid signature authentication. QL-189 adds no production HTTP listener or operational switch. **QL-190 — Independent Pre-Pilot Review Packet** is the sole remaining proposed numbered build in the QL-183–190 batch after QL-189 reaches exact-main GREEN. A completed development queue is **not** a live-pilot authorization.

Background: [QL-181 prerequisites](QL-181_PRIVACY_ROLES_LIVE_PILOT_DECISION_MATRIX.md), [QL-185 privacy blueprint](QL-185_PRIVATE_DATA_MINIMIZATION_RETENTION_BLUEPRINT.md), [QL-186 consent specification](QL-186_CONSENT_MESSAGE_CLASSIFICATION_SPECIFICATION.md), [QL-187 provider model](QL-187_PROVIDER_DECISION_COST_MODEL.md), [QL-188 server test harness](QL-188_SERVER_AUTH_WEBHOOK_REPLAY_TEST_HARNESS.md).

Primary technical references: [Node test runner](https://nodejs.org/api/test.html), [Supabase API security](https://supabase.com/docs/guides/api/securing-your-api), [Supabase Auth claims](https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook), [Twilio webhook validation guidance](https://www.twilio.com/docs/usage/security).
