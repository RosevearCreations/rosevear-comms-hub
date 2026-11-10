# QL-409 · Source-Scoped Protected Audit Decision Timeline, Independent Owner Exception Worklist & Receiver-OFF Recovery Review

## Owner acceptance and trust boundary

QL-409 is a read-only, demonstration-only operator review surface. The per-source selection reuses QL-406's six-app source selector. It displays synthetic, clearly identified decision history and independent exception routes to explain how a *future* authenticated, receiver-side protected audit projection would be reviewed. **No original audit decision, private receipt, signer proof or consent is imported.** No browser-provided role or event proves authority.

Every source remains `connection=HOLD`, `receiverEnabled=false`, `oneTestAuthorized=false`. The feature has no persistence, network side effects, remote receiver calls, notification send, credential fields or TEST execution. The receiver remains **OFF**. QL-408's independent protected audit checks and owner gates remain prerequisites.

## Decision history and exceptions

The pure `reviewQl409AuditDecisions` model:

1. Permits only registered sources; requires each input's `sourceId` to match the selected shell.
2. Accepts only the narrow public demonstration fields: `sourceId`, `caseId`, `eventId`, `observedAt`, `gate`, `actorRole`, `decision` and opaque `reference`.
3. Rejects unknown fields, malformed records, cross-source records, duplicate event IDs and future/malformed timestamps; sorts retained example events chronologically.
4. Derives an independent operator exception worklist: rejected decisions require immediate review, stale evidence requires refresh, other HOLD/review-requested decisions require independent follow-up. A claimed independent reviewer goes to Master owner review; others go to independent reviewer.
5. Treats snapshots more than 24 hours old, in the future, or without a valid captured timestamp as stale. Demo data is never substituted for a real protected decision.

Source examples for `yw` and `icamp` are **invented fixtures**, not evidence. Other sources show an empty demonstration timeline; they are not implicitly clear.

## Receiver-OFF recovery and supervised handoff

An owner may read the worklist and organize follow-up, but must retain HOLD until independent original-Windows custody evidence, valid source/reviewer/master signatures, source binding, consent, freshness, receiver enrollment, audit references and replay protection have been reviewed through a protected server-side workflow. An authorized one-TEST requires its own separately recorded owner decision. This code cannot initiate one.

Verification: `npm --prefix app run test -- src/auth/__tests__/ql409AuditDecisionReview.test.ts`, `npm --prefix app run check`, `npm --prefix app run build`, and `node scripts/ql329-asset-budget.mjs` from the repo root after build. Inspect the six-app owner screen for source selection, readable timelines and explicit receiver-OFF/HOLD messaging.

## Next proposed build

**QL-410 — Protected Audit Decision Export, Owner Action Continuity & Receiver-OFF Incident Recovery.** Only after independent evidence and owner authority are in place; preserve read-only fail-closed behavior by default.
