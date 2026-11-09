# QL-396 — Operator Evidence Recheck Queue, Outstanding Approval Aging & Owner Escalation Guidance

## Scope

An **inert, source-scoped, in-memory illustration** of a recheck queue, derived from bounded QL-394 decision history and QL-393 follow-up draft previews. It does not retrieve production incidents, create an approval, send an escalation, persist a task or grant access.

The fixed demo shows three registered source shells:

| Source | First illustrative observation | Age at 09:45 UTC | Age band |
| --- | --- | --- | --- |
| `devilndove` workshop conflict | 09:00 | 45 minutes | `OVERDUE` |
| `icamp` integration evidence | 09:20 | 25 minutes | `AGING` |
| `rosevear-ai-hub` local evidence | 09:39 | 6 minutes | `NEW` |

There are five source-scoped owner/evidence gate rows per affected source. These are **not actual open approvals**. The absence of the other three registered shells from this example does not mean those applications have no real incidents. Camp Rosevear and other businesses are tenants, not additional master-shell source identities.

## Synthetic aging and priority

- `NEW`: fewer than 10 elapsed minutes from the **first synthetic observation**.
- `AGING`: 10–29 illustrative minutes.
- `OVERDUE`: 30 minutes or more.
- `REVIEW_NOW`: a prior simulated drift alert or overdue illustration.
- `VERIFY_EVIDENCE`: another unresolved illustrative owner/evidence gate.

These thresholds are demonstration labels, **not production service-level agreements or verified approval ages**. Original owner approval timestamps, recipient identity and actual case aging are unknown. Read-only source and age filters change only this local sample.

## Independent review scopes

| Gate | Suggested review scope | Original evidence requirement |
| --- | --- | --- |
| `SOURCE_OWNER` | Source owner | Source-specific decision, scope and independently witnessed authorization |
| `MASTER_OWNER` | Separate master owner | Original master decision bound to the exact correlation |
| `SOURCE_PIN` | Source signing custodian | Signing-pin custody, source key identity and independent witness |
| `RECEIVER` | Receiver operator | Trusted private receiver enrollment and durable replay controls |
| `CONSENT` | Consent custodian | Scoped consent, privacy, retention and audit authorization |

Scope labels are not actual assignments. Every row remains `originalOwnerEvidence: NOT_VERIFIED`, `status: HOLD`, `sendEnabled: false`, `persisted: false`. Escalation text is static guidance; nothing contacts Ree, Jack or a source application.

## Fail-closed and release boundaries

- At most six distinct correlation groups with valid nonempty QL-394 snapshots and an affected QL-393 draft; an invalid or duplicate group stops the whole preview without partial results.
- Queue IDs are unique per source, correlation and gate. Multiple observations are deduplicated within that boundary. Tenant records are never accessed or shared.
- Original signing authority, source/master owner approvals, receiver enrollment, retention and replay controls require separate independently verified evidence before real work can be authorized.
- Vitest, TypeScript/Vite, independent `dev` and `main` CI and post-main-push checks must pass before software promotion. GREEN means code verification, not private operational authorization.
