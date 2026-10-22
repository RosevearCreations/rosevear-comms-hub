# QL-168 — Unresolved Hold Prioritization & Evidence Summary

QL-168 adds a readable, **display-only review order** to the public disabled operator preview, derived entirely from QL-163's in-memory synthetic exception review. It is not an operational priority queue or authority to act.

## Delivered

- Two stable review-order lanes: (1) synthetic source/provenance/integrity blockers; (2) synthetic evidence follow-up blockers. Hold IDs sort deterministically and retain the proposed route plus exact required-evidence wording from the verified QL-163 review.
- Current blocked QL-163 gate descriptions and their hold guidance appear immediately below the lanes.
- Five outstanding private owner-decision prerequisites are grouped separately, with the count of synthetic holds affected; none is marked verified, approved or signed.
- Source integrity and authorization contract are rechecked before showing route/evidence details. Missing/duplicated holds, unexpected routes, altered counts, altered prerequisites, forged permissions or a failed QL-163 integrity state move **all known holds** into an integrity-review lane with generic safe evidence guidance. No tampered route is endorsed.
- A zero-hold synthetic fixture has an explicit message: no open sample holds does not grant real authorization.
- Responsive, screen-reader-labelled UI uses static sections and lists. The new summary contains **no buttons, inputs, forms or action endpoints**.

## Acceptance

- Local `npm ci --no-audit --no-fund`, `npm run check`, `npm test`, `npm run build`, `npm run pages:build` all pass.
- Existing QL-164 through QL-167 automated coverage remains active; QL-168 adds deterministic ordering, grouping, unsigned prerequisite, fail-closed tamper and rendered read-only panel checks.
- Exact feature PR-head `app-build` SUCCESS before merging to `dev`. Exact promotion PR-head `app-build` SUCCESS before merging to `main`. Final `main` requires SUCCESS for all five checks: app-build, Build disabled preview, Deploy disabled preview, Supabase Preview and Workers Builds.

No owner decision, real hold disposition, actual urgency ranking, customer data, Supabase query, provider callback, Phone/SMS, archive, persistence, export, database migration or privilege change is enabled by this build.

Next: **QL-169 — Private Owner-Decision Prerequisite & Privacy Review**.
