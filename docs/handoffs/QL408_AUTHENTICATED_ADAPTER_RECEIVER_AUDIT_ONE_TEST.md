# QL-408 — Authenticated Protected Projection Adapter Contract, Receiver-Side Audit Mapping & Owner-Gated One-TEST Readiness

## Scope and actual state

QL-408 defines a strict, **read-only** audit projection boundary and displays the seven independent receiver-side evidence gates in the existing one-source owner drilldown. The browser currently imports **zero** protected projections. No private adapter, signer enrollment or live TEST is activated. All six connections remain `HOLD` and the receiver remains `OFF`.

## Protected server adapter prerequisites

Before a future protected adapter returns any projection it **must** independently verify:

1. An authenticated, authorized owner/operator session with an appropriate role and source/tenant scope; deny expired, replayed or cross-source sessions.
2. Original device/issuer custody, the exact original bytes, independently pinned source signer and cryptographic signature. Reuse the protected QL-404 verifier in a server-only trust domain, never client JavaScript.
3. Independent reviewer/witness original disposition; separate master-owner signature bound to the same source/case/purpose. The source owner cannot self-certify the independent reviewer or master decision.
4. Explicit consent, tenant boundary, original receiver enrollment, durable atomic replay prevention, one specifically authorized TEST receipt and independently signed receiver acknowledgment.
5. Audited denial and retention/redaction policy; never export private keys, original evidence bytes, witness identities or customer records to this UI, GitHub or ChatGPT.

The proposed redacted version-1 projection has exactly: `contractVersion`, fixed `sourceId`, opaque `caseId`, `purpose=ONE_TEST_READINESS_REVIEW`, canonical UTC `generatedAt` and `expiresAt` (maximum 24 hours apart), and seven audit tuples `{code,state,reference}`. `reference` is a non-secret opaque audit locator (required for a VERIFIED tuple), **not a signature, bearer token or proof of authorization**. Client-generated projections, including all seven gates marked VERIFIED, must never authorize a TEST.

## Seven receiver audit mappings

| Gate | Independent responsible party | Source of evidence |
|---|---|---|
| SOURCE_CUSTODY | Source owner | Original device / issuer custody |
| INDEPENDENT_REVIEW | Independent reviewer | Original bytes and witness chain |
| SOURCE_SIGNATURE | Source owner | Pinned identity and source signature |
| MASTER_APPROVAL | Master Shell owner | Separate signed approval for same source/case/purpose |
| CONSENT | Receiver operator | Purpose-scoped consent and tenant boundary |
| RECEIVER_ENROLLMENT | Receiver operator | Private enrollment and durable replay store |
| SCOPED_TEST_RECEIPT | Protected TEST operator | One signed TEST and independent receiver acknowledgment |

The contract checker rejects extra/secret fields, duplicate or missing gates, foreign source identities, malformed identifiers, timestamps or audit references and expired/future projections. **It is only shape/freshness guidance, not a verifier.** Every result is `connection=HOLD`, `oneTestAuthorized=false`, `receiverEnabled=false` with no network or persistence side effects.

## Verification

`npm --prefix app run test -- src/auth/__tests__/ql408ProtectedAdapterContract.test.ts src/auth/__tests__/ql407OutcomeImportReview.test.ts src/auth/__tests__/ql375OwnerSixAppDrilldown.test.tsx`

`npm --prefix app run check`

`npm --prefix app run build`

## Next proposed build

**QL-409 — Source-Scoped Protected Audit Decision Timeline, Independent Owner Exception Worklist & Receiver-OFF Recovery Review.** Any live protected receiver enrollment or signed TEST requires a separate supervised owner authorization and original evidence.
