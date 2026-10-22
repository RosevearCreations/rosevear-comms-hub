# QL-165 — Synthetic Fixture Provenance & Version Pinning

QL-165 pins the **six existing browser-local fallback samples** used by the public disabled preview: four synthetic conversations and two synthetic system-state cards. This is a source-controlled integrity check, not external provenance, authentication or customer evidence.

## What changed

- Every approved fixture has a stable `kind:id`, explicit revision 1 and a reviewed fingerprint in `app/src/operator/ql165SyntheticFixtureProvenance.ts`.
- The set is pinned to `ql093-local-fallback-v1` and schema version 1. Fingerprints use deterministic canonical JSON and FNV-1a 64-bit. This is an **accidental-drift marker, not a cryptographic security proof or signature**.
- Missing, duplicate, extra, changed or wrong-source fixtures, or a stale declared version, report an integrity failure. On failure, the preview **withholds local fallback rows** and displays the reason. Independently validated, allowlisted synthetic/public Supabase rows still follow the existing separate QL-093 validation rules.
- The operator preview displays whether the local six-fixture manifest matches and which set/schema version is active. No approvals or actions are created.
- The existing QL-164 tamper tests remain required, and QL-165 adds cases for exact pins, ordering, brand isolation, content edits, stale versions, source impersonation, missing/extra/duplicate identities and system-status changes.

## How to update a legitimate sample

1. Change the approved synthetic sample in `ql093ValidatedSyntheticSafeReads.ts` (never customer/provider content).
2. Explicitly review identity, schema and sample text. Bump the set/revision as appropriate, then deliberately update its pin in `ql165SyntheticFixtureProvenance.ts`.
3. Run `npm ci`, `npm run check`, `npm test`, `npm run build` and `npm run pages:build` in `app/`. A stale fingerprint or version must fail the CI test before promotion.
4. Obtain exact-head `app-build` success on the feature and promotion PRs, followed by all five successful release checks on the final `main` commit.

The production preview remains disabled and display-only. QL-165 does not change the Supabase schema, read targets, permissions or credentials; no customer data, live Phone/SMS, callback, persistence, export, real owner decision or AI sending is permitted.

Next queued: **QL-166 — Operator Preview Readability & Accessibility Repair**.
