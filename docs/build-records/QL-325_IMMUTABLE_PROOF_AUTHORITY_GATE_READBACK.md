# QL-325 — Immutable Proof, Independent Authority & Connection Gate Readback

## Software delivered and safe boundary

- I.T. Command now has a six-source immutable public-proof board, original exact pinned paths, historical QL-270/289/290/303/325 source SHA sequence and labelled pin transitions.
- An accessible per-source five-gate readback keeps original signed Proof-B, independent issuer/custodian/witness, nonproduction tenant, scoped TEST-only GET identity and explicit owner authorization unapproved. Distinct 200/403/404/429/401/network failure explanations cannot grant access.
- Six unauthenticated GitHub Contents GETs completed as a batch at `2026-11-03T16:32:38Z`, using exact QL-303 pinned source commits and `docs/integration/ql246-source-proof.json`; all six returned 404. The batch timestamp is not a per-source timestamp or current source health.
- Four isolated customer-facing businesses remain distinct from AI Data Platform and Rosevear AI Hub supporting systems. All six connections `DISCONNECTED / HOLD`; no private gateway reads, credential collection, customer data, source writes, provider calls/SMS, ACK, verified signer, owner acceptance or Windows relay activation. ACK remains `UNDER_REVIEW / PARKED_FOR_LATER`.

## Source, tests and promotion evidence

- Locally tested source commit `55d8f632fa8173200d0731c842758e400df61bcb` was promoted through [code PR #623](https://github.com/RosevearCreations/rosevear-comms-hub/pull/623) to exact `main` merge `1a164dc6af7ec0bfab938f067dae3e10b187829a`; `dev` was aligned to that exact merge commit.
- Focused QL-325 suite **8/8 PASS**. Full Vitest suite **143/143 files and 1,295/1,295 tests PASS** (`--maxWorkers=1 --isolate=false --testTimeout=60000`). TypeScript/Vite production build **PASS** (569 modules). Large legacy JS bundle warning remains a future performance follow-up.
- QL-171 static safety **PASS**, 376 files scanned, zero raw-network sinks and zero Supabase mutations; live calls/SMS disabled. This does not replace runtime penetration testing.
- Exact `main` `1a164dc6af7ec0bfab938f067dae3e10b187829a` check results: `app-build` SUCCESS at 16:50:34Z; `Build disabled preview` SUCCESS at 16:47:52Z; `Deploy disabled preview` SUCCESS at 16:48:08Z; `Supabase Preview` SUCCESS at 16:45:29Z; `Workers Builds: rosevear-comms-hub` SUCCESS at 17:02:22Z on 2026-11-03. Cloudflare's separate in-progress duplicate record during its Workers Builds incident was not mistaken for the successful check.
- Public disabled preview `https://rosevear-comms-hub.devilndovelive.workers.dev/` returned QL-325 content-hashed assets and HTTP-fetched live bytes matched locally tested production output exactly:

| Asset | Local and live SHA-256 | Result |
| --- | --- | --- |
| `index-Bi4fgmk7.js` | `56f6725416c3950db9121931379b79a7da95b732a862e3fde6ac7777984cf234` | Byte-identical |
| `index-J_BOUB2m.css` | `da3a51e7da4140d87a3c0a89f20ce44e84510c7a6f184e9650d79d9d8e329618` | Byte-identical |

**Production GREEN is software-only**, never authenticated six-app integration or owner TEST authorization. There is no proof gate closure. The code receipt is complete; this documentation-only promotion remains subject to its own exact-main applicable checks.

## Queue handoff

QL-325 is the **15th of 20 Production GREEN software-only builds**, leaving **five remaining**. Next authorized: **QL-326 — Nonsecret Connection Configuration Matrix & Environment Preparation Guide**. Do not set up credentials or connect a source as part of that guide.
