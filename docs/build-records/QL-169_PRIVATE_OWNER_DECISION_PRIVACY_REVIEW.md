# QL-169 — Private Owner-Decision Prerequisite & Privacy Review

## Purpose and boundary

This build records the **gaps before a real, private owner decision could ever be considered**. The public disabled preview displays only five prewritten category labels and general safeguards. It is not a private intake, consent workflow, decision ledger, authorization service, compliance certification or approval to enable live calls or messaging.

QL-169 derives a fail-closed, read-only checklist from the QL-168 synthetic summary. It neither copies QL-168 hold identifiers and free-form evidence descriptions into its own output nor stores personal information. The code never receives actual owner identity, customer contact data, call recordings, consent evidence, credentials, signatures or provider payloads. The current application still has no authorized private evidence collection path.

## Required separate private review

| Prerequisite | Evidence required before a *future* real decision | Privacy and access decision still missing |
| --- | --- | --- |
| Authenticated owner identity and authorized role | Independent identity and role check by a designated human | Approved identity verifier, least-privilege access, private storage; no identity documents in public preview |
| Independent evidence provenance and integrity | Per-hold origin, timestamps, authenticity, context and lineage | Authorized source, evidence minimization, access control and review-safe retention; no recordings/messages/attachments in preview |
| Explicit per-hold human disposition | Case-specific hold status, rationale and responsible human approval | Restricted case view, purpose limitation and auditable, non-automated decisions; no public real hold IDs or case notes |
| Consent, purpose, channel and scope | Proof of consent and allowed purpose, channel and operational limits | Determine applicable privacy obligations and consent mechanism separately, before any private collection or contact |
| Restricted human approval and audit sign-off | Authenticated reviewer, explicit sign-off, audit integrity | Choose retention period, access/revocation roles, incident response, review trail and deletion policy prior to any implementation |

**None of these five requirements is fulfilled by QL-169.** In particular, the synthetic provenance check cannot authenticate real evidence, and a passing deployment check cannot establish consent or business authorization.

## Decisions deliberately held

1. **Identity/roles:** Who can approve for each company, how identity is proved and how access is removed remain owner decisions.
2. **Evidence handling:** Approved source, secure storage, minimization, viewer permissions, retention and deletion have not been selected or implemented.
3. **Consent and communication:** Purpose, channel, authorization limits and customer/provider consent must be separately reviewed; no real calls, SMS/MMS, recordings, callbacks or AI sends are enabled.
4. **Human disposition:** No operator form, real exception record, signed owner decision, dispatch, closure, escalation or automated follow-up is authorized.
5. **Audit/sign-off:** No immutable real audit log, signed receipt, private export, real approval trail or database migration is included.

Any future private workflow requires a separate explicit owner decision, a threat/privacy review, technical authorization controls, retention rules, implementation scope and independent acceptance tests. It cannot be inferred from an unchecked public checklist or from passing CI.

## Implementation and acceptance

- `app/src/operator/ql169PrivateOwnerPrivacyReview.ts` uses a fixed five-row, generic matrix. It returns only literals (not upstream hold IDs or evidence text), and flags all five gaps as pending. It rechecks QL-168 source shape, evidence state and non-authorization flags before claiming synthetic source-contract consistency. A bad upstream contract triggers an integrity warning while every permission remains false.
- The read-only public preview renders those generic gaps before the QL-168 synthetic hold summary. It adds no input, send button, save control, export, link to private data or backend route.
- Automated tests cover exact five-row order, refusal to echo private-like upstream strings, empty hold behavior, tampered consent/approvals/permissions and absence of action controls in the rendered QL-169 panel.
- Run `npm run check`, `npm test`, `npm run build`, `npm run pages:build`, and `git diff --check` locally; feature PR exact-head `app-build` SUCCESS, promotion PR exact-head `app-build` SUCCESS, then all five required checks SUCCESS on the final `main` SHA.

The disabled preview stays **public/synthetic/read-only**. No real customer or owner records, Supabase writes, private workflow, provider interaction, Phone/SMS, dispatch, closure or permission changes are part of this release.

Next scoped build: **QL-170 — Release Receipt Integrity & Queue Reconciliation**. Then create a new planning batch.
