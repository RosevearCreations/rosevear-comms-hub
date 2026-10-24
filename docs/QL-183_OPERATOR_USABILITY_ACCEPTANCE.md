# QL-183 — Operator Usability Acceptance (synthetic training)

## Purpose and safety

QL-183 adds an operator-run **keyboard, screen-reader and mobile rehearsal** to the disabled two-brand communications preview. It does **not** certify accessibility, represent a real user study, store observations, or enable live operations. The 12/12 live-pilot prerequisites inherited from QL-181 remain `HELD_UNVERIFIED`. All examples must be synthetic.

The checklist is found at **Operator workspace → Safety & hold review → QL-183 Operator usability acceptance rehearsal**. Switching businesses remounts the checklist. No text entry is collected: choices are limited to **Not tested**, **Usable in my rehearsal**, or **Needs improvement**. All choices disappear on page reload, business switch or Clear this rehearsal.

## Operator walkthrough matrix

| Mode | Check IDs | Manual acceptance focus |
| --- | --- | --- |
| Keyboard | `key_skip`, `key_brand`, `key_journey` | Skip repeated navigation; brand context and state; QL-182 keyboard controls and no dispatch |
| Screen reader | `sr_landmarks`, `sr_controls`, `sr_safety` | Landmarks, accessible names and current location; live evidence detail; spoken hold/simulation distinction |
| Mobile | `mobile_320`, `mobile_375`, `mobile_zoom` | 320 px navigation, 375 px journey and 760 px/200% zoom, visible controls, wrapping and reading order |

Instructions and expected outcomes appear per check within the application. **A human must perform these checks using an actual keyboard, assistive technology and narrow viewport or phone.** A `SELF_REPORTED_READY_FOR_INDEPENDENT_REVIEW` state means all nine *human-selected* answers were usable; it still reports `verifiedAccessibilityAudit=false`, `livePilotAuthorized=false`, zero sends/writes and 12 held prerequisites. An improvement answer yields `NEEDS_REMEDIATION` and an on-screen, non-identifying task label. Blank checks yield `INCOMPLETE_SELF_REVIEW`.

## Code-level accessibility improvements

- The existing Skip to operator workspace anchor now targets a focusable `main` element.
- The current business/workspace context has a polite screen-reader announcement when changed.
- The shared operator shell visibly outlines keyboard focus for native buttons, links, selects, input fields and text areas.
- QL-183 uses labelled native selects, fieldsets, legends, radio inputs, a polite live summary, 44 px minimum tap targets and forced-colours/narrow-width styles.

These affordances are covered by automated DOM and CSS contract tests. Those tests do **not** substitute for real VoiceOver, TalkBack, NVDA, JAWS, device/zoom, or usability sessions. We do not claim independently validated accessibility or WCAG conformance.

## Acceptance and release gates

1. Run `npm run check`, `npm test`, `npm run build`, `npm run pages:build` inside `app`.
2. Run `node scripts/ql171-operator-baseline.mjs`, `node --test scripts/__tests__/ql171-operator-baseline.test.mjs`, and `node scripts/__tests__/ql170-release-receipt.test.mjs`. Confirm `supabase-mutation=0`, `raw-network=0` and no live telecom capabilities.
3. Merge a focused QL-183 feature branch into `dev`, then `dev` into `main`. Verify all **five** checks report `completed/success` against the resulting *exact main commit*: `app-build`, `Build disabled preview`, `Deploy disabled preview`, `Supabase Preview`, `Workers Builds: rosevear-comms-hub`.
4. Verify GitHub Pages HTML and new JS asset return HTTP 200 and the asset contains `ql183-operator-usability-acceptance-v1`.
5. **Manual accessibility and independent review remain future acceptance actions**; no checkbox in this build authorizes customer contact, provider provisioning, Supabase customer writes, owner sign-off or a live pilot.

## Queue accounting

QL-171–182: **12/12 exact-main GREEN** (prior completed batch). Proposed QL-183–190: 8 items; this build is **1 of 8** when separately verified GREEN, leaving **7 proposals (QL-184–190)**. The 12 live-pilot prerequisites remain held and are not counted as release builds.
