# QL-326 — Nonsecret Connection Configuration Matrix & Environment Preparation Guide

**Status:** DESCRIPTIVE DRAFT ONLY · all six `DISCONNECTED / HOLD`; private gateway requests 0; connections configured 0; owner TEST approvals 0; real credentials 0; Windows relay OFF; ACK Delivery Evidence `UNDER_REVIEW / PARKED_FOR_LATER`.

This guide describes what a **future, separately authorized** server-side TEST connection would require. It is **not** a setup or approval instruction for live services. Production GREEN for Rosevear Comms Hub means only its disabled-preview application was released; it does not mean any app-to-app integration is active.

## 1. All six source roles

| Registered source | Role | Illustrative synthetic alias | Scope and responsible humans |
| --- | --- | --- | --- |
| Rosie Dazzlers | Independent detailing business | `np-rosie-demo` | Only its future approved nonproduction business tenant · source owner + independent proof reviewer |
| Devil n Dove | Independent maker business | `np-devil-demo` | Only its future approved nonproduction business tenant; no Etsy credentials/orders/photos · source owner + independent proof reviewer |
| iCamp | Independent campground application | `np-icamp-demo` | Every campground remains separately scoped; never production Camp Rosevear data · source owner + independent proof reviewer |
| Yard Workers | Independent contractor application | `np-yard-demo` | Each contractor isolated; no production landscaping records · source owner + independent proof reviewer |
| AI Data Platform | Supporting reporting/gateway service | **NONE** | Not a customer tenant; no unrestricted multi-business join · reporting custodian + independent reviewer |
| Rosevear AI Hub | Optional supporting Windows edge service | **NONE** | Local relay OFF; no cameras, devices, vault or passwords · Windows owner + independent reviewer |

These aliases are fictional examples, not tenant IDs issued by providers, permission grants, deployed hostnames or evidence of ownership.

## 2. Environment preparations — zero runtime changes

| Environment | Allowed examples | Not allowed | Human check |
| --- | --- | --- | --- |
| Local design | `http://localhost` or `http://127.0.0.1` with optional port, no path | Real app URLs, userinfo, query strings, fragments, secret or personal content | Review **names and fixtures only** in browser memory |
| Public disabled preview | `https://example.test` or one whitelisted subdomain (`demo`, `sample`, `preview`, `test`), such as `https://demo.example.test` | Real DNS hosts, deployed private endpoints, arbitrary host labels, credentials, GET execution | Operator reviews descriptive matrix and status `HOLD` |
| Future nonproduction TEST | Same reserved `.test` placeholder pattern for **planning only** | Actual credentials, cloud setting edits, private gateway calls or remote writes without independent approval | Source owner, independent custody reviewer, exact tenant owner and security reviewer must separately approve a new action |

The validator intentionally does not recognize `production` or `prod` as draft environments. It rejects URLs with userinfo, paths, query strings, fragments, unknown domains, personal data or credential terminology and refuses mismatched synthetic aliases. It cannot save, initiate a request, or approve any source even if the draft is well-shaped.

## 3. Fields and variable names, **never values**

| Name | Role and expected policy |
| --- | --- |
| `source_system` | Stable source identifier in the signed future contract |
| `business_id` | Scope bound to the source-owning business; no cross-business reuse |
| `tenant_id` | Only the source-issued approved nonproduction tenant; support services have no customer tenant |
| `environment` | Explicit future authorized nonproduction environment, not live |
| `schema_version` | Compatibility field, proposed label `rosevear.integration.v1` |
| `ROSEVEAR_QL243_NONPROD_HMAC_KEY_B64` | **Historical contract's future server/test-runner secret NAME ONLY**. Never create, copy, paste, display, retrieve, or put in browser `VITE_` code during this build. No key is configured. |
| `VITE_ENABLE_SUPABASE_CLIENT` | Keep `false`; separate optional browser feature, unnecessary for this handoff |
| `VITE_ENABLE_HOSTED_DATABASE` | Keep `false`; no hosted database involvement |

No Cloudflare Worker or Supabase environment variables, secrets, project settings, provider permissions or source configuration are changed in QL-326. No source endpoint or real URL has been verified. The name list is not an instruction to deploy credentials.

## 4. Proposed read-only contract and shape

| Method / proposed path | Expected future response metadata (NOT observed) | Failure action |
| --- | --- | --- |
| `GET /api/integration/v1/health` | `schema_version`, `source_system`, `environment`, `business_id`, `tenant_id`, `connection_status: HOLD`, signed scoped envelope | Missing/invalid tenant or proof = **NO-GO** |
| `GET /api/integration/v1/capabilities` | Same identity scope plus read-only `capabilities[]`, `connection_status: HOLD`, signed scoped envelope | Unexpected capabilities or privilege expansion = **REJECT** |

Future private connections, if separately authorized, would require independent signer/proof custody, authenticated gateway identity, tenant and business mapping, least privilege, response signature checks, replay protection, audit retention and exact owner TEST approval. No public proof-file 200, ordinary CI GREEN, synthetic fixture or locally valid form can substitute for those gates. QL-325's dated credential-free public file checks returned six 404 results; they were **not** private source-health tests.

Failure handling: 401/403 or tenant mismatch → DENY; 404 → NOT IMPLEMENTED; 429, 5xx, timeout or offline → UNKNOWN / stop; stale, invalid or over-privileged response → REJECT and human review. No anonymous fallback, automatic retry, messages, customer record request or relay activation.

## 5. Human checklist for future independent review

- [ ] Verify the source's independent owner, exact immutable commit and original source-signed Proof-B with genuine custody evidence.
- [ ] Check signer identity and independent verifier authority; preserve raw source receipt provenance and dates.
- [ ] Reconcile the source business/tenant map; reject another company or unsupported cross-tenant mapping.
- [ ] Confirm proposed GET contract fields, compatible `schema_version`, signed envelope, minimal response and safe failure handling with the source custodian.
- [ ] Obtain precise owner authorization for a **separate future nonproduction TEST**, including scope, expiry, operator, rollback and independent witness.
- [ ] Only after a **new specific authorization** should anyone consider server-side secret provisioning or private requests; use a protected procedure outside this browser application.
- [ ] Keep all six `DISCONNECTED / HOLD` and ACK `UNDER_REVIEW / PARKED_FOR_LATER` until actual independently verified evidence and approvals exist.

## Sources and verification

- [QL-243 integration v1 handoff](ROSEVEAR_INTEGRATION_V1_CONNECTION_TEST_HANDOFF_QL243.md) — proposed gateway, authentication and contract boundaries.
- [QL-308 tenant contracts](../app/src/operator/ql308TenantContracts.ts) — two GET paths and synthetic per-business aliases.
- [QL-324 six-app catalogue](../app/src/operator/ql324ConnectionCatalogue.ts) — precise roles, owner duties, topology and boundaries.
- [QL-325 independent proof readback](build-records/QL-325_IMMUTABLE_PROOF_AUTHORITY_GATE_READBACK.md) — dated 404 evidence and five missing gates.
- [QL-326 validator source](../app/src/operator/ql326ConnectionConfiguration.ts) and [regression tests](../app/src/operator/__tests__/ql326ConnectionConfiguration.test.tsx) — rejected inputs and zero-request design.

**Owner action now:** none. This guide and its I.T. Command screen are safe, nonsecret preparation references only.
