# QL-464 — Operator experience, accessibility and measured CX tranche

## Scoped implementation
- Responsive operator summary, searchable source-filtered sample task inbox, sample-only review toggles and evidence-gap timeline.
- Seven explicit Master, Slave and internal-company source cards. All connectivity is UNVERIFIED: no accepted signed live-health or incident feed has been integrated.
- Labelled keyboard-friendly controls, focus outlines, slash-to-search in preview, small-screen reflow, reduced-motion and forced-colour support.
- QL-462 Master appearance inheritance. No cross-application dispatch, direct peer database reads, owner signing or Windows service control.

## Nonfabrication / security
Browser-visible samples are not actual customer tasks, incident history, signed evidence, active peer telemetry or source-authoritative status. A release or GitHub GREEN does not mean runtime CONNECTED. The original-host receiver and privileged actions remain separately owner-gated.

## +10 percentage-point goal
The QL-459–472 CX improvement is a TARGET. Current independently accepted baseline and owner-observed results have not been provided. Do not state a 10pp advance until real before/after accepted-control evidence is recorded with evaluator, device, timestamp, test steps and independent signoff.

## Release validation
1. From app/: npm ci; npm run check; npm run test -- src/operator/__tests__/ql464OperatorExperience.test.tsx; npm run build.
2. Existing QL-336A and QL-417+ protected CI gates remain unchanged; require correct exact candidate SHA.
3. Human acceptance: screen-reader, keyboard-only, 200–400% zoom, high contrast, reduced motion, 320px mobile, tablet and desktop with recorded results.
4. Later live connectivity work must pass independent signer/tenant/negative tests and prove peer receipt authenticity before changing a displayed source state.
5. Exact merged-main public deployment parity and worker-specific health gates are independent from application UI tests.

## Deferred
Actual live unified inbox, source-signed incident receipt ingestion, owner decision writes and Windows host service controls are not part of QL-464.
