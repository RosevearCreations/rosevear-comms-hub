# QL-398 — Operator Closure Readiness, Independent Evidence Checklists & HOLD Resolution Audit

## Scope and authority boundaries

QL-398 adds a **read-only, synthetic, source-scoped closure readiness review** on the Comms Hub Owner Six-App Drilldown. It draws exclusively from the bounded QL-396 recheck queue and QL-397 illustrative outcome history. **It does not authenticate a reviewer, receive an original evidence receipt, send a message, authorize an owner decision, resolve a HOLD, persist an audit record or close an incident.** No API or database calls are made by this preview.

The fixed example contains **three** shell/correlation cases (`devilndove`, `icamp`, `rosevear-ai-hub`), **15** unsatisfied independent evidence checks (five per source), **four** synthetic review notes and **two** illustrated source cases with conflicts. There are **zero** eligible closures. The other three registered source shells have no illustrated incident case; their absence is not a verified healthy/connected status. Camp Rosevear and other tenant businesses are not additional master-shell source IDs.

## Closure prerequisites and separation of duties

For **each source/correlation case**, an authenticated, independent real-world workflow must collect and validate all five distinct original evidence axes:

| Gate | Required original evidence and authority | Preview state |
| --- | --- | --- |
| `SOURCE_OWNER` | Original source-owner scope, purpose, correlation and independent witness | `NOT_VERIFIED` |
| `MASTER_OWNER` | Separate original master-owner authorization with independent witness | `NOT_VERIFIED` |
| `SOURCE_PIN` | Original per-source signer pin, key custody and independent verification | `NOT_VERIFIED` |
| `RECEIVER` | Original private receiver enrollment, replay, retention and audit proof | `NOT_VERIFIED` |
| `CONSENT` | Original source/tenant-scoped consent and separate closure/communication authorization | `NOT_VERIFIED` |

The UI shows the assigned *type* of custodian, not a verified human identity or an assignment. `sourceOwnerReview` and `masterOwnerReview` remain `NOT_VERIFIED`; independent reviewer separation remains `NOT_ATTESTED`; each item remains unsatisfied and each case remains `HOLD`. An illustrated note or even a claimed simulated all-clear cannot meet any of these requirements. The source and master decisions must never be collapsed into a single approval. Cross-tenant records must not be exposed through this shell-level example.

## HOLD resolution audit semantics

An illustrative note binds an opaque audit ID to an **existing QL-396 queue ID** and the exact registered source, correlation, evidence gate and reviewer scope. Two intents are represented: checklist review and proposed HOLD resolution. Claim bases distinguish missing original evidence, scenario-only references, and a claimed simulated completion; **none is an original receipt**. Every audit disposition is `HOLD_PRESERVED` and `resolutionAuthorized=false`, including the claimed all-clear.

Audit entries sort by UTC timestamp and opaque audit ID. Inputs fail closed as a whole for duplicate IDs, malformed timestamps, future/pre-case entries, out-of-scope source or reviewer changes, unknown queue IDs, invalid claims, or more than 30 notes. Invalid upstream queue or recheck outcomes also fail closed without partial results. The UI can filter by source shell and illustrative HOLD category but cannot change authority or evidence state. The in-memory audit is neither a durable compliance ledger nor an authenticated owner decision history.

## To actually clear a HOLD

1. Obtain original proof from each source's protected owner and signer custody workflows, bound to the exact source, purpose, tenant scope and correlation.
2. Independently authenticate the distinct source and master owner decisions and witness chain; verify sender custody, private receiver enrollment, replay and retention evidence.
3. Confirm consent and an independently authorized closure/communication decision in the originating systems. Do not infer sign-off from this software release or a scenario reference.
4. Only through separately implemented, approved, authenticated production workflows may an authorized operator record a durable decision and change a real incident's HOLD state. QL-398 implements **none of these live actions**.

AI Data Platform continues to own module completion/health truth; Comms Hub owns authorized incident/communications processes. No simulated outcome can promote software-GREEN into trust-GREEN.

## Acceptance and production verification

Run QL-398 model tests, the Owner Six-App Drilldown accessibility/filter tests, all app Vitest tests and TypeScript/Vite production build. Promote the tested tree to `dev` and `main` using protected GitHub PRs, require successful independent CI (including Windows owner key-safety and public Worker artifact parity), and verify the final `main` commit/tree and post-merge checks. Only report **Production GREEN** for the software deployment when those checks actually pass; real owner evidence and connection activation remain separate HOLD gates.
