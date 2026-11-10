# QL-400 — Operator Handoff Assignment Preview, Evidence Freshness Warnings & Owner Decision Escalation

## Scope and truth boundary

QL-400 extends the QL-399 source-scoped, **illustrative and read-only** original-evidence handoff review with role-only operator assignment drafts, synthetic observation-age warnings and owner escalation guidance. It is **not** a live staff task system, sign-in, original evidence verifier, notification scheduler, SLA monitor, owner approval, private receiver activation, persistent audit or incident closure. No data is fetched, written, sent or signed by this preview.

The fixed example contains **three** role-only handoff drafts for registered shells (`devilndove`, `icamp`, `rosevear-ai-hub`) and QL-396/397/398/399 source/correlation/gate identities. The example clocks are fixed at 2026-11-09 09:45 UTC. One demonstration review due time has elapsed; this is not proof of a real overdue employee assignment. Additional registered sources lacking synthetic cases are not considered healthy, connected or incident-free. Camp Rosevear and other sample tenants are not shell-level source IDs.

## Assignment and evidence freshness

Each draft binds a unique opaque assignment ID to an existing QL-396 queue ID, exact source, correlation, gate, prescribed custodian role, synthetic draft time and illustrative review due time. It does **not** name or authenticate a person. Actual assignment state remains `PREVIEW_ONLY_NOT_ASSIGNED`, and `assignmentActive=false`.

Draft timestamps must be valid UTC; draft time cannot predate the first source observation or exceed the evaluation clock. Due time must be no earlier than draft time and no more than two hours past that clock. The adapter rejects the entire review on duplicate IDs or queue bindings, unknown sources/gates, swapped custodians, malformed times or invalid upstream QL-399 review. At most 30 bounded drafts are accepted; no partial outputs are returned when input validation fails.

For each draft, the model measures the age of the **last synthetic QL-396 observation**, not the age of original evidence. Labels are `SCENARIO_RECENT_ONLY` (under ten minutes), `SCENARIO_AGING` (ten to under thirty minutes), and `SCENARIO_STALE` (thirty minutes or more). **Original evidence freshness is always `UNKNOWN_ORIGINAL`**, regardless of the illustrative label. The actual completeness, authenticity, age and ownership of real receipts are not visible here.

## Owner escalation and role separation

The read-only escalation priority is `OVERDUE` if the illustrative due time elapsed, otherwise `CONFLICT` if a linked QL-399 exception requires independent conflict review, otherwise `COLLECT_ORIGINAL`. These are guidance categories only: no reminder, task assignment, consent request or external message is created.

The source owner and master owner retain separate `NOT_VERIFIED` decisions. The independent reviewer remains `NOT_VERIFIED`, the origin signing pin, private receiver enrollment, replay/retention audit and tenant-scoped consent remain unverified, and closure stays `HOLD`. A simulated priority, fresh-looking reference, reviewer role or owner decision mention **must never** become authenticated authorization.

The UI offers keyboard-accessible source and priority filters, illustrative review due times, the synthetic freshness warning, separate owner decision status and expandable links back to QL-399 exception IDs and QL-398/399 HOLD trace IDs. Filters are local-only; no edit, send or approval control exists.

## Real workflow and software verification

Original source/master-owner evidence, separate witness and signer custody verification, receiver/replay/retention proof and scoped consent must be obtained through independently authenticated origin workflows. Only an approved implementation may assign real operators, notify custodians, persist audit evidence or change real incident state. QL-400 implements none of these. AI Data Platform remains the master completion/health evidence plane; Comms Hub remains the communications/incident operator plane.

Acceptance: run QL-400 unit and Owner Six-App Drilldown tests, complete Vitest suite, TypeScript/Vite build; promote the same verified tree via protected `dev` and `main` pull requests. Require separate CI including Windows encrypted owner-key safety and post-merge public Worker JS/CSS parity. Verify both final workflows and `main` commit/tree before declaring **software** Production GREEN. Software GREEN is not evidence/owner-trust GREEN.
