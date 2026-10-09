# QL-065 Ops Checklist — Disabled Operator Console Evidence Review

## Allowed review material

- Synthetic/redacted console reachability notes.
- Synthetic/redacted console visibility notes.
- Variable names without values.
- Guidance-only application/service link labels.
- Disabled button state notes.
- Safety-lock notes proving provider/runtime/persistence/customer-data/archive/retention paths remain off.
- Production CI proof.

## Not allowed

Do not collect, paste, upload, persist, or archive:

- API keys.
- Auth tokens.
- Webhook signing secrets.
- Supabase service-role keys.
- Provider callback tokens.
- Live phone numbers.
- Live customer names or identifiers.
- Message bodies.
- Transcripts.
- Recordings.
- Runtime logs proving live provider delivery.

## Review checklist

- Confirm QL-064 evidence intake is present.
- Confirm every evidence item is synthetic and redacted.
- Confirm every future action button is disabled.
- Confirm send SMS remains disabled.
- Confirm call customer remains disabled.
- Confirm connect provider remains disabled.
- Confirm attach live number remains disabled.
- Confirm persist evidence remains disabled.
- Confirm start live pilot remains disabled.
- Confirm provider callbacks and webhooks remain unconfigured.
- Confirm no provider account is connected.
- Confirm no Supabase migration is required.
- Confirm no browser-held secret is introduced.

## Approval boundary

QL-065 can approve only the next disabled evidence closure gate.

QL-065 cannot approve:

- Live provider setup.
- Phone/SMS callbacks.
- Live SMS sending.
- Live call handling.
- Recording.
- AI auto-send.
- Evidence persistence.
- Customer-data access.
- Archive writes.
- Retention-policy writes.
- Live pilot runtime.
