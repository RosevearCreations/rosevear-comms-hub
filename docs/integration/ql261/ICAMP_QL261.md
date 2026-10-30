# iCamp — QL-261 source-app action guide

**Forward to the iCamp build conversation.** Source: `RosevearCreations/iCamp`. QL-260 received **no new iCamp narrative and no actual QL-258 sanitized packet**.

## Apply in the source application

1. Return an exact original QL-258 nonsecret owner-progress packet. Do not mark owner-reported setup as verified custody or permission to connect.
2. Establish and independently confirm a **dedicated nonproduction campground tenant in an isolated test environment**. A sample Camp Rosevear record in a production database is not sufficient. Synthetic test users must use properly hashed unique credentials/MFA and must not reuse demo passwords shown in earlier conversations or public source.
3. Constrain an isolated TEST principal to GET-only health/capabilities data. It must never open gates, register visitors, book sites, accept payment, send SMS, change maintenance state or see production guests.
4. Privately appoint and independently authenticate a signer custodian, distinct nonce witness and separate reviewer. Approve restricted key storage and independently verify a real public SPKI pin/possession challenge.
5. When genuine private authorization exists, publish `docs/integration/ql246-source-proof.json` in proof commit B referencing audited immutable source A, then verify original signature, A→B ancestry and exact commit CI.
6. Run its own software tests and promote to dev/main independently. Return the authentic nonsecret QL-258 packet plus public proof references and privately reviewed tenant outcome. Do not insert a fake signed file to clear a 404.

## Source-side acceptance tests

- [ ] Separate nonproduction project/campground and tenant-scoped synthetic identity genuinely verified.
- [ ] GET-only test role cannot reach production stays, guests, gates, booking, payment or dispatch.
- [ ] Distinct real custodian/witness/reviewer and independently authenticated public pin verified offline.
- [ ] No remote TEST GET until separately authenticated owner TEST-only approval.

**Known snapshot:** `040faeeb064c162fc97c059c9a271983b7f1f6bf`; original public proof HTTP 404 on 29 October 2026 at that immutable SHA. Refresh if later source builds advance. DISCONNECTED / HOLD.

**Return:** exact QL-258 sanitized owner JSON + public A/B/CI refs only if real; nonsecret test tenant review outcome. Never send account passwords, guest records or private key materials.
