# QL-245 — owner-supplied six-app handoff reconciliation, signed-claim intake and held decision

Source: owner-supplied `Rosevear-Connect-V1.rtf` (received with request). The original RTF is not copied into the repository; the operator UI retains **sanitized source-specific implementation claims** and unresolved proof gaps only.

## Verified facts and limits

- All six source applications report QL-243 integration work; most include explicitly held states. No report supplies independently retrievable signed live GET receipts, all six provisioned distinct key IDs, independently pinned public signer key origins, durable gateway audit after restart or explicit authenticated owner authorization.
- Devil n Dove Build 510 states product/listing reference reads remain **disabled**, and its nonproduction key is **not provisioned**. AI Data Platform has not pre-registered a live candidate. Rosevear AI Hub's health endpoints are off by default.
- New Node-only offline verifier checks six distinct source Ed25519 signatures and an independent seventh assessor signature against caller-supplied out-of-band public SPKI pins, exact business/tenant, QL-244 source references, current source revisions, CI URL structures and seven true negative-denial claims. A successful signature check is **not** real-world source independence or evidence the tests took place.
- New operator workspace displays six claim-versus-evidence rows and four-company owner decision HOLD, with session-only sanitized input and no browser network/secret storage/activation. No production connector configuration changes.

**All four business connections remain DISCONNECTED; owner approval is NOT GIVEN; 12/12 QL-181 communications prerequisites remain HELD_UNVERIFIED.** Calls/SMS, provider dispatch, Etsy writes, customer/booking/guest/payroll/home-device access remain disabled.

## Verification commands

Run `node scripts/__tests__/ql245-six-app-evidence-review.test.mjs`, app TypeScript/Vitest, Pages build and QL171 zero-dispatch baseline. Synthetic signing keys and `np-...` fixture IDs are test-only, not external connection receipts.

Release to `main` is the deployment of an owner-safe evidence-review tool. It **does not activate** a real nonproduction gateway or grant pilot approval.
