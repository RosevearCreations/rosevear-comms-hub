# QL-327 — Six-App Contract Compatibility, Fixture Handshake & Version Matrix

**State:** LOCAL SYNTHETIC FIXTURES ONLY · authenticated peer handshakes **0** · real GET **0** · writes **0** · approved business scopes **0** · all six `DISCONNECTED / HOLD` · ACK `UNDER_REVIEW / PARKED_FOR_LATER` · Windows relay **OFF**.

The I.T. Command QL-327 matrix compares the shape of **proposed future** GET-only source responses. A compatible mock is neither a response actually sent by that source nor evidence that the source has recognized a tenant, issued a signer identity, granted consent or approved a TEST run.

## Version policy — no network negotiation

| Version label | Local status | Change | Compatibility result | Safe fallback |
| --- | --- | --- | --- | --- |
| `rosevear.integration.v1` | Pinned reference fixture | Required 11 field names | `BASELINE_SHAPE_ONLY_NOT_AUTHORIZED` | Retain the local fixture; no remote rollback |
| `rosevear.integration.v1.1` | Additive candidate **only** | Optional nonsecret `trace_label`; all v1 required fields retained | `ADDITIVE_DRAFT_NOT_AUTHORIZED` | Discard optional local field and compare again against v1; no source upgrade |
| `rosevear.integration.v2` | Unsupported breaking proposal | Unknown potentially incompatible contract | `DENY_VERSION_MISMATCH` | Stop, retain v1 fixture, request independent review |

These are QL-327 **fixture version labels**, not claims that any external application currently publishes or supports these versions. Even a v1.1 shape match cannot automatically upgrade an external peer.

## Exact source and tenant boundary

| Source | Fixture role | Fictional tenant alias | Non-operational capability fixture |
| --- | --- | --- | --- |
| Rosie Dazzlers | Independent business | `np-rosie-demo` | `preview_detailing_quote_status` |
| Devil n Dove | Independent business | `np-devil-demo` | `preview_maker_enquiry_status` |
| iCamp | Independent business | `np-icamp-demo` | `preview_campground_request_status` |
| Yard Workers | Independent business | `np-yard-demo` | `preview_contractor_quote_status` |
| AI Data Platform | Supporting service, **not a customer tenant** | **NONE** | `preview_aggregate_health_only` |
| Rosevear AI Hub | Supporting Windows service, **not a customer tenant** | **NONE** | `preview_local_relay_off_health` |

Each business also has an exact *fictional* `np-<source>-business` ID. It cannot be replaced by another business's ID or alias. Both supporting services use `business_id: null`, `tenant_id: null` and `NO_CUSTOMER_CONSENT_APPLICABLE`. A support role cannot become a fifth or sixth customer tenant. Real tenant IDs and customer records are never loaded here.

## Required synthetic GET contract shape

The validator only accepts a plain response-shaped object with these 11 required field names: `schema_version`, `source_system`, `environment`, `method`, `endpoint`, `role`, `business_id`, `tenant_id`, `consent_marker`, `capabilities`, and `connection_status`.

- Environment must be the literal `test` **synthetic label**, never a real production workspace.
- Method must be `GET`, with one of the two previously proposed paths: `/api/integration/v1/health` or `/api/integration/v1/capabilities`. No HTTP request occurs.
- Identity must match the selected registered source; tenant and role must match its exact fictional fixture.
- `consent_marker` must be `SYNTHETIC_PREVIEW_ONLY` for the four businesses or `NO_CUSTOMER_CONSENT_APPLICABLE` for support. Neither is an actual customer's consent.
- `capabilities` must contain exactly that one registered non-operational `preview_` capability, without writes or customer privilege expansion.
- `connection_status` must remain `HOLD`.
- In v1.1 only, optional `trace_label` may be a lowercase 3–32-character nonsecret slug. No unknown fields or unexpected PII, access tokens, emails, signed payloads or provider responses are accepted.

This shape is intentionally restrictive to make a **fail-closed fixture check**, not to define production API privileges. Real response validation and authenticated handshake design require a separately authorized security review.

## Reproducible failure matrix

The UI and automated tests run the same fixed, local scenarios across all six source roles (6 × 11 = **66 fixtures**):

| Scenario | Expected decision | Why it stops |
| --- | --- | --- |
| Valid pinned v1 shape | `BASELINE_SHAPE_ONLY_NOT_AUTHORIZED` | Structurally matched but no real authority |
| Required field removed | `DENY_REMOVED_FIELD` | Breaking response change |
| Breaking schema version | `DENY_VERSION_MISMATCH` | Unsupported v2 proposal |
| Other business tenant | `DENY_TENANT_BOUNDARY` | Cross-business isolation |
| Consent marker missing | `DENY_MISSING_CONSENT` | Never infer consent |
| Additional write privilege | `DENY_UNEXPECTED_PRIVILEGE` | No elevated capability |
| Business and support role swapped | `DENY_ROLE_BOUNDARY` | No customer tenant on support systems |
| Other source identity | `DENY_SOURCE_IDENTITY` | Source registry mismatch |
| POST instead of GET | `DENY_METHOD_OR_ENDPOINT` | Read-only contract only |
| Unrecognized customer field | `DENY_UNEXPECTED_FIELD` | No unknown personal records |
| Fixture asserts CONNECTED | `DENY_ELEVATED_CONNECTION` | Preview cannot grant access |

The 6 positive v1 cases are **shape-only**, not approved; 60 negative cases are rejected. Additional direct checks cover malformed input, missing/invalid consent, wrong endpoints, real production labels, invalid optional metadata and cross-company/support confusion. All results explicitly retain `authorized: false`, `authenticated: false`, `requests: 0`, `writes: 0`, `consentGranted: false` and `DISCONNECTED / HOLD`.

## Review and rollback instructions

1. Pin the *local* v1 fixture and identify the correct source owner and independent reviewer.
2. Compare contract versions and required fields with the hypothetical response; missing/unknown/privileged fields produce NO-GO, not a best-effort coercion.
3. Preserve independent business isolation and tenantless support roles. No cross-source fallback or customer-data lookup is permitted.
4. Treat v1.1 as a local additive demonstration; no server promotion, peer negotiation or automatic rollback is performed.
5. If incompatible, **keep the v1 synthetic fixture, quarantine the candidate and ask the humans to review**. Never switch real credentials, deployments, tenants or private GET routes.
6. Before any separate future authenticated nonproduction trial, obtain original signed Proof-B, independent custody/signature evidence, gateway identity, scoped tenant agreement, consent, and exact source-owner/owner TEST sign-off. QL-327 does not provide any of them.

The human owner still needs to review this on physical devices; CI/Cloudflare GREEN only confirms the disabled-preview code deployment.

## Source links for independent verification

- [QL-243 gateway handoff](ROSEVEAR_INTEGRATION_V1_CONNECTION_TEST_HANDOFF_QL243.md) — prior proposed v1 fields and identity boundary.
- [QL-308 source and fictional tenant registry](../app/src/operator/ql308TenantContracts.ts) — two GET paths and four isolated aliases.
- [QL-324 source catalogue](../app/src/operator/ql324ConnectionCatalogue.ts) — six roles and source reviewers.
- [QL-326 configuration guide](QL-326-NONSECRET-CONNECTION-CONFIGURATION-GUIDE.md) — permitted nonsecret environment examples.
- [QL-327 pure fixture validator](../app/src/operator/ql327ContractCompatibility.ts) — all decisions and zero-operation result.
- [QL-327 automated regression](../app/src/operator/__tests__/ql327ContractCompatibility.test.tsx) — full positive/negative, version and business/support isolation coverage.

**Next authorized item after verified promotion:** QL-328 — Nonproduction Dry-Run Orchestrator, Failure Matrix & Reversible NO-GO Packets. That is another credential-free simulation, not a real TEST approval.
