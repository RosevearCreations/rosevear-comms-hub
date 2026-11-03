# QL-328 — Nonproduction Dry-Run Orchestrator, Failure Matrix & Reversible NO-GO Packets

**Classification:** Credential-free LOCAL SIMULATION ONLY. Six sources DISCONNECTED / HOLD; Windows relay OFF; ACK UNDER_REVIEW / PARKED_FOR_LATER. **No real TEST authorization, source proof, authenticated GET, customer data, secret, provider message, remote retry, signed packet or rollback.**

## What the I.T. Command view actually does

QL-328 is a repeatable in-memory rehearsal of a *proposed* six-source connection review. It reuses the exact QL-327 synthetic source matrix (four independent business tenants and two tenantless supporting systems) and deterministic read-only contract shape. No browser request or database mutation is made.

The six displayed stages are **original Proof-B → independent issuer/reviewer/owner authority → tenant scope + consent → source GET contract compatibility → proposed TEST GET plan → stop/fallback/UNSENT NO-GO packet**. Every stage is explanatory, not a completed external gate. All six connections are held because no original independently validated source proof or exact owner TEST authorization is available. Even the locally compatible baseline gives NO-GO.

## Failure and response rehearsal

The 17 fictional scenarios are: valid shape but no authority; mock HTTP **401, 403, 404, 409, 429, 500, 503**; **timeout, offline, replay, cancellation, missing proof, wrong tenant, missing consent, expanded write privilege and breaking v2 schema**. HTTP values are labels injected into a local function, **not responses from a source**. Six sources × 17 scenarios = **102 deterministic NO-GO** readbacks, with 102 unique idempotency keys.

A replay or repeated mock scenario computes the same packet ID and idempotency key, without resending, executing a GET, escalating privileges or changing source data. Attempt counter 1–3 describes display-only repetitions. Cancellation means discarding the local rehearsal and generating an UNSENT cancellation decision, not cancelling an actual provider operation.

## UNSENT packet fields and human review

The synthetic packet contains a deterministic identifier, fictional source identity and tenant alias, signal, reason, proposed stop phase, last-known-local rollback steps, HOLD connection status and explicit non-authority fields. The receipt is **not signed, saved, exported, sent or approved**.

1. Preserve the pinned v1 local fixture; never roll back or modify a remote application automatically.
2. Keep four business tenants separate. Both support services have no customer tenant or customer consent. A wrong tenant results in NO-GO.
3. Stop on missing original source-signed Proof-B, missing independent custodian witness, missing owner TEST authority, bad role/tenant, missing consent, unexpected permission or any unknown failure.
4. Do not retry 429, timeout, offline, 5xx, or 409 automatically. No fallback to an unrelated source or external endpoint.
5. If a separately authorized future TEST is considered, require fresh original issuer evidence, independent custody and gateway identity, explicit scoped source-owner/owner authorization, known customer consent, and a separately reviewed nonproduction GET implementation. This build authorizes none of those actions.

## Test acceptance and outstanding observations

The automated regression enumerates all six source roles and 17 scenarios, asserts deterministic packet identity and NO-GO, checks idempotent repeat/cancel/replay semantics, role and tenant isolation, UI controls, keyboard/focus/responsive styling, and zero side effects. This code does not substitute for source-owner responses, owner physical-device testing, independent security assessment, or authenticated provider integration.

## Traceable source references

- [QL-327 versioned fixture policy](QL-327-SIX-APP-CONTRACT-COMPATIBILITY-GUIDE.md)
- [QL-328 pure orchestration model](../app/src/operator/ql328DryRunOrchestrator.ts)
- [QL-328 I.T. Command screen](../app/src/operator/Ql328DryRunOrchestrator.tsx)
- [QL-328 automated tests](../app/src/operator/__tests__/ql328DryRunOrchestrator.test.tsx)
- [QL-325 independent authority gate readback](QL-325-IMMUTABLE-PROOF-INDEPENDENT-AUTHORITY-GATES.md)
- [Final batch queue QL-311–330](QL-311-330-FINAL-SETUP-VISUAL-CONNECTION-QUEUE.md)

**Next after verified code + production receipt:** QL-329 — Cross-Device Accessibility, Security Boundary, Performance & Failure Regression. QL-328 itself must not advance the release queue until exact-main CI, Cloudflare production and live asset hashes are independently verified.
