# Rosevear AI Hub — QL-261 source-app action guide

**Forward to the Rosevear AI Hub build conversation.** Source: `RosevearCreations/rosevear-ai-hub`. The owner's Windows mini-server/private relay remains **NOT INSTALLED / OFF** for integration testing.

## Apply in the source application

1. Resolve real signing-key existence on an approved restricted persistent host, with authenticated human custodian, **separate** nonce witness and reviewer. If missing, obtain separate owner authority before provisioning. Validate public SPKI fingerprint from an independent trusted channel; do not trust a dashboard self-report.
2. Prepare a server **nonproduction-only** GET health/capabilities contract with strictly scoped identity. Preserve Home Assistant, cameras, MQTT, private document vault, local network and user credentials outside any trial; no home IPs or key-store paths in public return packets.
3. Only after actual private source-signing authorization, publish original signed `docs/integration/ql246-source-proof.json` at immutable proof commit B referencing audited source commit A. Compare original signature, key pin, A→B ancestry and exact-source CI independently.
4. Leave Windows mini-server **relay OFF**, including no installation, background scheduler, new network route, dynamic DNS or persistent tunnel on this handoff. Such an operation requires its own explicit authenticated nonproduction TEST-only approval, rollback plan and reviewer.
5. Source team runs tests, independently promotes source changes, and returns exact sanitized QL-258 owner JSON plus public proof/CI references. Private witness and custodian receipts stay exclusively with the trusted reviewer.

## Source-side acceptance tests

- [ ] App's health/capabilities route is synthetically tested without any live home-system action.
- [ ] No network connection to private home hardware or production service is attempted by this work.
- [ ] Genuine signed A→B proof and independently pinned signer verified by the off-browser reviewer.
- [ ] Explicit stop/rollback operation recorded before any later owner-authorized relay installation.

**Known snapshot:** `2678983cb077f38b825ce8f113390fe8236f51bb`, original public proof HTTP 404 on 29 October 2026 at that immutable SHA. Future main commits require a new public recheck; they are not automatically trusted.

**Return:** exact QL-258 sanitized JSON and nonsecret published source A/B/CI references only. Integration DISCONNECTED / HOLD; owner TEST authorization NOT_GIVEN, authenticated gateway GETs NOT_RUN.
