# QL-327 — Six-App Contract Compatibility, Fixture Handshake & Version Matrix

## Software delivered · all six connections still held

- I.T. Command now shows the precise four independent business roles and two tenantless support roles, with their fictional source identities and read-only preview capability names.
- Version matrix distinguishes pinned local `rosevear.integration.v1`, additive draft `rosevear.integration.v1.1` (only optional `trace_label`) and unsupported breaking `rosevear.integration.v2`. No peer is asserted to support or have deployed these versions.
- Pure synthetic fixture validator checks required fields, GET-only path and TEST shape, source identity, business/tenant isolation, explicit fictional consent marker, least-privilege preview capability and HOLD connection status. Unexpected fields, removed fields, schema changes, wrong tenant or support role, missing consent and elevated privileges produce distinct NO-GO decisions.
- Interactive scenario lab explains where a local shape check stops and how to preserve the v1 fixture and request independent review without remotely rolling back or initiating a handshake.
- [Full source-linked compatibility guide](../QL-327-SIX-APP-CONTRACT-COMPATIBILITY-GUIDE.md) provides exact field names, version policy, 66-case matrix and human follow-up. No actual source GET, secrets, source writes, customer records, consent grant, signed proof, TEST authorization, Cloudflare/Supabase setting change, provider messages, ACK or Windows relay activation. All six remain `DISCONNECTED / HOLD`; ACK `UNDER_REVIEW / PARKED_FOR_LATER`.

## Local source and verification

- Focused QL-327 suite **13/13 PASS**, including all **66** declared six-source/eleven-scenario fixtures, additive version and negative direct cases, role/tenant isolation and operator UI safety.
- Full Vitest suite **145/145 test files, 1,339/1,339 tests PASS** with `--maxWorkers=1 --isolate=false`.
- TypeScript `tsc --noEmit` and production Vite build **PASS** (575 modules). Existing large bundle warning remains; no optimization or performance sign-off claimed.
- QL-171 static safety **PASS**: 380 source files scanned, zero raw-network sinks and zero Supabase mutations; live calls and SMS disabled. Static analysis is not a runtime security test.
- Source pushed as `dev` `4520b712551121956c86dc4f8eb36bd9fce86b3d` in [code PR #627](https://github.com/RosevearCreations/rosevear-comms-hub/pull/627) and merged to exact code `main` `084b15908e784d7de9db0a9b1d6c6916f83d6dfa`. Exact PR-head `app-build` SUCCESS at 19:18:49Z, Cloudflare Workers Builds SUCCESS at 19:16:11Z and Supabase Preview SKIPPED (no config change).

## Production release evidence

- Exact code `main` **`084b15908e784d7de9db0a9b1d6c6916f83d6dfa` passed all five applicable checks** on 2026-11-03: `Supabase Preview` SUCCESS at 19:19:48Z; `Workers Builds: rosevear-comms-hub` SUCCESS at 19:21:02Z; `Build disabled preview` SUCCESS at 19:24:24Z; `app-build` SUCCESS at 19:27:22Z; `Deploy disabled preview` SUCCESS at 19:29:11Z. Older duplicate Cloudflare/Supabase in-progress records were not confused with these successful exact-main checks. `dev` was fast-forward aligned to that code `main` after verification.
- Public disabled preview `https://rosevear-comms-hub.devilndovelive.workers.dev/` returned QL-327 content-hashed assets. `curl` fetched their full bytes and SHA-256 matched the locally tested production output:

| Asset | Local SHA-256 | Live SHA-256 | Result |
| --- | --- | --- | --- |
| `index-D52ffKNn.js` | `6e719f0bbc704c9d6193d20ba79fbb0c2993ec98b1414a86d070ec5ab870559d` | `6e719f0bbc704c9d6193d20ba79fbb0c2993ec98b1414a86d070ec5ab870559d` | Byte-identical |
| `index-BvwdJs-l.css` | `f7c70381d89e19a206cc26dd8d797c66bebcdbba77bf9e5e6d3c0956c608554e` | `f7c70381d89e19a206cc26dd8d797c66bebcdbba77bf9e5e6d3c0956c608554e` | Byte-identical |

**Software Production GREEN verified on the code release only.** This remains a disabled-preview application and cannot be described as authenticated source compatibility, real consent or owner acceptance. The documentation-only queue receipt is separately subject to its own applicable checks.

## Outstanding external gates and next build

- Source-signed original Proof-B and independent custodian attestation are still unavailable. There is no authenticated gateway identity, real tenant/consent authorization, owner TEST decision, physical-device owner acceptance or private Windows relay.
- Production GREEN, when reached, will mean *only* deployment of the disabled operator preview. It must not be described as a successful real peer handshake.
- Next authorized after verified release: **QL-328 — Nonproduction Dry-Run Orchestrator, Failure Matrix & Reversible NO-GO Packets**, credential-free only.
