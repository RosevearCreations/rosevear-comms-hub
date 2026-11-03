# QL-314 — Unified Inbox Visual Triage, Clear Empty States & Saved Filters

**Release scope:** Actual QL-292 synthetic inbox controls, presented in the QL-312 Standard Theme and QL-313 responsive shell. This is an operational preview, not a connected mailbox or messaging provider.

## What operators now see

1. **Colourful, labelled priority lanes** summarize the whole current business, before search and other filters. Each lane includes a text name and integer count; colour never conveys priority alone.
2. **Active filter choices** form removable buttons, one per non-default search, lane, view, channel, priority, demo owner or conversation-status setting. Each button names the setting and its value. The single **Clear all filters** action restores all defaults without disturbing the chosen business or sorting field.
3. **Result totals** distinguish matching conversations from the five sample threads for the selected business and identify how many visible matches are unread or marked for follow-up. They label the source as local demo, not a loading or provider-health signal.
4. **Thread cards** expose fictional source, demo owner, status, high/normal priority, next safe review action and unread/follow-up text. The selected card retains its accessible pressed state and opens the existing timeline, consent and unsent-response guidance.
5. **No matching sample conversations** is a filtered empty state with guidance to remove one chip or clear all. It is never called a network failure, provider timeout or successful delivery.
6. The two existing saved-view slots (**Desk focus** and **Follow-up review**) now summarize the number of captured filters and sort order. Saving and restoring remain in-tab only; switching to another business or reloading clears the views and fallback defaults are safe.

## How to review the release

- Select **Front End / Operator → Unified inbox**, then choose **Priority now** and **Unassigned in demo**. Confirm that the active chips appear and results narrow, while the five lane counts still describe the whole fictional business.
- Remove only the **Demo owner** chip and verify the lane remains selected. Use **Clear all filters** to return to the five sample threads.
- Search for a phrase that does not match, confirm the empty state, then use **Clear filters**. No connection or real message should occur.
- Save one filter combination to **Desk focus**, navigate to the dashboard and back, then use **Restore saved view**. Change to iCamp and confirm the saved view and preceding business's fictional threads are unavailable.
- Review responsive widths 320, 375, 768, 1024 and 1440 CSS pixels and zoom 100, 200 and 400 percent. Capture actual screenshot, keyboard and screen-reader findings in [the visual matrix](visual/ql314-inbox-visual-capture-matrix.json). Its capture status remains pending until those reviews genuinely occur.

## Safety and acceptance

All sample people, conversations, owners, receipts and events are invented. Visual changes cannot send SMS, call, email, upload MMS, connect a provider, process real customer data, authorize an integration or sign off a management gate. All six cross-app connections remain `DISCONNECTED / HOLD` and ACK Delivery Evidence remains `UNDER_REVIEW / PARKED_FOR_LATER`. **Software Production GREEN is a build/deployment status, not real integration or physical owner-device acceptance.**
