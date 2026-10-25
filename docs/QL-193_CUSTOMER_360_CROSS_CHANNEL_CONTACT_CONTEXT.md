# QL-193 — Customer 360 & Cross-Channel Contact Context

## Delivered — four-company synthetic preview

QL-193 adds the **Customer 360** workspace to the QL-191 console and links it directly to the QL-192 unified inbox. It is a **read-only sample interface**, not a contact management database or live CRM synchronization.

- Four company-scoped, fabricated contact directories: Rosie Dazzlers (4 sample contacts), Devil n Dove (3), iCamp (3), and YW (3).
- A total of **13 fictional customer profiles** covering **17 external conversation fixtures**. Three internal/staff-only threads remain intentionally unlinked to customers.
- Exactly one explicitly authored profile association for each external sample thread. Four contacts have two separate channel threads so operators can inspect meaningful cross-channel context.
- Search by fictional name, service context and source-thread subjects; all/needs-attention/multiple-channel filters with a clear-filter recovery.
- Selected profile shows combined channel count, reply/follow-up counts, contact context, source-linked event bodies and per-thread consent.
- Conservative consent indication across multiple channels: an opt-out wins over all other states; any unknown remains unknown unless every linked source is service-only. This is an **operator warning**, not permission to send.
- **Open Customer 360** on a synthetic inbox thread, and **View in unified inbox** from every linked profile source. Both actions navigate inside the same company and preserve only the chosen demo IDs in React memory.
- On-switch cleanup: profile selections are discarded when an organization changes; contact IDs and thread IDs are never used to access another organization's fixture records.
- Accessible `ⓘ` help, explicit synthetic warning, keyboard focus, mobile stacking, and forced-colour support.

### Deliberate identity boundaries

The human-readable fictional label is **never** an identity key. The authored `syntheticCustomerContexts` registry links stable thread IDs within one exact `OrganizationId`. The same “customer A” wording in multiple businesses is unrelated. If an external thread lacks an explicit association, the UI must show it as unlinked rather than guessing. Internal coordination threads never become customer identities.

Do **not** translate this fixture linking into production identity deduplication. A future secured implementation must prove organization/tenant membership, operator authorization, verified contact identity and match evidence, access controls, record provenance, consent per purpose/channel, retention/deletion handling and conflict resolution **before** any merge or synchronization. iCamp's campground tenants and YW's company tenants are not connected or permissioned by this UI.

### Safety and release limits

- No real names, contact addresses, phone numbers, email addresses, customer accounts, booking records, voice recordings, property/site details, stored profiles or server secrets.
- No network requests, Supabase queries/writes, external APIs, storage writes, message/call sends, contact merges, imported provider data, webhooks or identity claims.
- Original QL-192 in-memory follow-up/review flags are not imported as persisted contact facts. Customer 360 only aggregates the authored fixture fields and their original statuses.
- No changes to provider readiness, authentication, authorization, RLS, consent ledger or live pilot. All **12** QL-181/QL-190 owner prerequisites stay **HELD**; production GREEN refers **only** to the disabled demonstration.
- A public GitHub Pages preview must never expose actual private customer data. Real data needs server-side authorization + tenant isolation, Supabase RLS and protected hosting, separately accepted before activation.

### Acceptance tests

Run from `app`:

1. `npm run check`
2. `npm test` — includes `ql193Customer360.test.tsx` with registry integrity, scope, consent, filters, help, link navigation, no-network/write, and accessible styles.
3. `npm run build` and `npm run pages:build`.

Preserve QL-170/171 release/baseline and QL-188/189/190 synthetic server, operational safety and review audit checks. Verify `dev` and `main` have the same Git source tree; all five exact-main checks must pass (`app-build`, Pages build/deploy, Supabase Preview, Workers Builds). Finally verify the live public asset includes release marker `ql193-customer-360-cross-channel-v1`.

After QL-193, **3 of 20** interface/integration roadmap builds are delivered. Next proposed milestone: **QL-194 — Conversation Assignment, Ownership & Follow-Up Queue**, still synthetic and disabled until server-side authorization is approved.
