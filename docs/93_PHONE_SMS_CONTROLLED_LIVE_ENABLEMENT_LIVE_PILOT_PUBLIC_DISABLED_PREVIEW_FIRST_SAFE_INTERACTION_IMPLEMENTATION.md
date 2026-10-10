# QL-080 — Public Disabled Preview First Safe Interaction Implementation

Status: complete.

## Purpose

QL-080 implements the first safe interaction selected in QL-079 for the public GitHub Pages disabled preview.

The implemented interaction is the **sample brand switcher** between:

- Rosie Dazzlers
- Devil n Dove

## Public URL

```text
https://rosevearcreations.github.io/rosevear-comms-hub/
```

The preview continues to use the GitHub Pages base path:

```text
/rosevear-comms-hub/
```

## Implemented interaction

The public preview now lets the operator click Rosie Dazzlers or Devil n Dove in the floating Interface Preview panel.

The interaction changes only:

- active sample brand label
- synthetic queue cards
- synthetic customer timeline text
- preview explanatory copy

## Data boundary

QL-080 uses only:

- hard-coded synthetic preview data
- browser-local React state

QL-080 does not use:

- Supabase runtime reads
- Supabase runtime writes
- live customer records
- provider account data
- phone numbers
- message bodies
- transcripts
- recordings
- archive records
- retention records
- AI-generated replies

## Runtime boundary

The following remain disabled:

- provider callbacks
- live phone webhooks
- SMS sending
- call runtime
- call recording
- AI send
- provider delivery
- callback registration
- provider account connection
- provider live-number attachment
- Supabase migrations
- Supabase Edge Functions
- persistence writes
- live customer reads
- live customer writes
- archive writes
- retention policy writes
- Vercel hosting changes
- Cloudflare Pages changes
- live pilot runtime

## Acceptance result

QL-080 is acceptable only if:

1. App scaffold CI passes.
2. GitHub Pages Disabled Preview build passes.
3. GitHub Pages Disabled Preview deploy passes.
4. The public URL remains the GitHub Pages disabled preview URL.
5. The only interactive behavior is the browser-local sample brand switcher.
6. All live action controls remain locked and inert.

## Next queued build

QL-081 — Public Disabled Preview First Safe Interaction Review.
