# QL-027 — Phone/SMS Disabled Dry-Run Connection Plan

Status: complete when merged to `dev`, promoted to `main`, and `main` CI is GREEN.

## Scope

QL-027 adds a provider-neutral disabled/dry-run connection plan for the manually purchased disposable test number.

The build prepares a safe plan for synthetic inbound voice/SMS fixture verification without live provider callbacks or customer-data writes.

## Files

- `api/deployment/phoneSmsDisabledDryRunConnectionPlan.ts`
- `api/contracts/phone-sms-disabled-dry-run-connection-plan.example.json`
- `docs/39_PHONE_SMS_DISABLED_DRY_RUN_CONNECTION_PLAN.md`
- `docs/builds/QL-027-phone-sms-disabled-dry-run-connection-plan.md`
- `ops/telephony/phone-sms-disabled-dry-run-connection-plan.md`
- `telephony/disabled-dry-run-connection-plan.md`
- `scripts/remote-operator-phone-sms-disabled-dry-run-connection-plan.md`

## Safety locks

```text
PHONE_SMS_PROVIDER_WEBHOOK_CONFIGURED=false
PHONE_SMS_PERSISTENCE_WRITES_DISABLED=true
PHONE_SMS_LIVE_CUSTOMER_READS_DISABLED=true
PHONE_SMS_LIVE_CUSTOMER_WRITES_DISABLED=true
ENABLE_PHONE_WEBHOOKS=false
ENABLE_SMS=false
ENABLE_CALL_RECORDING=false
ENABLE_AI_DRAFTS=false
ENABLE_AI_AUTO_SEND=false
```

## Not included

- No actual phone number.
- No provider credentials or SIP credentials.
- No webhook secret values.
- No invoices, screenshots, receipts, or ownership documents.
- No customer data.
- No live phone/SMS payloads.
- No provider webhook configuration.
- No Supabase migration.
- No live provider connection.

## GREEN proof

- PR CI passes `npm install`, `npm run check`, and `npm run build`.
- `main` CI passes the same checks after promotion.
