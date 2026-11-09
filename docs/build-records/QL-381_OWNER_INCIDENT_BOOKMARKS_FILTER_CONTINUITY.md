# QL-381 — Owner Incident Review Bookmarks, Filter Continuity & Accessible Session Navigation

Authenticated owners can bookmark bounded in-memory observations, filter to bookmarked groups, restore a previous filter state after a session shortcut, and press Escape in the detail panel to return keyboard focus to the selected result. Bookmarks are tied to the underlying observation sequence, not a potentially transient display group ID. They are capped at 40, never persisted, and cleared with role or authentication changes; stale observations do not appear as active bookmarks.

This is review-only UI. Bookmarks do not acknowledge, resolve or independently validate incidents. All evidence boundaries, protected refresh and owner MFA checks remain in place.

Verification: QL-381 safety and UI tests plus preserved QL-336A release gates.
