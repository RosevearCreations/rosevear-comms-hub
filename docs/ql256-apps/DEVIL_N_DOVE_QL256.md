# Devil n Dove — QL-256 connection handoff

**Repository:** [RosevearCreations/devilndove-site](https://github.com/RosevearCreations/devilndove-site)  
**Verified original proof:** HTTP 404 on 29 October 2026 at immutable main `5017939f3b63e3f63d79a83f34357956cbafd0b4`  
**Integration:** DISCONNECTED / HOLD. A successful product/editor/Etsy build is **not** integration approval.

## Give the Devil n Dove build maintainer these instructions

1. Return the actual signing-key decision: `SIGNER_NOT_PROVISIONED`, `SIGNER_EXISTS_CUSTODY_NOT_VERIFIED` or `SIGNER_STATUS_UNKNOWN`. Do not produce a sample signed proof or repeat a generic HOLD statement.
2. Pin audited source commit **A** and a GREEN CI run for A. Confirm QL-248's two-SHA contract: final proof is committed later at descendant **B**, but its signature describes source A.
3. Prepare a real unique Ed25519 signer with approved private custody, separate from all other apps. Ask for a distinct private custodian, independent challenge witness and reviewer, with an independently verified public key SPKI fingerprint. Never place secrets in a product field, chat or repository.
4. Use only a separately identified, isolated nonproduction Devil n Dove tenant. Any connection test must be restricted to GET health/capabilities, after authenticated owner TEST-only permission and independent reviewer acceptance of the staged proof sequence.
5. After genuine, authorized, independently witnessed GET and negative-test receipts, sign the canonical final QL-246 proof. Publish `docs/integration/ql246-source-proof.json` at descendant commit B and provide exact A/B, A's successful CI, immutable HTTP 200 URL, raw file SHA-256 and trust pin evidence.
6. Keep the product editor, stored Etsy listing IDs, inventory images and sales-channel workflows independent of Comms Hub TEST. No user/customer sync is required for the first health check.

**Do not:** create or update Etsy drafts, change Marketplace listings, upload product photos, mutate catalog/inventory/orders, or use actual customer records to test connectivity.

## Return this short report

```text
App: Devil n Dove
Current main SHA:
Signer provisioning decision:
Source A + matching GREEN CI run: NOT_AVAILABLE / verified values
Independent custody / witness / reviewer: NOT_ASSIGNED / PRIVATE_REVIEW_REQUESTED
Proof B + SHA-256 + independent SPKI fingerprint: NOT_AVAILABLE / verified values
Nonproduction tenant verified: NO / PRIVATE_REVIEW_PENDING
Owner TEST-only authorization: NOT_GIVEN
Genuine gateway GET/denial receipts: NOT_RUN
Connection: DISCONNECTED / HOLD
Next concrete blocker:
```

Read [the complete owner walkthrough](../ROSEVEAR_QL256_MASTER_CONNECTION_WALKTHROUGH.md). This document is not network-test or pilot authorization.
