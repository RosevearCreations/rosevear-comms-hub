# QL-380 — Owner Incident Review Keyboard Navigation, Accessible Detail Continuity & Safe Review Summaries

Within the protected owner incident history, arrow keys move through visible results, Home/End jump to their boundaries, and Enter activates the existing focused-detail flow. Focus remains on the selected result during arrow traversal so keyboard users can continue scanning. The existing filter and owner-role resets remain intact.

An immediately visible summary counts displayed groups, displayed action-level groups, groups requiring timestamp evidence verification and groups no longer displayed. Counts refer only to the current filtered in-memory owner session, never persisted incidents or six independently verified sources. No network requests, incident writes, or authority changes are introduced.

Verification: QL-380 Vitest UI tests, node safety test and unchanged QL-336A release gates.
