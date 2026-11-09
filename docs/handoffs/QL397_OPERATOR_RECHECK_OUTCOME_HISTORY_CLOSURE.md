# QL-397 — Operator Recheck Outcome History, Owner Review State & Evidence-Based Closure Guidance

## Scope

Build QL-397 extends QL-396 with an **in-memory, synthetic, source/correlation/gate-scoped outcome chronology** and an operator-facing closure checklist. It is not an actual incident audit, approval workflow, owner review receipt, evidence acceptance, customer communication, or server-side closure engine. No live data, messages, signatures, owner decisions or incident records are fetched, written or sent.

The fixed demonstration contains 15 illustrative owner/evidence gates for the `devilndove`, `icamp` and `rosevear-ai-hub` shell sources. Five observation records cover four gates, including a later synthetic conflict for the Devil n Dove source-owner gate. These are scenario outcomes only. An absent event is not proof of a completed review, and the three other registered shells are not shown as incident-free.

## Historical review model

Each outcome is bound to a previously validated QL-396 queue ID with the **same source ID, correlation ID, gate and intended reviewer scope**. A new outcome cannot reassign the source owner, master owner, signer, private receiver operator or consent custodian. Observations use distinct opaque IDs and valid UTC times, no earlier than the first synthetic queue observation and no later than the evaluation clock. Chronology is deterministically ordered by time and ID. Up to 60 observations are allowed; a malformed, duplicated, cross-source or future-dated observation invalidates the entire output without partial results.

| Synthetic review state | Meaning | Actual authority |
| --- | --- | --- |
| `AWAITING_ORIGINAL_REVIEW` | No scenario outcome note for this gate | `HOLD` |
| `SCENARIO_REVIEW_NOTE_ONLY` | A synthetic note or reference recheck was added | `HOLD` |
| `CONFLICT_REQUIRES_INDEPENDENT_REVIEW` | A simulation shows conflicting or still missing evidence | `HOLD` |

Even a seemingly refreshed reference is **not independently verified proof**. Both `sourceOwnerReview` and `masterOwnerReview` remain `NOT_VERIFIED`, and original evidence is `NOT_VERIFIED` throughout. `closureEligible` is zero and `closureState` is `HOLD` for all 15 gates. Send and persistence are disabled.

## Five independent original closure requirements

1. Original source-owner authorization for this exact shell, purpose and correlation.
2. Separate original master-owner decision and independently verified witness.
3. Original source-signing pin, key custody and identity proof.
4. Trusted private receiver enrollment, replay protection, retention and audit evidence.
5. Original scoped consent and independently authorized closure/communication decision.

Reviewing this checklist, creating a simulated timeline or completing a local software test **never authorizes closing a real incident or releasing a hold**. Proof must be obtained and authenticated through the original systems and owner workflow, with tenant isolation preserved. AI Data Platform retains ownership of master health/completion metrics; Comms Hub retains responsibility for authorized operational communications.

## UI and verification

The Owner Six-App Drilldown adds a dark, keyboard-accessible QL-397 section with source and illustrative review-state filters, a chronological detail expansion for each gate, separate owner decision readback and a five-check closure explanation. Filters are read-only and do not persist selections or call APIs. Source IDs are registered shell IDs, never sample-tenant accounts.

Run the QL-397 unit and owner drilldown tests, the complete app Vitest suite, TypeScript/Vite production build, and independent `dev` and `main` protected GitHub checks. Check the exact promoted `main` commit and post-merge workflows before reporting software GREEN. GREEN never substitutes for original owner-signing evidence or live integration authorization.
