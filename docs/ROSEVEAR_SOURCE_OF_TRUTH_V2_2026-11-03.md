# Rosevear Systems — Source of Truth v2: Master → Shell → Child

**Snapshot:** November 3, 2026, 19:45 Eastern. **Classification:** architecture decision and repo/deployment inventory, NOT proof of a deployed master identity provider, functioning inter-app connections, or provisioned child tenants. Source repos own their app code/data; the canonical Comms Hub planning model is app/src/operator/ql329MasterShellTruth.ts.

## Owner decision: the master/shell/child hierarchy

**Rosevear Master Control Plane** is the proposed owner-level control plane, but is **NOT DEPLOYED**. Its future scope is master membership, shell ownership, delegated child access, security policy and audit. **Rosevear Comms Hub** is a shared communications service under that future master, not an identity issuer or child tenant. **AI Data Platform** is the integration broker for authenticated, scoped cross-app transports, currently held.

| Application / shell | Canonical connector ID | Where connection is owned | Owned/example child | Child model |
| --- | --- | --- | --- | --- |
| Yard Workers | yw (deployed API identifies itself as yard-workers) | **YW platform shell** | Rosevear Landscaping | Multiple independent landscaping/property companies under YW; actual child permissions must be checked |
| iCamp | icamp | **iCamp SaaS shell** | Camp Rosevear | Existing campground multi-tenancy, child access must be independently scoped |
| Auto Detailing | rosiedazzlers | **future detailing shell** | Rosie Dazzlers | Current owned-business site; future separate detailers require real multi-tenant implementation |
| Maker Commerce | devilndove | **future maker-commerce shell** | Devil n Dove | Current owned-business site; future independent shops require real multi-tenant implementation |
| AI Data Platform | ai-data-platform | Supporting integration broker | **None** | Never a customer business tenant |
| Rosevear AI Hub | rosevear-ai-hub | Supporting Windows/local system | **None** | Private relay OFF; no customer business tenant |
| Rosevear Comms Hub | rosevear-comms-hub | Communications service | **None** | Currently deployed disabled preview only |
| Rosevear Master | rosevear-master | **Future master owner control plane** | Above shells, not a customer | Identity and entitlements NOT YET IMPLEMENTED |

The four older Comms Hub local business cards were illustrative training fixtures. YW and iCamp must **not** use Rosevear Landscaping or Camp Rosevear as the connector identity. Similarly, a planned future Rosie or Devil child must not be treated as a credential or automatic access grant.

## Non-negotiable authorization and data rules

1. The future master operator needs its own authenticated, audited identity. An app login is not master authorization.
2. Cross-app connection identity is **shell_id**. A **child_tenant_id** belongs to a separately authorized, source-owned child context and is optional only after shell authentication. A child cannot originate the connection.
3. Even a master owner cannot automatically read a campground, landscaper, detailer or shop's records. Each shell enforces explicit delegated roles, consent and row-level isolation.
4. AI Data Platform and Rosevear AI Hub remain supporting services with no child customer tenant. Hub private relay stays OFF until independently verified and separately activated.
5. The current signed v1 gateway has legacy business_id and tenant_id fields. The next adapter must reconcile shell scope without silently changing canonical signed bytes or retroactively treating old demo aliases as master grants.
6. Future reviewed contract fields may include master_id, shell_id, child_tenant_id, audience, scope, consent_reference, issuer, environment, signature and receipt_id. **Those names are a proposal, not an implemented or authorized live API.**

## Source repositories and observed deployment resources

Seven owner-accessible GitHub repos were checked. Revisions and hosts below are historical observations for Nov 3, 2026 and can change. The live repos and provider build records take precedence.

| App | Source and observed main | Deployment/resource evidence |
| --- | --- | --- |
| Comms Hub | [rosevear-comms-hub](https://github.com/RosevearCreations/rosevear-comms-hub), revision 441b39de | [Public Cloudflare disabled preview](https://rosevear-comms-hub.devilndovelive.workers.dev/), QL-328 live JS/CSS verified, zero approved external source connections |
| Yard Workers | [yw](https://github.com/RosevearCreations/yw), revision ee657df8 | Vercel yw production observed READY at Builds 518–519; public GET health and capabilities return HOLD. Build 520 existed on dev |
| iCamp | [iCamp](https://github.com/RosevearCreations/iCamp), revision 6ac07bd6 | Vercel i-camp production observed READY for Build 197; Supabase iCamp ACTIVE_HEALTHY; signed nonproduction tenant-bound GET is HELD |
| Rosie Dazzlers | [rosiedazzlers](https://github.com/RosevearCreations/rosiedazzlers), revision 4fe9ca5a | Existing guarded Cloudflare integration Functions; Supabase RosieDazzlers ACTIVE_HEALTHY; no provisioned multi-detailer shell |
| Devil n Dove | [devilndove-site](https://github.com/RosevearCreations/devilndove-site), revision 7d60e320 | Existing signed Cloudflare integration GET functions, held; no provisioned multi-maker shell |
| AI Data Platform | [ai-data-platform](https://github.com/RosevearCreations/ai-data-platform), revision 0540eb30 | Vercel production observed READY for Build 284; signed gateway and app-identity mapping exist, not a customer-authorized connection |
| Rosevear AI Hub | [rosevear-ai-hub](https://github.com/RosevearCreations/rosevear-ai-hub), revision 812bfa7a | Windows/local runtime not independently accessible here; private relay not installed/enabled |

**Connected Vercel projects visible:** i-camp, yw and ai-data-platform, all with historical READY production deployments; no claim they are authenticated peers of Comms Hub.

**Connected Supabase projects reported ACTIVE_HEALTHY:** rosevearcreations Project (gxujcwpktaickcgzyvnu), iCamp (cxgszmpbeswdikzofvjv), YardWeasels/YW (jmqvkgiqlimdhcofwkxr), and RosieDazzlers (cwxhhvwpilmrfwxirixx). Provider health is NOT a business login, API compatibility test, tenant permission, schema migration or Comms Hub connection. No database connection strings, service keys or personal data are published here.

## Current integration contracts: code exists, authorization does not

- YW [health](https://github.com/RosevearCreations/yw/blob/main/api/integration/v1/health.js) and [capabilities](https://github.com/RosevearCreations/yw/blob/main/api/integration/v1/capabilities.js) return static public descriptions and HOLD, not authenticated tenant/shell scope. The response app_id yard-workers is not identical to canonical registry ID yw.
- iCamp [readiness](https://github.com/RosevearCreations/iCamp/blob/main/docs/INTEGRATION_V1_ICAMP_READINESS.md) and [route implementation](https://github.com/RosevearCreations/iCamp/blob/main/lib/integration-v1/route.ts) require signed server-only nonproduction requests for an exact campground tenant. Production and unauthorized requests fail closed.
- Devil n Dove [health](https://github.com/RosevearCreations/devilndove-site/blob/main/functions/api/integration/v1/health.js) and [capabilities](https://github.com/RosevearCreations/devilndove-site/blob/main/functions/api/integration/v1/capabilities.js) have guarded/signed read-only entrypoints; no connection is activated.
- Rosie Dazzlers [guarded handler](https://github.com/RosevearCreations/rosiedazzlers/blob/main/functions/api/_lib/rosevear-integration-v1.js) exposes a protected v1 path; credentials and authorization are not established here.
- AI Data Platform [signed broker](https://github.com/RosevearCreations/ai-data-platform/blob/main/apps/web/lib/integration-v1-gateway.ts) and [application identity mapping](https://github.com/RosevearCreations/ai-data-platform/blob/main/docs/BUILD_282_SHARED_APPLICATION_IDENTITY_ENVIRONMENT_TENANT_MAPPING.md) exist. Logical tenant/workspace mappings are not activated credentials or owner approval.
- AI Hub [integration catalogue](https://github.com/RosevearCreations/rosevear-ai-hub/blob/main/docs/INTEGRATIONS.md) describes a private local service; do not treat repository access as permission or proof the Windows node is online.
- Comms Hub [QL-328 source](../app/src/operator/ql328DryRunOrchestrator.ts) is a local simulation and UNSENT NO-GO packet viewer. Its external provider calls are zero.

## Safe commissioning sequence (not executed by QL-329)

1. Implement and independently review master login, shell-owner membership, tenant children and per-shell audited delegated grants. Do not copy credentials or bypass source authentication.
2. Reconcile legacy source IDs and the exact current signed v1 bytes; preserve backward compatibility. Implement shell-first connector adapters and child-tenant isolation at the source, not as browser-only filters.
3. For each shell, obtain authentic original signed Proof-B, signer custody evidence, owner and source-owner TEST authorization, nonproduction origin, TLS, scoped server-only credential in the approved secret manager, and explicit consent where required.
4. Under that authorization, first run only read-only health and capabilities from the approved AI Data Platform broker to the exact shell scope. Capture independently verifiable signed receipts and negative tests for wrong shell, wrong child, missing consent, stale/replayed credentials, POST, 429, timeout and offline.
5. Review role/tenant boundaries and physical-device behaviour with the owner. Enabling production customer data, webhook events, messaging, phone/SMS, payments or Windows relay requires additional separate authorization and full operator acceptance.

**Important release note:** GitHub and Vercel have independent CI/CD and show real historical production deployments. Connecting them to Comms Hub is not technically required just to push source updates. A deliberate pause of feature builds while coordination is designed is a separate owner release policy, not a proven infrastructure dependency.

**Honest present state:** master not deployed, shell/child connector migration planned, **six DISCONNECTED / HOLD**, original independent Proof-B still unaccepted, no private TEST permission, Windows relay OFF, ACK UNDER_REVIEW / PARKED_FOR_LATER. QL-329 does not create external connections. QL-330 may reconcile owner acceptance only after a separate request; do not auto-activate peers or start another batch.
