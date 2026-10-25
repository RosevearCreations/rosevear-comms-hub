# QL-203 — YW Property Service Request & Job Inquiry Connector (Mock)

## Delivered

- A Yard Workers-only mock connector in the QL-199 Connector Centre, with fictional **Yard Rosevear** and separate isolation-test tenant.
- Four successful fictional inquiries: snow removal scheduling, urgent septic triage, sticker/contract-based rural garbage collection, and lawn-care renewal. A fifth tree-care inquiry intentionally demonstrates a disabled service-module hold.
- Explicit mock company tenant, property, enabled service module, channel and source-thread checks before a normalized staff-review handoff appears. Rejects wrong organization/contract, cross-tenant properties, property mismatches, disabled modules and unknown requests.
- Responsive inquiry panel, synthetic service-module registry, contextual ⓘ Help, and a way to open the corresponding fictional inbox conversation.

The adapters are static TypeScript fixtures, not PMS clients; sample property labels and records are fictional and have no relationship to live YW production tenants.

## Held operations

No real property lookup, tenancy or authorization, crew availability, estimate, contract, work order, dispatch, invoice, balance update, service acceptance, outbound SMS or email is performed. Urgent septic requests require staff triage and are **not** automatically dispatched. Owner-approved live service workflows require backend authentication and per-company/per-module/per-property permissions, explicit approval, audit and privacy controls, idempotency and integration tests before any separate enablement release.

## Acceptance

1. Select **Yard Workers → Connector centre**. Choose fictional demo company, property and inquiry; preview a staff-review-only mapping and open its sample inbox thread.
2. Choose a different property for the snow example or switch to the isolated company and verify no preview leaks across property or tenant boundaries.
3. Select the tree-care held example to verify service-module rejection and switch to another organization to ensure the YW panel resets and disappears.
4. Run `npm run check`, `npm test`, `npm run build`, and `npm run pages:build` in `app/`. The QL-203 regression test covers four valid synthetic requests, every major negative gate, and the user interface.
5. Promote using PRs into `dev` and `main`. Verify exact-main checks, source parity and published Pages marker `ql203-yw-property-service-mock-v1` before declaring Production GREEN.
