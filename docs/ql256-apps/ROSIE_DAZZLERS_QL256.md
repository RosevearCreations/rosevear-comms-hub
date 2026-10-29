# Rosie Dazzlers — QL-256 connection handoff

**Repository:** [RosevearCreations/rosiedazzlers](https://github.com/RosevearCreations/rosiedazzlers)  
**Verified original proof:** HTTP 404 on 29 October 2026 at immutable main `79751649527a3b4a887ce252f8a1c5b93a9434bd`  
**Integration:** DISCONNECTED / HOLD. A GREEN detailing-site build does not close the gift-service or communications holds.

## Give the Rosie Dazzlers build maintainer these instructions

1. Answer the specific real-signer question: `SIGNER_NOT_PROVISIONED`, `SIGNER_EXISTS_CUSTODY_NOT_VERIFIED` or `SIGNER_STATUS_UNKNOWN`. Do not claim an original signing key was provisioned simply because the CI passed.
2. Identify audited source **A** and exact successful Actions run. Confirm final proof-containing commit **B** must descend from A without putting B's own SHA in the signed payload.
3. Obtain approved private, app-specific Ed25519 signer custody; independent public SPKI pin; distinct authenticated custodian, witness and reviewer. Keep credentials and private identity details outside GitHub.
4. Request reviewer acceptance of the phased dependency fix: establish source/pin identity before a separately authenticated, <=30-minute owner TEST-only permission, then witness genuine nonproduction health/capabilities GET and denial evidence. Do not run requests before permission.
5. With original receipts and valid challenge, sign/publish `docs/integration/ql246-source-proof.json` at B. Return the immutable HTTP 200 URL, public raw digest, exact A/B commits, A's CI and independent trust evidence; otherwise report 404 or NOT_AVAILABLE.
6. Choose a synthetic isolated test identity; confirm no live gift, deposit, payment, booking or customer state can be touched during the test.

**Do not:** resend gift cards, run payment captures/refunds, issue appointment bookings, send phone/SMS, disclose real customer addresses or work on active orders.

## Return this short report

```text
App: Rosie Dazzlers
Current main SHA:
Signer provisioning decision:
Source A + matching GREEN CI run: NOT_AVAILABLE / verified values
Independent custodian / witness / reviewer: NOT_ASSIGNED / PRIVATE_REVIEW_REQUESTED
Proof B + raw SHA-256 + trusted SPKI: NOT_AVAILABLE / verified values
Original gift HOLD unaffected: YES
Owner TEST-only authorization: NOT_GIVEN
Genuine gateway GET/denial receipts: NOT_RUN
Connection: DISCONNECTED / HOLD
Next concrete blocker:
```

Read [the complete owner walkthrough](../ROSEVEAR_QL256_MASTER_CONNECTION_WALKTHROUGH.md). No network or live workflow is authorized here.
