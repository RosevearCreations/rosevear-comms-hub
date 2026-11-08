# QL-372 — Supervised Enrollment Walkthrough, Screen-Reader Acceptance & Secure Ceremony Resume

## Scope and trust boundary

This release provides **instructional navigation only** inside the QL-367 Master Owner Portal, using the existing protected QL-370 server readback and QL-371 seven-step checklist. It does not introduce a new server endpoint, role, database migration, OAuth scope, source connection or enrollment action.

- Ree (`source`) and Jack (`master`) each use their **own** trusted device, Supabase identity and TOTP authenticator. Each retains control of their original Windows signing key.
- Role-specific instructions describe original QL-368 evidence-only signing (24-hour window), independent **NEW** QL-369 explicit activation decisions (one-hour window), intent matching, 30-minute server-side MFA attestations, and Ree-only final packet submission.
- Navigation, a read step, and a browser-stored resume position are **never** approval, cryptographic evidence, MFA, or an authorization to connect any application.
- The original offline signatures are not browser-observable. The server alone verifies the final exact signed packet and one-time two-membership activation; all six application shells remain `DISCONNECTED / HOLD` with private TEST disabled.

## Resuming safely on the same device

1. Sign in as Ree or Jack using the individual original-owner account and complete authenticator MFA.
2. In **Our enrollment progress**, refresh protected server status. The server must confirm a fresh, owner-role-matched AAL2 session and six held shells. Snapshots more than two minutes out of date are not trusted.
3. Under **Review one step together**, choose **Resume reading step N** if offered. The guide **never resumes on its own**. The saved item is only the last viewed help step, not a prior verified state.
4. Navigate using **Previous step**, **Next instruction** and **Clear help position and start over**. Keyboard focus moves to the newly selected step heading, and an accessible live announcement identifies the step.
5. Review actual current evidence again in the server readback and on the original devices. Expired or revoked evidence must be regenerated; the help position does not renew it.
6. Sign out to remove **both** locally stored owner help positions. The existing **Clear this browser’s ceremony selections** action also clears this position.

The single `sessionStorage` value has the form `v1:<one of seven fixed step IDs>` under the role-specific key `rosevear-comms-hub:ql372:help-position:source|master`. It contains **no** email, user ID, shared intent SHA-256, MFA code, Auth token, factor secret, private key, source payload, signature, signed packet, or server attestation. It is tab-scoped and versioned; malformed or unrecognized values are ignored. Storage failures leave the guide usable without persistence. A stale or unavailable server readback hides the resume offer. Refreshing the page never restores privileged activity.

## Keyboard and screen-reader acceptance

Automated `jsdom` tests verify the semantics and state changes. These simulate the browser; they **do not claim** a real Windows Narrator, NVDA or VoiceOver acceptance by Ree or Jack.

Suggested original-owner manual acceptance on **each** machine:

1. At 200% browser zoom and narrow window width, confirm every step title, status and navigation button stays readable, with no horizontal cut-off. Check Windows high-contrast mode.
2. With Windows Narrator (or NVDA), tab into **Review one step together**. The section has a named heading, the current instruction reads as *Instruction 1 of 7*, and the group has a name.
3. Activate **Next instruction** using Tab + Enter/Space. Confirm focus moves to the **step heading**, and the polite live announcement reads the selected step without claiming enrollment completion.
4. Use **Previous step**, then **Clear help position and start over**. Confirm focus stays predictable. The final step has a disabled **Next instruction** button and never triggers packet submission.
5. After an authenticated MFA readback, navigate to another step and refresh the tab. Confirm a **Resume reading** offer is visible but nothing resumes until it is selected. Confirm the current server status is independently rechecked.
6. Sign out and sign back in. Confirm no resume offer remains. Confirm Jack cannot use Ree’s final activation file form or sign on her behalf.
7. Repeat with an AAL1-only session, expired/stale readback, disabled browser storage and/or disconnected network. No protected server data, past attestation or resume is treated as current.

Keep any owner-verified usability observations privately and without exposing MFA codes, original signer secrets, signed files or personally identifying Auth fields.

## Verification and release checks

- `npm run check`, `npm test`, `npm run build` and the full `bash ../scripts/ql336a-required-gates.sh` from `app/`.
- New QL-372 pure tests reject malformed positions, peer-role crossover, stale snapshot, AAL1, HOLD drift and storage denial.
- New QL-372 React tests check role-specific guidance, focus transition, live announcement, explicit resume, clear/reset and no actual submission.
- Static negative-access test in the full gates and Windows owner-key safety workflow rejects new browser network, privileged DB writes, unattended signer calls and sensitive persistence.
- Existing QL-369 and QL-370 Edge verifier and all original release gates remain required.
- After production merge, verify GitHub Actions app-build, original Windows key safety, Pages disabled preview, and public Worker HTML/JS/CSS SHA-256 parity.
- A read-only Supabase audit may count actual owner memberships, active owner MFA attestations, activation receipts and six held shells. **Never fabricate owner consent to turn tests green.**

## Next scope

QL-373 candidate: Owner-Guided Ceremony Readiness Troubleshooting, Safe Help Links & Independent Two-Device Acceptance Notes. Any actual release of HOLD remains a separate, explicit, original-owner and source-specific decision.
