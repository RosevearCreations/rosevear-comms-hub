# QL-170 — Release Receipt Integrity & Queue Reconciliation

QL-170 is the last scoped build in the QL-164–QL-170 batch. It adds a **read-only, exact-commit release receipt verifier** and an explicit next-batch planning trigger. Neither its code nor a GREEN deployment is authorization to turn on communications, accept real owner evidence, write audits or close customer holds.

## What it verifies

The verifier `scripts/ql170-release-receipt.mjs` compares independently retrieved GitHub evidence, not a hard-coded GREEN label:

1. User-provided complete `main` commit SHA still matches the remote `main` branch; `dev` and `main` carry identical source tree identities.
2. Every one of the five required **exact-main** checks is present **exactly once**, has `head_sha` equal to that exact commit, and has completed with `success`: `app-build`, `Build disabled preview`, `Deploy disabled preview`, `Supabase Preview`, `Workers Builds: rosevear-comms-hub`.
3. The feature PR is merged into `dev` at the current `dev` commit and its exact feature head had a successful `app-build`.
4. The promotion PR is merged into `main` at the exact target SHA, was opened from the current `dev` commit and that promotion head also had a successful `app-build`.
5. The roadmap contains the unique, ordered sequence QL-164, QL-165, QL-166, QL-167, QL-168, QL-169, QL-170—and no invented successor.

Incomplete, skipped, failed, stale-SHA, duplicate, mismatched or unmerged receipts produce **HELD**, with a nonzero CLI exit code. Other unrelated checks cannot substitute for any required check. Successful validation returns `GREEN`, `queueRemainingAfterRelease: 0`, and `newPlanningBatchRequired: true`; these are **release and planning states only**, not business decisions or live enablement.

## Invocation after the final main promotion

Run from the repository root with the actual PR numbers and **full final main SHA** (substitute the values from the completed release):

```sh
node scripts/ql170-release-receipt.mjs --sha <full-40-character-main-sha> --feature-pr <feature-pr-number> --promotion-pr <promotion-pr-number>
```

The verifier uses public read-only GitHub API queries. If the repository requires authenticated API access, use the normally configured `GITHUB_TOKEN` or `GH_TOKEN` environment variable. No credentials are printed or recorded. `--repo owner/name` is optional and defaults to `RosevearCreations/rosevear-comms-hub`.

For every release, obtain the latest checks on the **exact final `main` SHA** after the merge. GitHub workflow completion and provider deployment can be asynchronous. Do not pre-sign a receipt based solely on local tests, a feature PR, a `dev` merge or a prior `main` SHA.

## Evidence and acceptance

- `scripts/__tests__/ql170-release-receipt.test.mjs` tests a complete GREEN receipt and tampering with SHA, trees, missing/duplicate/stale/skipped/failed checks, PR lineage, feature/promotion app-build evidence and queue identity. The app CI workflow runs this test alongside existing frontend checks.
- The existing public disabled preview only explains that deployment receipts are checked externally. It **does not** display a fictitious GREEN status or accept private evidence.
- Existing app TypeScript/tests, production Vite build, disabled Pages build, and diff hygiene must pass locally; feature and promotion PR exact-head `app-build` must pass before their respective merges.
- Final success requires exact-main SUCCESS for all five named checks, plus the verifier's independent branch/PR/queue reconciliation. The release receipt should be linked in the final handoff rather than committed as a self-referential assertion in the build being verified.

## Queue outcome

QL-169 [feature PR #288](https://github.com/RosevearCreations/rosevear-comms-hub/pull/288) and [promotion PR #289](https://github.com/RosevearCreations/rosevear-comms-hub/pull/289) completed their required release checks on main commit [`050ddc9`](https://github.com/RosevearCreations/rosevear-comms-hub/commit/050ddc9d3af4d264a310ed9599cbdd605ba30e4d). QL-170 is the final outstanding entry; **do not treat it as completed until its own exact-main receipt is GREEN**.

Once QL-170 is GREEN, the scoped queue has **zero remaining entries**. Create and agree a new batch of logically sequenced builds **before** starting QL-171. Neither a future work list nor this release verifier is authority to activate real Phone/SMS, customer contact, private evidence collection, database writes, exports, escalations or hold closure.
