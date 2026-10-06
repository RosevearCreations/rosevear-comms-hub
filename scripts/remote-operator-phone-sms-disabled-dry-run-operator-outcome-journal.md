# Remote Operator Checklist — QL-031 Operator Outcome Journal

## Build

QL-031 — Phone/SMS Disabled Dry-Run Operator Outcome Journal.

## Promotion checklist

1. Confirm branch starts from current production `main`.
2. Confirm QL-031 adds only synthetic, redacted, non-persistent journal previews.
3. Confirm no provider setup, provider callback, SMS sending, recording, AI draft, AI auto-send, Supabase migration, or live customer access is added.
4. Confirm PR CI passes:
   - `npm install`
   - `npm run check`
   - `npm run build`
5. Merge the exact PR head to `dev` only after CI is green.
6. Promote the exact `dev` tree to `main` through a promotion PR.
7. Confirm promotion PR CI is green when available.
8. Merge to `main`.
9. Confirm `main` push CI is green.

## Required safety proof

The production proof must show:

```text
safeToPersist=false
futureEnablementPlanningAllowed=true only for approved planning outcomes
liveEnablementAllowed=false
providerCallbackAllowed=false
persistenceWrites=false
liveCustomerRead=false
liveCustomerWrite=false
livePhoneWebhook=false
smsSending=false
callRecording=false
aiDrafts=false
aiAutoSend=false
```

## Do not promote if

- A real phone number appears.
- A real operator identity appears.
- Any credential or secret appears.
- Any customer data appears.
- Any live provider payload appears.
- Any persistent audit row is created.
- Any provider callback or live phone/SMS feature is enabled.
