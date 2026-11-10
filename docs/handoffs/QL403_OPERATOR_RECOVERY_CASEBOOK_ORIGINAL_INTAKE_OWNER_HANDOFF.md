# QL-403 — Operator Recovery Casebook, Original Evidence Intake Requirements & Owner Verification Handoff

## Scope and operating truth

QL-403 adds a **read-only, synthetic** casebook to the protected Master Shell owner drilldown. It organizes QL-402's source-bound recovery notes into example original-evidence intake, independent-review and owner-verification handoffs. It **does not** receive or validate original evidence, create a live assignment, write a case, acknowledge a message, enroll a signer, contact a source, send notifications, authorize a connection or resolve a HOLD.

The separate **AI Data Platform** is the Master Shell's intelligence, health, metrics and module-completion plane. **Rosevear Comms Hub** is the complementary communications, operator, incident and notification plane. Neither is permitted to impersonate a source company or bypass the other plane's independent authorization. A master monitoring role is **not** a blanket master credential to customer tenants.

## Fixed shell-level source contracts

| Contract ID | Application | Scope | Expected shell health handler |
| --- | --- | --- | --- |
| `yw` | [Yard Workers](https://github.com/RosevearCreations/yw) | SaaS product shell, not Rosevear Landscaping | `server/ql364-source-health.mjs` |
| `icamp` | [iCamp](https://github.com/RosevearCreations/iCamp) | SaaS product shell, not Camp Rosevear | `lib/integration-v1/ql364-source-health.mjs` |
| `rosiedazzlers` | [Rosie Dazzlers](https://github.com/RosevearCreations/rosiedazzlers) | Owned-business shell | `functions/api/_lib/ql364-source-health.mjs` |
| `devilndove` | [Devil n Dove](https://github.com/RosevearCreations/devilndove-site) | Owned-business shell, not unapproved Etsy/Meta scopes | `functions/api/_lib/ql364-source-health.mjs` |
| `ai-data-platform` | [AI Data Platform](https://github.com/RosevearCreations/ai-data-platform) | Master monitoring/data broker shell | `apps/web/lib/ql364-source-health.mjs` |
| `rosevear-ai-hub` | [Rosevear AI Hub](https://github.com/RosevearCreations/rosevear-ai-hub) | Private Windows support server shell | `server/src/rosevear_ai_hub/api/ql364_source_health.py` |

These are contract declarations in `app/src/auth/ql386MasterShellRegistry.ts`, **not live source pings**. The current drilldown has an aggregate protected readback only; it cannot attest that any named source is individually authenticated. The QL-387 routing designs and QL-388 intake envelope are non-transporting previews. See [QL-365D source attachment handoff](QL365D_SIX_APP_COMMS_ATTACHMENT_VALIDATION_HANDOFF.md).

## QL-403 casebook data and safety boundaries

1. Each scenario case has a stable opaque case ID, source shell ID, assignment ID, correlation ID, intended reviewer role, handoff stage, bounded timestamp and optional QL-402 review reference. No names, messages, credentials, private evidence or customer records are stored.
2. Cases must bind to their QL-402 recovery assignment and role, use a real scenario review reference from that same assignment (or `null`), and never predate that review or occur in the future. Duplicate/colliding IDs, invalid stages and cross-source references fail closed.
3. Each case exposes five separately unverified requirements: `SOURCE_OWNER`, `MASTER_OWNER`, `SOURCE_PIN`, `RECEIVER`, `CONSENT`. Every one begins `NOT_RECEIVED / NOT_PERFORMED / NOT_SIGNED`.
4. The operator can filter by source and handoff stage, expand original-artifact requirements and read a safe next step. Filters alter only the local preview.
5. Source custody, independent reviewer, owner signatures, receiver identity, authorization, consent and closure always remain unverified. `sendEnabled`, `persisted` and `handoffAuthorized` are `false`; every closure decision remains `HOLD`.

## How the actual connection must be established

1. **Source contract:** The separate source owner publishes the approved shell-level manifest, source ID, expected handler, narrowly scoped events, provenance and independently verifiable health evidence. Product tenants remain isolated.
2. **Original custody:** Acquire the original issuer/signer and witnessed original evidence from the source in a protected owner workflow, not this preview. Check freshness, scope, signing-key custody and source-to-artifact binding. A simulated receipt or database row is insufficient.
3. **Independent owner decision:** Verify the original source-owner approval and an independent Master Shell owner approval for the exact source, receiver, tenant boundary, purpose and TEST scope. Record authentic signed decisions and an independent witness where required.
4. **Receiver and consent:** Verify Comms Hub receiver enrollment and encryption/signing authority server-side, accepted consent, audience/routing permissions and idempotent/replay-safe signed receipts. Keep keys out of source, browser and screenshots.
5. **Small supervised TEST:** With both owner approvals, perform a scoped, read-only signed health/event probe; correlate its source-original signed receipt and receiver acknowledgment. Route monitoring evidence to AI Data Platform and approved incident/notification events to Comms Hub. Reject, quarantine and audit unknown or stale evidence.
6. **Promotion of trust:** Only the protected owner process can update the verified per-source connection state from `HOLD`; the presence of QL-403 code on production `main` is **not** proof of that source's operational attachment.

## Functional relationship / master and participant roles

- **Master oversight:** AI Data Platform owns cross-app health, provenance, readiness scoring, verified completion denominators, statistics and diagnostics. It receives only approved, isolated source monitoring.
- **Master communications operator:** Comms Hub owns consent-bound notification/incident intake, owner escalation, acknowledgements, safe routing and human recovery. It is a **service of the master architecture**, not a unilateral enrollment authority or the master database for each app.
- **Participant source shells:** Yard Workers, iCamp, Rosie Dazzlers and Devil n Dove own their business operations and records. A shell can provide approved status/events but a shell connector does not grant access to customer or example business tenants.
- **Local participant:** Rosevear AI Hub owns its original Windows installation, local device/process truth, and private relay. No public or browser permission may substitute for local owner authority.

**Operational status:** QL-403's review contract is `INERT_PREVIEW`; the signed, independently witnessed per-source trust state must be checked through the protected owner readback and the original source systems. Without new verified original evidence, report connectivity as `NOT INDIVIDUALLY VERIFIED / HOLD`, not “six connected.”

## Acceptance and recovery

- Model tests cover case ID uniqueness, timestamp and reviewer binding, spoofed source/correlation, fake reference, invalid stage, upstream failed-close, deterministic ordering and filter isolation.
- Accessible drilldown tests cover three demo stages, 15 unverified original checks, zero live actions and keyboard-friendly filters.
- A missing or inconsistent protected readback is `STOP` or `Unverified`, not authorization.
- Recovery is to preserve HOLD, re-acquire original evidence through protected custody, independently verify source and master signatures, confirm receiver and consent, then perform a narrowly approved TEST. Do **not** manually flip a UI state, reuse old scenario acknowledgements or enable an unverified relay.

## Owner acceptance checklist

- [ ] Source owner independently identifies original issuer and protected original artifact.
- [ ] Source signer/key custody is independently verified; witness evidence is original and fresh.
- [ ] Separate Master Shell owner signs the exact source/receiver/purpose/tenant authorization.
- [ ] Receiver enrollment and signed, non-replayable receipt are verified server-side.
- [ ] Consent and retention/data minimization scope are checked; no tenant boundary is crossed.
- [ ] Actual scoped TEST and production connection states are reviewed from authenticated sources.
- [ ] HOLD is removed **only** by the authoritative protected workflow with linked original evidence.

All seven checklist entries are requirements for future original-world acceptance, **not claims completed by QL-403**.
