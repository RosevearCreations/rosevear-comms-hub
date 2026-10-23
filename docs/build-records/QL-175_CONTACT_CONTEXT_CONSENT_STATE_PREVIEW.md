# QL-175 — Contact Context & Consent-State Preview

**Release boundary:** Synthetic, provenance-verified QL-173 fixtures only; disabled preview throughout. No real contact ingestion, Supabase migration/write, browser storage, private owner approval, call/SMS/email transmission, opt-in or opt-out update is authorized or implemented.

## Delivered

1. `ql175ContactContextConsent.ts` derives a single-source, deterministic **contact context** for each business from the existing QL-173 canonical migration. A full revalidation at the projection boundary rejects drifted fixtures, invalid source fingerprints and broken cross-brand references. It does not read the QL-004 editable browser-local repository.
2. Three synthetic profiles per brand link to the correct conversations, existing message counts, **UNSENT / SIMULATED** draft markers, follow-up tasks and intake records. No fake contact email, phone or town is re-exposed; no external customer data enters the model. Profiles and histories cannot cross the brand boundary.
3. `findQl175DuplicateCandidates` detects normalized, full synthetic-label similarities only inside one brand. Suggestions are marked **REVIEW ONLY / NO MERGE**, identity remains **NOT VERIFIED**, and no association or database mutation occurs. The pinned sample set has zero duplicate-label matches. Tests supply deliberately ambiguous duplicate examples to exercise this path.
4. Each profile displays **SMS**, **Voice calls**, and **Email** consent independently. All begin **UNKNOWN / NO EVIDENCE** because the pinned fixtures contain no reliable consent artifact. Unknown is never converted into a grant. Every channel is always `dispatchAllowed: false` and `verifiedGrant: false` for this disabled-preview build.
5. The operator can click **Simulate opt-out** and **Reset to unknown** to demonstrate a red opt-out badge. This local React-state overlay is expressly **SIMULATED** and cannot produce `granted`, write actual consent, dispatch, invoke an owner approval or modify the canonical QL-173 fixture. Cross-brand IDs, unverified sources, forged grant operations and invalid channels are denied. The overlay is discarded when switching brands.
6. `Ql175ContactContextPreview.tsx` appears under the existing QL-172 **Synthetic conversations** workspace, after QL-174 triage. The four-workspace shell stays intact. Profiles, history, consent evidence warnings and no-merge candidates use accessible section labels, status announcements, 44px controls, visible focus, mobile and forced-colour rules.

## Acceptance evidence

The focused `app/src/operator/__tests__/ql175ContactContextConsent.test.tsx` asserts:

- Exactly 3 profiles/3 linked conversations per business, with matching tasks/intakes, no cross-brand leakage and no private contact fields.
- Every SMS/voice/email state starts **UNKNOWN** and blocked; no contact detail, inbound message or simulated past demo approval is treated as consent.
- Similar synthetic labels produce possible-duplicate suggestions inside the same brand only, and never a merge; ambiguous names cannot establish verified identity.
- Preview opt-out and reset work without canonical mutation; invalid channels, brands, identities, source drift and any opt-in/grant operation fail closed.
- Rendered screen retains brand isolation and loses opt-out simulations on switching brands; `fetch` and `localStorage.setItem` remain unused.
- Responsive layout, keyboard focus indication, ARIA landmarks/status and forced-colour styling are covered.

Run full checks:

```text
cd app
npm run check
npm test
npm run build
npm run pages:build
cd ..
node scripts/ql171-operator-baseline.mjs
node --test scripts/__tests__/ql171-operator-baseline.test.mjs
```

## Deployment / owner acceptance

Promote as a separate reviewed feature PR → `dev`, then `dev` → `main`. GREEN applies only after five exact-main checks succeed: `app-build`, `Build disabled preview`, `Deploy disabled preview`, `Supabase Preview`, `Workers Builds: rosevear-comms-hub`, plus an HTTP 200 from GitHub Pages. A successful Pages release still **does not** activate live telecommunications, real consent processing or owner decisions.

**Next queued:** QL-176 — Conversation Timeline & Unsent Draft Workspace. After QL-175 is promoted, **7 queued builds (QL-176–182)** remain.
