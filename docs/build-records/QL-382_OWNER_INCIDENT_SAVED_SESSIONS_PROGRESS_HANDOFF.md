# QL-382 — Owner Incident Review Saved Sessions, Review Progress & Accessible Handoff Summaries

Adds up to five named-by-sequence, in-memory review snapshots containing current filters, bookmarks and explicitly opened session observation sequence IDs. Snapshots are cleared at owner role or MFA change. Restoring a snapshot discards references to observations no longer in the current bounded history. A review progress meter counts observed alert episodes opened for review, never independent resolution. A read-only handoff summary describes filtered groups and evidence verification needs, without sending any message or authorizing work.

No browser storage, server writes, external handoff, incident acknowledgement or signed decision is introduced. The accessible UI distinguishes viewed from verified/resolved, and offers a clear-saved-views button.

Verification: QL-382 focused Vitest and node safety tests, existing owner-history tests and unchanged QL-336A release topology.
