# QL-206 — Secure Operations: Company, Role & Tenant Access Testing

QL-206 follows QL-205's fictional handoff review desk. The earlier four-company roadmap called for secure-operations/organization-access testing, not a production authentication rollout. This build adds an operator-facing, explicitly **non-authoritative** permission test surface inside Connector centre for Rosie Dazzlers, Devil n Dove, iCamp and YW.

## New operator workflow

1. Select **Connector centre** and inspect the **QL-206 · Secure operations** panel.
2. Choose one of twelve fixed fictional personas (including signed-out, business-specific viewer/reviewer/manager/owner, a different campground tenant, and a different YW company).
3. Choose an allowed fictional connector handoff and a proposed operation: inspect summary, edit rehearsal, prepare fictional packet, or send a message.
4. Read the policy-design outcome and the **always disabled** actual runtime state. Record at most eight recent, session-only test results; clear them or switch organizations to reset.
5. ⓘ Help explains the boundary and recommended denial scenarios. Mobile screens adapt the selectors and result panel.

## Pure decision contract

- Start with the exact connector contract and a source item still eligible through QL-205/QL-204. Missing, held, cross-company, altered reference/thread or mismatched contract is denied.
- Only fixed, invented persona object instances qualify for testing. A copied/tampered object is rejected; this is **not** a credential-verification substitute.
- A persona must match the active business. iCamp personas additionally match a campground tenant; YW personas match a company tenant, and optionally a specific property. YW's disabled tree-care sample never qualifies.
- Read-only roles can inspect; reviewer roles can also edit fictional rehearsal drafts; manager/owner roles can also prepare fictional packets. No role can send messages. Every supposed match is presented as **DESIGN MATCH · RUNTIME DENIED**, with `verifiedIdentity: false` and `runtime: disabled`.
- No localStorage/sessionStorage, backend call, Supabase policy or table, provider credential, authentication, webhook, persistence, export, dispatch, quote, booking, approval, message or work order has been changed or invoked.

## Real security remains held

An operator-selectable persona is not an authenticated identity; a browser view is not an access-control boundary. A genuine rollout would need private-server authentication, business and tenant membership checks on every request, record-level permission for iCamp/YW, role grants under owner governance, consent/privacy verification, immutable audited decisions, attack testing, and explicit owner approval. The public disabled preview must never be described as live secured operations.

## Acceptance and promotion

Run in `app/`: `npm run check`, `npm test`, `npm run build`, `npm run pages:build`. Tests cover all four organizations, cross-company owner denial, signed-out denial, least-privilege roles, iCamp tenant isolation, YW company/property isolation, disabled outbound action, forged/held/mismatched fixtures, and UI session reset. Promote via feature PR to `dev`, then reviewed PR to `main`; verify all exact-main checks GREEN, `dev`/`main` file parity, and the public Pages marker `ql206-four-company-secure-operations-mock-v1`.
