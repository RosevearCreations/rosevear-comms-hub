# QL-314 — Unified Inbox Visual Triage, Clear Empty States & Saved Filters

## Delivered preview software

- Built directly on the existing QL-192/292 inbox, with QL-312 Standard Theme colours and QL-313 responsive shell, not on a duplicate or mock-only screen.
- Priority lanes now visually differentiate the five fictional categories with text labels. Their counts explicitly represent the **entire selected business before filters**, avoiding confusion with the combined-filter result set.
- Seven active-filter types (search, lane, view, channel, priority, demo owner and status) render individual accessible removable chips. **Clear all filters** resets the selection while preserving unrelated sorting and business context; ordinary controls remain available.
- The result bar reads back matching sample threads, visible unread examples and visible follow-up flags, with an explicit **Local demo ready · no provider sync** disclosure.
- Each thread card has source, demo-owner, high/normal priority, status and safe next-review labels. The existing consent, selected timeline and disabled/unsent composer behaviours remain unchanged.
- A genuine **filtered-no-results** state explains why the list is empty, suggests removing one chip and provides full reset. It cannot be mistaken for a server timeout, provider loading state or delivery success.
- Two existing in-tab saved-view slots now summarize their validated filter counts and sort order. Missing, invalid or cross-brand presets display safe-default recovery, never another business's saved details.
- Updated contextual help, [operator walk-through](../QL-314_UNIFIED_INBOX_VISUAL_TRIAGE_GUIDE.md) and [four-business/five-width visual review matrix](../visual/ql314-inbox-visual-capture-matrix.json). Screenshot and real-device acceptance remain **PENDING**, not a fabricated outcome.
- All six supporting-app integrations remain `DISCONNECTED / HOLD`, ACK evidence remains `UNDER_REVIEW / PARKED_FOR_LATER`. No real calls, SMS, emails, dispatch, provider send, private customer data or owner approval.

## Tested source and promotion

- `npm run check`: **PASS**.
- Focused inbox regression: **3/3 test files, 35/35 tests PASS**.
- Full `npx vitest run --reporter=dot`: **132/132 files, 1,197/1,197 tests PASS**. Existing React duplicate-key warnings from unrelated historical review fixtures remain; no QL-314 test failures.
- `node scripts/ql171-operator-baseline.mjs`: **PASS**, no raw-network or Supabase mutation sinks, real calls/SMS/owner approvals disabled. This is not a runtime security audit.
- `npm run build`: **PASS**, 542 transformed modules, with existing large bundle warning retained.
  - Tested JS `index-DfrGxHfI.js` SHA-256 `e0ea5ce7decd5efc92a6d2def1a280ee308e01db7e237019eccbaee495e1b89b`.
  - Tested CSS `index-CCGSFQze.css` SHA-256 `e374c92c851c9150d5995f97c7541ee2dbd465f0114f71eb8efffb37aff4e31c`.
- Promoted source to `dev` SHA `9d3d2e5c390862ed88aa9913b018c7141b4e3dee`, then merged [code PR #602](https://github.com/RosevearCreations/rosevear-comms-hub/pull/602) into code `main` SHA `8ae49f27ab67e12c8b3227344d35f6ef6b9f3f9c`.

## Exact-main production verification

**Software Production GREEN at exact code `main` SHA `8ae49f27ab67e12c8b3227344d35f6ef6b9f3f9c`.** All five applicable checks completed successfully: `app-build`, `Workers Builds: rosevear-comms-hub`, `Build disabled preview`, `Deploy disabled preview`, and `Supabase Preview`.

The public Cloudflare Worker https://rosevear-comms-hub.devilndovelive.workers.dev/ served the new QL-314 HTML pointing to the following artifacts; the full HTTP-fetched files matched their locally tested SHA-256 values:

| Live artifact | Production SHA-256 | Tested build comparison |
| --- | --- | --- |
| `index-DfrGxHfI.js` | `e0ea5ce7decd5efc92a6d2def1a280ee308e01db7e237019eccbaee495e1b89b` | **Byte-identical** |
| `index-CCGSFQze.css` | `e374c92c851c9150d5995f97c7541ee2dbd465f0114f71eb8efffb37aff4e31c` | **Byte-identical** |

This proves the deployed disabled-preview application assets, not real-device or live-messaging acceptance.

No real owner-device acceptance or external integration permission is implied by this software release.

## Queue handoff

QL-314 is the **fourth Production GREEN preview software build of twenty**, leaving **sixteen**. Next planned: **QL-315 — Conversation Timeline, Delivery-State Visual Language & Unsent Draft Recovery**. After QL-330, the next batch must come from genuine owner acceptance findings and independently verified evidence and require separate owner authorization.
