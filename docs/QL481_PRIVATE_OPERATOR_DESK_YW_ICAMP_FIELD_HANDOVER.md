# QL-481 — Scoped owner incident desk, independent handover and YW/iCamp private staging adapter

## Scope and current baseline

QL-480 implemented a signed private incident adapter, a per-case append-only fsynced journal, scoped deduplication, technical recovery vs owner closure, and synthetic Yard Workers/iCamp journeys. QL-479 added a supervised private TLS pilot for Comms Hub telemetry. Neither build proved real Yard Workers/iCamp signer enrollment, trusted production tenant authority, live delivery, original Windows worker installation, or a production customer case.

QL-481 connects the **authenticated owner UI** to a **limited local review experience** and adds **independently signed, durable private handover evidence** plus strict owner/custodian staging bindings for the two products. It does NOT expose private case data from Cloudflare or Supabase, start a receiver, install a worker, enable any scheduled task, or claim that a source is live.

## Implemented

1. **Private operator desk:** `app/src/auth/Ql481PrivateIncidentDesk.tsx` is displayed inside the existing personal `#/master` owner portal under I.T. and security. Only an enrolled owner with fresh protected readback and AAL2 can use the local-file selector; everyone else sees a locked explanation. It offers an accessible source choice, in-memory-only examination of a strictly allowlisted **redacted QL-481 durable-handover JSON** record, a scoped case summary, pending-intent count, journal and source receipt hashes, an explicit clear control, and a field-verification checklist. Browser structure checks are intentionally labeled `LOCAL_FILE_STRUCTURAL_REVIEW_NOT_AUTHENTICATED`. They **do not validate trusted signer pin enrollment** and cannot authorize a case decision. No network API, customer record, localStorage or browser file upload is added.
2. **Server-side signed independent source binding:** `reviewQl481SourceBinding` requires an exact, short-lived, dual-signed private-staging enrollment for `yard-workers` or `icamp` with distinct source, independent reviewer, operator and custodian Ed25519 pins, exact tenant, source revision, non-sensitive data class and no receiver enablement or customer authority. `ingestQl481BoundedFieldEvent` only admits the enrolled scope into QL-480's signed journaling adapter and always reports **field runtime HELD**. No invented source credentials or source activation.
3. **Durable recovery handover:** `prepareQl481Handover` reads the current case through an authentic signed QL-480 private operator read, then signs an exact redacted projection of case/tenant/episode, current journal and source receipt digests, pending intent counts and source revision. An **independent reviewer** must sign the identical payload. `createQl481PrivateHandoverLedger` re-reads the original private journal, rejects changed source state and changed tenant, writes the packet and review to an owner-only, write-once SHA-256-named file, fsyncs and reads back. Same signed handover is idempotent; conflicting handover ID or damaged durable evidence returns HOLD. No customer contact or financial fields.
4. **Required CI:** Node tests cover distinct signer pins, expired/foreign tenant binds, corrupted or forged signatures, source revision drift, durable handover across adapter restart, rejection of changed recovery state, exact replay, conflict, tampered receipt and no provider/customer delivery. Vitest tests cover strict browser redaction, foreign-app inspection, locked access and in-memory-only UI. Windows job checks that the browser does not use fetch/localStorage and that no QL-481 hosted receiver is wired.
5. **Master Recommendation Review priorities:** Comms Hub is an owner/operator case and follow-up system; AI Data Platform owns source/health measurements and Rosevear AI Hub owns original local device observation. Account/tenant and finance authority stays in each product. QL-481 provides a reusable operator evidence format, **not** full cross-application signed production acceptance. Avoid inflating completion percentages based on simulation or unverified uploaded files.

## Running and reading

- The UI is visible at the existing authenticated owner entry (`#/master`) → **I.T. and security**. When the fresh protected owner AAL2 readback is unavailable, the file inspection is locked. When authenticated, only a redacted QL-481 ledger JSON can be examined, in memory, without uploading it.
- The new server-side API is deliberately **module-only**, with no public route or default process. It must be instantiated by a protected private worker with genuine independently enrolled Ed25519 pin material. Keys and packets may not be placed in GitHub, public storage or browser build environment variables.
- For testing, CI runs `node --test runtimes/master-telemetry/ql481-private-incident-handover.test.mjs` and `npm --prefix app run test -- src/auth/__tests__/ql481PrivateIncidentDeskModel.test.ts src/auth/__tests__/ql481PrivateIncidentDeskUI.test.tsx`. Tests use generated ephemeral signer keys and private temporary files. No real Yard Workers/iCamp tenant data is modified.

## Acceptance matrix

| Area | Current QL-481 outcome | Requires separate real evidence |
|---|---|---|
| Owner UI and local redacted file inspection | Implemented under current AAL2 gated owner portal; structural-only | A deployed authenticated backend to read actual current case evidence, with source/tenant RBAC |
| YW/iCamp staging binding | Dual-signed contract validated in synthetic CI | Independently enrolled **real** source/custodian/tenant signer keys and signed first private event |
| Durable recovery handover | Write-once signed owner/reviewer ACK and restart/tamper tests | Real operator with independent reviewer, remote backup/restore and independently witnessed original host |
| Actual provider delivery/customer response | NOT SENT | Separate consent, provider receipt, verified authorization and independent observation |
| Cloudflare source release | Subject to protected merge/deployment checks | No equivalence to original Windows host or business runtime activation |

**Next proposed: QL-482 — Protected Server Case-Read API, Source-Specific RBAC and Independently Verified First Yard Workers Incident Lifecycle.** Integrate a private authenticated backend with real read-only case evidence. Test Yard Workers first, independently repeat with iCamp only after customer/tenant owner authority is approved. Never use browser-imported JSON as proof.

## Restart guidance

Cloudflare web client deploys require **no Windows restart**; a normal browser refresh is generally sufficient. A local manually running Node/Windows worker only needs a controlled stop/start after code that it runs is replaced; this build **does not** install or restart a local worker. If Vite environment variables change in local development, restart that development server because Vite loads .env values at startup. Do not restart the Windows host or enable port 8788 by default.
