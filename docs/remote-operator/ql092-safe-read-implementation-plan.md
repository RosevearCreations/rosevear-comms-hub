# Remote operator note — QL-092

QL-092 is a planning build for validated synthetic safe reads in the public disabled preview.

## Operator-facing behavior

- The public disabled preview remains safe to open.
- Local synthetic samples remain the default source.
- Supabase read env values can remain absent; missing values keep fallback behavior active.
- No live communications action becomes available.
- No live customer, provider, archive, retention, or admin data should appear in the browser.

## What to expect

The repository now records the validation rules for the next safe-read implementation build. The next build may add a visible source indicator and hydrate display-only synthetic samples from the public synthetic views only when the existing QL-090 gates pass.

## Do not enable yet

Do not connect live provider callbacks, attach live numbers, enable SMS/call send, enable AI send, or configure browser writes as part of QL-092. Those remain outside the public disabled preview boundary.
