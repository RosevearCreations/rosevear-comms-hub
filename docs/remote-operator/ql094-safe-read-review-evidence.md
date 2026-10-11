# Remote operator note — QL-094

QL-094 turns the existing safe-read panel into a review/evidence panel.

## Operator-facing behavior

- The floating safe-read button now displays `QL-094`.
- The panel shows evidence counts before the display-only sample cards.
- The panel still lets the operator switch between Rosie Dazzlers and Devil n Dove synthetic preview rows.
- The panel still shows fallback reasons when the browser cannot safely read from the approved Supabase project.

## Important boundary

QL-094 is evidence-only. It does not send replies, connect a provider, register callbacks, place calls, send SMS, write archives, write retention records, or approve AI output.
