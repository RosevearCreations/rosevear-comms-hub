# QL-320 — Accessible front-end journey, recovery states & operator visual sweep

## Software delivery (synthetic preview)

The existing operator shell now carries a six-step, keyboard-operable journey panel in the Dashboard, Inbox, Contact 360, Guided Intake, Routing Studio, Assignment Workboard, Accessibility Review and Composer workspaces. Its controls navigate to the actual existing screens; the panel is not a detached illustration or an API integration.

The readback uses only the four authored, fictional company fixture registries, explicit conversation/contact mappings, company-scoped queue and existing strictly validated UNSENT composer drafts. Switching companies clears current drafts and changes the entire readback. The step buttons never send, schedule, assign a real worker, authorize consent, dispatch or connect a provider.

## Four-business source matrix

| Business | Synthetic inbox and contact | Intake | Routing | Handoff | Review |
| --- | --- | --- | --- | --- | --- |
| Rosie Dazzlers | `rd-sms` → `rd-contact-a` | Detailing quote preview | `rosiedazzlers` | `rd-task-2` | Company-keyed QL-299 manual walkthrough |
| Devil n Dove | `dnd-sms` → `dnd-contact-a` | Custom maker inquiry | `devilndove` | `dnd-task-2` | Company-keyed QL-299 manual walkthrough |
| iCamp | `camp-sms` → `camp-contact-a` | Campground guest inquiry | `icamp` | `camp-task-2` | Company-keyed QL-299 manual walkthrough |
| Yard Workers | `yw-sms` → `yw-contact-a` | Seasonal property service | `yw` | `yw-task-2` | Company-keyed QL-299 manual walkthrough |

Cross-company queue/thread mismatches must block readback rather than display another tenant's fictional sample. There is no automatic customer identity inference. A missing explicit link is an empty state, not a claimed contact.

## State and recovery acceptance

| State | Visible behaviour | Safe recovery |
| --- | --- | --- |
| Fixture ready | Scoped sample, contact consent, queue task and recoverable draft summary | Open actual journey step |
| Loading rehearsal | States that local fixtures are already available and no provider request is in progress | Return to fixture |
| Empty rehearsal / no valid link | No guessed identity or impossible navigation | Clear example if a valid fixture exists |
| Error rehearsal / real company-scope mismatch | Explicit error text; step navigation blocked | Retry visual rehearsal; mismatch remains blocked |
| Disabled rehearsal | No step actions during rehearsal; live action still disabled | Restore navigation rehearsal |
| Unsent draft | Strict QL-293 company/thread/template validation, redacted in-memory edit only | Resume real composer; switch/reload clears |

Each example state is visibly identified as a UI rehearsal. None claims to be the result of an HTTP request or a real delivery. The panel adds readable labels independent of colour, keyboard focus outlines, 44px minimum action targets, responsive grids at tablet and phone widths, forced-colours support and reduced-motion handling. The shell retains its skip link, focus-on-navigation headings and QL-313 mobile menu.

## Reproducible automated software checks

Run from `app/`:

```bash
npm run check
npx vitest run src/operator/__tests__/ql320FrontEndJourney.test.tsx
npm test
npm run build
```

`ql320FrontEndJourney.test.tsx` covers four company source chains, invalid/cross-company rejection, real six-step navigation and heading focus, five distinct UI states and recovery controls, company switching, valid UNSENT draft recovery, and CSS accessibility contracts. Full suite and pipeline results must be recorded with their exact commit after running; do not claim those checks before execution.

## Outstanding human and external evidence (NOT accepted by this build)

1. Owner physical desktop/tablet/phone walkthrough and independent screen-reader evidence; automated jsdom and CSS inspections do not prove real-device accessibility.
2. Keyboard tab order, route focus, high-contrast/forced-colour visibility and 200%, 300%, 400% zoom inspected on actual owner devices. No owner sign-off has been recorded here.
3. Real provider / SMS / IVR / email identity, opt-in, deliverability, independent tenant and six-app source evidence remain unverified, disabled or HOLD as previously recorded.
4. QL-282 ACK delivery evidence remains UNDER REVIEW. No external receipt, acceptance, message, booking, customer or staff action is inferred from the software-only preview.

**Release invariant:** `main` Production GREEN means only tested and deployed *disabled synthetic preview software* is green. It never implies production telephony, human approval, tenant privilege or provider activation.
