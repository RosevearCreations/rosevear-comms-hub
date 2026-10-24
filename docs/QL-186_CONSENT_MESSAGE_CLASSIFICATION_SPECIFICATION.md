# QL-186 — Consent & Message Classification Specification

**Release gate:** synthetic-only policy candidate for the disabled GitHub Pages preview. QL-186 does **not** decide whether any real message is legally permitted, obtain real consent, record a real opt-out, send/receive a real provider event, create a Supabase table, change roles/RLS, clear QL-181 holds or authorize a live pilot. **All 12 live-pilot prerequisites remain `HELD_UNVERIFIED`.** The precise GitHub `main` commit and production Pages asset are independently verified upon promotion.

## Where operators review this build

Go to **Operator workspace → Safety & hold review → QL-186 Consent & message classification specification**. Select a business (Rosie Dazzlers or Devil n Dove), a fictional message purpose, SMS/email/voice, missing or *illustrative unverified* consent claim, previous synthetic suppression and an example inbound `STOP`, `START`, `HELP` or no keyword.

The result is always `REVIEW_ONLY_NO_SEND` for recognized same-brand scenarios, `CROSS_BRAND_REJECTED` for foreign business, or `INVALID_PREVIEW_REQUEST` for malformed/tampered input. All results report `dispatchAllowed=false`, `evidenceVerified=false`, `consentGranted=false`, `livePilotAuthorized=false`, and zero real records read, calls/messages sent, evidence/suppression writes or owner approvals. Business switching remounts the preview to defaults and never imports another brand's consent/suppression state.

The UI does not accept free-text recipient information. Every message body is a checked-in fictional literal, not an actual outbound draft. It cannot address, contact, record or change an individual.

## Message purpose decision table — not a legal determination

| Fixture | Review candidate | Distinction requiring review |
| --- | --- | --- |
| Requested service appointment update | Service-only candidate | Must verify real request, content, lawful basis and any applicable exceptions; transactional labeling is **not** a general CASL exemption. |
| Reply to a customer-requested quote | Service-only candidate | Proof of the request and exact content are needed; an extra promotion can change classification. |
| Seasonal discount offer | Commercial candidate | Review CEM definition, commercial purpose, consent, identification and unsubscribe. |
| Review/feedback invitation promoting future services | Commercial candidate | A commercial solicitation can be included; inspect wording, intended use and legal scope. |
| Booking notice bundled with upsell | Commercial candidate | Mixing an upsell with service facts cannot automatically use a service-only basis. Separate purposes where possible. |
| STOP/HELP request receipt | Control-only candidate | No automatic provider response; define approved acknowledgment and suppression workflow separately. |

**Channel distinction:** SMS and email can be commercial electronic messages under CASL depending on content and context; there are exceptions and requirements that must be evaluated by a qualified reviewer. Voice calling has a **separate** telemarketing/consent and provider review; do not misapply electronic-message exemption logic to a voice call. The demonstration does not decide any of these legal questions.

## Future private consent and withdrawal evidence model

Only after external authorization, the backend should be designed to record:

1. **Exact tenant and subject:** `brand_id`, opaque `subject_reference`, verified channel/recipient scope, never just frontend selected brand.
2. **Defined purpose:** prospective commercial/operational intent, message policy version, channel, affected campaign/service and applicable rules.
3. **Basis and provenance:** express, implied, requested-service or other *reviewed* basis; collection source/method, timestamp, actor and verifiable original wording/notice version. A contact flag or an inbound message is not enough evidence.
4. **Consent review and expiry:** reviewer, review decision, relevant conditions, expiry trigger/renewal logic, exceptions, documentation of how claims were assessed.
5. **Durable withdrawal/suppression:** event ID, prior state, `STOP`/other source, receipt time, brand/channel/purpose scope, integrity, idempotent handling and suppression precedence. `START` must never unilaterally reinstate marketing consent. `HELP` must not unsuppress or itself be interpreted as a promotional send request.
6. **Per-send decision and audit:** future server checks authenticating provider/operator, active consent basis where required, suppression, verified brand, identified sender/unsubscribe content where required, rate limit and separate owner pilot boundary. Disallowed requests produce no provider dispatch. Retain protected audit evidence and reconcile provider delivery receipts without treating provider success as proof of lawful consent.

All real ledger fields require access classification, retention and deletion policy from QL-185. Proposed Supabase storage would need isolated private tables, least-privilege grants, per-record/per-brand RLS, server authority and negative tests. Public QL-087/090 synthetic read-only views and browser QL-004 `localStorage` must **not** hold or authorize real proof. No migration or database query is executed by QL-186.

## Fail-closed keyword design

| Input or condition | Synthetic interpretation | Future approved handler obligation |
| --- | --- | --- |
| `STOP` | `suppressionModeled=true`, zero writes and zero sends | Authenticate provider/source, deduplicate replay, create durable suppression, apply policy across matching brand/channel/purpose, review timing and acknowledgment requirements. |
| Existing synthetic suppression | Remains modeled regardless of other selectors | Suppression takes precedence over any stale or disputed positive claim; prohibit dispatch before server checks. |
| `START` after `STOP` | Previous suppression remains; `consentGranted=false` | Never use keyword alone as fresh verified marketing grant; separately examine opt-in requirements and proof. |
| `HELP` | A review-only information request; zero automatic replies | Determine approved response, identity/brand/provider constraints, fraud/rate controls and applicable obligations. |
| Unverified positive claim | Still no grant | Independently inspect purpose, collection, consent wording, evidence provenance, expiry and reviewer decision. |
| Cross-brand or malformed event | Deny and hide fixture content | Check server-side brand scope, signature and object ownership, quarantine invalid events. |

## Source-traceability and release acceptance

- `app/src/operator/ql175ContactContextConsent.ts` still offers only `unknown` and local `opted_out` and no verified grant. The QL-186 model intentionally does **not** modify it.
- `app/src/operator/ql179MockPhoneSms.ts` is a provider-neutral synthetic simulator, not signature validation or actual SMS/voice transport.
- `app/src/operator/ql181PrivacyPilotGate.ts` continues to hold all 12 prerequisites, including `consent-proof`, `identity-mfa`, `brand-rls`, `provider-auth`, `owner-signoff`.
- `docs/QL-185_PRIVATE_DATA_MINIMIZATION_RETENTION_BLUEPRINT.md` governs the proposed future data minimization and lifecycle, still unapproved.
- Official guidance reviewed October 24, 2026: [CRTC CASL FAQ](https://crtc.gc.ca/eng/com500/faq500.htm), [CRTC guidance on obtaining consent and CEM requirements](https://crtc.gc.ca/eng/com500/guide.htm), [OPC guidelines for meaningful consent](https://www.priv.gc.ca/en/privacy-topics/privacy-for-businesses/appropriate-handling-of-personal-information/collecting-personal-information-and-consent/consent/gl_omc_201805/), [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) and [Supabase securing data](https://supabase.com/docs/guides/database/secure-data). Confirm applicability, exceptions, suppression deadlines and proof requirements with a qualified Canadian privacy/communications reviewer before any real use.

Run `npm run check`, `npm test`, `npm run build`, `npm run pages:build` inside `app`, QL-171 baseline plus baseline tests and QL-170 receipt tests. The QL-186 test file runs a combinatorial matrix across both brands, six scenarios, three channels, illustrative/missing claims, suppression state and keywords; it checks STOP precedence, START no regrant, cross-brand denial, malformed inputs, no network/storage writes, operator integration and accessible controls. Promote feature→`dev`→`main` with reviewed PRs, verify matching branch trees and five **exact-main** checks (`app-build`, `Build disabled preview`, `Deploy disabled preview`, `Supabase Preview`, `Workers Builds: rosevear-comms-hub`), and verify the published Pages JavaScript includes `ql186-consent-message-classification-specification-v1`.

After QL-186 GREEN, **four proposals remain**: QL-187 Provider Decision & Cost Model, QL-188 Server Auth/Webhook/Replay Test Harness, QL-189 Operations Safety Controls and QL-190 Independent Pre-Pilot Review Packet. Closing numbered builds does not close the twelve real live-pilot holds.
