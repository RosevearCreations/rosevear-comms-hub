# QL-316 — Contact 360, Consent Readback & Four-Business Intake Visual Alignment

## Delivered disabled-preview software

- Updated the existing QL-193/295 Customer 360 and QL-296 Guided Intake screens, preserving their original deterministic fixture, consent, identity and UNSENT handoff rules.
- Added one shared visual system, navy graphic headers, distinct workstream accent colours and category labels for Rosie Dazzlers, Devil n Dove, Yard Workers and iCamp. Text labels remain readable without reliance on colour.
- Contact lists and profile readbacks now show the strictest linked fictional consent. Per-source statuses distinguish opt-out, service-only and unknown, with explicit **no marketing permission**. Identity readback says **UNVERIFIED**; duplicate candidates remain **0 confirmed matches** and all live actions remain disabled.
- Intake now shows company-specific reviewer cards, progress from 0–4 valid fixture choices, labelled question steps, explicit **UNSENT** pending/ready states and manual verification guidance. Edits invalidate the handoff; business changes reset the form.
- Updated [operator walkthrough](../QL-316_CONTACT_CONSENT_INTAKE_VISUAL_GUIDE.md) and [four-business visual capture matrix](../visual/ql316-contact-intake-capture-matrix.json). Manual real-device screenshots and screen-reader acceptance are **PENDING**, not falsely marked complete.
- No real customer read/write, contact matching or merge, consent mutation, outbound message, quote, booking, payment, customer intake, provider trial, web request or browser storage. Six-app integration remains `DISCONNECTED / HOLD`; ACK evidence remains `UNDER_REVIEW / PARKED_FOR_LATER`.

## Tested source

- `npm run check`: **PASS**.
- Focused Contact 360/Consent/Guided Intake regression: **3/3 files, 18/18 tests PASS**. A prior exact help-text regression was detected by the full suite, corrected, and its 12/12 tests passed before final rerun.
- Complete `npx vitest run --reporter=dot`: **134/134 files, 1,206/1,206 tests PASS**. Historical unrelated duplicate-key warnings remain without test failures.
- `node scripts/ql171-operator-baseline.mjs`: **PASS**, `raw-network: 0`, `supabase-mutation: 0`, live calls/SMS/owner approvals disabled; this static inventory is not a penetration test.
- `npm run build`: **PASS**, 546 transformed modules, known large-bundle warning.
  - Tested JS `index-D-gXY9Vq.js`: SHA-256 `760f00ac379ea9043d609a8698440a660ecbcc09ccde3a44f9d535db4a55d745`.
  - Tested CSS `index-CfKqZMCi.css`: SHA-256 `672fd7fb9dba18860a4139715c2f0ddeb0353361d3a195d75743bf9881b72066`.
- Exact source tree `b1d8b8c28ad3876132ae9809ce8500ca0de66aac` matched local `89cc31d405a847aefa5b59aa7765a91bf195c942` and published source `20d022be61c9cc6395a9df74683a7a448e942d64`.
- `dev` code SHA `20d022be61c9cc6395a9df74683a7a448e942d64`; [code PR #606](https://github.com/RosevearCreations/rosevear-comms-hub/pull/606) merged into `main` code SHA `fd1af3212641b8a0f1f57b21b346a256ee87b298`.

## Exact-main and live Worker verification

**Software Production GREEN at exact code `main` SHA `fd1af3212641b8a0f1f57b21b346a256ee87b298`.** All five applicable checks completed **SUCCESS**: `app-build`, `Workers Builds: rosevear-comms-hub`, `Build disabled preview`, `Deploy disabled preview` and `Supabase Preview`.

The public Cloudflare Worker https://rosevear-comms-hub.devilndovelive.workers.dev/ served QL-316 HTML naming the correct assets, and full HTTP-fetched files matched tested SHA-256 values:

| Live artifact | HTTP-fetched SHA-256 | Tested build comparison |
| --- | --- | --- |
| `index-D-gXY9Vq.js` | `760f00ac379ea9043d609a8698440a660ecbcc09ccde3a44f9d535db4a55d745` | **Byte-identical** |
| `index-CfKqZMCi.css` | `672fd7fb9dba18860a4139715c2f0ddeb0353361d3a195d75743bf9881b72066` | **Byte-identical** |

This verifies disabled-preview software, not owner-device acceptance, identity verification, genuine consent, provider connection or a real quote/booking.

## Queue handoff

QL-316 is the **sixth Production GREEN disabled-preview build of twenty**, leaving **fourteen**. Next planned: **QL-317 — Multi-Line Routing, IVR Scenario Map & Safe Fallback Studio Polish**. After QL-330, future builds must arise from genuine owner acceptance findings and independently verified evidence and require new owner authorization.
