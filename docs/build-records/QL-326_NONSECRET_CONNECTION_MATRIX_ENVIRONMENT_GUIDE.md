# QL-326 — Nonsecret Connection Configuration Matrix & Environment Preparation Guide

## Software delivered · not an integration authorization

- The I.T. Command screen now documents all six source contracts in a consistent table: four separately isolated customer-facing businesses and two support services which **cannot** become customer tenants.
- It lists local, disabled preview and future nonproduction TEST planning environments, only two proposed GET contract paths, response field names, source-owner and independent-reviewer duties, explicit failure fallbacks and a guided human checklist.
- The draft validator runs exclusively in browser memory and checks fictional source fixtures, descriptive references and reserved placeholder origins. It refuses production environments, other-business aliases, customer-tenant assignment for support services, credential or personal-record patterns, unsafe metadata, and all real/non-placeholder hosts, URL paths, userinfo, queries and fragments. A valid local draft still returns `DRAFT_ONLY_NOT_AUTHORIZED`.
- [Full nonsecret guide](../QL-326-NONSECRET-CONNECTION-CONFIGURATION-GUIDE.md) records names only; no secret values, Cloudflare/Supabase config changes, live private requests, source writes, messages, real customer records, ACK authorization or Windows relay activation. Browser hosting flags remain false. All six sources `DISCONNECTED / HOLD`; ACK `UNDER_REVIEW / PARKED_FOR_LATER`.

## Local verification and source evidence

- The focused QL-326 suite completed **31/31 PASS** after hardening the placeholder host and personal-record patterns.
- The complete Vitest run completed **144/144 test files and 1,326/1,326 tests PASS** with `--maxWorkers=1 --isolate=false`.
- `tsc --noEmit && vite build` **PASS**, 572 modules; built `index-xpcclcJY.js` and `index-bexUqPSn.css`. Existing large bundle warning remains; no performance claim made.
- QL-171 static baseline **PASS**, 378 source files scanned, zero raw-network and zero Supabase-mutation sinks, with live calls/SMS disabled. This is a static readback, not a runtime security penetration test.
- Code pushed to `dev` as `c79a785f91ff2bf31bd9963c6a78a68b5cdcd130` and reviewed in [PR #625](https://github.com/RosevearCreations/rosevear-comms-hub/pull/625).

## Exact-main / Cloudflare production receipt

- Code [PR #625](https://github.com/RosevearCreations/rosevear-comms-hub/pull/625) merged to exact `main` **`020768b3f6d9439853c500e97065e762bd183b17`** after its exact-head `app-build` SUCCESS (18:41:49Z) and Cloudflare Workers Builds SUCCESS (18:37:51Z). Supabase Preview was SKIPPED on the PR, with no backend configuration changes.
- Exact code `main` `020768b3f6d9439853c500e97065e762bd183b17` passed all five required checks on 2026-11-03: `Build disabled preview` SUCCESS at 18:42:58Z, `Supabase Preview` SUCCESS at 18:42:54Z, `Workers Builds: rosevear-comms-hub` SUCCESS at 18:43:28Z, `Deploy disabled preview` SUCCESS at 18:45:30Z, and `app-build` SUCCESS at 18:45:56Z. The older duplicate Cloudflare/Supabase in-progress status lines are distinguished from the successful exact-head checks. `dev` was then fast-forward aligned to that exact `main` commit.
- Public disabled preview `https://rosevear-comms-hub.devilndovelive.workers.dev/` returned the new QL-326 content-hashed assets. `curl` HTTP-fetched live JS/CSS bytes were SHA-256 compared against the locally tested production bundle:

| Asset | Local SHA-256 | Live SHA-256 | Result |
| --- | --- | --- | --- |
| `index-xpcclcJY.js` | `144f98eacaf58b512d7e8d88f78bf9f1216a3833677924ce9eb126424eb012b3` | `144f98eacaf58b512d7e8d88f78bf9f1216a3833677924ce9eb126424eb012b3` | Byte-identical |
| `index-bexUqPSn.css` | `112118c4ca2a0fff9e2f248a3b3f28b896a2efa8d1f3515694ef4550f1eef432` | `112118c4ca2a0fff9e2f248a3b3f28b896a2efa8d1f3515694ef4550f1eef432` | Byte-identical |

**Code software Production GREEN verified.** That means only the disabled-preview bundle and checks have passed. It is emphatically **not** a source connection, identity/tenant permission, signer custody acceptance, live provider validation or owner physical-device acceptance. The documentation-only queue receipt is separately subject to its own applicable checks.

## Follow-up

- Owner physical-device and screen-reader acceptance remain pending.
- Source-proof custody, signer authority, tenant mapping, gateway identity and exact owner TEST authorization all remain separate unapproved gates. No real GET may be initiated by this preview.
- Next authorized build after independently verified promotion: **QL-327 — Six-App Contract Compatibility, Fixture Handshake & Version Matrix** (synthetic contract only).
