# QL-075 — Public Disabled Preview Feedback Intake

Status: in progress until promoted to `main` and verified.

## Build intent

Capture feedback from the public GitHub Pages disabled preview after the enablement variable is expected to be corrected.

## Implementation

- Updated the floating interface preview to QL-075 feedback-intake state.
- Added feedback prompts for public URL load, first impression, brand switching, operator queue, customer timeline, disabled controls, help text, and next interactive surface.
- Added `api/deployment/phoneSmsControlledLiveEnablementLivePilotPublicDisabledPreviewFeedbackIntake.ts`.
- Added `api/contracts/phone-sms-controlled-live-enablement-live-pilot-public-disabled-preview-feedback-intake.example.json`.
- Added source, ops, remote-operator, and telephony records.

## Promotion checks

- `npm install`
- `npm run check`
- `npm run build`
- App scaffold CI on `main`
- GitHub Pages Disabled Preview workflow on `main`

## Locked runtime paths

Provider callbacks, phone webhooks, SMS sending, call runtime, recording, AI send, persistence writes, live customer access, archive writes, retention writes, Supabase runtime changes, Vercel, Cloudflare Pages, and live pilot runtime remain disabled.
