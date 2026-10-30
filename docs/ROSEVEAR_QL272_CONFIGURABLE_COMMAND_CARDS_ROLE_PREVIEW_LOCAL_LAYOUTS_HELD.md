# Rosevear Comms Hub — QL-272 Saved Command Layouts (HELD)

## Scope of this release

**QL-272 — Configurable Command Cards, Role-Safe IT Profiles & Saved Operator Layout Preferences (HELD)**

This release extends QL-271's four themed command views (IT Command, Management, Analytics, System Status). The expanded personal-layout editor remains collapsed until requested and supports:

1. **Card order and visibility by view.** Move any of the four KPI cards up or down, and hide individual cards. At least one KPI must remain visible on each screen.
2. **Information density.** Comfortable and Compact layouts; Compact reduces hero height, padding and card size while retaining the communications-network motif.
3. **Detail visibility.** Turn the detailed chart/register panels on or off separately for each of the four views.
4. **Saved local profiles.** Start with Standard, Compact command and IT review; save a copy with a generic name, select among at most six profiles, or restore factory defaults. The layout survives switching workspaces and refreshing the page on the same device.
5. **Read-only role perspectives.** Operator, Manager and IT reviewer change only presentation labels and explanatory scope. Every role explicitly denies credential provisioning, signature acceptance, real tenant access, authenticated GET requests and live communications. These are **not authenticated roles**.

## Storage and isolation

- A versioned `rosevear-comms-hub:ql272-command-layouts:v1` browser-local record is stored through the existing `app/src/storage/localRepository.ts` boundary. It contains only profile ID/name, UI density, role **preview**, per-view card order/visibility and panel visibility.
- No password, signing key, tenant ID, customer record, proof receipt, token, external URL or credential is collected by this editor. It never calls an API or worker.
- Invalid schema, role injection, duplicate IDs or attempts to hide all four cards fall back to known-safe defaults. Storage failures leave a working session with a visible warning.
- Profiles are local to one browser/device; they are not shared between staff, and do not grant any privileges. The disabled-preview authentication posture remains unchanged.

## Security status — separate from deployment

- Original signed Proof-B for all six source repositories remains missing at the dated QL-270 inspection, with the six `HTTP 404` observations shown as dated evidence rather than live heartbeat checks.
- Independent signer custody, role/pin verification, isolated nonproduction tenant evidence, actual owner release and authorized bounded GET trial remain **DISCONNECTED / HELD**.
- No live phone, SMS, dispatch, hardware, customer-data integration or authenticated gateway request is activated by this release. **`main` Production = GREEN is only software deployment status.**

## Verification

- TypeScript/Vite build and focused QL-272/UI tests.
- Full Vitest regression suite and QL-171 source-drift/zero-network safety inventory.
- GitHub `dev` and `main` checks and a live disabled-preview page smoke test after promotion.

## Next proposed build

**QL-273 — Contextual ⓘ Help, Accessible Command Shortcuts & Saved View Recovery Audit (HELD).** Continue improving the operation surfaces and preference recovery without bypassing source-proof, tenant-isolation or independent approval gates.
