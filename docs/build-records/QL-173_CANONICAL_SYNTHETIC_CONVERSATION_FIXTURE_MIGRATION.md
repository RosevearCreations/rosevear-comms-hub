# QL-173 — Canonical Synthetic Conversation Model & Fixture Migration

**Release boundary:** versioned checked-in synthetic records only. This build does not alter Supabase schemas, invoke remote reads, modify the QL-004 localStorage repository, enable provider events or sends, or collect any real owner approval.

## What changed

1. `app/src/fixtures/ql173CanonicalSynthetic.ts` introduces one typed, pure adapter for the checked-in **QL-004 demo seed** and the four **QL-093 local fallback conversations**. It reuses the existing domain types in `app/src/types.ts` and does not invent a second live data model.
2. Every contact, conversation, message, task, intake, audit and simulated draft has a source-namespaced, stable synthetic ID. Contact/conversation/draft references preserve the intended Rosie Dazzlers or Devil n Dove brand. All collections are sorted newest-first and then by ID for deterministic replay.
3. Each record carries synthetic-only provenance: source kind, original source ID, version, QL-165-compatible source fingerprint, normalized record fingerprint and canonical schema version. The QL-004 source is separately pinned at `fnv1a64:0791e3cb92938645`; the six QL-093 fixtures retain their pre-existing QL-165 pinned manifest unchanged. **FNV-1a is a drift marker, not a cryptographic signature.**
4. QL-004 demo contact phone/email/town values are **not carried into the canonical preview**; its historical `humanApproved: true` inbound demo messages become explicitly `false` in the projection. QL-093 sample drafts are distinct `UNSENT_SIMULATED` records; no provider/event delivery is possible.
5. The QL-172 synthetic-conversation workspace now renders these verified canonical fixtures through `DisabledInterfacePreview`, replacing the duplicate hard-coded preview conversation list. It provides a clear provenance timeline, version/count indicator, explicit unsent status and the existing disabled action controls.
6. Any source pin failure, malformed fixture, duplicate identity, orphan relationship, invalid brand reference, inconsistent link, schema drift, invalid sort, provenance mismatch, or attempted approval/delivery produces review issues. A rejected migration returns **empty collections** and the UI displays a blocked placeholder without publishing unverified sample data.

## Synthetic migration inventory

| Canonical collection | QL-004 seed | QL-093 fallback | Total |
| --- | ---: | ---: | ---: |
| Contacts | 2 | 4 | 6 |
| Conversations | 2 | 4 | 6 |
| Internal/inbound synthetic messages | 2 | 4 | 6 |
| Follow-up tasks | 2 | 0 | 2 |
| Intake requests | 1 | 0 | 1 |
| Audit events | 1 | 0 | 1 |
| Distinct unsent preview drafts | 0 | 4 | 4 |

The adapter is not a database migration. The older QL-004 browser-local inbox remains segregated from this immutable, synthetic-only projection, pending later QL-174–178 replacement work. Supabase's separately gated public synthetic views are *not* trusted as QL-173 fixture sources. No real customer or private owner approval evidence is read or written.

## Acceptance and regression gates

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

`app/src/fixtures/__tests__/ql173CanonicalSynthetic.test.ts` covers fixture counts, source content pins, ID determinism, brand filtering, unsafe owner/delivery states, relational orphans, duplicate IDs, drift, malformed source and fail-closed empty results. `app/src/fixtures/__tests__/ql173OperatorPreview.test.tsx` exercises the actual operator rendering, both brands, unsent drafts and disabled live-action buttons. Existing QL-165/166/168/169/172 suites remain regression gates.

## Release verification required

Merge the independently tested QL-173 change into `dev`, then promote the reviewed `dev` commit into `main`. Check **all required statuses against the exact final `main` SHA**: `app-build`, `Build disabled preview`, `Deploy disabled preview`, `Supabase Preview`, and `Workers Builds: rosevear-comms-hub`. Verify the GitHub Pages preview responds successfully. Only then report **`main` Production = GREEN**, meaning the disabled-preview deployment is healthy, not that a live communications pilot is authorized.

**Next queued:** QL-174 — Brand-Safe Inbox & Triage Preview. After this promotion, 9 builds remain (QL-174–182).
