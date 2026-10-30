# Devil n Dove — QL-261 source-app action guide

**Forward to the Devil n Dove build conversation.** Source: `RosevearCreations/devilndove-site`. Comms Hub integration DISCONNECTED / HOLD; nothing in this guide authorizes an Etsy or Marketplace POST.

## Apply in the source application

1. In an approved private process, resolve whether a real Ed25519 source signer exists. Privately provision only if explicitly authorized, with a restricted persistent server-side store and separate authenticated custodian, witness and reviewer.
2. Have the independent witness confirm possession of the real key and verify its **public SPKI pin through a separate trusted channel**. A browser status, public key pasted into chat, or automated witness simulation cannot establish custody.
3. Build a nonproduction **read-only health/capabilities** target isolated from primary D1 product/media/stock data and Etsy OAuth credentials. Do not give Comms Hub rights to create listings, mutate drafts or read customer details.
4. After real private authorization, publish authentic original `docs/integration/ql246-source-proof.json` at proof commit B signing immutable source commit A. Verify original signature, commit ancestry and exact-source CI; do not fabricate a file to clear the 404.
5. Run source-unit/CI tests and promote the source app independently. Return a QL-258 sanitized JSON and public A/B/CI identifiers. Private key/witness materials go only to the approved private reviewer, never Comms Hub.

## Source-side acceptance tests

- [ ] Primary D1 bindings (`DB`/`DD_DB`) and Etsy API secrets remain unchanged and server-only; **no new Cloudflare or GitHub secret is requested** for QL-261.
- [ ] Comms Hub scoped test role cannot use draft POST/update, Marketplace publishing, local product edits or private media.
- [ ] Independently pinned original proof B verifies A and exact-source CI.
- [ ] Etsy product tests (including owner-managed earlier drafts) remain **separate** from source-integration security acceptance.

**Known snapshot:** `a17dd027eddccabf890a28ff82120cf88687c572`, proof HTTP 404 on 29 October 2026 (historical immutable SHA only). Owner TEST approval NOT_GIVEN; authenticated gateway GETs NOT_RUN.

**Return:** exact sanitized QL-258 owner packet, verified public source pointers after genuine proof, no private names/keys/tokens. Status remains HELD without independently authenticated private evidence.
