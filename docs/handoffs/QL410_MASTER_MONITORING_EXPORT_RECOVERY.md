# QL-410 — Protected Audit Decision Export, Owner Action Continuity & Receiver-OFF Incident Recovery

## Release scope and actual trust state

QL-410 adds a **downloadable, source-scoped, synthetic owner-review JSON export** and a visible independent operator exception continuity queue. The export intentionally removes the claimed actor role and opaque evidence reference, never includes credentials or original private receipts, and labels the output `INERT_DEMONSTRATION_NOT_PROTECTED_EVIDENCE`. Export is client-only and never sends data to a server.

The monitoring panel displays **UNKNOWN** for uptime because no authenticated, live host observations are connected to this build. No fabricated uptime percentage or production connection is displayed. An untrusted local observation can be structurally reviewed as UP/DOWN/STALE (5-minute freshness threshold) but cannot authorize a receiver, one-TEST, or a connection. QL-409's source binding, duplicate/future checks and independent routes remain in force.

## Master Shell ownership and coordination boundary

| System | Responsibility | Integration state in QL-410 |
| --- | --- | --- |
| AI Data Platform | Master intelligence, uptime aggregation, service trends, validations, forecasting and portfolio health | Contract handoff only; no live consumer or verified remote connection established |
| Rosevear Comms Hub | Operator incidents, follow-up routing, evidence freshness, accessible recovery, and approved notifications | Source-scoped read-only UI and export; receiver OFF / HOLD |
| Rosevear AI Hub | Ree's original Windows local runtime; local service probes, scheduled automation, secure host-side observation | Optional observer script delivered; **not installed or scheduled by GitHub promotion** |

Ree's original machine is **DESKTOP-AE894KC**. Jack's **TEMPLAR** laptop is an independent reviewer; it must never become an unattended production automation host or gain the original owner's private signing material. Yard Workers and iCamp stay product-shell scoped; Rosie Dazzlers and Devil n Dove stay owned-business scoped. The Master Shell must not combine tenant/customer records with infrastructure health.

### Proposed handoff contract (no automatic activation)

The observer's local JSON uses `rosevear.ql410.ree-loopback.v1`, identifies `rosevear-ai-hub`, and contains local services, UTC observation times, reachability, duration and random observation IDs. It is **unsigned local diagnostic evidence only**. Before feeding it to AI Data Platform or Comms Hub, a future protected server-side adapter must independently authenticate the original host, bind source identity and revision, verify signer/custody/consent, enforce replay resistance, cap payload sizes, reject stale inputs, and map monitor incidents to source-scoped operator routes.

For aggregation, prefer these measurements per service: last observed UTC, age of last observation, reachable state, response time in milliseconds, uptime percentage over a *defined and measured* time window, restart count, process or scheduled-task state, and error events. Without a continuous measurement window, uptime percentage stays **UNKNOWN**, never 100% by assumption.

### Ree-only observer: optional, owner-operated setup

The checked-in file `scripts/windows/ql410-ree-host-observer.ps1` is a read-only loopback TCP check for ports `8765` (API), `5173` (client) and `8443` (Caddy). It refuses to run unless the machine name is `DESKTOP-AE894KC`, and stores a credential-free report in Ree's `%LOCALAPPDATA%\RosevearAIHub\Monitoring\ql410-local-health.json` when explicitly invoked. **It has not been run, installed or scheduled on Ree's machine.** The probe does not establish an authenticated connection or prove the application routes work; it checks local TCP reachability only. Use `-PrintOnly` to inspect without creating the report.

Once Ree has reviewed and approved the exact script on the original Windows host, a Windows Task Scheduler job can invoke it as the **Ree user** at a chosen interval. Do not run on Jack's laptop, a cloud runner or a CI machine, and do not enable remote publishing until a protected adapter and owner permissions are verified. Do not expose Supabase keys, local authority files, private receipts or Tailscale credentials.

## Receiver-OFF incident recovery

1. Keep receiver OFF, one-TEST HOLD and all unverified source connections HOLD.
2. On Ree's original PC, read local port/process and recovery-task state; distinguish one failed TCP probe from a verified outage.
3. Independently review timestamp freshness, host identity, service name and source binding; never accept owner/self-asserted authentication from browser data.
4. Route source-specific incidents to the Comms Hub operator; provide read-only AI Data Platform aggregation once a protected transport exists.
5. Require separate signed original-owner, independent witness and Master owner approvals for any receiver change or one-TEST. Recovery guidance alone never performs those actions.

## Verification and next build

Run `npm --prefix app run test -- src/auth/__tests__/ql410MasterContinuity.test.ts`, `npm --prefix app run check`, `npm --prefix app run build`, and QL-329 asset budget. On the owner screen, switch among all six sources; confirm filtered export, UNKNOWN monitoring and receiver-OFF messaging.

**Next proposed QL-411 — Original-Ree Host Telemetry Adapter, AI Data Platform Uptime Read Models & Comms Incident Correlation Pilot.** First establish explicit original-host owner deployment and a protected, read-only signed transport; do not invent live uptime or enable TEST enrollment.
