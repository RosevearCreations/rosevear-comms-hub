# QL-191 — Operator Console V2, Navigation Architecture & Functional Dashboard

## Scope and outcome

QL-191 introduces the first four-organization operator interface in the **disabled public preview**. It does not start a private or production communications runtime.

The previous shell supported Rosie Dazzlers and Devil n Dove through `BrandId` and opened the browser-local inbox by default. The updated shell opens a responsive dashboard and provides an organization registry for:

| Organization | UI scope | Integration state |
|---|---|---|
| Rosie Dazzlers | Detailing quotes, bookings and follow-ups | Existing browser-local two-brand demo retained; no live integration |
| Devil n Dove | Custom orders, commissions and product questions | Existing browser-local two-brand demo retained; no live integration |
| iCamp | Campsite/guest services and maintenance | New read-only synthetic demo; no linked campground tenants or production API |
| YW · Property Maintenance | Property enquiries, dispatch and service contracts | New read-only synthetic demo; no linked companies, clients or production API |

Each organization is a **UI context**, not a server-verified authorization grant. The `legacyBrandId` field is deliberately `null` for iCamp and YW, so their contexts cannot be passed to the older two-brand components. When backend accounts are eventually authorized, the system must validate organization and tenant identity independently on the server and via database row-level security; client-side filtering is not sufficient.

## Implemented

1. `app/src/operator/ql191Organizations.ts` — explicit four-organization registry with service/module hints, future tenant scope and safe legacy-brand mapping.
2. `app/src/operator/ql191DashboardData.ts` — sixteen unique, fabricated queue fixtures organized by company; **zero real identities, phone numbers, customer records, provider payloads or credentials**.
3. `app/src/operator/Ql191OperatorDashboard.tsx` — default dashboard with four synthetic metric cards, filtered queue, selectable detail, functional navigation shortcuts, readable module summaries, a circled `ⓘ` help control and explicit connection/hold status.
4. `app/src/operator/Ql191AdditionalOrganizationPreview.tsx` — isolated iCamp/YW inbox/workflow examples and clear telephony/evidence limitations; no attempt to bind old Rosie/Devil fixtures to them.
5. `app/src/operator/OperatorShell.tsx` and companion CSS — accessible organization switcher, five navigable workspaces, focus on workspace heading following navigation, colour accents, mobile layout, forced-colour affordances, visible disabled status and preserved two-brand historical previews.
6. Unit/component tests cover four-company selection, filter behaviour, keyboard focus, navigation, organization-scoped previews, original two-brand flow, no dashboard network/storage writes and held live-pilot boundaries.

## Acceptance checklist

- [x] First load shows a useful dashboard, not a safety-only or blank landing screen.
- [x] All four organizations selectable; each shows only its own fabricated queue examples.
- [x] Five navigation destinations available; usable shortcuts, filters and detail selection work without reload.
- [x] Rosie Dazzlers and Devil n Dove existing local inbox, synthetic journey, telephony and safety review remain reachable.
- [x] iCamp/YW are never sent into two-brand `BrandId` helpers; their sandbox previews remain isolated and unconnected.
- [x] No implicit cross-organization authorization, provider configuration, live customer access or approval.
- [x] Keyboard focus, responsive layout, strong contrast, `aria` states and in-context help verified.

## Tests and release

From `app`: `npm run check`, `npm test`, `npm run build`, `npm run pages:build`. At the repo root, retain QL-170, QL-171, QL-188, QL-189 and QL-190 audits. CI's `npm test` includes `ql191OperatorConsole.test.tsx` and the QL-172 navigation regression suite.

Production GREEN requires merged `dev` and `main` with matching source trees, all five checks on the **exact resulting main commit** (`app-build`, `Build disabled preview`, `Deploy disabled preview`, `Supabase Preview`, `Workers Builds: rosevear-comms-hub`) and a published GitHub Pages JS bundle containing the QL-191 four-organization console marker.

## Still held / subsequent work

- **QL-192** will expand the unified inbox rather than mistake synthetic items for real customer conversations.
- **QL-199–203** will provide approved connector contracts and four business-specific integrations, initially with mock inputs.
- iCamp will require explicit campground tenant boundaries; YW will require company/module permission checks.
- Protected authentication, server-side connector credentials, signed webhooks, private data and Supabase RLS require separate approved work and negative tests. Public GitHub Pages is **not** a confidential operator runtime.
- The existing QL-190 independent pre-pilot review and **all twelve QL-181 real-pilot holds** remain unresolved. This build does not sign them off or turn on calls, SMS/MMS, recording, data writes, provider webhooks or autonomous AI sending.
