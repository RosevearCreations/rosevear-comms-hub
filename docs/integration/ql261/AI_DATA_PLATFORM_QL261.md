# AI Data Platform — QL-261 source-app action guide

**Forward to the AI Data Platform build conversation.** Source: `RosevearCreations/ai-data-platform`. This document is a request for real source changes and externally reviewed evidence, **not** permission to run authenticated gateway tests. Comms Hub remains DISCONNECTED / HOLD.

## Apply in the source application

1. Confirm the last reported **existing candidate signer** on its actual approved restricted server/key store. Do not generate a new signer merely because the UI says custody is unverified. The owner must decide whether a real key exists, can be recovered or needs provisioning.
2. Through a private, authenticated process, assign a key custodian, a **different** challenge witness and an independent reviewer. Approve persistent restricted key storage and verify the *public* SPKI pin independently/out of band. Never reveal private keys or challenge answers in a GitHub issue, Comms Hub, Vercel browser bundle or this handoff.
3. Confirm a **separate nonproduction** health/capabilities target with read-only GET-only permissions. Production recovery audits, repairs and customer data must remain inaccessible to this future test role.
4. After genuine private custody authorization, have the source team publish signed original `docs/integration/ql246-source-proof.json` at a **later proof commit B** that attests independently audited **source commit A**. Verify both immutable SHA values, the original signature, source ancestry and exact-source CI. No fabricated proof file or self-approved pin.
5. Build/test and promote source software independently. Return the actual **QL-258 sanitized owner JSON**, public commit A/B references and nonsecret CI status. Send any private identity/witness receipts only to the approved off-browser reviewer.

## Source-side acceptance tests

- [ ] Existing signer/key status classified by a human with actual authorized access, not by code inference.
- [ ] Read-only nonproduction route responds only to permitted scoped role; deny unauthenticated/production use (run solely after separately authenticated TEST-only approval).
- [ ] Genuine signed proof B verifiable offline against the independent public pin and source A; CI bound to exact commit.
- [ ] No keys, secret values, private addresses or real user information in public source, logs or return packets.

**Known snapshot:** `a28a4874497a416613bc4182b5f895a5132fe0b9`, original public proof HTTP 404 on 29 October 2026. Refresh at a new SHA; the historical 404 is not a claim about a future commit. Owner TEST-only approval NOT_GIVEN; gateway GETs NOT_RUN.

**Return to Comms Hub:** QL-258 exact sanitized owner JSON + source A/B/CI nonsecret references + `PRIVATE_CUSTODY_REVIEW_PENDING` unless an actual independent review has occurred. Keep all private receipts outside chat.
