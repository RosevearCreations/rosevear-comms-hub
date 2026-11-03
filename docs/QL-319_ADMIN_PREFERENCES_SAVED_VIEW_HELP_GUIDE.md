# QL-319 — Admin Preferences, Saved-View Recovery, Shortcuts & Contextual Help Finish

## Operator walkthrough (disabled preview)

1. Open **IT Command**, **Management**, **Analytics** or **System Status**. The new **Operator settings & recovery** section appears below the command tabs. It is an Admin-style **display preview**, not an administrator sign-in.
2. Choose an existing local layout profile and a Comfortable or Compact density in **01 · Layout & reading density**. The adjacent **Customize cards** editor still owns card order, visibility, role-preview display and naming up to six profiles. Changes persist only through the already-reviewed `rosevear-comms-hub:ql272-command-layouts:v1` browser-local record when storage is available.
3. In **02 · Navigation & shortcuts**, navigate to any command screen or open the shortcut reference. Use **Alt + Shift + 1–4** for IT, Management, Analytics and Status; **Alt + Shift + H/R** for help and local saved-view audit; **Escape** closes an assistance panel. Shortcuts are ignored while typing in an editable field.
4. In **03 · Saved-view integrity & recovery**, choose **Inspect saved profile**. Only a `VALID` v1 record enables **Restore saved layout**. Missing, invalid, malformed and unavailable records never restore. In an invalid/malformed case, Standard defaults render safely; **Review reset to defaults** presents the exact data-loss explanation and requires **Confirm replace local layouts**. **Keep existing layout** cancels the reset. Resetting discards named local layouts and does not touch CRM or accounts.
5. In **04 · Contextual help & export readback**, open help for the current command screen. **Review sanitized layout export** displays a read-only, schema-validated JSON representation that can be copied manually. No automatic download, clipboard operation, cloud transfer, import, new storage key or account sync occurs. The preview cannot include extra tenant/customer/secret fields.

## Acceptance and explicit boundaries

| Scenario | Expected result |
| --- | --- |
| Fresh profile; density edit; command view switch | Visible layout and existing validated v1 local record reflect the choice; no new persistence key |
| Corrupted JSON / altered schema / changed role | `MALFORMED` / `INVALID`, safe Standard render, restore disabled, explanatory reset confirmation |
| Browser storage unavailable | Session-only presentation and no persistence claim; no secret or new role grant |
| Export preview | Read-only sanitized v1 layout JSON; no automatic send, file, clipboard or private data |
| Reset review then cancel | Stored layout remains untouched |
| Confirm reset | Standard profiles replace the local layout only, where storage permits |
| Keyboard / reduced motion / forced colours / mobile | Labeled controls, visible focus, reflowed cards and settings, text alongside status colours |

Manual owner-device screen-reader, 200% text-zoom and authenticated role acceptance have **not** been performed or signed off. All four businesses remain synthetic and segregated. Six-app integrations stay `DISCONNECTED / HOLD`; ACK Delivery Evidence stays `UNDER_REVIEW / PARKED_FOR_LATER`. No real customer data, staff assignments, provider send/call/SMS, dispatch, tenant GET, role grants, credentials or owner approval are enabled by QL-319.
