# Yard Workers — QL-261 source-app action guide

**Forward to the Yard Workers build conversation.** Source: `RosevearCreations/yw`. The observed **Rosevear Landscaping production company** and its company owner are **NOT** a separate nonproduction integration tenant.

## Apply in the source application

1. Prepare and independently verify a dedicated **nonproduction Supabase project/database and tenant**, separate from production. Use synthetic test data only. Record a nonsecret isolation result; do **not** reuse the production company row as proof of isolation.
2. Verify that a scoped nonproduction role may only GET an explicit health/capabilities route for its own tenant; refuse production project IDs, cross-tenant reads, mutations, billing/payroll, scheduling, dispatch and user administration. Do not run real remote GETs until separately authenticated owner TEST approval.
3. Privately decide real signer existence, provision a restricted persistent key store if authorized, and independently authenticate custodian, a different witness and reviewer. Witness actual key possession and independently pin the public SPKI.
4. After genuine signer authorization, publish the original signed proof file at `docs/integration/ql246-source-proof.json` in later proof commit B signing audited source commit A. Independently compare immutable main commit ancestry and exact-source CI.
5. Keep the discovered **legacy global-admin access anomaly** in a separate explicit owner access-review decision. QL-261 does not authorize account demotion or role changes.
6. Source team runs CI/tests, promotes its own software and returns exact sanitized QL-258 owner JSON and nonsecret source/tenant review outcome. Private custody and tenant identifiers remain in the approved review channel.

## Source-side acceptance tests

- [ ] Test project/database and synthetic tenant are independently demonstrated separate from production.
- [ ] Test principal is denied every other tenant, production resource and all write/dispatch actions (run only in a separately approved nonproduction TEST window).
- [ ] Original signed A→B source proof independently verified; no simulated signer/pin acceptance.
- [ ] No legacy-admin privilege mutation without an owner-approved separate workflow.

**Known snapshot:** `0da74570ddc97f224aef15f2a39810ca40c9dd8c`, original proof HTTP 404 on 29 October 2026. Historical status only; refresh at new main. Live integration remains DISCONNECTED / HOLD; TEST permission NOT_GIVEN.

**Return:** exact QL-258 sanitized JSON, nonsecret `ISOLATED_NONPRODUCTION_TENANT_INDEPENDENTLY_REVIEWED` only if truly reviewed, public source proof A/B and CI links. Never export admin identities, Supabase service keys or customer records.
