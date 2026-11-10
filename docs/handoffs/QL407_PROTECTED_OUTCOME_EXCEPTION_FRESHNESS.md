# QL-407 — Protected Original Receipt Review Outcome Import, One-Source Operator Exception Routing & Evidence Freshness Alerts

## Release boundary

QL-407 adds a source-scoped, read-only outcome projection review to the owner drilldown. **No protected original evidence, source key, reviewer approval or signed TEST receipt has been supplied. All six sources remain HOLD.** A software deployment is not independent review, receiver enrollment or permission to operate a live connection.

## Protected import contract (future authenticated adapter)

The client receives only a redacted, independently authenticated server-generated projection with exactly these fields: `sourceId` (one of six fixed shells), `caseId` (opaque nonsecret identifier), `reviewedAt`, `expiresAt` (canonical UTC ISO timestamps), `disposition` (`ACCEPTED_FOR_REVIEW`, `REJECTED`, `INCOMPLETE`), `verifiedByProtectedServer`, and `projectionVersion: 1`.

**Never treat the `verifiedByProtectedServer` Boolean as proof if submitted by a browser, ChatGPT message, public GitHub revision or arbitrary network response.** The future adapter must authenticate the operator, validate the original cryptographic source/reviewer/master chain using the protected QL-404 verifier, enforce six-shell source binding, authorize access, redact original bytes, enforce retention and replay controls, and only then produce a projection over an authenticated channel. The frontend cannot perform that verification and currently imports no records.

The view-model rejects extra fields (including accidental secrets), invalid timestamps, invalid case IDs, foreign shell identities, duplicate records, future-dated reviews, expired evidence and unverifiable claims. It raises `REVIEW_DUE_SOON` in the 48-hour expiry window. The selected source is isolated from all other shell and tenant identities.

## Operator routing

1. **Source owner:** establish original device/issuer custody and a signed source packet in the separately authenticated protected workflow.
2. **Independent reviewer:** inspect original bytes and witness chain, verify independent key pins and sign a disposition.
3. **Master Shell owner:** separately approve the exact source, purpose and one TEST scope.
4. **Receiver operator:** separately verify consent, private enrollment, durable replay prevention, signed one-TEST receipt and receiver acknowledgement.

The review output is always `HOLD_ORIGINAL_RECEIPT_AND_RECEIVER_GATES`. A valid *review projection* cannot itself activate the receiver, authorize TEST, persist an incident, deliver an alert or set a connection to CONNECTED. Freshness labels are operator guidance, not automated notifications.

## Verification

`npm --prefix app run test -- src/auth/__tests__/ql407OutcomeImportReview.test.ts src/auth/__tests__/ql406ProtectedHandoffReview.test.ts src/auth/__tests__/ql375OwnerSixAppDrilldown.test.tsx`

`npm --prefix app run check`

`npm --prefix app run build`

## Next proposed build

**QL-408 — Authenticated Protected Projection Adapter Contract, Receiver-Side Audit Mapping & Owner-Gated One-TEST Readiness.** No actual private receiver connection or TEST authorization is implied by this proposal.
