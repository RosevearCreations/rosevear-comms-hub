# QL-317 — Operator Routing Map and Safe Fallback Guide

**Scope:** UI-only presentation of existing QL-298 four-business synthetic routes. **Mode:** DISABLED / SYNTHETIC PREVIEW. This screen neither connects a telephone provider nor purchases, forwards or dials a number.

## Operator walkthrough

1. Open **Front End / Operator → IVR & routing scenario studio** for Rosie Dazzlers, Devil n Dove, Yard Workers or iCamp. The active company is named in the heading; other-company routes are blocked.
2. Scenario **A** starts with a fictional new inquiry; **B** starts with fictional after-hours. Choose a **Guided comparison example** on either side to load one of the nine prechecked examples. Choosing an example only changes in-memory UI state.
3. Change **Fictional incoming line**, **Shared-line identification claim**, **Demo hours**, **Answer result**, or **Keypad choice** to inspect that scenario. **Revert edits to selected example** restores only that side. **Reset both sample scenarios** restores the default A/B comparison.
4. Follow the five labelled steps on the route map and the matching accessible decision table. They display the **same five stage objects**, including outcome and terminal fallback. **PREVIEW** is a disabled display only; **BLOCKED** stops and requires manual review; **NOT REACHED** means a prior gate stopped the route.
5. Expand **View original QL-298 deterministic trace** for original engine messages. The contextual **Routing help** button explains states and loop protection.

## Guided scenario and safe termination matrix

| Guided case | Deterministic result | Documented final disabled path |
| --- | --- | --- |
| New inquiry / valid demo line | `QUEUE_PREVIEW` | `NEW_INQUIRY_QUEUE_PREVIEW` — not a real assignment |
| Wrong business line | `CROSS_BRAND_HOLD` | `NO_ROUTE` — no cross-company context |
| Unknown shared-line identity | `AMBIGUOUS_HOLD` | `MANUAL_BRAND_IDENTIFICATION` — no guessed tenant |
| Closed hours | `VOICEMAIL_PREVIEW` | `COMPANY_VOICEMAIL_PLACEHOLDER` — no audio or message |
| Missing/unmapped keypad option `9` | `INVALID_KEY_HOLD` | `MANUAL_OPERATOR_REVIEW` |
| Repeat keypad `0` / fallback loop | `REPEAT_MENU` | `MENU_PREVIEW_ONLY` — **exactly one step, no automatic loop or retry** |
| Timeout `#` | `TIMEOUT_HOLD` | `MANUAL_OPERATOR_REVIEW` |
| Mock carrier error | `PROVIDER_ERROR_HOLD` | `MANUAL_TECHNICAL_REVIEW` — no provider request |
| Claimed shared-line business | `QUEUE_PREVIEW` | `NEW_INQUIRY_QUEUE_PREVIEW` — manual claim **never verifies identity** |

The original QL-298 simulator also returns `INVALID_SCENARIO_HOLD / NO_ROUTE` for unknown line identifiers, wrong input fields and malformed inputs. Answered/busy/no-answer/holiday closure and existing-request cases remain supported. No branch ever sends a call, SMS, callback, recording, phone configuration or external write.

## Verification and outstanding real-device acceptance

- `ql317RouteMap` calls `ql298Simulate` and derives all five display stages from its outcome; neither the map nor table has a separate router. The new tests compare the same stage identifiers, states, labels and detail in both views and cover nine cases across all four businesses.
- React interaction tests cover independent A/B presets, edit, revert, help, one-cycle repeat and reset. Existing QL-298 cross-company, invalid-scenario and routing tests remain intact.
- The five-stage map follows **line → business identity → hours/answer → menu → fallback**, matching the actual QL-298 execution order. If an early gate stops, later choices are explicitly **NOT REACHED**.
- Keyboard, labelled controls, semantic table headers, screen-reader-compatible states, 44-pixel controls, responsive layouts, reduced motion and forced-colour support are supplied in the source. **Independent physical-device, assistive-technology and owner acceptance remain pending.** Automated coverage is not an owner acceptance receipt.
- The six supporting-app integrations remain `DISCONNECTED / HOLD`. ACK Delivery Evidence remains `UNDER_REVIEW / PARKED_FOR_LATER`. Production GREEN only means the **disabled-preview UI code** passed its exact-main checks and live Worker asset comparison.

**Source:** `app/src/operator/ql298RoutingStudio.ts` (canonical simulation), `ql317RouteMap.ts` (read-only projection), `Ql317RoutingStudio.tsx` (graphic map, semantic table, controls), `__tests__/ql298RoutingStudio.test.tsx`, `__tests__/ql317RoutingVisual.test.tsx`.
