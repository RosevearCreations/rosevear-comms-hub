# QL-325 — Immutable Proof, Independent Authority & Connection Gate Readback

## What the disabled preview does

I.T. Command adds one six-source, read-only proof/authority board immediately after QL-324. For each source, an operator can select the app, review five independent blockers, open immutable public proof URLs, and inspect the dated QL-270/289/290/303/325 source-pin history with explicit SHA changes. It distinguishes public `200` (present but not authentic), `403` (forbidden), `404` (missing), `429` (rate limited), `401`, timeout and unexpected error without granting any permission. Diagram and tenant boundaries remain in QL-324.

All six source connections stay **DISCONNECTED / HOLD**. Four independent business tenants (Rosie Dazzlers, Devil n Dove, iCamp, Yard Workers) are separate from AI Data Platform reporting and Rosevear AI Hub private edge. Support systems cannot become customer tenants; private relay remains OFF. No customer data, credentials, Supabase mutation, source gateway GET, provider write, live call/SMS, email/ACK, independent attestation or owner sign-off occurs.

## Real public-only observation

- Read completed: **2026-11-03T16:32:38Z**. The six unauthenticated, credential-free GitHub Contents `GET` requests were made against the exact `docs/integration/ql246-source-proof.json` path using the QL-303 immutable commit pins. Each returned **HTTP 404**. The completion timestamp is for the batch, not a separate per-source measurement. No authenticated GitHub request or private source endpoint was used for this observation.
- Pins and repositories are read from QL-303/QL-324, and dated historical sources from QL-270, QL-289, QL-290 and QL-303. Earlier QL-270 result was at the moving main ref; it must **not** be represented as an immutable file read. Source pin drift means the recorded SHA changed, not a change in evidence authority.
- Public 200 would prove only file availability; it cannot validate signer identity, detached signature, custody chain, tenant isolation, scoped TEST identity or owner approval. A 403/429 makes proof availability unknown rather than affirmatively missing.
- Snapshots are not continuous monitoring; after 24 hours the UI says the readback is stale. An owner must independently obtain authentic new evidence. Clicking the public reference link is deliberate browser navigation only; the app itself makes no requests.

## Five gates (all unapproved, independently per source)

1. Genuine signed original Proof-B supplied at verifiable immutable origin.
2. Independent source issuer, signer key, reviewer, custodian and witness authority verified.
3. Isolated nonproduction business tenant independently authorized (support services cannot be tenants).
4. Least-privilege TEST-only identity approved for GET health/capability contract paths.
5. Explicit owner TEST authorization for the exact scope.

**There are 0/30 approved gates, zero authenticated gateway GETs, zero source writes and zero authorized source connections.** ACK Delivery Evidence remains **UNDER_REVIEW / PARKED_FOR_LATER**.

## Verification and release acceptance

Focused test: `npm --prefix app test -- src/operator/__tests__/ql325ProofGateReadback.test.tsx`. Full regression: `npm --prefix app test -- --maxWorkers=1 --isolate=false --testTimeout=60000`; TypeScript/Vite: `npm --prefix app run build`; safety: `node scripts/ql171-operator-baseline.mjs`. Production GREEN also requires the exact `dev` → `main` promotion, required app/disabled preview/Supabase/Cloudflare checks and a live deployed asset verification. This document alone is not a release receipt.

Next queued software-only build **QL-326 — Nonsecret Connection Configuration Matrix & Environment Preparation Guide**, subject to independent authorization and promotion gates.
