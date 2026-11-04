# QL-332 — Managed Vault/KMS, Peer Identity Bootstrap & Automated Rotation

## Actual scope and truthful status

The authoritative Comms Hub registry is the existing Supabase **rosevearcreations Project** (`gxujcwpktaickcgzyvnu`). The 2026-11-04 independent read confirmed six shell/support rows, zero Supabase Auth users and zero master principals/grants. The `supabase_vault` extension was installed (v0.3.1). Installation **does not** prove a key was provisioned, a provider trust root was commissioned, or source-owned peer authority exists.

QL-332 adds:

1. Five private `public.master_*` custody metadata tables with FORCE RLS and **no anon or authenticated privileges/policies**. They retain only verified issuer public-key fingerprints, opaque Vault/KMS handles, key versions, policy states, and nonsecret signed evidence digests. No key, peer, workload, rotation or owner record is seeded.
2. A separately packaged Node.js **private-broker rotation engine** (`runtimes/master-custody/rotation.mjs`). It checks a trusted database-issued scope, original issuer/source-owner/owner receipt digests, attested workload, handle version and expiry. It must atomically claim a unique shell/purpose job, stage a managed version without returning plaintext key bytes, verify both source and broker during a bounded overlap, then commit a compare-and-swap cutover and append signed receipts. Provider/peer failure quarantines the job; no cross-tenant fallback or permission expansion.
3. Read-only I.T., Management and System Status key-custody readback, including six required bootstrap gates and local negative boundary previews. Public code neither queries Vault nor performs source requests or mutations.
4. Automated negative tests for swapped issuer, wrong shell, wrong new handle, failed managed provider, missing approval, concurrent lease, replayed nonce, invalid receipt, expiry and emergency revocation.

**CUSTODY HOLD** means actual workload federation, live managed key issuance, a deployed rotation scheduler, real two-sided signing, customer data and peer access are **not established**. A passing unit-test key-provider stub is not an operational KMS. Do not claim live encryption, rotation or CONNECTED from that stub.

## Database contract

| New table | What it permits | What it prohibits |
| --- | --- | --- |
| `master_workload_identities` | Provider and attested private workload subject reference | Workload tokens, unverified active identity |
| `master_peer_issuers` | Exact shell/source issuer, public key SHA-256, pinned revision, original Proof-B/source-owner/custody hashes | Private JWK, unverified issuer promoted to VERIFIED |
| `master_managed_key_handles` | Opaque `vault:UUID` or `kms:...`, purpose/version, status and expiry | Plaintext secret columns, active handle without original receipts |
| `master_rotation_jobs` | One in-flight job per shell/purpose, old/new same-scope FKs, bounded dual-key window and two-sided verification digest | Parallel key takeover or cross-shell candidate |
| `master_custody_receipts` | Append-only idempotent hashes and event code | Browser read/write, update/delete of original receipt |

All five have RLS ENABLE + FORCE, no client policies and explicit revocation of `PUBLIC`, `anon` and `authenticated` table grants. A server-only `master_private` trigger rejects receipt UPDATE/DELETE. The `service_role` or trusted DB owner **can bypass RLS**, so never expose that credential to the SPA, logs or a general browser API. There is deliberately no `SECURITY DEFINER` public function, `pg_cron` task or deployed server endpoint in this build. DB constraints enforce structure; the **private broker plus original evidence** must enforce actual trust transitions.

## Required first-time source/key ceremony (one shell at a time)

1. Verify the real master owner's Supabase Auth sign-in, MFA and independent owner enrolment. A legacy `app_admins` email is not a credential or an authorization receipt.
2. Owner/security custodian approves the exact private broker deployment, issuer/audience, environment and workload identity (prefer ephemeral OIDC with short-lived scopes). Independently confirm workload attestation; do not paste bearer credentials into metadata tables.
3. Source owner supplies an authentic original signed Proof-B, pinned public signing key, issuer ID, source revision, and explicit **read-only nonproduction** TEST permission. Independently verify signature, custody, source control revision, issuer audience and signing key fingerprint. Do not manufacture signed approvals.
4. Security custodian provisions the private signing/encryption material **within approved managed Vault/KMS** using authorized out-of-band controls. The broker receives an opaque handle and narrow permission only; separate purpose and environment; never use `VITE_` variables, client-side secrets or per-child manual keys.
5. Register attested workload, source public-key fingerprint, original evidence digests and opaque managed handle **through an audited private service**. The service verifies referenced claims against their original issuers and stores immutable decision/denial receipts. Nothing should become ACTIVE based solely on a database row or an operator UI selection.
6. In an isolated nonproduction authorized TEST, independently prove managed encrypt/decrypt/sign, both sides of the signed peer contract, negative cross-shell checks, replay/nonce expiry and receipt origin parity. Only then authorize the private scheduler and rotation automation. Each child needs distinct source-owned tenant access; platform shell authority never implies child access.

This first-time trust ceremony cannot be completed autonomously while the owner has no authentic enrolled user and the source custodians have not provided original signed authority. The UI stays read-only until those external facts exist.

## Rotation and recovery contract

**Automatable once genuinely enrolled:** Inventory key expiry; propose DUE for each exact `(shell_id,purpose)`; atomically claim a lease; create an isolated new managed version; stage old+new during a bounded (1–24 hour) overlap; challenge both pinned signing sides with unique nonce/audience; verify independent source/broker receipt hashes; commit compare-and-swap cutover; retire old handle only after confirmation. Never rotate a root KMS encryption key merely to rotate an application key handle.

**Fail-closed:** On KMS outage, expired workload/key, unknown public fingerprint, revoked issuer, source denial, wrong shell/child, conflicting lease, replay, incorrect signed response or mismatch between both sides, quarantine that scope, preserve prior evidence, alert for verified owner/security review. A failed scope must not fall back to a different company/campground/key/host, automatically re-enable messaging or change grants.

**Emergency revoke:** The trusted broker needs an original separately authorized revocation receipt; revoke managed provider access first and persist the exact scoped revocation. No replacement owner/source grant is inferred. Confirm external peers reject the revoked key before re-enrolment. If key material was exposed, follow provider incident procedure and preserve custody logs.

**Rollback:** Disable the private scheduler and freeze new staging. Do not drop key/issuer/audit tables or erase signed history to make a status green. Existing QL-331 registry/customer tables remain untouched. Any destructive down migration or real-key rollback requires fresh owner/security review.

## Test matrix and independent evidence

- `node --test runtimes/master-custody/rotation.test.mjs`: real coordinator logic against controlled simulated adapters (not a real KMS).
- `npm --prefix app run test -- src/operator/__tests__/ql332CustodyReadiness.test.tsx`: accessible view, all six HOLD, no raw calls or browser writes.
- `npm --prefix app run check`, full app test suite and production build.
- Source-controlled `database/migrations/0010_ql332_managed_custody.sql` and matching timestamped `supabase/migrations` must match exactly. Run Supabase migration/advisor/negative DB checks before recording **DB GREEN**.
- At release: verify exact-main GitHub app-build, Supabase Preview, Cloudflare Worker/Pages workflows, and independently matched public Worker JS/CSS SHA-256.
- Positive **managed-service** encrypt/decrypt/sign and real source-signed two-sided rotations are **NOT PROVEN** until authentic user, workload, source keys and TEST approvals exist. This remains `KEY CUSTODY HOLD`, regardless of software CI.

References: [Supabase Vault](https://supabase.com/docs/guides/database/vault), [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Supabase security](https://supabase.com/docs/guides/security/product-security), [Cloudflare Secrets Store](https://developers.cloudflare.com/secrets-store/), [Cloudflare Worker secret bindings](https://developers.cloudflare.com/workers/configuration/secrets/), [Source of Truth v3](ROSEVEAR_SOURCE_OF_TRUTH_V3_QL331.md).
