# QL-074 — Public Disabled Preview Visual Review

## Purpose

QL-074 verifies the public GitHub Pages disabled preview as a visual review target for the Quo-lite operator interface direction.

The target public URL remains:

```text
https://rosevearcreations.github.io/rosevear-comms-hub/
```

## Review boundary

This build reviews the public preview direction only. It does not enable live Phone/SMS, provider callbacks, persistence, archive, retention, AI sending, or live pilot runtime.

## Visual review checklist

- Confirm the public URL loads when the GitHub Pages deployment gate is open.
- Confirm the preview clearly presents the Quo-lite direction.
- Confirm the brand switcher, operator queue, customer timeline, disabled controls, status cards, and public review warning are visible.
- Confirm the interface clearly says it is static, disabled, and not a live Phone/SMS pilot.
- Confirm the public preview uses the `/rosevear-comms-hub/` base path.
- Confirm the GitHub Pages workflow either deploys static assets or skips safely behind the variable gate.

## Browser safety boundary

Allowed public browser variables remain limited to:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

The browser must not receive service-role keys, provider credentials, callback tokens, live phone numbers, live message bodies, transcripts, recordings, or live customer data.

## Runtime locks

The following remain disabled:

- Provider callbacks
- Live phone webhooks
- SMS sending
- Call runtime
- Recording
- AI auto-send
- Persistence writes
- Archive writes
- Retention writes
- Live pilot runtime

## Result rule

If the GitHub Pages workflow deploys and the public URL loads, QL-074 can support a true visual review.

If the workflow skips, QL-074 remains production-safe, but the public visual review must be repeated after the enablement variable is corrected.
