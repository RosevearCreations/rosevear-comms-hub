# QL-336A — CI consolidation, required gates and merged-branch custody

Status: implementation candidate. Promotion requires reviewed dev/main PRs, exact-main CI and a public Worker readback; do not infer production GREEN from this document.

## Reduced event fan-out

- A changed `app/**` previously started **three** workflows on a main push: `App scaffold CI`, `GitHub Pages Disabled Preview`, and `Public Disabled-Preview Asset Verification`.
- The public parity job is now part of `App scaffold CI`, after `app-build` succeeds, keeping its exact job ID `public-worker-asset-parity` and check display name `Public Worker JS/CSS SHA-256 parity`. A main app push now starts **two** workflows, a **33% reduction** in this measured source-controlled event fan-out.
- The original parity workflow remains available as a manual `workflow_dispatch` independent recheck; it no longer starts a redundant main-push run. The scheduled source-manifest audit remains separate.
- The gated GitHub Pages build/deploy remains isolated, with its required production environment and disabled provider flags unchanged.

## Preserved gates

- The `app-build` workflow job remains named `app-build` and runs on pull requests and exact `main` pushes.
- All **43** existing application commands after `npm ci` are preserved byte-for-byte and in order by `scripts/ql336a-required-gates.sh`, including TypeScript, full Vitest, focused suites, custody/handshake/manifest safety tests, release receipts, baseline, build and asset budgets. An additional test enforces the original command fingerprint.
- `npm ci` remains an independent setup step. GitHub Actions steps in the application job reduce from **46 to 4** without skipping the underlying commands.
- Both automatic and manually invokable public parity jobs rebuild locally using explicitly disabled hosted/customer/provider flags, then compare exact SHA-256 of deployed Worker JS/CSS. Retry exhaustion is a failure; no bypass or soft-success result is permitted.
- `scripts/__tests__/ql336a-ci-topology.test.mjs` guards the workflow triggers, required job names, fail-closed dependency, disabled flags and preserved test inventory.
- The workflow has only `contents: read`, uses checkout without persisted credentials, and does **not** add production API keys, permissions, calls/SMS, dispatch or source-data writes.

## Remote branch retention audit (2026-11-05 UTC)

At inspection: 354 remote-tracking branch refs, 353 reachable from the current `main` commit, including protected `main` and `dev`; one branch (`codex/ql270-workers-production-trigger`) had an unmerged tip; public GitHub listed zero open PR heads. **351 merged non-protected refs are candidates for individual revalidation**, not an instruction to delete blindly. GitHub branch heads and open PRs must be rechecked at deletion time, including any newly created build branch.

**Cleanup HELD:** the configured GitHub connector lacks a branch-ref deletion action, and local Git does not have authenticated push permission. No remote branches were deleted; no privileged GitHub Actions branch deletion workflow was introduced. Deletion requires an authorized authenticated capability, exact head SHA validation, protection of `dev`/`main` and active work, and a recoverable audit receipt.

## Promotion/connection boundary

This change affects CI and documentation only. The six-source integration remains `DISCONNECTED / HOLD`; no source migrations, child backfills, or signed production handshakes are activated.

Next planned product build: **QL-337 — AI Data Platform Broker, Comms Event Contracts & Idempotent Effects**. Branch cleanup must resume when branch-ref deletion becomes available and independently verified.
