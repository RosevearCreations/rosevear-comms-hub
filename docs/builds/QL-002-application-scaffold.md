# QL-002 — Application Scaffold

## Status

Complete.

## Purpose

Create the first runnable admin shell for the shared Rosevear Comms Hub.

## Framework chosen

Vite + React + TypeScript.

## Implementation summary

- Added a local app scaffold in `app/`.
- Added a brand-aware admin shell.
- Added brand switcher for RosieDazzlers and DevilnDove.
- Added placeholder conversation inbox.
- Added conversation detail panel.
- Added static sample data and typed models.
- Added build/typecheck commands.
- Added CI workflow for app validation.
- Added API contract placeholder updates.
- Added application scaffold source-of-truth document.

## Validation commands

```bash
cd app
npm install
npm run check
npm run build
```

## Green criteria

- App can run locally.
- Admin shell loads.
- Brand switcher works.
- Placeholder inbox displays brand-specific sample conversations.
- No live phone/SMS/AI sending is connected.

## Next build

QL-003 — Database and API Foundation.
