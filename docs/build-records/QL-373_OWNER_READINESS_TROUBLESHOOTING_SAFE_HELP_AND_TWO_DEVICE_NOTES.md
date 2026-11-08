# QL-373 — Owner-Guided Readiness Troubleshooting, Safe Help & Two-Device Notes

## Purpose and security boundary

QL-373 extends the already protected QL-369–372 original-owner portal. A diagnostic summary describes the **next safe manual step** based on the QL-370 verified, redacted AAL2 server readback. It offers fixed HTTPS instructions and a completely separate **self-reported usability note** for each owner. These tools are **guidance only**; they neither enroll an owner nor establish a signed original-owner decision.

Existing Supabase Auth, server-side AAL2 enforcement, dual independent original Windows signatures, one-time activation requirements, 30-minute intent-bound attestations and all six application `DISCONNECTED / HOLD` constraints remain untouched. A browser note, expired snapshot, Help resume, or copied document must never be represented as signed owner authorization or an operational TEST approval.

## Owner walkthrough: two independent devices

1. **Ree — original trusted Windows server:** Open the Master Owner Portal under Ree's personal Supabase Auth identity. Complete Ree's own authenticator challenge (AAL2). Never share recovery codes or tokens.
2. Open **Our enrollment progress**, use **Refresh server status**, and inspect the 6/6 HOLD readback. Follow **What can we safely check next?**. A failed/stale readback, missing attestation, expired evidence, or HOLD drift is a reason to stop or recheck, not a permission to bypass MFA.
3. Open **Record a separate usability note on this device**. Test keyboard-only tab order and focus, screen reader labels/live status, Ree's own MFA-protected status refresh, and the visible six application HOLD. Select **Not tested**, **Worked on this device**, or **Blocked on this device** for each. Select a broad blocker category only. No free-text secrets are accepted.
4. Click **Copy safe observation note** if the observations should be shared, or manually copy its read-only textarea. The note contains fixed labels and Ree's selected results, not auth details, original signer evidence, server fields or identifiers. **Clear observations** resets only this local transient page state. It does not clear enrollment or server history.
5. **Jack — separate trusted laptop:** Sign in as Jack using his own Supabase account and authenticator. Repeat the same tests on the laptop, independently. Jack's note must be completed by Jack and never assumed or signed by Ree. It is a usability observation, not consent.
6. Each owner can compare redacted results through an appropriate safe channel. For original offline signer commands and the genuine separate owner decisions, follow [QL-369 original enrollment procedure](QL-369_AUTHENTICATED_DUAL_OWNER_ENROLLMENT_CEREMONY.md). For focus and keyboard/screen-reader acceptance follow [QL-372 supervised accessibility notes](QL-372_SUPERVISED_WALKTHROUGH_SCREENREADER_ACCEPTANCE_AND_SAFE_RESUME.md). See [Supabase official MFA guidance](https://supabase.com/docs/guides/auth/auth-mfa) for personal authenticator setup.
7. **Only Ree** can explicitly present the two separately signed, currently valid original-owner activation decisions to the existing protected QL-369 server. Neither usability note is evidence of signature, consent, membership activation, or app connection. After genuine activation, all six applications remain `DISCONNECTED / HOLD` until separate source-specific approvals.

## Decision branches, negative controls and accessibility

| Situation | Advisory response | Required boundary |
|---|---|---|
| Owner role, audit/receipt, 6/6 HOLD drift | STOP and investigate | Do not retry activation or trust on-screen claims |
| AAL1 or no protected readback | Complete personal MFA / refresh | No browser-only AAL2 confirmation |
| Stale readback or device clock drift | Check clock and refresh | Countdown is an estimate, not server authority |
| No original intent | Review original Windows evidence | No fabricated SHA-256 or browser signature |
| Own attestation absent/stale | Owner renews own session/intent | Cannot attest for peer |
| Peer attestation absent/stale | Other owner independently attests | Cannot use shared device account/code |
| Time window closing | Review expiries and re-sign if necessary | No extension of original evidence validity |
| Both attestations current | Original two signed decisions still required | Ree alone submits actual packet |
| Real owner membership verified | Show limited membership confirmation | Six apps still HOLD; no private TEST |

The new panel uses a native semantic `<section>`, live `status` or urgent `alert`, labelled HTML `<select>` controls in `<fieldset>`, a read-only `<textarea>`, keyboard-accessible `<details>` disclosure, visible focus outlines, high-contrast borders, and 44-pixel control targets. Static links use `noopener noreferrer` and do not include dynamic owner information. User observations remain in component memory; the panel performs **no** Supabase, network, SQL, Auth, session or storage operations. Copy occurs only after the user's click.

## Verification and promotion requirements

- `npm run check`, full `npm test`, production `npm run build`, asset budget and all preserved `ql336a-required-gates.sh` checks succeed.
- New focused unit/React tests cover priority STOP state, independent owner guidance, stale AAL2, original intent, attestation expiry, fixed HTTPS links, fixed-category note export, accessible controls, clear/copy-only interactions, no additional QL-370 Edge requests, and six HOLD preservation.
- New Node safety gate checks absence of new Auth/server writes, persistence, hidden file selection or tokenized help URLs; the protected original gate fingerprint remains unchanged.
- CI Windows owner-key safety and production `main` verification must pass. Independent original-device signing, physical two-device accessibility testing, and real production owner authentication **remain owner actions** and are never claimed by synthetic CI.
- Both `dev` and `main` are promoted only after their protected pull-request checks succeed; separately confirm Cloudflare Worker/public asset parity and the Supabase production HOLD counts.

**Important:** A GREEN build proves the implementation and protected release checks passed. It cannot replace Ree's and Jack's two real machine checks, nor create genuine original-owner signatures or activate any held application.
