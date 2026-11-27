# QL-504 — Comms-Owned Signed Receipt Worker, Durable Replay and Automatic Readback

**Owner:** Rosevear Comms Hub · 27 November 2026 · **Accepted basis:** issue #1044 and the owner-approved 26-Nov Source of Truth. The owner has already reported preliminary Windows/provider stages 1–2 complete: **do not request repeats or monitoring**. Protocol 1.1: applications advance independently.

## Precisely delivered in code

- A **private Node worker contract** in \`runtimes/master-discovery/ql504-private-receipt-worker.mjs\`: imported by a separately authorized private process, **not** the public React runtime. \`ql504Enqueue\` requires the existing QL502 original-source and independent-provider signed evidence (or a source-signed saved intent with no provider evidence). It accepts only approved app+tenant+version metadata, without customer body/phone/payment/financial information, authority transfer, cross-app DB access, or send permissions.
- **Explicit time-bounded Ed25519 public-key pins**, with a separately approved source pin and independent provider pin, overlapping active pins for controlled rotation, strict expiry and no trust-on-first-use. Pin validation does not enroll anyone or read signing private keys.
- **Journal custody:** bounded append-only JSONL records, SHA-256 chained, every event fsynced, exclusive private lock, restart reconstructs state, no automatic lock break. Corrupt/truncated journal, expired pins, reused message version with changed signed digest or wrong tenant enters HOLD.
- **Idempotency and replay:** deterministic task hash uses original tenant/thread, message version/content/source digest and provider-evidence digests. A duplicate queue item stays one item. A crash after ATTEMPT may invoke the server RPC again; the QL503 *database* enforces exact-version and event replay idempotency. This is at-least-once execution with an idempotent destination, **not unqualified exactly-once network delivery**.
- **Bounded retry:** explicit \`ql504DrainOnce\` requires injected private server-role RPC gateway and active approved pins, never a public HTTP endpoint or scheduler. Delayed retries preserve the source packet, tenant, version and evidence digests. Failure after the configured maximum or expired evidence creates a terminal DEAD_LETTER HOLD. **No consumer messaging or external provider send** occurs during retry.
- **Operator readback:** existing QL503 \`Ql503DurableDeliveryHistory\` now refreshes itself on valid auth state changes, when a browser tab returns to the foreground, and every 45 seconds while an authenticated database client is available and the tab is visible. Its backend RLS remains authoritative; the UI does not grant tenant access, mutate receipts, display secret credentials, or claim human acknowledgement.
- **Inert original-host CLI:** \`node runtimes/master-discovery/ql504-original-host-cli.mjs --status\` is safe on any machine; \`--inspect\` is read-only and restricted to original \`DESKTOP-AE894KC\` as \`Ree\`; \`--drain-once\` intentionally **refuses** because production service-role and original host enrollment cannot be authorized by the public code alone. Existing QL340C TEST receiver stays OFF.
- Negative tests: forged source/provider signatures, cross-tenant request, untrusted pin, wrong version, stale or changed packet, consent/authorityTransfer, duplicate evidence, accepted-only not delivered, bounded outage retries, idempotency, journal tamper/corruption, private gateway required, no network/automatic-send, narrow/mobile accessibility and auth-triggered automatic readback.

## What was actually tested

1. Local CI fixtures generate ephemeral **test-only** independent Ed25519 pairs. Production key enrollment is NEVER inferred from these.
2. Node tests exercise fsync/locked on-disk queue, duplicate and changed-version denials, signed-provider ACCEPTED vs DELIVERED, bounded retry DEAD_LETTER, restart readback, and private RPC mock outcomes without sending.
3. React jsdom tests exercise auth and visible-tab refresh, empty-grant messaging and absence of send buttons; style remains keyboard-friendly, responsive and reduced-motion safe. jsdom is **not a real customer device**.
4. Python cross-language source checks run offline and verify CLI is inert, guards survive, no network sender/secret material, and UI refresh is automatic.
5. Supabase connected database \`gxujcwpktaickcgzyvnu\`: QL503 service-role RPC remains the only approved server write path; FORCE RLS, exact-tenant read and default zero grants remain unchanged. QL504 does **not** install a new database migration or grant credentials.
6. Exact-main CI Linux, Windows and public Worker JS/CSS SHA-256 parity are release gates. The GitHub Pages preview is disabled and is not a private host or provider deployment.

## Live production boundary

**Code Production GREEN** means the tested worker contract, UI, and tests are merged to exact \`main\` with successful GitHub Actions. It does **not** mean the private original Windows process has been installed, auto-started, authorized or observed running; that a real independent provider has delivered a message; or that a customer replied. Before a real field pilot, the approved original Comms-only service operator must enroll a private server-role gateway, managed public issuer pins and exact source/tenant authorization through the existing trusted owner-private procedure. Do not paste private keys or customer data into chat/GitHub. No owner action is required just to finish QL504 code GREEN.

**What next?** Only a separate authorized Comms runtime acceptance build can wire a private original-host process to this worker, with signed original-device evidence and actual real provider readback. If another application hasn't provided its own signed events, keep that source in HOLD and continue other independent Comms improvements. Do not ask the owner to check other apps or poll CI.

**Reference:** issue #1044, QL503 runbook \`docs/build-records/QL-503_DURABLE_AUTH_TENANT_DELIVERY_HISTORY.md\`, QL502 signed receipt verification, Supabase RLS policy guidance https://supabase.com/docs/guides/database/postgres/row-level-security .
