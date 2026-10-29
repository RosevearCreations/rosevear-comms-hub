# iCamp — QL-256 connection handoff

**Repository:** [RosevearCreations/iCamp](https://github.com/RosevearCreations/iCamp)  
**Verified original proof:** HTTP 404 on 29 October 2026 at immutable main `32b7c466ad34f7018863c8b837f94c5a3b1103a5`  
**Integration:** DISCONNECTED / HOLD. Passing app tests, database work and published releases do not establish signer identity.

## Give the iCamp build maintainer these instructions

1. State signer decision `SIGNER_NOT_PROVISIONED`, `SIGNER_EXISTS_CUSTODY_NOT_VERIFIED` or `SIGNER_STATUS_UNKNOWN`—not a mock signing result.
2. Capture complete audited source commit **A** with exact GREEN CI run. Confirm that any genuine signed QL-246 proof will live at later descendant commit **B**, keeping the signed source revision fixed to A.
3. Provision (only under an approved private process) a unique iCamp Ed25519 signer and private custody. Obtain the public SPKI hash independently; custodian, witness and reviewing assessor must be separately authenticated and distinct.
4. Independently establish an isolated campground/company tenant mapping. A test name such as Camp Rosevear alone does not prove isolation; do not infer a tenant ID from current production data.
5. Have an independent reviewer explicitly accept the staged signer/pretest trust amendment, then prepare the private, separately authenticated owner TEST-only GET request. Max 30 minutes, health/capabilities only; no private call before permission.
6. With actual permitted GET, denial, audit and rollback receipts, sign/publish the final file at `docs/integration/ql246-source-proof.json` in B, verify HTTP 200 and raw digest, and return full A/B, exact CI and trusted public-pin evidence.

**Do not:** operate campground gates, issue wristbands, change bookings, access real guests, collect deposits or alter site availability.

## Return this short report

```text
App: iCamp
Current main SHA:
Signer provisioning decision:
Source A + matching GREEN CI run: NOT_AVAILABLE / verified values
Verified nonproduction campground tenant ID: NOT_AVAILABLE / independently checked value
Custodian / independent witness / reviewer: NOT_ASSIGNED / PRIVATE_REVIEW_REQUESTED
Proof B + raw SHA-256 + independently verified SPKI: NOT_AVAILABLE / verified values
Owner TEST-only authorization: NOT_GIVEN
Genuine gateway GET/denial receipts: NOT_RUN
Connection: DISCONNECTED / HOLD
Next concrete blocker:
```

Read [the complete owner walkthrough](../ROSEVEAR_QL256_MASTER_CONNECTION_WALKTHROUGH.md). This is preparation only, not permission to test gates.
