# QL-440 — Fresh Original-Host Ceremony Authorization Issuance, Independent Receiver OFF Revalidation & Three-Master Activation-Prerequisite Decision

## Safety and decision boundary

QL-440 consumes the **actual protected QL-439 one-use PENDING and READINESS custody receipts** plus an externally verified QL-439 result. It is a fresh authorization to **attempt a separate QL-429/QL-430 supervised challenge**, not an authorization to turn on a receiver, connect any Master, or run a pilot. Both positive and negative paths retain `connection=HOLD`, `activationAuthorized=false`, and `slaveGate=HOLD_NEXT_MASTER_INTEGRATION_STAGE`. Only the successful issuance path reports `ceremonyAuthorizationIssued=true`; that statement is narrower than activation authority.

CI uses synthetic Ed25519 signing keys and mock adapters. It does **not** provision new live host signing keys, enroll the external source/independent receiver, perform a real Windows watchdog check, or authenticate a physical receiver. A copied or manually edited local ledger is not an independently trusted external system.

## Protected original-host ceremony sequence

1. On **DESKTOP-AE894KC**, establish a fresh protected original-owner session and separately verify the QL-439 source evidence. Require exact QL-439 state `DURABLE_QL439_NEW_CEREMONY_REENTRY_READINESS_ONLY`, unchanged incident, new and distinct ceremony/episode, QL-439 renewed anchor and independent reader SHA-256 digests, three-Master readiness, dual signed preparation-only decision, and protected QL-439 PENDING/READINESS receipt digests.
2. Generate a **new ceremony challenge nonce** distinct from QL-439's renewal nonce. Prepare the request with exact incident/ceremony/episode IDs, protected QL-439 receipt digests, renewed anchor and independent reader digests, and `NEW_CEREMONY_CHALLENGE_ONLY_NO_RECEIVER_ON` action.
3. Before any live external calls, atomically claim an exclusive `PENDING` QL-440 incident record in a protected absolute directory (0700), with file mode 0600, file+directory fsync, and exact readback. A crash or failed readback consumes this incident attempt; do not auto-retry and risk duplicate issuance.
4. Require fresh, separately pinned **signed original-host OFF observation** from **DESKTOP-AE894KC**, watchdog armed, positive OFF sequence, and exact request/nonce binding.
5. Require a **separate independent receiver observer**, signing `OFF` no earlier than the host witness, with a non-decreasing OFF sequence and exact signed host OFF digest. Never accept an unsigned provider response, stale OFF, `ON`, TEMPLAR as source host or a recycled signer pin.
6. Require three fresh signed `PREREQUISITES_ACCEPTED_NEW_CEREMONY_CHALLENGE_ONLY_NO_ON` decisions from **rosevear-ai-hub**, **rosevear-comms-hub** and **ai-data-platform**. Each decision binds the precise request and independent receiver OFF digest; the aggregate digest is canonicalized by fixed Master order.
7. Require **two distinct independently verified owner/reviewer signatures** over the narrow `ISSUE_FRESH_CEREMONY_CHALLENGE_AUTHORITY_ONLY_NO_ON` decision, binding the same request, independent OFF digest and ordered Master decision digest. An approval to switch ON fails closed.
8. Require the **original host's separately pinned signed issuance** over the narrow `FRESH_QL429_QL430_CEREMONY_CHALLENGE_ONLY_NO_RECEIVER_ON` authority, binding both owner and Master decisions plus the fresh OFF digest.
9. Recheck protected QL-439 receipts and QL-440 PENDING custody; claim one-use fsynced `ISSUED` receipt with all resulting hashes. A successful run returns `DURABLE_QL440_NEW_CEREMONY_AUTHORIZATION_PREREQUISITES_ACCEPTED` and **still** `connection=HOLD`, `activationAuthorized=false`. No receiver ON API exists in QL-440.
10. A later boot reading only private QL-440 issuance MUST return `QL440_DURABLE_PRIVATE_ISSUANCE_NEW_OFF_AND_OWNER_CHALLENGE_REQUIRED`; prior issuance does not establish physical OFF **now**, key possession **now**, or live connection **now**.

## Regression and production gates

- Positive synthetic original-host OFF + independent observer + three distinct Master decisions + dual-owner signoff + original-host issuance and one-use custody.
- Negative wrong host, ON, missing watchdog, stale/forged independent OFF, sequence rollback, missing/duplicate/ON Master, broadened owner or issuer action, reused key, prior receipt drift, old nonce, interrupted issue, tampered private ledger and replay.
- GitHub protected audit QL-417–440 plus app/Windows checks; promote identical scoped files to dev and main without merging unrelated divergent history; verify exact post-merge production SHA and deployed Worker artifact parity before claiming Production GREEN.
- Keep physical receiver OFF and source connection HOLD until a separate real original-host, independently witnessed activation ceremony is executed and owner-approved.

## Master Shell interface alignment from attached reference PDF

The owner-provided 31-page *Generic Workshop Operations Application UI & Workflow Recreation Specification* provides a **visual/design pattern**, not real Rosevear production data. Use its page 2 ten-screen visual index, page 5 Admin Dashboard, page 19 Analytics & Reports, page 23 Settings & Configuration, page 25 shared shell, and page 31 delivery checklist as the basis for new design tokens and operational cards.

- **Master layout:** deep navy/black application surface, purple current destination, persistent top identity/build strip, contextual left workspace rail, rounded cards, semantic green/amber/red/blue indicators, quiet purple actions, accessible contrast; desktop two navigation layers, tablet grouped rails, mobile drawer/bottom navigation.
- **Three Master planes:** AI Data Platform = intelligence/analytics/telemetry; Comms Hub = inbox, routing, tasks/operations and signed receipts; Rosevear AI Hub = original Windows host, device/runtime status and local diagnostics. Show separate authorization gates; presenting them side by side never grants cross-plane authority.
- **Product shell oversight:** Yard Workers and iCamp link at *product shell* level, with read-only aggregate status/capacity/scheduling views and separate business/tenant contexts. Devil n Dove and Rosie Dazzlers keep distinct brand/tenant workspaces.
- **Reusable instruments:** health/KPI cards with source, observedAt and comparison interval, audit/event stream, incident timeline, responsive queue/kanban, capacity chart and trends, filters/bookmarkable location where applicable; do not hardcode screenshot metrics, fabricate LIVE badges, or confuse CI GREEN with receiver CONNECTED.
- **Phasing:** (1) shared design tokens + owner command shell; (2) three Master read-only health and action navigation; (3) YW/iCamp shell read-only adapters; (4) brand-scoped workflows; (5) full responsive and accessibility regression. QL-440 implements only the **first CSS alignment pass for the protected personal owner landing**, not a complete rewrite of all ten functional screens.
- **Safety:** status-only views never issue QL-440 signing events from browser clicks. Authentic, authorized, domain-specific services own all mutations; no credentials exposed to the browser; access enforcement remains server-side.

MASTER360-COMMS-QL440 | original-host=DESKTOP-AE894KC | predecessor=EXACT_DURABLE_QL439_PRIVATE_PENDING_AND_READINESS | host=NEW_SIGNED_OFF_WATCHDOG_ARMED | observer=FRESH_INDEPENDENT_SIGNED_OFF | masters=THREE_SIGNED_CHALLENGE_PREREQUISITES_ONLY | owners=DUAL_SIGNED_NARROW_ISSUANCE | issuer=ORIGINAL_HOST_SIGNED_NEW_CEREMONY_AUTHORIZATION | ledger=PENDING_THEN_ISSUED_ONE_USE | connection=HOLD | activationAuthorized=FALSE | CI=SYNTHETIC_NOT_LIVE

**Next proposed QL-441 — Protected Fresh-Ceremony Challenge Consumption, Dual-Owner Runtime Authority Separation & Independently Witnessed Receiver ON Go/No-Go.**
