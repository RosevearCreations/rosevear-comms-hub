# QL-181 — Privacy, Roles & Live-Pilot Decision Matrix

**Overall decision: HOLD.** This document is an inventory for a *future* security and owner review, not a security certification, legislative opinion, implementation approval, customer consent record or owner decision. All QL-181 code is synthetic and display-only. QL-182 will verify the synthetic journey; neither QL-181 nor QL-182 grants a live pilot.

## Verified source inventory and distinctions

| Existing source | Observed preview behaviour | Remaining limit |
| --- | --- | --- |
| `app/src/supabase/appAdmin.types.ts` | `owner`, `admin`, `staff_readonly` allowlist role names and brand scope shape. | Role names are not proof of authenticated access or server-side authorization for live customer data. |
| `app/src/auth/AdminSessionGate.tsx` | Config-gated Supabase Auth session/magic-link and active admin allowlist lookup; local-only mode can still render the demo. | Verify server identity, session expiry/revocation, MFA, secure recovery, exact record/brand authorization and RLS separately. |
| `app/src/supabase/client.ts` | Config-gated Supabase publishable-key browser client. | Publishable keys are not privileged credentials; never place `service_role` or provider secrets in frontend code; evaluate all Data API/RLS policies. |
| `app/src/integrations/supabaseReadOnlyClient.ts` | Optional read-only synthetic views with project URL check, kill switch and blocked customer/provider/admin table names. | This is not a runtime authorization layer for private production data. |
| `app/src/storage/localRepository.ts` | Older QL-004 localStorage database, manual lead capture/import/export, including fields for real-looking phone/email/text. | This is **not an approved secure customer-data store**. Do not enter real contacts in the public disabled preview or reuse its export as a production privacy system. |
| `app/src/operator/ql175ContactContextConsent.ts` | No verified consent grants; `unknown` or locally simulated opt-out only; dispatch false. | Need separate channel- and purpose-specific consent handling, opt-out proof and suppression before any actual send. |
| `app/src/operator/ql179MockPhoneSms.ts` | Version-pinned provider-neutral in-memory mock receipts; marked NO_REAL_SIGNATURE_OR_AUTHENTICATION. | No real provider webhook, sender authentication, payload validation or live event trust boundary. |
| `app/src/operator/ql180RoutingIvr.ts` | Pinned synthetic routing choices; shared-line ambiguity, business mismatch, personal isolation and voicemail examples. | No carrier contract, real line control, fallback, rate limiting, DTMF processing or call routing has been implemented. |

## Live-pilot prerequisites — all HELD

| ID | Prerequisite | Evidence/decision required outside the public preview | Review responsibility |
| --- | --- | --- | --- |
| `identity-mfa` | Operator identity, MFA and sessions | Server-confirmed identity, independent MFA/step-up, recovery, revoke/offboard drills. | Owner + security |
| `brand-rls` | Least privilege, server authorization, brand isolation | API/resource-level authorization; RLS in exposed schemas; per-record/brand checks; IDOR regression/penetration tests. | Security + database |
| `lawful-collection` | Purpose, notice, minimum data | Decide necessary fields, privacy notice and collection purpose; replace unsafe local demo storage before real data. | Privacy + owner |
| `consent-proof` | Channel/purpose consent, opt-out | Commercial vs transactional classification; review CASL; verified consent basis, withdrawal, STOP/HELP, suppression and sender identification. | Privacy/legal |
| `retention-deletion` | Retention and data subject handling | Retention schedule, access/correction, secure deletion, export control, backup retention and incident notification. | Privacy + owner |
| `provider-auth` | Webhook integrity and idempotency | Server-side signature/timestamp verification, replay protection, verified sender/provider/line and quarantine. | Security + telephony |
| `secrets` | Secret storage | Confirm privileged backend-only keys, rotations, logging/redaction, breach response and least privilege. | Security + infrastructure |
| `abuse-limits` | Abuse and spend controls | Carrier-side and backend rate/volume/cost limits, DoS/spam/fraud threat model and emergency stop. | Telephony + security |
| `audit-monitor` | Evidence and incident response | Private role-scoped audit trail, alerting, integrity checks, incident runbook and restoration tests. | Operations + security |
| `numbers-carrier` | Business/personal line ownership | Verify Bell Fibe and cell number ownership/terms, explicit personal-line exclusion, call routing/forwarding rollback and billing. | Line owner + telephony |
| `independent-security` | Independent pilot security acceptance | Isolated real staging acceptance, risk sign-off, negative tests, privacy review and rollback. | Independent reviewer |
| `owner-signoff` | Real owner scope and authorization | **Separately** verify owner identity and explicit authorization for precise pilot scope, costs, lines and release. No collection on this site. | Verified business owner |

All 12 items remain `HELD_UNVERIFIED` even if an operator marks every explanation as read. There is **no approval or consent button**, no backend write, no signed artifact, no live-pilot gate-opening flag and no automatic escalation.

## Least-privilege role *illustration* (never production enforcement)

| Role shown in QL-181 selector | Synthetic samples | Same-brand mock review | Read held matrix | Real customer/telephony/pilot rights |
| --- | --- | --- | --- | --- |
| Signed out / unidentified | No | No | No projected role capability; public warning may remain visible | **Denied** |
| `staff_readonly` | Illustrative read | No | Illustrative read | **Denied** |
| `admin` | Illustrative read | Illustrative read | Illustrative read | **Denied** |
| `owner` | Illustrative read | Illustrative read | Illustrative read | **Denied** |

The dropdown never authenticates a person or changes `app_admins`, real RLS, or permissions. Even a server-verified `owner` role would not itself constitute out-of-band owner authorization for a live pilot. The active brand is an interface context only, not proof of database access rights.

## Canadian privacy/communication references for later reviewer

- Office of the Privacy Commissioner of Canada: [PIPEDA limiting collection](https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/p_principle/principles/p_collection/), [limiting use/disclosure/retention](https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/p_principle/principles/p_use/), and [organizational safeguards self-assessment](https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/pipeda-compliance-help/pipeda-compliance-and-training-tools/securing-personal-information-a-self-assessment-tool-for-organizations/).
- CRTC: [CASL official FAQ](https://crtc.gc.ca/eng/com500/faq500.htm). Commercial electronic messages, including qualifying SMS, can require consent, identification and a working unsubscribe mechanism. Applicability must be reviewed for each intended purpose; the preview makes no legal determination.
- Supabase: [RLS guide](https://supabase.com/docs/guides/database/postgres/row-level-security) and [Securing your API](https://supabase.com/docs/guides/api/securing-your-api). Never interpret frontend role selection or a publishable key as row-level authorization.
- OWASP: [API Security Top 10 — Broken Object Level Authorization](https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/). Independently test brand/record ownership server-side before any customer-data use.

## Acceptance / next step

QL-181 release verifies a **working deny-by-default inventory**, not a live-ready service. Tests must cover every role including illustrative owner, 100% read-mark completion, cross-brand denial, malformed role/IDs, source drift, no state persistence and zero live-provider capabilities. QL-182 will run the final **synthetic** end-to-end acceptance and queue closure. Any real deployment requires new explicit owner authorization and separately reviewed implementation after all holds are independently resolved.
