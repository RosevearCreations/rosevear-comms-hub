# QL-142 — Synthetic Handoff Evidence Export Design

QL-142 is a design specification and **display-only preview**, not a functioning export mechanism. It projects six synthetic QL-141 action areas into an explicit JSON schema proposal. It fails closed when the prior source is incomplete, inconsistent or blocked.

## Contract
- MIME: `application/json`
- Proposed filename: `ql142-synthetic-evidence-preview.json`
- Version: 1
- Public/synthetic fields only: schemaVersion, sourceBuild, classification, counts, sections.id, sections.area, sections.finding.
- Exclude personal identity, contact details, message/call content, recordings, provider credentials, AI payloads, consent records and private owner decisions.
- exportEnabled, downloadEnabled and canTransmit are always false.

No real export buttons, Blob creation, browser download, database/ledger/archive, Worker endpoint, Supabase or storage writes, phone calls, SMS, DTMF, provider callbacks, recording or AI sending. The UI is a preview for design review only.

## Release gates
- Exact QL-141 source validity.
- Feature-head app-build success before dev merge.
- Promotion-head app-build success before main merge.
- Exact final main five successful statuses: app-build, Build disabled preview, Deploy disabled preview, Supabase Preview and Workers Builds: rosevear-comms-hub.
- Future implementation needs distinct consent/privacy/security and operator authority.

Next proposed: QL-143 — Synthetic Export Schema Review & Redaction Verification (subject to roadmap).
