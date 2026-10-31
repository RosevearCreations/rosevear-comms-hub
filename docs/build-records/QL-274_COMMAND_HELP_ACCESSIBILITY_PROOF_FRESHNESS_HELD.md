# QL-274 — Command Help Coverage Audit, Operator Preference Accessibility Review & Six-App Proof Exception Freshness (HELD)

## Interface implementation

1. Added a fourth **Help & proof review** disclosure in the command guidance toolbar, shared by IT Command, Management, Analytics and System Status.
2. The review calculates actual in-code help coverage from QL-273 content: four page-purpose/interpretation/next-step guides and sixteen KPI-specific ⓘ descriptions. It explicitly limits the claim to the four QL-271 command views, not all historical operator workspaces.
3. The operator preference review displays the selected browser-local profile, density, nonprivileged role-preview label, at-least-one-card-per-view state and an accessibility checklist. Screen-reader/device acceptance stays **manual review pending**, not claimed as automated WCAG certification.
4. Preference changes now announce their text status with `role=status`/`aria-live=polite`; metric help uses a live region. Normal keyboard focus, shortcuts, input suppression, reduced-motion and forced-colour support remain in place.
5. The same review includes six immutable GitHub source links and a timestamped HTTP 404 exception ledger. The IT System Status panel and Connections inspector display the new results; the previous QL-270 observation remains a separately dated historical receipt.

## Real public source-proof recheck

Checked **2026-10-31T00:22:45Z** using read-only public GitHub requests. Each source SHA was first retrieved from its public `main` ref. The exact proof target was `docs/integration/ql246-source-proof.json` at that immutable SHA.

| Source application | `main` SHA at check time | GET result |
| --- | --- | --- |
| AI Data Platform | `79a90aa17c2f04b77b27bd3eca54dbdc50d87fe5` | HTTP 404 |
| Devil n Dove (`devilndove-site`) | `3d47209aa9966ec3d7d994190ef6c0939d0ad5b3` | HTTP 404 |
| Rosie Dazzlers | `565e6142b7a928cf6707b6d227f229ae6ef9c428` | HTTP 404 |
| Yard Workers (`yw`) | `29378a0c9050652f05882a280445750d4a881074` | HTTP 404 |
| iCamp | `219251ee433d745a236ac19c682a3a453db72463` | HTTP 404 |
| Rosevear AI Hub | `4db6746cbb862b5a4b972c918601ef5c6f3ee927` | HTTP 404 |

These are **freshly collected historical public observations**, not authenticated gateway GETs or cryptographic proof verification. They become stale after 24 hours; a changed main SHA also requires another recheck. Client-side rendering performs no network requests. A future HTTP 200 would mean only that the file exists, never that the original signer/pin, independent witness, tenant isolation or owner TEST authorization passed.

## Release and security boundary

- Six source systems remain **DISCONNECTED / HOLD**. Accepted signed Proof-B: 0/6; independent authorizations: 0/6; authenticated TEST GETs: zero; no live calls, SMS, dispatch, customer records, or relay traffic.
- No new localStorage key, raw frontend fetch, Supabase write, secret, tenant identity or provider activation introduced. QL-171 fail-closed source baseline must remain GREEN.
- QL-273's valid profile recovery remains local-only. Role previews cannot grant privileges.
- The owner-supplied Cloudflare screenshot on 30 October 2026 confirms the production Worker is `https://rosevear-comms-hub.devilndovelive.workers.dev/` and QL-273 was Ready there. An older documented `jfrosevear.workers.dev` hostname is not the current production target; QL-274 promotion should verify the correct domain.

## Verification and promotion gates

- `npm run verify:ql274`
- `npm --prefix app run test` and `npm --prefix app run build`
- `node scripts/__tests__/ql171-operator-baseline.test.mjs`
- PR check success → `dev` merge → Cloudflare Workers build success → `main` PR check and merge → exact-main GitHub checks success → HTTP 200 plus QL-274 markers in the correct Workers bundle.

## Next planned build

**QL-275 — Guided Operator Help Navigation, Accessibility Owner Walkthrough & Signed Proof-B Exception Routing (HELD)**. Add contextual paths from guidance to the source screens, owner-observable accessibility acceptance steps and actionable but nonauthorizing proof exception handoff decisions. Runtime connection, communication and tenant-release gates remain held.
