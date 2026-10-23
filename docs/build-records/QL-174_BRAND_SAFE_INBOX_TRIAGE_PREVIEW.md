# QL-174 — Brand-Safe Inbox & Triage Preview

**Boundary:** An in-memory operator preview of pinned QL-173 synthetic fixtures only. QL-174 never sends a message, places or logs a call, records an approval, modifies a held case, reads private customers, or adds browser persistence, API access, provider callbacks or Supabase writes.

## Delivered

1. `app/src/operator/ql174BrandSafeTriage.ts` converts the QL-173 canonical snapshots into isolated triage rows for Rosie Dazzlers and Devil n Dove. Only QL-173 provenance-verified records can enter this view. `getQl174BrandRows` revalidates the entire snapshot at the projection boundary and fails closed on any drift.
2. Each brand gets **All**, **New**, **Needs reply**, **Awaiting customer**, **Quotes**, and **Follow-up** queues. `New` is empty by default, while `Follow-up` derives from an *existing synthetic open task*, not from any new or actual task. Counts and filters reflect each brand independently.
3. `Ql174BrandSafeTriagePreview.tsx` adds accessible queue buttons, synthetic contact/subject/channel context, search, priority and assigned-operator filtering, deterministic recent/priority sorting, and a focused selected conversation card. It lives above the existing detailed canonical conversation reader in the QL-172 **Synthetic conversations** workspace. The shared navigation remains four sections, preventing a duplicate inbox route.
4. Operators can stage queue moves among only five synthetic states (`new`, `needs_reply`, `awaiting_customer`, `quote`, `follow_up`) and choose **Unassigned** or the selected brand's **demo operator** label. The **Apply simulated triage** button changes React memory only. No QL-173 record, follow-up task, owner approval, status in storage, consent entry, outbound message, or provider event is changed.
5. Switching businesses resets the current selection and filters. The model will reject a source ID from the other business, an unknown ID, an unverified fixture, an invalid operator label or an unsafe status such as `approved` or `archived`. A reset control discards all simulated moves.
6. A prominent **DISABLED PREVIEW · UNSENT** banner remains visible, every draft is marked `UNSENT / SIMULATED`, and no real SMS/call/owner decision action is presented. CSS covers mobile widths, 44px controls, visible keyboard focus and forced-colour mode.

## Reproducible fixture expectations

| Brand | All | New | Needs reply | Awaiting customer | Quote | Follow-up |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Rosie Dazzlers | 3 | 0 | 2 | 1 | 0 | 1 |
| Devil n Dove | 3 | 0 | 2 | 0 | 1 | 1 |

Queues in the final column overlap primary queues because **Follow-up** is a projection of an existing open synthetic task. It is not a new task, approval or live reminder. All six conversations and their original QL-173 provenance records remain unchanged.

## Acceptance gates

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

`app/src/operator/__tests__/ql174BrandSafeTriage.test.tsx` covers:

- Exact per-brand queue counts; synthetic fixtures and traceable provenance only.
- Queue, search, priority and operator filters; deterministic ordering.
- Simulated triage and assignment without canonical snapshot mutation, task creation, owner approval or provider delivery.
- Rejection of cross-brand IDs, invalid statuses/assignees, missing records and corrupted provenance.
- Rendered operator queue changes, no `fetch` or `localStorage.setItem`, reset semantics and cross-brand screen transition.
- Keyboard focus, mobile and forced-colours CSS rules.

All existing QL-165–173 model, operator and QL-171 safety tests must continue to pass. The QL-004 browser-local inbox is a separate existing demo that this build neither migrates nor authorizes for real customer-data entry.

## Promotion / evidence

Merge implementation to `dev` after CI app-build succeeds, then promote `dev` to `main` with a separate review. Verify all five checks by **exact `main` commit SHA**: `app-build`, `Build disabled preview`, `Deploy disabled preview`, `Supabase Preview` and `Workers Builds: rosevear-comms-hub`. Check GitHub Pages returns HTTP 200. Only then is **`main` Production = GREEN**, meaning a healthy disabled-preview artifact, not live operational authorization.

**Next queued:** QL-175 — Contact Context & Consent-State Preview. Once QL-174 reaches GREEN, **8 queued builds** (QL-175–182) remain.
