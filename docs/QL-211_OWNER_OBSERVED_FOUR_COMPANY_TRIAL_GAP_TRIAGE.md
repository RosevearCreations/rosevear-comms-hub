# QL-211 — Owner-Observed Four-Company Trial & Readiness Gap Triage

Release marker: `ql211-owner-observed-four-company-trial-disabled-preview-v1`

## Scope and truthful evidence boundary

QL-211 is the **guided manual-trial workbench**, not a claim that Laurie/Jack, another owner, an accessibility specialist or a real operator has completed an observed trial. It begins with **0 of 40 manual scenarios observed**. QL-210's 40 passing **synthetic** checks remain a separate metric, not an owner signoff. These distinctions are shown in both the dashboard and the portable status receipt.

The application still has **no real customer data, provider configuration, authenticated/authorized tenant session, SMS, MMS, calls, payment, or external write path**. All twelve QL-181 pre-pilot prerequisites remain `HELD_UNVERIFIED`. A Production GREEN release means this disabled-preview application built, passed its automated checks and was served from the production host; it does **not** authorize a real pilot.

## Operator-led workflow

1. Enter **Owner trial & gap triage** from the four-company shell, or via the QL-210 Safety & hold review shortcut.
2. Choose Rosie Dazzlers, Devil n Dove, iCamp or YW. Each has ten scenario cards covering inbox, Customer 360, follow-ups, telephone, consent, connector provenance, tenant isolation, reporting, keyboard/help and mobile/zoom.
3. Read the action and expected safety behavior. Open the linked mock workspace, perform a real manual *preview* observation, then return to the trial card.
4. Select `Not run`, `Observed pass (self-reported)`, `Observed gap`, or `Could not complete`. The system does not infer a pass from the presence of UI elements. Any self-reported pass is explicitly unverified.
5. For an issue, enter the **fictional, non-personal** observation note and select repair area and impact. The triage list orders findings `P0 → P3`, with blocked tests at `P1`, and shows suggested corrective work. This screen cannot mark a finding closed or create an owner approval.
6. Review the all-company coverage table. Each company's observation notes are shown only while that company is selected. Changing workspaces/companies preserves the draft for the **current open app session**; reload discards it.
7. Use the optional read-only JSON receipt to copy an anonymized **status-only** summary. Free-text notes, names, device identifiers and owner attestations are not exported. The explicit two-step reset clears only the chosen company's in-memory draft.

## Acceptance gates

- Ten unique scenario IDs per company; forty manual scenarios start `not_run` even when QL-210's forty automated checks pass.
- Company-isolated ledger with independent counts and triage; no cross-company note visibility.
- Explicit outcome change required for an observation. `observed_gap` maps critical/high/medium/low to `P0/P1/P2/P3`; `blocked` becomes `P1` follow-up.
- A maximum 240-character fixture-only note, no note in the copied receipt, no network/localStorage/IndexedDB writes or backend identity capture.
- Keyboard-focus indicators and narrow-viewport layout for the trial workspace; actual assistive-technology and phone acceptance must still be performed by an owner/reviewer.
- QL-181's twelve independent holds, zero real writes/sends/calls and `livePilotReady: false` are invariant under every local observation.
- Regression: TypeScript, Vitest, app build, Pages build, feature PR green, `dev` integration and `main` promotion; exact `main` checks and served marker must both be verified before calling Production GREEN.

## Next proposed build (not automatically authorized)

**QL-212 — Four-Company Trial Finding Replay & Repair Evidence Queue.** Add repeatable synthetic reproduction packs per recorded gap, owner-safe repair assignment and a formal retest queue, with the same preview-only dispatch/approval holds. Actual gaps and severity need owner observation; empty queues should remain empty, not fabricated as real findings.
