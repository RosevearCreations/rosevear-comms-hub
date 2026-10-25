# QL-196 — SMS/MMS Composer & Consent Controls

## Delivered

- Ninth four-company operator workspace, **SMS/MMS composer**, for Rosie Dazzlers, Devil n Dove, iCamp and YW.
- Company-isolated SMS and MMS conversation selectors based exclusively on QL-192 fictional fixture IDs. From a selected SMS/MMS inbox conversation, an explicit shortcut opens its composer context.
- Two business-appropriate draft templates per company, editable in memory with a 500-character limit. A preview button displays a **NOT SENT** message; no draft or action survives a workspace remount or page reload.
- MMS attachment selector presents only fictional photo/document descriptions. No real file picker, uploaded bytes, media URL or attachment processing.
- Purpose toggle distinguishes demonstration service responses from promotional messages. The policy computes conservative consent across explicitly linked QL-193 contact threads: an opt-out on an associated channel is treated as an opt-out for the composer too; marketing never proceeds without separately verified express consent. Unknown and service-only statuses likewise grant **no** send permission.
- All send, schedule and real-upload buttons are disabled regardless of purpose, fixture consent or preview state. No opt-in creation or live identity matching is possible.
- Responsive, keyboard accessible controls, source navigation and contextual `ⓘ Help`.

## Explicit boundaries

All recipients, content templates, attachment representations and consent entries are fictional. The editable draft must not be used for real personal information. No SMS/MMS sends, carrier calls, provider webhooks, customer contact, Supabase mutations, retained browser data, storage or real consent ledger exists. The twelve QL-181/QL-190 live pilot prerequisites remain held. A real implementation needs server-side identity and tenant authorization, independently established consent and STOP/START/HELP processing, an approved provider, file malware/privacy controls, retention and review policies, and an owner-controlled enablement gate.

## Acceptance

Run `npm run check`, `npm test`, `npm run build`, `npm run pages:build` from `app/`, plus existing QL-170/171/188/189/190 safety audits in CI. `ql196MessageComposer.test.tsx` exercises company scope, cross-channel opt-out precedence, marketing restrictions, character limit, preview, fictional attachments, cross-workspace navigation, and isolation/reset. Confirm five successful exact-`main` production checks, identical promoted `dev`/`main` trees and the published `ql196-sms-mms-composer-v1` marker before claiming GREEN.
