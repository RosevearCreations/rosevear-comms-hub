# QL-059 — Phone/SMS Controlled Live Enablement Live-Pilot Explicit Go/No-Go Decision Gate

Status: implemented on branch `ql-059-phone-sms-controlled-live-enablement-live-pilot-explicit-go-no-go-decision-gate`.

## Added

- Explicit go/no-go gate helper: `api/deployment/phoneSmsControlledLiveEnablementLivePilotExplicitGoNoGoDecisionGate.ts`
- Contract fixture: `api/contracts/phone-sms-controlled-live-enablement-live-pilot-explicit-go-no-go-decision-gate.example.json`
- Website help overlay: `app/src/help/SiteHelpSystem.tsx`
- Website help styles: `app/src/help/site-help.css`
- App mount update: `app/src/main.tsx`
- Source-of-truth doc: `docs/72_PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_LIVE_PILOT_EXPLICIT_GO_NO_GO_DECISION_GATE.md`
- Help-system doc: `docs/help/WEBSITE_SECTION_HELP_SYSTEM.md`
- Ops, telephony, and remote-operator checklists
- Build sequence update queuing QL-060

## Decision outcome

QL-059 can approve only `approve_controlled_live_pilot_activation_planning`.

That approval is limited to QL-060 planning. It does not enable runtime behavior.

## Help system outcome

The app now includes:

- floating Help control
- circled “i” help icons attached to major app sections
- help topics for all existing sections
- a manual intervention guide covering variables, services, application links, and evidence restrictions

## Safety retained

QL-059 does not:

- grant live enablement
- start a live pilot
- execute runtime verification
- connect a provider account
- attach a provider live number
- enable provider delivery
- configure provider webhooks
- enable callbacks
- send SMS
- record calls
- enable AI auto-send
- write persistence
- read or write live customer data
- write archive records
- write retention policy
- add Supabase migrations

## Next queued build

QL-060 — Phone/SMS Controlled Live Enablement Live-Pilot Controlled Activation Planning.
