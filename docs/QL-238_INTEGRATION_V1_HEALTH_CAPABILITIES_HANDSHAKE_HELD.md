# QL-238 — Integration Contract v1 Health/Capabilities Handshake Readiness, Four-Company Tenant Isolation & Owner-Safe No-Dispatch Evidence Gate

Release date: 2026-10-27.

## Delivered

- Added the **Gateway handshake & tenant gate** operator workspace after QL-237 Free phone options & integration v1.
- Uses the existing v1 document and QL-237 business-specific read capability lists as the source of fictional browser fixture scope. Rehearses only **GET /api/integration/v1/health** and **GET /api/integration/v1/capabilities**; capabilities require a prior held health receipt for the exact business/tenant and expose only read-reference operations.
- Four-company matrix shows health, capabilities, local packet state, actual **DISCONNECTED** connection state and all twelve QL-181 real release holds. Changing companies does not copy local evidence into another company.
- Negative mock rehearsals for cross-business, foreign/missing tenant, direct app route, production environment, write capability, expired nonce, duplicate request, malformed/expanded personal fields and wrong sequence.
- Local acknowledgment and held packet preparation require **both** current fictional responses. They are explicitly ACKNOWLEDGED_UNVERIFIED / LOCAL_PACKET_PREPARED_HELD; any new result resets both acknowledgement and packet. A new health attempt also invalidates old mock capability evidence. A company-only reset preserves others' fictional state.
- Node-only independent helper at scripts/ql238-integration-handshake-sandbox.mjs verifies randomly generated synthetic HMAC-SHA256 signatures, canonical GET fields, time window, nonce replay suppression, health-before-capability ordering, per-app/campground/company scope, key rotation and revocation and no-command/dispatch boundaries. CI runs its Node tests. No listener, production key, provider callback, customer data or authenticated remote call exists.
- Updated [Rosevear Integration Contract v1 Handoff](ROSEVEAR_INTEGRATION_CONTRACT_V1_HANDOFF.md) with external application proof needed before any actual health/capabilities rollout.

## Acceptance and actual HOLD state

1. All four mock health/capabilities pairs remain HELD_UNVERIFIED even when their shape checks succeed. Displayed connection state stays DISCONNECTED; all real QL-181 prerequisites remain HELD_UNVERIFIED (12/12).
2. Tests reject mismatched or missing tenant, cross-company, bad route/method, production env, unknown/write capability, malformed/tampered/expired/replayed signatures and credential revocation/rotation.
3. Browser performs zero network calls, database changes, real owner approval, telephone calls or SMS. The isolated Node harness is not an API endpoint or proof of deployed HMAC authentication.
4. Tests include case-only reset, fresh review after a repeated health event, local packet gate, read-only response fields and mobile/keyboard accessibility.
5. Full app tests, TypeScript, Pages bundle, QL-171 no-new-sink audit and GitHub production gates must pass before GREEN.

## Handoff still required from each external application

**AI Data Platform:** implement the genuine server-only gateway registry, per-app credentials, key IDs/rotation, ACLs, verified read-only health/capabilities brokerage, durable audit receipts and actual tenant isolation. **Business apps:** add server-only endpoints to this contract with deliberate permissions and no customer body in health. **Comms Hub:** consume verified minimum references only after the external gateway has independently passed review; retain preview until authorized.

No real connection has been enabled by QL-238. Owners must review integration costs, access scope, Canadian privacy/consent, rollout risk and rollback before approving any real release.

**Next expected Comms Hub build after QL-238:** QL-239 — Integration Contract v1 Read-Only Gateway Proof Intake, Credential Rotation Dry Run & Independent Four-Company Connection Review.
