# QL-318 — Assignment Workboard and Safe Handoff Review

**Mode: DISABLED SYNTHETIC PREVIEW** for Rosie Dazzlers, Devil n Dove, Yard Workers and iCamp. No real employee assignment, customer contact, dispatch, reminder, notification, handoff delivery, owner approval, browser storage or provider request is authorized.

## Operator walkthrough

1. Open **Front End / Operator → Assignments & follow-ups**. The current fictional business appears in the heading. Six worklist lanes retain QL-294's deterministic due/overdue, assigned, unassigned, blocked and completed filters; search and owner selection narrow only this company's seeded tasks.
2. Read each task's **due window**, **severity**, **attention state**, **fictional owner**, **status** and count of local changes. Select a task to see the same four attributes in the larger workboard snapshot, its source fixture and the session-only action history.
3. Change owner, status, priority or illustrative due window. These are local examples, not actual employee actions or deadlines. Change receipts are sorted by session sequence and cannot include another company.
4. In **Operator handoff preview**, choose a fictional recipient and a fixed next step, then press **Prepare unsent handoff summary**. The prepared text is **UNSENT**, not a task reassignment or external notification.
5. **Review current UNSENT summary in this tab** is enabled only when the prepared summary matches the selected task and the latest task receipt sequence. Review displays a **READ LOCALLY · UNSENT · NOT AN APPROVAL** readback; it makes no write or delivery.
6. If a task changes after preparation, including changing a field and then changing it back, the old summary becomes **OUTDATED** and its content is hidden. **Prepare unsent handoff summary** again before in-tab review. Completed tasks cannot prepare new previews until reopened.
7. Use **ⓘ Help** for field meanings, the stale-summary rule and shortcuts; **Alt + Shift + Q** opens assignments, **F** focuses search, **J** focuses the first item, and **K** toggles help. Shortcuts do nothing inside inputs, selects, text areas, contenteditable elements or composition sessions.

## Safe review gates

| Condition | Readback | In-tab review |
| --- | --- | --- |
| No prepared handoff | No summary | Disabled |
| Latest prepared UNSENT summary, valid fictional owner and receipt | Visible as **UNSENT** | Enabled; only local reading |
| Any later assignment receipt, even if field restored | Outdated, old text hidden | Disabled pending fresh preparation |
| Done task, unknown recipient, forged/foreign receipt, other company | Stale or unavailable | Disabled |
| Reprepared with valid current task and recipient | Fresh **UNSENT** summary | Enabled; no external action |

The revision-aware gate is derived from the canonical QL-194 reducer and its session-only handoff receipt sequence, not a second storage system. Worklist order comes from the existing `sortedQueueTasks` and QL-294 lane rules. Source-linked inbox and Customer 360 navigation stay company-scoped.

## Verification and outstanding acceptance

- Automated tests cover all four company fixture rosters, sorted cards, severity/attention mapping, foreign queue denial, sequence-sorted history, unknown recipient and foreign receipt rejection, stale-after-edit-and-reversal, refresh/review and company switch reset.
- Functional keyboard/help, 44-pixel controls, responsive cards, high-contrast/forced-colour focus outlines and reduced-motion styling are implemented. **Physical phone/tablet/desktop screenshots, independent screen-reader testing and real owner acceptance remain PENDING.**
- QL-171 static safety inspection must remain clear of new raw network or Supabase write sinks. Six supporting apps stay `DISCONNECTED / HOLD`, and ACK Delivery Evidence remains `UNDER_REVIEW / PARKED_FOR_LATER`.

**Source:** `app/src/operator/ql194WorkQueue.ts`, `ql294OperatorWorklist.ts`, `ql318Workboard.ts`, `Ql194FollowUpQueue.tsx`, `ql318-workboard-visual.css`, `__tests__/ql318WorkboardVisual.test.tsx`.
