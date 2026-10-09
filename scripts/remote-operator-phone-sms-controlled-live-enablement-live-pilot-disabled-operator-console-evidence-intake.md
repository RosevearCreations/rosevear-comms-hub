# QL-064 Remote Operator Checklist — Disabled Operator Console Evidence Intake

Use this checklist after QL-064 reaches production.

## Access

1. Open the existing Rosevear Comms Hub admin web app.
2. Click **Phone/SMS console — disabled**.
3. Confirm the console opens without any provider login, callback setup, or runtime action.

## Evidence intake

Capture only synthetic/redacted proof for:

1. Console reachability.
2. QL-064 stage label.
3. Runtime OFF.
4. Provider delivery OFF.
5. Redacted evidence status.
6. Safety locks.
7. Manual evidence checklist.
8. Variable names only.
9. Guidance-only links.
10. Disabled future actions.

## Safety check

Do not paste, upload, or store any:

- Provider secret.
- API key value.
- Webhook signing secret value.
- Live phone number.
- Customer phone number.
- Customer message.
- Recording.
- Transcript.
- Real callback URL with token.

## Expected disabled buttons

- Send SMS disabled.
- Call customer disabled.
- Connect provider disabled.
- Attach live number disabled.
- Persist evidence disabled.
- Start live pilot disabled.

## Stop condition

If any live action is enabled, stop and mark QL-064 blocked.
