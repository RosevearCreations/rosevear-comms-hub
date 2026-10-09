# Website Section Help System

QL-059 adds a reusable help layer for the admin website. The goal is to make each major section self-explaining without enabling any live provider, phone, SMS, persistence, or customer-data behavior.

## User-visible behavior

- A floating **Help** control is available on every screen.
- Major sections receive a circled **i** help button.
- Selecting a circled **i** opens the matching help topic.
- The help panel includes a topic selector so staff can move directly to any help article.

## Covered sections

- Hub overview
- Brand switcher
- Navigation
- Dashboard stats
- Inbox controls
- Conversation detail
- Contacts
- Tasks
- Intakes
- Data tools
- Manual lead
- Live-pilot decision safety
- Manual intervention guide

## Safety boundaries

The help system is UI-only. It does not:

- call phone/SMS providers
- configure callbacks
- send SMS
- start a live pilot
- read live customer systems
- write Supabase
- write archives
- change retention policy
- store secrets

## Manual intervention help topic

The manual intervention topic reminds operators that future live work must be verified in external service dashboards and documented using redacted evidence only. It covers:

1. variables and secrets
2. services to verify
3. application links to collect
4. evidence restrictions
5. runtime safety locks

## Maintenance rule

When a new section is added to the app, add a help topic and attach a selector in `app/src/help/SiteHelpSystem.tsx` before promoting the build.
