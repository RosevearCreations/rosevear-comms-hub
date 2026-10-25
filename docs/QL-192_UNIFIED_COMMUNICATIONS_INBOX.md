# QL-192 — Unified Communications Inbox

## Delivered

QL-192 adds a **single, consistent synthetic inbox** to the QL-191 four-organization operator shell. It supersedes the QL-191 iCamp/YW stand-in inbox and the default presentation of the old QL-004 two-brand local prototype, without deleting the historical local tools.

The demonstration now exposes the same navigation, filter, channel and conversation-detail workflow for:

| Organization | Synthetic scenarios (examples) |
|---|---|
| Rosie Dazzlers | Detailing SMS, missed calls, coating quotes, image placeholder, fleet email |
| Devil n Dove | Custom orders, simulated voicemail, maker form, reference image, internal task |
| iCamp | Campsite guest SMS, arrival calls, event visitors, seasonal email, maintenance task |
| YW · Property Maintenance | Snow-plow SMS, septic voicemail, garbage sticker estimate, lawn contract, fibre trenching task |

**Each organization has five uniquely identified, fabricated threads**, a few synthetic events, and no real phone number, address, email, customer or campground/property tenant ID. This is not a migration or live data sync.

## Operator experience

1. A visible, disabled-only banner and selected organization heading. Metrics count only the organization's fictional threads.
2. Full-text search across sample subject, channel, summary, context and event text; channel dropdown for SMS/MMS/calls/voicemail/website/email/internal; actionable All/Unread/Needs reply/Follow-up filters; clear-filter empty state.
3. Keyboard-operable selectable conversation list with status, priority, unread and follow-up indicators.
4. Read-only conversation detail, service context, consent state and ordered timeline of inbound, call and internal sample events.
5. Optional **mark reviewed** and **follow-up flag** operate in React memory only and reset on unmount/company switch; they are not customer changes, assignments, consent events or audit records.
6. Disabled textarea and Send button; consent unknown/service-only/opted-out visible; a contextual `ⓘ` help control; mobile and forced-colour styles.
7. Older QL-004 browser-local inbox for Rosie/Devil remains available through an explicit **Open historical QL-004 local demo tools** control. It is never mounted for iCamp/YW, and no local contact records are imported into this new inbox.

## Safety, privacy and integration boundaries

- The four-company switcher is UI context only, not a verified authentication or tenancy boundary. Its synthetic filtering does **not** grant permission to read any real business/tenant records.
- The QL-181 / QL-190 twelve live-pilot prerequisites remain **all HELD**. QL-192 does not enable real messaging, SMS/MMS sending, phone events, recording, voice, webhooks, AI auto-send, provider credential storage, customer writes or private backend reads.
- Real connector implementations require separately approved server authorization, company and tenant memberships, Supabase RLS, consent enforcement, signed provider webhooks, retention/security review and protected deployment. The GitHub Pages demonstration cannot contain real private customer content or secrets.
- Existing QL-186 consent classification, QL-188 replay harness and QL-189 operations safety continue to apply. Example consent states are not actual legal proof.

## Acceptance and release gate

- [x] Four companies show only their own five fabricated inbox threads.
- [x] Search, channels, filters, empty-state recovery, thread detail, help, temporary review and follow-up indicators work.
- [x] Explicit opt-out/unknown-consent alerts and disabled composer are present.
- [x] Company switches reset temporary state and cannot reveal other companies' sample records.
- [x] Original QL-004 local tools remain opt-in for Rosie/Devil only.
- [x] No storage write or network request is made by QL-192's synthetic controls.
- [x] Keyboard/focus, mobile and forced-colour styling verified.

Run `npm run check`, `npm test`, `npm run build`, `npm run pages:build` from `app`; continue QL-170, QL-171, QL-188, QL-189 and QL-190 script regressions. CI automatically runs Vitest, including `app/src/operator/__tests__/ql192UnifiedInbox.test.tsx`.

For **Production GREEN**, verify feature and `dev` promotion, exact `dev`/`main` Git-tree parity, five completed/successful checks on the exact `main` commit (`app-build`, `Build disabled preview`, `Deploy disabled preview`, `Supabase Preview`, `Workers Builds: rosevear-comms-hub`), and a new public disabled-preview asset containing `ql192-unified-four-company-inbox-v1`.

After QL-192, **2 of 20** interface/integration roadmap builds are delivered. Next: **QL-193 — Customer 360 & Contact Management** (synthetic-only until separate secure authorization).
