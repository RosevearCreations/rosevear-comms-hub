# Rosevear Comms Hub — QL-270 modern operator command centre & six-app connections

**30 October 2026 Eastern · software release target dev/main GREEN · connection release DISCONNECTED / HOLD**

## Owner-facing improvements

The prior operator shell showed **47 long workspace cards in one continuous sidebar**, with descriptions on every button. QL-270 keeps all historical screens but groups them into four expandable categories:

| Category | Initial state | Purpose |
| --- | --- | --- |
| **Operations** | Open | Dashboard, inbox, Customer 360, assignments, phone, composer, calendar and reporting |
| **IT & Connections** | Open | New six-app connection manager, connector centre, six-app signed-proof evidence and original gateway testing tools |
| **Admin & Reviews** | Closed | Safety, owner trial, reviewer preparation and review audit |
| **Advanced / Historical** | Closed | Thirty-one previous pilot/exception/recovery workspaces, preserved and searchable |

The compact business selector remains scoped to Rosie Dazzlers, Devil n Dove, iCamp or Yard Workers. Search finds historical tools by label/description. The desktop sidebar scrolls independently; on mobile the menu becomes a compact stack. The dashboard now opens with network telemetry, status meters, and a direct **IT · Connections** shortcut. The preview warning shows only a concise status, with environment diagnostics behind **Technical configuration**. No authentication logic, credentials, stored permissions, or live connections changed.

The primary screen uses a navy/cyan control surface with clear headings, crisp contrast, responsive information cards, six application status cards, connection-stage indicators, and visible focus states; existing functional screens remain accessible, including earlier synthetic examples. No generated records are passed off as live data.

## What six connected applications would do

**Four operational business applications** feed independently permissioned events into the **Rosevear Comms Hub**. None is connected today:

| Source | Future owner benefit | Privacy boundary |
| --- | --- | --- |
| Rosie Dazzlers | Quote/booking inquiries, follow-ups, confirmation routing | Detailing customer scope only |
| Devil n Dove | Maker commissions, order questions and draft-status handoffs | Never turn an Etsy production draft into a TEST fixture |
| iCamp | Reservations, guest inquiries, events and maintenance handoffs | Strict per-campground tenant separation |
| Yard Workers | Contractor quotes, work orders, scheduling, client communications | Strict per-company tenant separation |

**Two supporting applications** are not fifth or sixth businesses:

- **AI Data Platform:** optional future analysis and reporting over expressly allowed, sanitized events. It must not implicitly merge four companies' customer data or treat a shared GitHub owner as authorization.
- **Rosevear AI Hub:** optional local AI and private relay/automation on the owner's Windows system. The private relay remains **not installed for this integration**. Home cameras, credentials, local vault and personal devices remain excluded from TEST.

The Comms Hub is the central communications coordinator, not a replacement for the original CRM/booking/inventory systems. These data flows are **planned contracts only**, not operational today.

## New IT → Connections workflow

1. Select any of the **six source cards**. The inspector displays its purpose, privacy boundary, original proof observation and four activation stages.
2. **Prepare a local TEST plan** with a *generic, nonsecret* `np-...` alias. The form validates its syntax and shows a session-only draft. It neither provisions a database tenant nor saves an API endpoint or credential.
3. Use **Open current public Proof-B source** to inspect the allowlisted GitHub contents URL in a separate browser tab. The app itself does not issue any browser network request; we preserve the original QL-171 zero-new-network-sink trust boundary. Record the current HTTP result independently: 404 means absent and 200 means publicly present, **not** an authenticated signature. The displayed QL-270 immutable SHA and 404 are a dated observation only.
4. Use **Open security evidence** to review the previous original A→B proof workflow, separately pinned Ed25519 public key, authenticated custodian, distinct nonce witness, independent reviewer, tenant isolation, owner TEST-only authorization and stop/rollback gates.
5. **Real connection creation and the bounded GET trial stay disabled** until the independent requirements genuinely pass. At that later stage, an authorized server-side gateway would be needed; a browser checkbox or static GitHub file does not create trusted connectivity.

No SMS, phone calls, dispatch, customer-data reads or external application gateway GETs are added in QL-270.

## Fresh original signed Proof-B recheck

At the exact October 30 `main` SHAs below, GitHub returned **HTTP 404** for `docs/integration/ql246-source-proof.json` in all six source repos. These are historical observations, not predictions about later commits.

| Source | Immutable main SHA | Result |
| --- | --- | --- |
| `ai-data-platform` | `71c94f351366d9ab2df1e3e5ba372830c6821ddd` | HTTP 404 |
| `devilndove-site` | `6cf92d245ec2c053d4edf49a53b13c7f3db8c123` | HTTP 404 |
| `rosiedazzlers` | `769aa2da601a4964e8d88ffc65271b16d19f6c73` | HTTP 404 |
| `yw` | `e358b4b94b6000103411b3f26c74701b19687262` | HTTP 404 |
| `iCamp` | `6dcb14f1b9e2541b900727110eccab92ab49e3a2` | HTTP 404 |
| `rosevear-ai-hub` | `9d0536a54fbe3024851efa1f600d4a302d0c0d01` | HTTP 404 |

Real independent signer-pin approval, private human witness and reviewer, isolated nonproduction tenants and owner TEST-only authorization have **not** been provided. The only safe gateway decision is **DISCONNECTED / HOLD**. Authenticated gateway GETs: **0**. Live-pilot holds: **12**. No fabricated proof or TEST signature has been substituted.

## Testing and deployment acceptance

QL-270 adds focused React/UI and public-source tests. Existing QL-191 navigation behavior, task/inbox workspaces, company boundaries and earlier safety tests must stay passing. `npm --prefix app run test` and `npm --prefix app run build` are required before merging. The exact `main` SHA must pass GitHub app CI and disabled-preview deployment checks; this is a software release result only, not independent authorization of any integration.

**Next planned: QL-271 — Connection Profile UX Persistence Strategy, Role-Safe IT Administration & Independent Signed-Proof Return Recovery (HELD).**
