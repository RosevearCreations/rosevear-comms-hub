# Telephony Boundary — QL-072 GitHub Pages Disabled Preview Deployment Enablement Gate

QL-072 adds a gated static GitHub Pages preview workflow. It does not change telephony runtime behavior.

## Still disabled

- Provider account connection
- Provider live-number attachment
- Callback registration
- Provider callbacks
- Phone webhooks
- SMS sending
- Call runtime
- Call recording
- Transcript handling
- AI draft sending or auto-send
- Persistence writes
- Live customer reads or writes
- Archive writes
- Retention policy writes
- Live pilot runtime

## Browser safety

The static preview must not contain service-role keys, provider credentials, webhook signing secrets, callback tokens, live phone numbers, live message bodies, transcripts, recordings, or live customer data.

## Workflow gate

The GitHub Pages workflow is gated by:

```text
ENABLE_GITHUB_PAGES_DISABLED_PREVIEW=true
```

Without that variable, the Pages workflow is skipped.
