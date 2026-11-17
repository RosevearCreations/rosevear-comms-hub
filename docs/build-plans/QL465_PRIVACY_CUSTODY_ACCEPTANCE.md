# QL-465 — Privacy custody and acceptance

## Scope implemented in source
- Strict tenant/workspace/purpose-bound local noncontent event projection, rejecting unknown keys, personal data, cross-tenant inputs and stale source claims. These projected identifiers remain pseudonymous and potentially linkable; this is not anonymization or an authenticated external peer connection.
- Server-side AES-256-GCM encryption and decryption with cryptographic tenant/workspace/record/purpose binding and explicit owner-role check. Helper only, not a deployed production vault or customer data migration.
- Source Ed25519 signature verification on purpose-scoped consent-withdrawal requests; HMAC-authenticated, private, write-once local custody ledger. Post-withdrawal local consent checks fail closed.
- Staged signed data-subject access/export, deletion and retention-review request receipts. No customer exports, erasure, actual provider notifications or remote changes.
- Owner-reviewed bounded retention due checks with legal-hold denial, never unattended purge.
- Accessible read-only privacy dashboard inside the Master console. No real customer records, keys, source permissions or receiver operations exposed.

## Authority, isolation and legal boundaries
The secure ledger requires an owner-provisioned 32-byte audit HMAC key and private 0700 directory; encryption requires a separately protected 32-byte key. No secrets are committed. QL-466 is responsible for real key custody and rotation. This ledger is not a customer database, vault, legal-compliance certification or full data-subject-rights processing system. Existing QL-462 and QL-463 source links stay OPEN/HOLD; no runtime peer is newly connected.

Actual export or erasure needs independently verified requester identity, applicable retention/legal exceptions, complete service-specific records inventory, real owner authority, execution and receipts. Never infer legal approval or successful deletion from a staged request. Privacy obligations vary by context and should be reviewed before live handling.

## Required checks
App CI from app/: npm ci, npm run check, npm test, Node QL-465 privacy custody test, npm run build, existing unchanged safety/asset budgets. The QL-336A required gates include the privacy test. Tests cover tamper rejection, signed withdrawal, replay, cross-tenant rejection, authenticated decryption, no-effect requests and legal-hold retention. On exact main: protected audits, Windows host safety, Cloudflare production build, deployment and public Worker JS/CSS SHA-256 parity.

**Operational privacy acceptance still HELD** pending observed real tenant role tests, key ceremony, independent source identity and customer consent, legal retention policies, production lifecycle, negative/live cases and owner approval. Code-green does not prove legal or full runtime privacy compliance.

Next queued after verified production release: QL-466 — Secrets Lifecycle, Vault Backing, Key Rotation and Custody Reconciliation.
