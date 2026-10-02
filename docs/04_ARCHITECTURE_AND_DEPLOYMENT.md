# 04 — Architecture and Deployment

## Architecture principle

Build the hub as a separate app/repo that integrates with RosieDazzlers and DevilnDove rather than burying communication logic inside either business website.

## High-level architecture

```text
RosieDazzlers website/app ─┐
                           ├─ Rosevear Comms Hub API ─ Database
DevilnDove website/app ────┘                 │
                                             ├─ AI draft/summarize layer later
                                             └─ Phone/SMS provider layer later
```

## Application layers

### Admin UI

Used to view contacts, conversations, calls, messages, tasks, intakes, summaries, and drafts.

### API layer

Receives data from:

- RosieDazzlers quote forms
- DevilnDove custom order forms
- future phone/SMS webhooks
- future email/chat integrations

### Data layer

Stores normalized customer communication records.

### Integration layer

Handles brand-specific routing and external provider events.

### AI layer later

Creates summaries, tags, missing-info checklists, and draft replies.

## Hosting constraints

Known constraint: existing free Cloudflare and Vercel projects are already in use.

QL-001 does not decide final hosting.

Future hosting options:

### Option 1 — Existing app integration

Place only API endpoints in an existing hosted app if usage/resources allow.

### Option 2 — Separate static/admin app

Deploy a separate admin UI to a free or low-cost provider when needed.

### Option 3 — Supabase-backed app

Use Supabase for database/auth and host the UI elsewhere.

### Option 4 — VPS/hybrid

Use a small VPS for telephony webhooks or PBX needs while keeping the UI static/serverless.

## Deployment decision gates

Do not choose deployment until we answer:

- Does phone integration require persistent WebSocket/long-running process?
- Are we using Asterisk/FreePBX, direct API provider, or 3CX?
- Does the app need real-time inbox updates?
- What free-tier limits are acceptable?
- Do we need user login/auth from day one?

## Initial folder layout

```text
app/                    Admin UI/application source later
api/                    API routes/contracts later
brand-configs/           JSON brand configs
database/                SQL schema/migrations/seeds
docs/                    Source-of-truth documentation
integrations/            Brand/provider connector notes
telephony/               Provider-neutral phone/SMS notes
scripts/                 Local helper scripts later
```

## Integration pattern

Business websites should send clean intake payloads to the hub.

Example payload fields:

```json
{
  "brand": "rosiedazzlers",
  "source": "website_quote_form",
  "customer": {
    "name": "Customer Name",
    "phone": "555-555-5555",
    "email": "customer@example.com",
    "town": "Tillsonburg"
  },
  "intake": {
    "type": "detailing_quote",
    "vehicle_type": "SUV",
    "service_requested": "Interior Detail",
    "flags": ["pet_hair", "needs_photos"]
  }
}
```

## Security architecture assumptions

- Admin-only access at first.
- Brand separation by `brand` field.
- Audit records for status changes and message approvals.
- No public write endpoint without authentication, rate limiting, and spam protection.
- No AI processing of call recordings until privacy rules are active.
