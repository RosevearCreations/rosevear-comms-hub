# QL-399 — Original Evidence Handoff Readiness, Independent Reviewer Exception Queue & Closure Decision Traceability

## Scope

QL-399 extends the QL-398 **synthetic, read-only HOLD closure review** with a source-and-correlation-bound original evidence handoff checklist, a bounded independent reviewer exception queue and chronological, provenance-linked closure decision traces. This is a fixed local demonstration, **not a signed owner handoff, evidence-upload service, authenticated reviewer assignment, durable exception ledger, live communication or incident closure engine**. No origin API, database, signer, receiver or cross-tenant record is accessed.

Three illustrative shell-scoped cases (`devilndove`, `icamp`, `rosevear-ai-hub`) contain **15 original handoff requirements**, **four simulated reviewer exceptions** and **eight trace entries** (four QL-398 audit notes plus four QL-399 exceptions). All three cases report **five outstanding original artifacts**, **zero handoffs ready** and **zero eligible closures**. The other three registered app shells are not assumed healthy or connected because no illustrative incident case is shown. Sample businesses such as Camp Rosevear do not become master-shell sources.

## Required original handoff package

Each shell/correlation needs all five distinct original receipts, independently authenticated in the original protected process:

| Evidence gate | Original artifact and independent proof | Preview result |
| --- | --- | --- |
| `SOURCE_OWNER` | Signed source-owner decision, scoped purpose and separate witness receipt | `NOT_PRESENT` |
| `MASTER_OWNER` | Separate signed master-owner decision and witness receipt | `NOT_PRESENT` |
| `SOURCE_PIN` | Registered shell key pin provenance and key custody verification | `NOT_PRESENT` |
| `RECEIVER` | Trusted private receiver enrollment, durable replay, retention and audit evidence | `NOT_PRESENT` |
| `CONSENT` | Original source/tenant-scoped consent and separate closure/communication authority | `NOT_PRESENT` |

**Do not treat source-owner and master-owner decisions as interchangeable.** Custodian names shown by the preview are role types, not verified people. Every gate's independent reviewer remains `NOT_VERIFIED`, separation of witnesses `NOT_ATTESTED`, handoff status `BLOCKED_ORIGINAL_PROOF` and closure status `HOLD`.

## Exception validation and decision continuity

An illustrative reviewer exception must carry a unique opaque ID, exact existing QL-396 queue ID and matching registered source, correlation, gate and reviewer scope. Codes are `ORIGINAL_RECEIPT_MISSING`, `INDEPENDENT_WITNESS_MISSING`, `CUSTODY_CHAIN_UNVERIFIED` and `SCENARIO_CLAIM_CONFLICT`. The latter is prioritized as `REVIEW_CONFLICT`; the rest are `COLLECT_ORIGINAL`. All are `OPEN_HOLD` and independently unverified. They are not live tickets or assigned people.

The adapter rejects as a whole malformed/duplicated IDs, collision with a QL-398 audit ID, mismatched source/gate/scope, unknown queue, future/pre-case times, unknown codes and more than 30 exceptions. A failed upstream QL-396/397/398 review blocks output. Each source-scoped decision trace combines immutable input identifiers, record kind, gate, timestamp and reason from QL-398 audit records and QL-399 reviewer exceptions. Chronology is sorted by time then trace ID. **Every disposition is `HOLD_PRESERVED` with `authorized=false`**, including simulated all-clear attempts; a trace entry is not proof of a real owner decision.

## Operator guidance and software verification

The dark, keyboard-accessible Owner Six-App Drilldown section offers *local-only* shell and exception-priority filters and expandable original handoff checklist, exception notes and decision trace. A filter cannot release HOLD, send communications, activate an original signer/receiver, assign a reviewer, mark an artifact verified or persist a decision.

To authorize any real closure, source and master owners must separately complete original signed decisions with independently verified witness and custody records, receiver enrollment/replay/retention evidence and scoped consent through authenticated origin systems. Any actual decision must be recorded by an independently implemented approved durable audit/closure process, **not QL-399**. AI Data Platform owns module health/completion evidence; Comms Hub owns authorized communications and incidents.

Acceptance: run QL-399 model and Owner Six-App Drilldown tests, complete Vitest suite, TypeScript and Vite build. Promote the **same tested tree** via protected `dev` and `main` PRs, require separate CI including Windows encrypted key-safety and post-merge public Worker artifact parity; verify final `main` SHA/tree and both post-merge workflows before claiming software Production GREEN. GREEN never substitutes for missing original trust evidence.
