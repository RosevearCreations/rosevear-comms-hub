# QL-237 — Free Communications Options & Cross-Application Integration v1

Release date: 2026-10-27.

## Delivered

- Adds **Free phone options & integration v1** to the four-company operator sidebar.
- Research-backed distinction between ongoing no-new-cost intake (Cloudflare email/form and manually using existing plans), free software (Asterisk/FreePBX; Linphone individual SIP), and a time-limited developer trial (Twilio). Links lead to provider documentation; no invented quotes or claim of truly free Canadian public voice/SMS.
- Displays a six-spoke AI Data Platform-centered gateway plan, business-owned entity boundaries and a copyable implementation brief based on the owner's attached `Rosevear_API_V1.rtf`.
- Defines a minimal, fictional `rosevear.integration.v1` event envelope and client-side preflight; tests allowed event mapping, scoped tenant, wrong-business, direct-route, unknown command, stale timestamp and idempotent replay denial.
- Shares [application handoff contract](ROSEVEAR_INTEGRATION_CONTRACT_V1_HANDOFF.md) for independent development of AI Data Platform, Devil n Dove, Rosie Dazzlers, Yard Workers, iCamp, Comms Hub and Rosevear AI Hub.

## Non-negotiable limitations

- No actual provider or API account connection, secret entry, server gateway, callback, real signature validation, DB write, customer message, live call, SMS, number purchase or port.
- Preview fixtures and receipts are session-only and fictional. A positive local preflight is `HELD_UNVERIFIED` by design, not an authorization or proof of secure server delivery.
- All 12 actual QL-181 pilot-release prerequisites stay `HELD_UNVERIFIED`. QL-237 does not supersede QL-236 independent receipt tracking.

## Verifiable provider and platform sources (checked 2026-10-27)

1. Cloudflare email receiving/routing service: https://developers.cloudflare.com/email-service/ ; free Workers plan request limit: https://developers.cloudflare.com/workers/platform/limits/ . Domain and other mail costs can still apply.
2. Asterisk free/open-source communications server: https://www.asterisk.org/get-started/ . PSTN number, SIP trunk and SMS transport are separate.
3. Twilio trial limitations (30 days, verified recipients): https://www.twilio.com/docs/usage/trials ; Canada voice charges: https://www.twilio.com/en-us/voice/pricing/ca ; Canada SMS/number/carrier charges: https://www.twilio.com/en-us/sms/pricing/ca . Rates are USD where indicated on provider site and subject to change.
4. Linphone free personal SIP, with individual-use restriction: https://www.linphone.org/en/getting-started/ ; no carrier SMS: https://www.linphone.org/en/faq/ .
5. Existing Bell home-number forwarding manual: https://support.bell.ca/home_phone/calling_features/how_to_use_call_forwarding_on_my_bell_home_phone . Actual plan and forwarding fees must be checked.

## Release checks

- TypeScript, full tests, Pages build and static no-external-mutation audit.
- Regression: four business event scopes; current fixture must remain held; wrong business/tenant/route/action rejected; replay denied; no live operations.
- CI for `dev` and `main`, exact-main production status; only call production GREEN after checks succeed.

**Next queued build after QL-237:** QL-238 — Integration Contract v1 Health/Capabilities Handshake Readiness, Four-Company Tenant Isolation & Owner-Safe No-Dispatch Evidence Gate.
