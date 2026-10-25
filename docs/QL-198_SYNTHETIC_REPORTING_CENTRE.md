# QL-198 — Synthetic Reporting Centre

QL-198 adds a four-business Reporting Centre alongside the QL-191–197 operator workspaces.

## Functionality

- Company-scoped, calculated sample totals for fictional threads, unread examples, needs-reply conversations, active/unassigned/overdue/completed tasks and session edit receipts.
- Accessible channel/status grouping table with example counts and shares, without chart-library/network dependencies.
- Session queue edits from QL-194 and QL-197 are reflected when navigating to Reports. Company changes restore the original isolated demonstration queue.
- Navigable shortcuts to Inbox, Follow-up Queue and Calendar, with contextual `ⓘ Help` and responsive layout.

## Limits

This is **not operational analytics**. Fictional inbox fixtures and ephemeral in-memory tasks are the sole inputs. Percentages are of the current company’s five synthetic example threads. No live provider, customer records, real date trends, backend aggregation, tracking, export, retention, alerts, SMS or call enablement. Real reporting would require tenant-authorized data access, aggregation definitions, retention policies and owner approval.

## Checks

Run `npm run check`, `npm test`, `npm run build`, `npm run pages:build` in `app/`. QL-198 tests cover four-company isolation, grouping totals, session update reflection, UI filters, help, navigation and reset. Release marker: `ql198-synthetic-reporting-v1`.
