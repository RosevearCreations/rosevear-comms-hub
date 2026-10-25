# QL-190 — Independent Pre-Pilot Review Packet

**Disposition: REVIEW PACKET PREPARED; LIVE PILOT = HOLD.** This document and the GitHub Pages screen are a public, synthetic handoff **for** independent review. They are **not** a completed independent review, legal opinion, audited production architecture, owner decision, consent proof, telecom activation request or authorization to contact customers.

## What QL-190 delivers

1. `app/src/operator/ql190-review-packet.json` — pinned, versioned **draft** manifest of exactly twelve `HELD_UNVERIFIED` prerequisites linked to the QL-181 decision matrix. Every prerequisite names a future reviewer lane and the external artifact still needed. The manifest explicitly records `externalReviewCompleted=false`, `ownerSignoffCaptured=false` and `pilotAuthorizationGranted=false`.
2. `scripts/ql190-packet-integrity-audit.mjs` — offline, read-only integrity audit. It compares the twelve manifest IDs with the actual QL-181 matrix and checks that nine historical source documents (QL-181–QL-189) exist, carry their expected build IDs and remain pinned. It rejects missing/duplicate/forged holds, path drift, a fabricated approval state and unexpected packet fields. A **pass only means checked-in records agree**, not independent security acceptance.
3. `scripts/__tests__/ql190-packet-integrity-audit.test.mjs` — negative tests for tampering, missing sources, fake signatures/approvals, path traversal and one-record removal.
4. **Operator workspace → Safety & hold review → QL-190 Independent pre-pilot review packet** — accessible source links and a read-only category filter for both businesses. The browser shows twelve held requirements and an external reviewer agenda. It has no approve/deny button, data entry, signature, file upload, localStorage writes, Supabase API, provider call or live enable toggle.
5. A CI gate runs the audit and Node tests. QL-190 does not modify Supabase schema, credentials, permissions, hosting plans, telecom accounts, numbers, callback routes, provider billing or customer-data retention.

## Review handoff: evidence required outside this public site

| ID | Independent review question / evidence to obtain | Review lane |
| --- | --- | --- |
| `identity-mfa` | Demonstrate real identity, MFA, secure recovery, session revocation and offboarding on a protected server. | Owner + security |
| `brand-rls` | Verify backend route grants, brand/record authorization, database RLS and cross-tenant IDOR denial. | Security + database |
| `lawful-collection` | Confirm lawful purpose, notices, minimum fields and approved private storage replacing the older local-browser demo. | Privacy + owner |
| `consent-proof` | Separate commercial/transactional purposes; verify basis, channel-specific consent, opt-out, HELP/STOP handling and suppression. | Privacy/legal |
| `retention-deletion` | Approve access/correction, purpose-based retention, export, deletion, backup lifetime and incident notification. | Privacy + owner |
| `provider-auth` | Select a provider; demonstrate its real signature/timestamp verification, event scope, retries, replay ledger and quarantine. | Security + telephony |
| `secrets` | Prove backend-only key handling, rotation, revocation, log redaction and separation between staging and production. | Security + infrastructure |
| `abuse-limits` | Test real rate/volume/spam/fraud and spending limits, emergency stop and adverse retry behavior. | Security + telephony |
| `audit-monitor` | Demonstrate access-controlled redacted logs, incident alerts, integrity of evidence, escalation and restoration drills. | Security + operations |
| `numbers-carrier` | Verify ownership/terms of Bell Fibe and business cell numbers, segregate personal use, map forwarding/fallback and rollback costs. | Line owner + telephony |
| `independent-security` | Obtain a truly independent written staging security/privacy assessment, recorded negative-test results and residual risks. | Independent reviewer |
| `owner-signoff` | **Separately** verify the actual owner and capture an explicit out-of-band decision on pilot scope, costs, lines, roles, data, rollback and release date. | Verified business owner |

The table restates the [QL-181 canonical prerequisites](QL-181_PRIVACY_ROLES_LIVE_PILOT_DECISION_MATRIX.md); it does not assert that any required external document has been received. All twelve remain open for both Rosie Dazzlers and Devil n Dove.

## Source lineage and known limitations

The source manifest links these earlier **development artifacts**. They contain simulated evidence, specifications and proposed safeguards, not live acceptance:

- [QL-182 synthetic journey and queue handoff](QL-182_JOURNEY_ACCEPTANCE_AND_NEXT_BATCH_HANDOFF.md)
- [QL-183 operator usability](QL-183_OPERATOR_USABILITY_ACCEPTANCE.md)
- [QL-184 brand permission mapping](QL-184_BRAND_WORKSPACE_PERMISSION_MAPPING.md)
- [QL-185 private data/retention blueprint](QL-185_PRIVATE_DATA_MINIMIZATION_RETENTION_BLUEPRINT.md)
- [QL-186 consent/message classification](QL-186_CONSENT_MESSAGE_CLASSIFICATION_SPECIFICATION.md)
- [QL-187 provider and cost model](QL-187_PROVIDER_DECISION_COST_MODEL.md)
- [QL-188 isolated server-auth/webhook/replay tests](QL-188_SERVER_AUTH_WEBHOOK_REPLAY_TEST_HARNESS.md)
- [QL-189 mock operational safety controls](QL-189_OPERATIONS_SAFETY_CONTROLS.md)

**Unverified by QL-190:** actual provider cost/contract and chosen numbers, deployment design for a protected web server, true authentication and Supabase least privilege, PIPEDA/CASL applicability for each communication type, customer consent, protected storage/retention, independent security testing, named incident responders, rollback ownership and verified owner permission. None is completed by a synthetic build passing CI.

## External independent review process (future work, not executed)

1. **Prepare protected staging** separated from production, with disposable data, verified identities and an unambiguous representative of each legal/business line owner. Public GitHub Pages is not a staging backend.
2. **Confirm scope and data map:** intended lines, commercial/transactional use cases, legitimate collection, retention, roles, recipient permissions, personal-line exclusion and provider terms.
3. **Review each hold:** collect a private source artifact, reviewer identity and date, negative-test evidence, open issues and residual-risk rating. The QL-190 manifest is not where those records are stored.
4. **Rehearse failure/rollback:** unauthorized brand access, stolen session, forged/replayed webhook, opt-out, cost overrun, traffic spike, failover, lost secrets and emergency stop. Do not use real customers as test fixtures.
5. **Independent decision:** a reviewer unconflicted with the implementation records a recommendation, conditions and unresolved issues in an appropriately secured location.
6. **Owner decision after review:** verify the owner independently and obtain **separate explicit authorization** for a bounded pilot, budget, phone numbers, allowed operators, permitted data, incident contacts, rollback and activation schedule.
7. **New engineering/release authorization:** only after the above, separately scope and build actual protected runtime, policy checks, provider connections, production telemetry and staged pilot activation. A QL-190 code merge is not that authorization.

## Test and deployment acceptance

From repository root:

```bash
node scripts/ql190-packet-integrity-audit.mjs
node scripts/__tests__/ql190-packet-integrity-audit.test.mjs
node scripts/ql171-operator-baseline.mjs
cd app
npm run check
npm test
npm run build
npm run pages:build
```

The audit returns `PACKET_SOURCES_CONSISTENT_ONLY` with `livePilotAuthorized=false` and zero external effects. The browser tests confirm cross-brand refusal, tamper rejection, no write/network side effects and no approval interface. The required release gate is two reviewed merges (`feature → dev → main`), exact `dev`/`main` tree parity, five successful check runs attached to the **exact resulting main SHA** (`app-build`, `Build disabled preview`, `Deploy disabled preview`, `Supabase Preview`, `Workers Builds: rosevear-comms-hub`) and a reachable new Pages HTML/JS bundle containing `ql190-independent-prepilot-review-packet-v1`.

## Numbered backlog closure vs live authorization

After QL-190 reaches exact-main GREEN, the approved **QL-183–190 development batch is 8/8 complete**, with **zero remaining numbered builds in that batch**. This is a **software roadmap milestone only**. The QL-181 twelve-item **real-pilot hold remains 12/12** and requires independent, out-of-band human and operational work. Future live-provider builds must be newly authorized, not inferred from queue closure.

### Reviewer reference sources

- [CRTC — Canada's Anti-Spam Legislation FAQ](https://crtc.gc.ca/eng/com500/faq500.htm) (review applicability with Canadian counsel for the actual message type)
- [OPC — PIPEDA limiting collection](https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/p_principle/principles/p_collection/)
- [Supabase — securing the Data API with GRANT and RLS](https://supabase.com/docs/guides/api/securing-your-api)
- [OWASP API1:2023 — Broken Object Level Authorization](https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/)
- [Node.js test runner](https://nodejs.org/api/test.html)
