# QL-374 — Owner-Authenticated Operator Shell Entry, Guided Navigation & Accessible First Use

## Scope and trust boundary

The Master Owner Portal (`#/master`) already authenticates each personal Supabase user through the QL-367 self-read and verifies a real current AAL2 session through QL-368. QL-374 adds a new **personal, read-only operator starting point** only after both checks. It does not create a second login, grant a role from a browser setting, or reuse the public synthetic operator preview as a privileged interface.

Ree's `source` role and Jack's `master` role remain separate. No new network request is made. The operator entry uses QL-370's existing protected, redacted server response and rejects a mismatching role, missing AAL2, a stale snapshot (older than two minutes), membership/audit drift, fewer than six held shells or non-HOLD connection state. It shows the status as unverified or STOP instead of treating a browser flag as a grant.

The three accessible sections are **My overview**, **I.T. and security**, and **Getting started**. Navigation uses native buttons with a current-page indication, an announced section heading, keyboard focus restoration, minimum 44px targets, mobile stacking and forced-colors borders. The portal's older QL-369 activation actions remain separate and explicitly user-confirmed. The new shell contains no write, source activation, private TEST, customer view, secret, query parameter or new Supabase table access.

## Preflight reconciliation: historical does not mean current

Read-only November 8, 2026 Supabase verification found **2 Auth users, 0 active owner memberships and 6/6 shells DISCONNECTED / HOLD**. The QL-331 *zero users* statement, and QL-329 *no master identity/session yet* were true for their **November 3 historical snapshots**, but were outdated as a present-day prerequisite after the QL-367 owner portal. QL-307/309 recorded earlier six HTTP 404 NO-GO snapshots; the QL-365D software integration was subsequently promoted. Those old snapshots are still preserved for evidence and regression, but no longer block entry into the authenticated, non-operational owner dashboard.

| Historical check now archived on public I.T. pages | What changed | What remains required |
|---|---|---|
| QL-329 architecture `PLANNED`, no owner login yet | QL-367–374 portal exists | Genuine personal Auth and AAL2, no inherited child access |
| QL-331 Auth user preflight `0` | Protected current count `2`, membership `0` | Independent signed original-owner membership activation, RLS |
| QL-307/309 early six HTTP 404 / pilot NO-GO | Software contract/handoff advanced by QL-365D | Current source-specific original issuer, witness, owner TEST decision, isolated tenant, trusted signed connection |
| QL-310 early batch reconciliation | Historical observations, not a heartbeat | Fresh source-authenticated readback and separate connection approval |

The public operator's I.T. and System Status screens now lead with a **dated current-vs-historical register**. The QL-329, QL-331, QL-307, QL-309 and QL-310 panels are behind accessible archive disclosure controls. Their original test material is retained, not silently deleted; new labels explain the date and prevent obsolete data from being used as a current gate.

**There is no release of the six applications.** Even if both owner memberships become verified, customer operations, source activation, private TEST and tenant access remain `DISCONNECTED / HOLD` until their own approvals. A public demo count is never a substitute for the authenticated protected QL-370 refresh.

## First-use acceptance on both original devices

1. **Ree — original Windows server:** Open `#/master`, sign in using Ree's own Supabase account, and complete the personal TOTP challenge. Confirm the landing says **Welcome, Ree**, not a shared organization login.
2. Use Tab, Shift+Tab, Enter and a screen reader to open **I.T. and security**, **Getting started**, and return to **My overview**. Focus should move to the selected section heading, which should be announced. The current button has an accessible current-page marker.
3. Select **Refresh server status** in QL-370 below. Confirm a recent protected reading shows zero memberships until independently activated and all six HOLD; deliberately disconnected or expired status must never be presented as verified. No owner signature is required to browse the safe operator starting point.
4. **Jack — separate original laptop:** Repeat independently with Jack's own credentials and TOTP. The landing must identify **Jack**. A status or note from Ree's device is not proof of Jack's session or signature.
5. Follow [QL-369 original dual-owner enrollment](QL-369_AUTHENTICATED_DUAL_OWNER_ENROLLMENT_CEREMONY.md) only when both owners are ready to take the real signed decisions. QL-374 never automates those decisions. Use [Supabase MFA guidance](https://supabase.com/docs/guides/auth/auth-mfa) for separate authenticator setup.

## Tests and release evidence

- Unit and React tests cover pending/active memberships, both owner identities, stale/no/readback/AAL1/HOLD/audit failures, no connection grants, keyboard navigation, focus restoration, labelled status, and first-use guidance.
- Node static safety check rejects new network, Auth or data mutations in QL-374; confirms MFA/identity gating, reuse of the protected QL-370 request, and archival of old I.T. panels with real gates intact.
- Required consolidated CI and Windows release checks explicitly include the QL-374 safety gate. Historical integration verifier tests remain in CI; **only their obsolete live-entry status is retired**.
- Production acceptance requires protected `dev` and `main` PR checks, GitHub Pages/Cloudflare publication, independent public JS/CSS SHA parity, and current Supabase HOLD counts. A GREEN software build never substitutes for owner/device acceptance.

## Repository branch cleanup inventory and safe limits

At this review the repository API and a read-only full remote fetch found **444 remote branches**, including `dev` and `main`. Git ancestry classification against the then-current heads yielded **382 branches reachable from `main`** (including `main`), **382 reachable from `dev`** (including `dev`), and **355 reachable from both**. This identifies 355 strong merged-history cleanup candidates, but does not prove that all other heads are useless. **62 branches are not ancestors of `main`** (including `dev`) and require unique-work or squash-equivalence review. Do not erase 442 refs without first proving which are merged and identifying unmerged unique commits; deleting unmerged work is not a safe definition of “unnecessary.” No obsolete application data, customer records, security logs or source proof were deleted. This workspace's build branch is temporary and must not be mistaken for a production branch.

The connected GitHub management tool for this session has no GitHub `DELETE /git/refs` or delete-branch operation, so **remote branch deletion was not performed**. To complete the requested two-branch policy, use a credentialed repository-owner GitHub workflow/UI to verify protected `dev`/`main`, classify merged branches against both, preserve or explicitly archive unique unmerged commits, then delete approved merged refs in bounded batches and verify the final branch inventory. Never remove protected branch heads or bypass PR release rules. Confirm deletion results from the GitHub API rather than claiming this document performed them.
