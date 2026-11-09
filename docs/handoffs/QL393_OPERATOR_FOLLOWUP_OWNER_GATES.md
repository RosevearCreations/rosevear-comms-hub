# QL-393 — Operator Follow-Up Drafts, Source Evidence Recheck Requests & Owner Approval Gates

**Scope: `INERT_PREVIEW`, no live send.** This build extends the [QL-392 review filters](QL392_OPERATOR_INCIDENT_FILTERS_IMPACT_PRIORITIES.md) with a deterministic, source-scoped draft projection. Even if a simulated scenario claims all approvals passed, the output is still a *draft only*. It cannot deliver an email, create a message or task, reserve a replay key, write a database, enroll a receiver, sign a request or change a permission.

## Draft generation and source isolation

`app/src/auth/ql393OperatorFollowUpDrafts.ts` accepts the bounded QL-391 synthetic correlation preview, an exact opaque correlation ID and a caller-supplied synthetic gate scenario. The input must first pass QL-392 review validation. It generates zero or one draft per **affected registered shell source**:

| Source evidence in the selected group | Source-scoped proposed action | Payload |
| --- | --- | --- |
| Signed-preview conflict, conflicting readback or invalid evidence | `CONFLICT_REVIEW` | Fixed `SOURCE_CONFLICT_PROOF` request code |
| Missing, stale or unknown readback | `EVIDENCE_RECHECK` | Fixed `SOURCE_SCOPED_READBACK` request code |
| All evidence current and no conflict | No draft | None |

Each draft has one source ID, one opaque correlation ID, a bounded reason code, fixed-language summary, `recipientScope: SOURCE_SHELL`, five gate states and immutable `sendEnabled: false` / `persisted: false`. The draft never includes another source's raw event, a tenant identity, customer data, credentials or a free-form message. For example, if Yard Workers evidence is current while iCamp evidence is stale in one shared group, only iCamp gets the illustrative source-scoped recheck draft.

## Five independent scenario gates

| Gate | Synthetic criterion | Real-world status |
| --- | --- | --- |
| `SOURCE_OWNER` | Exactly one simulated owner decision matching the draft's source **and** correlation | HOLD until independently verified original source owner |
| `MASTER_OWNER` | Exactly one separate simulated master-owner decision matching the correlation | HOLD until verified master approval for the exact action |
| `SOURCE_PIN` | Exactly one simulated source signing-pin match bound to source **and** correlation | HOLD until original key custody and signer proof are verified |
| `RECEIVER` | Simulated enrolled receiver flag | HOLD until the genuine secured receiver and replay ledger are activated |
| `CONSENT` | Exactly one simulated consent matching source **and** correlation | HOLD until original operator scope, retention and audit permission are verified |

Absent, duplicate, mismatched or held decisions do not pass. Bad source IDs, malformed correlations, unbounded lists or unsupported statuses return `HOLD` without drafts. The status `SCENARIO_READY_ONLY` means five *caller-supplied fictional flags* happen to match; it **never** means the action may execute. No user interface control can change a gate from HOLD to authorized.

## Owner display

The owner screen shows an accessible synthetic correlation selector, a fixed draft table, five expandable gate explanations and explicit non-sending language. Selecting another correlation only changes in-memory read-only display. A group without a concerning source renders a safe no-draft state. There are no send, approve, export, acknowledgement, assignment or mutation buttons.

## Production prerequisites

Before any source-evidence request may be sent: authenticate the original source and master owner on their actual authorized devices; verify separately pinned signer evidence and scoped consent for each source; approve a server-side exact request schema, recipient, replay/idempotency contract and audit/retention policy; confirm a live receiver and tenant isolation through independently witnessed proof. AI Data Platform remains authoritative for evidence/health data; Comms Hub coordinates only communication and incident operator workflows with verified scope.

Tests cover source isolation, correct draft kinds, no-draft groups, duplicate/missing/mismatched approval gates, malformed inputs, all-five-simulated-pass still non-sending, and accessible owner display. GitHub CI GREEN means code promotion only, never original owner enrollment or live request authority.
