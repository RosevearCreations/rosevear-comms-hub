# QL-291 — Operator Command Centre Density, Guided Card Navigation & Role-Safe Layout Recovery

**Scope:** improve the disabled-preview command interface without changing integrations, permissions, customer data, provider communication or proof acceptance. The QL-290 public source observations remain dated; QL-291 does **not** claim a fresh GET or new original Proof-B evidence. Six-App Acknowledgement Delivery Evidence remains **UNDER_REVIEW / PARKED_FOR_LATER**; all six integrations remain **DISCONNECTED / HOLD**.

## Implementation

1. **Information-rich command overview:** the IT, Management, Analytics and System Status views each show three concise, correctly labeled summary values derived from known source registrations or the existing 16 fictional training scenarios. No revenue, staff, health check, message delivery or live gateway telemetry is fabricated.
2. **Three guided routes per command view:** 12 accessible routes across four modes with clear step labels, descriptions, actionable navigation, and per-card ⓘ help explaining what the destination can and cannot do. Destinations are existing read-only or fictional workspaces. Collapsing the guide reduces screen height without removing the core metrics.
3. **Accessible density controls:** one-click Comfortable / Compact buttons reuse QL-272's existing active local profile. Compact mode adjusts overview/card spacing while preserving 44px targets, legible text, keyboard focus and responsive mobile layouts. Reduced-motion and forced-colors states are supported.
4. **Role-safe local layout recovery:** display previews remain unable to access tenants, issue authenticated gateway GETs, send messages or grant roles. A prominent local integrity readback can check saved QL-272 format, restore only a validated supported profile, and replace malformed/invalid records with safe defaults only on a separate explicit action. No new storage keys or formats.
5. **Truthful persistence status:** the shell no longer calls a missing or tampered local record 'saved'. It distinguishes a verified saved layout, safe defaults without an accepted record, and unavailable storage. An attempted save that fails remains session-only.
6. **Freshest already documented source in Status view:** the status card now reads the dated QL-290 immutable six-app snapshot instead of presenting QL-277 as latest. The older proof chain remains available in the evidence inspector, and no extra source GET is performed.

## Security and privacy

- No new `localStorage` persistence keys, database writes, telemetry, network requests, private receipt intake, credentials, role changes or external notifications.
- All demo counts remain fixture-backed, with four isolated businesses and two supporting source systems; no cross-tenant customer joins.
- Live phone, SMS, dispatch, provider callbacks, authenticated GET, original signoff and integration activation all remain disabled.
- ACK delivery evidence stays **UNDER_REVIEW / PARKED_FOR_LATER** and is not restarted by dashboard navigation or recovery.

## Verification and promotion gates

- `npm run verify:ql291` — new QL-291 coverage plus QL-271–290 operator regressions.
- `npm --prefix app run check`, `npm --prefix app run test`, `node scripts/__tests__/ql171-operator-baseline.test.mjs`, `npm --prefix app run build`.
- Exact tested Git tree through feature → `dev` → `main`; all applicable production checks GREEN on the exact `main` SHA; live Worker JS/CSS downloaded SHA-256 must match the local tested build.
- Promotion and queue counting only follow successful checks; no PR or synthetic test counts as production approval.

## Next planned build

**QL-292 — Unified Inbox Priority Lanes, Search Precision & Saved Triage Filters.** Improve the fictional inbox with clear urgency/ownership lanes, precise brand-safe search, combinations of filters and recoverable local triage presets. No customer message reads or provider sends are authorized.

See the [active QL-290–304 queue](../QL-290-304-REQUIRED_BUILD_QUEUE.md). QL-292 becomes next only when QL-291's main production receipt is verified.
