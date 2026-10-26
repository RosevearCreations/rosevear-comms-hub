# QL-207 — Supabase Persistence & Tenant Isolation Sandbox

The agreed four-application roadmap places this build after QL-206's fictional role-and-tenant permission tests. It prepares persistence behavior and a future Supabase RLS contract without connecting the public Quo-lite preview to the real database or introducing writes to the existing project.

## Delivered operator functionality

- **Connector centre → QL-207** presents an offline in-browser persistence rehearsal for Rosie Dazzlers, Devil n Dove, Camp Rosevear (iCamp), and Yard Rosevear (YW).
- Choose a fixed fictional persona and eligible fictional inquiry. Save one of two fixed mock stages into a short-lived in-memory record with a revision number.
- Replaying an identical request key returns the same result without advancing the revision; reusing that key for different content is rejected.
- A stale expected version is rejected. A normal follow-up save advances the version by one. Clearing the sandbox or switching companies discards its records and idempotency receipts.
- Each invented operator's **scoped read** only shows records matching the company's handoff allowlist and QL-206 role/tenant/property design rules. Foreign owners, signed-out personas, other campgrounds, wrong YW companies or properties, tampered sources, and held tree-care requests are denied.
- Functional ⓘ Help, responsive selectors, status announcements and clear preview-only notices. No free-text input so the sandbox cannot be used to enter real customer information.

## Supabase-targeted private schema proposal

`docs/QL-207_PRIVATE_SUPABASE_SCHEMA_PROPOSAL.sql` is a **non-executed, explicitly non-migration** proposal. It illustrates private-schema membership and append-only draft snapshots, forced RLS, selected membership-driven read/insert policies, optimistic-concurrency and idempotency uniqueness, and no anon/authenticated grants. It is intentionally outside `supabase/migrations/` so GitHub's existing Supabase integration cannot automatically apply it.

The current `supabase/config.toml` exposes `public` and `graphql_public`, **not** the proposed `ql207_sandbox` schema. Existing synthetic public tables, migration history, provider integrations and owner holds remain unchanged. A separate owner-approved development database, token-authenticated SQL tests and review of tenant authorization are mandatory before any actual execution.

These safeguards follow [Supabase's Row Level Security guidance](https://supabase.com/docs/guides/database/postgres/row-level-security). The [Data API exposure behavior](https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically) reinforces that SQL grants and API exposure require independent review. A simulated policy decision cannot prove a real database policy.

## Acceptance

Run `npm run check`, `npm test`, `npm run build`, and `npm run pages:build` in `app/`. Automated acceptance covers all four company boundaries, exact retries and changing-payload conflicts, stale revisions, forged roles and sources, cross-tenant reads, UI session reset and zero network/storage adapters. Do **not** apply the SQL proposal in QL-207.

Promote through `dev` and protected `main`; verify every required exact-main check is GREEN, no `dev`/`main` file difference, and the published Pages asset contains `ql207-supabase-tenant-persistence-sandbox-mock-v1`.

## Next expected build

**QL-208 — Secure Provider Webhook & Messaging Gateway Sandbox.** Validate fabricated incoming provider events, signatures/nonce/replay rules, tenant-specific routing and a permanently disabled outgoing queue without connecting a real phone, SMS, website, campground or PMS provider.
