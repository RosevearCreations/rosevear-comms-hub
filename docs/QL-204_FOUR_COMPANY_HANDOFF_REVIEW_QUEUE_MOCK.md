# QL-204 — Four-Company Connector Handoff Review Queue (Mock)

QL-204 follows the completed QL-200–203 company-specific connector previews with an operator-oriented review queue. This scope is the next functional step defined after the existing four-connector queue; no previous QL-204 specification was found in the repository.

## Functionality

- A company-scoped **Handoff review queue** inside the existing Connector Centre.
- Composes the four prior allowlisted, fictional connector adapters without copying contact records into a global feed: Rosie Dazzlers (2), Devil n Dove (2), iCamp (2) and Yard Workers (4 available, 1 held by the disabled sample module).
- Shows topic, inbound source, category, staff-review prompt, synthetic priority and reference for the currently selected company only.
- Gives the operator filters for pending mock review, all synthetic records and high priority; supports local search and opening the corresponding fictional inbox thread.
- Allows undoable **reviewed in this session** flags, which are deliberately local browser state, reset on organization switching, and are never described as live approval, assignment or persisted status.
- Contextual ⓘ Help and responsive layout for narrower screens.

## Strict safety boundary

QL-204 introduces no API clients, synchronization, phone/SMS runtime, real customer reads, new database migration, exports, or persistence. Connector sample maps remain company-gated. A held sample cannot enter the review queue. Neither selecting a thread nor flagging a sample as reviewed creates an external handoff, service job, quote, booking, reservation, invoice, published listing or message. UI brand switching is not a server authorization grant.

## Release acceptance

Run `npm run check`, `npm test`, `npm run build`, `npm run pages:build` in `app/`. Tests verify expected per-company counts (ten available, one held), exact contract identity, no cross-organization leakage, search/filtering and temporary review-state reset. Promote through `dev` and `main`; verify exact-main checks, source parity and published Pages marker `ql204-four-company-handoff-review-mock-v1` before GREEN.
