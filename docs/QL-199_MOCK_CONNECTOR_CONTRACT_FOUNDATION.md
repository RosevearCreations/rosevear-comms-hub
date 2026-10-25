# QL-199 — Four-Company Connector Contract Foundation

## Delivered

QL-199 establishes **mock-only contracts**, tenant isolation requirements, operation allowlists and fictional mapping rehearsals for the first cross-company connector wave. The operator Console now offers **Connector centre** with contextual ⓘ Help, explicit non-connection state, required gates and an accessible rehearsal form using only built-in example records.

| Planned build | Organization | Contract |
| --- | --- | --- |
| QL-200 | Rosie Dazzlers | Quote and booking inquiry preview |
| QL-201 | Devil n Dove | Commission and custom-order inquiry preview |
| QL-202 | iCamp | Guest and campground reservation inquiry preview |
| QL-203 | YW | Property service request and job inquiry preview |

The pure adapter `previewConnectorMapping()` accepts only one of the published immutable contract objects, a company match, an allowed mock operation and a source id present in that company's approved fictional channel fixtures. It returns a minimal normalized **fictional** summary and rejects foreign company records, unsupported operations and unknown samples. There are no URL, credential, webhook or remote-query inputs.

## Safety prerequisites

UI company selection is **not authentication**. Real connectors require a private backend, authenticated and authorized company and (where applicable) campground/company tenant, verified module/object permissions, scoped API or signed webhook credentials, replay protection, audit events, retention and privacy policies, rollback, owner-approved workflows and negative cross-tenant tests. Real customer sync, provider callbacks, outbound calls/SMS/MMS, autonomous AI sending, financial/booking operations and all QL-181 live-pilot holds stay disabled.

## Acceptance

Run `npm run check`, `npm test`, `npm run build`, `npm run pages:build` inside `app/`. QL-199 tests assert unique four-company contracts, allowlisted mock operations, hard rejections of cross-organization records, UI help/gates, mock mapping and company-switch resets. Release marker: `ql199-mock-connector-contracts-v1`. Promote to GREEN only when exact-main CI, Cloudflare, Supabase Preview and GitHub Pages checks pass, `dev`/`main` source trees match, and the published Pages bundle contains the marker.
