# QL-336 — Rosie Dazzlers and Devil n Dove owned-child shell preparation

**2026-11-04 (America/Toronto)** · This is an additive, fail-closed code release; it is **not** a tenant backfill, live connection or production provider rollout.

## Delivered in source code

1. **Comms Hub:** canonical Ed25519 broker TEST challenge now recognizes `rosiedazzlers` and `devilndove` as *future platform shell identities*, never first-child business identities. It refuses to prepare or accept their signed TEST challenge without **all three** separate source-specific predicates: verified original backup, approved source migration, and independently verified cross-child isolation. The existing YW and iCamp protocol stays compatible.
2. **Rosie Dazzlers:** new shell-level `GET /api/integration/v1/shell/{health,capabilities}` handlers return `503 HOLD` until original authority exists; wrong child selectors and mutating methods fail earlier. The proposed four-table Supabase migration has no legacy booking/customer/payment/asset backfill, no active membership, no client grants, and `ENABLE` + `FORCE` RLS on every table.
3. **Devil n Dove:** equivalent shell GET boundaries always return HOLD, with no Etsy/listing/order/media/customer reads or writes. D1 canonical migration 0051 defines pending children, memberships, exclusive legacy resource claims and opaque provider-handle references, with no live data change or active child. D1 lacks native RLS, so its eventual query/route/storage isolation requires independent server-side test and review.
4. **Owner I.T. screen:** shows first child versus future platform shell, separately linked source code, current inactive schema, exact held GET paths and original authorization prerequisites.

## Deliberately NOT completed or activated

- No original source data backup was independently verified for Rosie or Devil, so **source migrations/backfills are not applied or activated here**. Legacy business operation stays as-is; existing booking, product, checkout, payment, Etsy, media, fulfillment and staff endpoints have not been rewritten into multi-tenant APIs.
- Neither source may enroll a second business. Every new registry/claim row, if a reviewed migration is later applied, remains `PENDING` and non-authoritative by schema construction.
- No source owner signed external TEST, independent issuer key, broker workload, managed KMS handle, nonce store, real source-signed GET receipt, private origin or production consent is available. The new routes therefore return HOLD even if a caller sends a forged envelope. **0/2 authenticated; 0/6 external connected**.
- Master Supabase QL-336 migration adds only two held source profiles and immutable false-gate metadata; it neither grants new RLS access nor changes the existing two source profiles or signed receipt history.

## Required independent acceptance before source database conversion

1. Confirm actual Rosie Supabase and Devil D1 database backups, rollback exercise and canonical migration checksums. Apply additive migrations to development first, verify counts/constraints/roles, then separately authorize production.
2. Review every existing customer, booking, payment, provider, product, media, asset, order, inventory, export and service-account query/storage path. Attach explicit shell, child and verified principal scopes and demonstrate cross-child **403/no-rows**, including direct API and object-storage URLs.
3. Ensure separate Etsy/Stripe/PayPal/media/fulfillment provider ownership and secret storage per child, with no shared-browser key or first-child fallback. Retest legacy owned-business behavior.
4. Verify original signer and source owner, both TEST approvals, broker workload and managed key, nonce atomicity, pinned private nonproduction origin and independent signed receipt. No synthetic fixture is acceptance proof.

## Gate evidence

- Comms protocol negative/crypto tests: `node --test runtimes/shell-handshakes/protocol.test.mjs`.
- Rosie scope and RLS migration safeguards: `node --test scripts/ql336_owned_child_shell_test.mjs`.
- Devil scope and canonical D1 SQLite constraints: `node --test scripts/release467_build610_ql336_child_shell.test.mjs`, `python3 scripts/migration_policy_gate.py`.
- Comms JSX/TypeScript/production build and `ql336ChildShellReadiness.test.tsx` must pass before PR merge. Required GitHub and actual deployment checks must be separately observed.

## Next prioritized build

**QL-336A — CI Workflow Consolidation, Required-Gate Preservation & Safe Merged-Branch Cleanup.** Inventory current required check names and independent release gates first; consolidate overlapping runs without removing protected security, RLS, migration, artifact or production checks. Delete only confirmed fully merged, unreferenced feature branches; keep `dev`/`main` and any active PR, protected, or release provenance ref. Do not force-merge or bypass branch protection to reduce queue time.
