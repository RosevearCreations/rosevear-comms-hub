# Yard Workers — QL-256 connection handoff

**Repository:** [RosevearCreations/yw](https://github.com/RosevearCreations/yw)  
**Verified original proof:** HTTP 404 on 29 October 2026 at immutable main `2c7b07037beb1b0ac239eb1b994cb6a87fd1923e`  
**Integration:** DISCONNECTED / HOLD, independent of the property-maintenance production release.

## Give the Yard Workers build maintainer these instructions

1. Provide the honest signer-provisioning decision: `SIGNER_NOT_PROVISIONED`, `SIGNER_EXISTS_CUSTODY_NOT_VERIFIED` or `SIGNER_STATUS_UNKNOWN`; no simulated signer/custodian or signature fabricated by a test fixture.
2. Record exact audited source commit **A** and successful CI for A. Prepare genuine proof later in descendant commit **B** under `docs/integration/ql246-source-proof.json`; don't make B self-reference.
3. Have an authorized operator handle the distinct Yard Workers Ed25519 key privately; assign separate authenticated key custodian, independent witness and reviewer. Independent SPKI fingerprint verification must occur outside this repo.
4. Verify the intended **nonproduction** company/tenant mapping privately (for example, test company Yard Rosevear only if it is genuinely isolated). Never silently map the connector to the live company, payroll, clients or tenants.
5. Arrange independent agreement to the staged proof/test sequence, then request a separate, authenticated, <=30-minute owner TEST-only GET window. Limit to health and capabilities endpoints. No real gateway requests until approval.
6. After original witnessed success/negative/audit/rollback receipts exist, sign the final QL-246 payload, publish B and return immutable HTTP 200 URL, A/B SHAs, raw SHA-256, CI and independently established key pin.

**Do not:** send dispatches, generate live invoices, edit payroll/staff, change landscaping/snow/septic work orders or access live client records.

## Return this short report

```text
App: Yard Workers
Current main SHA:
Signer provisioning decision:
Source A + matching GREEN CI run: NOT_AVAILABLE / verified values
Verified isolated company tenant ID: NOT_AVAILABLE / independently checked value
Custodian / independent witness / reviewer: NOT_ASSIGNED / PRIVATE_REVIEW_REQUESTED
Proof B + public digest + independent key pin: NOT_AVAILABLE / verified values
Owner TEST-only authorization: NOT_GIVEN
Genuine gateway GET/denial receipts: NOT_RUN
Connection: DISCONNECTED / HOLD
Next concrete blocker:
```

Read [the complete owner walkthrough](../ROSEVEAR_QL256_MASTER_CONNECTION_WALKTHROUGH.md). Do not use the test company name alone as proof of isolation.
