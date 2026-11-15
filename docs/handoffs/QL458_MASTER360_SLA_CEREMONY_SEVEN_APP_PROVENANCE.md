# QL-458 — Independent SLA aging, ceremony drift challenge and signed seven-app provenance

**Source-first, non-authorizing evidence only.** `main` GREEN denotes a passing software release, never a live CONNECTED peer or current physical receiver OFF. Original receiver incident remains OPEN/HOLD, `activationAuthorized=false`, `closureAuthorized=false`, `physicalReceiverCurrentlyOff=false`. No secret sharing, peer database access, worker activation or automatic incident closure.

## Independently signed evidence
1. **Exact QL-457 custody**: verify original 0700/0600 immutable PENDING and REVIEW/EXCEPTION receipts, three-Master and dual-owner OPEN/HOLD decision, signed predecessor classification; previous exceptions and signed recurrence do not silently recover.
2. **19 distinct pinned Ed25519 signers**: original Comms source; independent recovery/escalation; original Windows host DESKTOP-AE894KC; independent anchor; independent physical observer; separate ceremony authority; independent gate; 3 Masters; 2 owners; 7 independent application source signers. All PINs and expected 40-hex main SHAs must arrive from an independently trusted configuration, not from the submitted record.
3. **Multi-horizon SLA aging**: signed follow-up case and incident identity, predecessor digest, opened, acknowledged and owner-response timestamps; evaluate delayed acknowledgement >5 minutes, overdue owner-response >1 hour, incident follow-up >24 hours. Each breach creates signed EXCEPTION OPEN (not closure); invalid timestamps/signatures or missing original evidence fail HOLD.
4. **Ceremony drift challenge**: nonce challenge binds exact predecessor receipt, old enrollment digest, fresh independently signed new enrollment digest, strictly increasing generation, signed observed timestamp, witness digest, and issuer clock drift. Drift >30 seconds, expired authority or pending re-enrollment requires EXCEPTION OPEN; malformed challenge stays HOLD.
5. **Seven-app source provenance**: canonical `rosevear-master-shell-seven-apps.v1` and controller `ai-data-platform`. Exactly seven ordered independently signed read-only manifests, with matching external PIN, repo identity, role, exact expected `main` SHA, tenant boundary, manifest digest, unique source identity, fresh timestamp, source status and incident/nonce/predecessor. `UNVERIFIED_HOLD`, `authorityTransfer=false`, `privilegedScope=false`, `ISOLATED_READ_ONLY`. Signed SOURCE_DENIED is an EXCEPTION; wrong identity/privilege/stale data is HOLD. No application status is upgraded to CONNECTED by this review.
6. **Protected output and review**: source manifest digest, exact SLA bands, signed drift status, independent veto, three signed Master review votes and two owner signatures flow to exclusive fsynced one-use REVIEW/EXCEPTION record. Trusted final clock, original protected ledger, source freshness, original-host independent OFF witness and ceremony expiry rechecked before durable commit.

## Ordered chain to relay
1. `ai-data-platform` — master controller, canonical validation
2. `rosevear-ai-hub` — original host/master witness
3. `rosevear-comms-hub` — communications/master
4. `iCamp` — campground SaaS shell
5. `yw` — Yard Workers SaaS shell
6. `devilndove-site` — Devil n Dove internal company
7. `rosiedazzlers` — Rosie Dazzlers internal company

All participants must ACK the same exact controller `main` SHA, app-specific `main` SHA, topology, signer identity, manifest digest and read-only scope before any independently approved external runtime enrollment. No updates of private credentials or cross-app side effects are attempted by QL-458.

## Validation and honest progress
Tests: `node --test runtimes/master-telemetry/ql458-sla-drift-seven-app-provenance.test.mjs`, full QL-417–458 protected regression, original-host Windows safety, app CI, Supabase, Cloudflare Production Workers, exact final-main public JS/CSS SHA256 parity. Synthetic tests exercise source denial vs forged identity, privileged schema, 5m/1h/24h escalation, stale signed reports, challenge nonce/issuer drift, 19-key separation, historical OPEN/HOLD, replay, TOCTOU and corrupt custody.

**Scope limitation:** Software does not independently collect the required signed manifests from live applications; external original-source adapters and pin enrollment remain prerequisites. No percentage-completion increase may be claimed without per-domain baseline and acceptance evidence.

**Next proposed:** QL-459 — Canonical Seven-App Provenance Schema Registry, Controller-to-Shell Signer Enrollment & Source-Handoff Contract Verification.
