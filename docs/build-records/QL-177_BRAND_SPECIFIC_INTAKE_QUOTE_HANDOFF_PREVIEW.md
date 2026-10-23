# QL-177 — Brand-Specific Intake & Quote Handoff Preview

## Delivery scope

- Add an operator-visible, source-verified QL-177 preview to the **Synthetic conversations** workspace, following the brand-safe inbox, contact context, and unsent timeline.
- Rosie Dazzlers: select sample vehicle category, service, condition, image-review need and optional county coverage cue. Existing SUV/pet-hair QL-004 fixture pre-populates four verified answers, and its existing follow-up task is linked.
- Devil n Dove: select sample maker technique, material family, design/reference requirement, timing expectation and optional specification needs. The existing candle personalization follow-up task is linked without fabricating an intake record.
- Six conversations remain anchored to QL-173 verified, provenance-pinned fixtures, with canonical contact/conversation/intake/task relationships. The four QL-093 synthetic fallback conversations plus Devil n Dove QL-004 get derived **preview suggestions only**; the canonical fixture collections are immutable.
- Required fields gate the mock review handoff. Completion results only in `READY_FOR_INTERNAL_REVIEW_SIMULATED` in React component memory. A change invalidates previously staged readiness; reset and brand switch discard local edits. No pricing calculator, real quote or actual workflow task is created.
- A training-only internal note is redacted before state storage using QL-176 sanitization. Selects accept only reviewed enumerated values; text cannot become an image upload or external destination.

## Explicit safety contract

**DISABLED PREVIEW.** No customer calls, SMS/MMS, email, live provider webhook, photo upload, customer quote, accepted deadline, appointment booking, payment, owner approval, live task creation, persistent browser or Supabase write, or external submission. No real private customer or owner data should be entered. The older QL-004 local inbox remains an inventoried baseline risk, **not an approval to process real data**.

If a source pin, provenance field, cross-brand link, or snapshot invariant fails, the QL-177 view fails closed. Cross-brand conversation identities, arbitrary field names/values, and forged approved states are rejected. Internal mock handoff routes are visibly synthetic, not permission grants.

## Verification gates

1. Run `npm run check`, `npm test`, `npm run build` and `npm run pages:build` in `app/`.
2. Run `node scripts/ql171-operator-baseline.mjs`, `node --test scripts/__tests__/ql171-operator-baseline.test.mjs`, `node scripts/__tests__/ql170-release-receipt.test.mjs` at repository root.
3. Review seven selected QL-177 changed files and merge feature branch to `dev` only after application checks succeed.
4. Promote reviewed `dev` to `main` through a PR. Require exact-main success for `app-build`, `Build disabled preview`, `Deploy disabled preview`, `Supabase Preview`, and `Workers Builds: rosevear-comms-hub`, plus observable GitHub Pages preview.

**Release status:** candidate until a matching SHA and all five main checks are verified. Do not claim GREEN from this record alone.

**Next queue once GREEN:** five builds, QL-178–182: task/follow-up simulation; provider-neutral phone/SMS emulator; multiline routing/IVR simulation; privacy/roles/live pilot prerequisites; synthetic end-to-end journey acceptance.
