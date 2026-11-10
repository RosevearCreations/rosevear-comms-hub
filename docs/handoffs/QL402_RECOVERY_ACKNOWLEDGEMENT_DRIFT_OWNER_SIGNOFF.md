# QL-402 — Operator Recovery Decision Review, Acknowledgement Drift Audit & Independent Owner Sign-Off Checklist

## Scope and authority boundary

QL-402 adds a **read-only, offline** comparison of QL-401 role-only handoff acknowledgements against successive illustrative recovery review notes. It displays whether sample acknowledgement references were preserved, dropped or restored, and a separate five-axis checklist for original source and master-owner approval, signing custody, receiver/replay proof and scoped consent. This does **not** create a real decision, authenticate a worker, sign an acknowledgement, verify a witness, send an escalation, persist a journal or release an incident from HOLD.

The three example shell/correlation assignments remain `devilndove`, `rosevear-ai-hub` and `icamp`. They are shell identities, **not** their tenant businesses. The synthetic comparison clock remains 2026-11-09 09:45 UTC. The examples include a dropped workshop reference, a dropped-then-restored local receiver reference and a source with no illustrative acknowledgement. This shows **scenario drift only**; the actual receipt, time, signer and custody remain unknown.

## Bounded source-specific recovery comparison

Every note binds a unique opaque review ID to an existing QL-400/401 assignment, its exact source shell/correlation, prescribed custodian role, valid UTC time between the draft and scenario clock, one of `RETAIN_HOLD`, `REQUEST_ORIGINAL_RECHECK`, or `ESCALATE_OWNER_REVIEW`, and either a null reference or the specific known QL-401 acknowledgement ID for that assignment. A referenced mark must exist in that source case and predate the review note. At most 30 notes are accepted.

The adapter **fails closed in full** on duplicate IDs, forged owner approvals or intents, cross-source/correlation/role references, invented acknowledgement IDs, collisions with prior IDs or HOLD traces, malformed/future/pre-draft times, and invalid QL-401/399 upstream evidence. Notes sort by time and stable review ID. The comparison identifies `SCENARIO_UNCHANGED`, `NO_SCENARIO_REFERENCE`, `SCENARIO_REFERENCE_DROPPED` or `SCENARIO_REFERENCE_RESTORED` against the preceding note (or QL-401 baseline). Neither restoration nor any request to escalate constitutes an original signed decision. Every trace has `decisionAuthorized=false` and `HOLD_PRESERVED`.

## Independent owner sign-off checklist

For each source case, QL-402 preserves the five original required axes from QL-399:

1. `SOURCE_OWNER`: separate source-owner decision with scoped purpose and independent witness.
2. `MASTER_OWNER`: distinct master-owner signed approval and independently verified witness.
3. `SOURCE_PIN`: original source signing-pin provenance, custodian and independent signature proof.
4. `RECEIVER`: private receiver enrollment, replay protection, retention and original audit receipt.
5. `CONSENT`: source/tenant-scoped consent and independent communication/closure authority.

All original receipts stay `NOT_PRESENT`, witnesses `NOT_ATTESTED`, signed decisions `NOT_VERIFIED`, checked axes `0/5`, owner signoffs false and every closure `HOLD`. The role labels and demo review notes are not a secure owner-signoff interface; the adapter never exposes write or send controls. Actual evidence freshness and signatures require protected, independently authenticated origin workflows.

## Owner recovery route

Treat a changed scenario acknowledgement as a prompt for an **independent real-world check**, not proof of a failed notification or authorization. Verify the genuine assignment and origin receipt under appropriate access controls. Resolve disputed original evidence with independent source/master-owner and witness review. Confirm signer custody, receiver replay/retention and tenant consent before any real operational decision. Record the result in approved tamper-evident workflows, not this preview. AI Data Platform owns master health/completion reporting; Comms Hub owns authenticated operations and communications.

## Acceptance and release

Run QL-402 unit tests, owner screen accessibility/regression tests, full Vitest, TypeScript/Vite build and the intact QL-336A/QL-340 CI gates. Promote identical source trees with protected `dev` and `main` PRs. Verify Windows key safety, final post-merge application CI, public Worker JS/CSS SHA-256 parity and Pages disabled-preview workflow. Mark **software** Production GREEN only when all required checks are successful; do not equate deployment with original evidence trust or an authorized owner signoff.
