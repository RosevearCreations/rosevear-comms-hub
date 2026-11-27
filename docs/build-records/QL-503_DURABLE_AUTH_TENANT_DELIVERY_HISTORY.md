# QL-503 — Authenticated, Durable Tenant-Scoped Delivery History and Real Provider Receipt Reconciliation

**Source of Truth:** the owner's 26 November 2026 Rosevear all-applications instructions. **Owner direction:** original Windows and Master provider preliminary stages 1–2 were reported already handled; do not request repeats, verification screenshots, log monitoring or cross-application data entry. Each application advances independently under protocol 1.1.

## What QL-503 actually implements

1. New **live Comms-only Supabase schema**, applied to project gxujcwpktaickcgzyvnu as migration 20261127124701:
   - ql503_tenant_read_grants — no seeded memberships; every record requires an authenticated Supabase user, exact source-app identifier, 64-character tenant digest, explicit source-approval receipt, active state and expiration
   - ql503_delivery_messages — append-only original source signed message-version metadata (source app, thread/tenant/content/source-packet digests, message ID, version and dates); **no customer body, phone, email, invoice or raw signing material**
   - ql503_delivery_evidence — append-only, exact-tenant, message-version-linked ACCEPTED, DELIVERED and inbound old-version REPLY evidence; separate provider receipt ID; signed packet digest and source identity classification
   - server-role-only, SECURITY INVOKER, atomic ql503_record_verified_delivery RPC. Immutable message conflicts and duplicate evidence IDs fail closed; signed delivered events require a previously accepted event; obsolete replies require a real later version
   - all three public tables FORCE RLS, client write grants revoked, anon read denied, authenticated read only with current exact-tenant grant
2. Private Node importer: ql503-durable-verified-import.mjs. It verifies the original business-source Ed25519 signature, **separate pinned provider Ed25519 signature**, expected tenant/brand, expiry, event/version, ordering and an original source-signed reply using the QL502 verifier **before** calling a separately supplied server-only RPC gateway. No service key is in code, browser or GitHub.
3. Existing QL192/314 inbox now includes the separate QL503 authenticated read-only ledger panel, beside QL502's clearly fictional rehearsal. A ready authenticated Supabase session automatically checks its own current source-approved tenant read grants and then fetches only the RLS-filtered rows. The component never accepts an arbitrary tenant ID, provider secret or service-role key. It shows SAVED, ACCEPTED without DELIVERY, PROVIDER-DELIVERED SIGNED CLAIM and OUTDATED REPLY distinctly. No send buttons.
4. Node tests: forged source/provider, stale/cross-tenant receipt, old-version reply, duplicate replay, no-key/no-gateway, server RPC success and error, no customer sends.
5. React/Vitest JS DOM tests: no grants, guest/anonymous denial, exact tenant, bad scoped response, saved-vs-delivered meaning, existing actual inbox integration, no automatic network in disabled preview; accessibility styling. Python offline cross-language tests.
6. A directly executed **connected Supabase rollback-only SQL test** verified a service-role atomic import and a real authenticated-role RLS read of one temporary permitted tenant while an unrelated tenant remained invisible. The inserted test grant/records were rolled back. No fake provider receipt was persisted.

**Caution:** An independent provider-signed DELIVERED claim means the provider claims it delivered, not that a human read it. Actual network observation, human acknowledgement, authenticated guest/staff acceptance and original physical Windows device proof are independent external requirements. They were not fabricated or marked GREEN by this build.

## Stages and ownership — no more owner polling

**Already reported by owner:** original host and provider preliminary steps 1 and 2. QL503 does not request repeating these. The remotely connected Supabase environment still has zero active child grants and zero provider messages. That is an **observed Comms DB state**, not a statement that owner Windows tasks were not done.

### Autonomous Comms-owned work (performed now)

- Inspect Comms GitHub dev/main and Supabase schema; reconcile with 26-Nov Source of Truth.
- Apply secure QL503 migration in the Comms project alone, with zero automatic enrollment or cross-project database writes.
- Run SQL RLS, durable write/replay, anonymous/no-grant and cross-tenant negative tests with transaction ROLLBACK.
- Implement server-only verified packet import and React read-only operator ledger.
- Run offline Node, Python, TypeScript, React and inherited security and application tests.
- Merge scoped dev and main PRs after CI PASS and verify exact-main production Linux, Windows and public Worker JS/CSS SHA256 parity plus successful GitHub Pages preview rebuild if triggered.
- Update Comms Hub issues with exact code and DB evidence, leaving field evidence HOLD.

### Independent work we do NOT wait on

iCamp Site 12 visitor data, Yard Workers source telemetry, Devil n Dove order events, Rosie Dazzlers booking records, other applications' credentials, original Windows physical operations, and independent provider account enrollment may each progress at different times. Their missing source-signed data **must not block** QL503 code, safe DB, build tests, other operator work or source-independent Comms Hub improvements. Do not fabricate memberships, phone messages, guest replies, sender verification or a live provider connection to compensate.

### When actual owner action is needed — **nothing to do now**

Only after the Comms operator identity and independent source/provider consent are ready for a genuine limited field pilot, the one remaining owner action is to approve **one actual controlled source-app tenant membership and its provider test recipient** in the owning systems' authorized private process. We will identify the exact screen/action and scope when that work is genuinely actionable; we should never be asked to monitor GitHub, watch another app, post a private key, repeat PowerShell inventory or keep seven windows synchronized. Without such authority, continue the next *independent Comms feature* and mark only the live field pilot HOLD.

## What constitutes "ready" for this build

Code GREEN: exact scoped dev merge + scoped main merge; exact-main app and Windows CI; QL503 node, JS DOM and Python checks, asset JS/CSS SHA parity. Supabase schema APPLIED and SQL permissions/dedup/RLS verified; no forced live activation.

Field HOLD: no original provider delivery in Comms DB, no source-approved active child tenant grant, no authenticated guest/staff browser sessions (public preview deliberately disables hosted data), no observed source signer/recipient webhook. QL502 demo/QL501 Master ACK are **not real customer delivery**. Do not conflate.

## Safe status checks (only if a specific issue arises later)

Connected Supabase project > SQL editor: read-only SELECT count(*) from public.ql503_delivery_messages and public.ql503_tenant_read_grants; never copy customer messages or keys. In GitHub, the release record links to the exact production CI and immutable commit SHA. These are diagnostics, **not tasks we must monitor**.

## Next independent Comms-only gap

After QL503: **QL-504 — Comms-Owned Signed Receipt Import Worker, Private Replay Recovery and Real Tenant Operator Readback**. Build service-level endpoint integration, authenticated worker custody, encrypted server-only environment bindings, durable retry/queue telemetry and controlled Comms-owned consent-safe test events, without requiring iCamp/YW/other apps to be ready. Keep live provider integration disabled until its separately controlled signer/receiver actually exists. No imaginary completeness percentages.

## References

- User Source of Truth (26 November 2026)
- QL501 original source-signed trial: docs/build-records/QL-501_ORIGINAL_SOURCE_SIGNED_MASTER_TRIAL.md
- QL502 versioned reply and provider ACK truth: docs/build-records/QL-502_BRANDED_DELIVERY_VERSION_REPLY_TRUTH.md
- Supabase row-level security and data-API grant guidance, current November 2026: https://supabase.com/docs/guides/database/postgres/row-level-security
- Current Comms GitHub issues #1038, #1041; original independent field HOLD preserved.
