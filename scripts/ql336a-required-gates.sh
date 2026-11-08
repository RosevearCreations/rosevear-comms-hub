#!/usr/bin/env bash
# QL-336A: exact carry-forward of the former app-ci.yml verifier chain.
# Invoke from app/, so existing relative paths and working directories remain unchanged.
set -euo pipefail

run_gate() {
  printf '\n[QL-336A REQUIRED]'
  printf ' %q' "$@"
  printf '\n'
  "$@"
}

run_gate npm run check
run_gate npm test
run_gate node --test ../runtimes/master-custody/rotation.test.mjs
run_gate node --test ../runtimes/master-procedures/engine.test.mjs ../runtimes/master-discovery/manifest.test.mjs
run_gate node --test ../runtimes/shell-handshakes/protocol.test.mjs
run_gate node ../scripts/__tests__/ql170-release-receipt.test.mjs
run_gate node --test ../scripts/__tests__/ql171-operator-baseline.test.mjs
run_gate node --test ../scripts/__tests__/ql188-synthetic-server-harness.test.mjs
run_gate node ../scripts/__tests__/ql208-provider-gateway-sandbox.test.mjs
run_gate node ../scripts/__tests__/ql238-integration-handshake.test.mjs
run_gate node ../scripts/__tests__/ql239-credential-rotation-dry-run.test.mjs
run_gate node ../scripts/__tests__/ql240-nonproduction-receipt-verifier.test.mjs
run_gate node ../scripts/__tests__/ql241-external-gateway-retrieval.test.mjs
run_gate node ../scripts/__tests__/ql242-gateway-audit-owner-rehearsal.test.mjs
run_gate node ../scripts/__tests__/ql243-secure-gateway-connection.test.mjs
run_gate node ../scripts/__tests__/ql244-witnessed-handshake-review.test.mjs
run_gate node ../scripts/__tests__/ql245-six-app-evidence-review.test.mjs
run_gate node ../scripts/__tests__/ql247-six-app-github-census.test.mjs
run_gate node ../scripts/__tests__/ql248-proof-commit-reconciliation.test.mjs
run_gate node ../scripts/__tests__/ql249-public-github-origin-retest.test.mjs
run_gate node ../scripts/__tests__/ql250-pin-custody-window-witness.test.mjs
run_gate node ../scripts/__tests__/ql251-witness-return-test-authorization.test.mjs
run_gate node ../scripts/__tests__/ql252-proof-custody-owner-intake.test.mjs
run_gate node ../scripts/__tests__/ql253-proof-origin-pin-registry-owner-test.test.mjs
run_gate node ../scripts/__tests__/ql254-proof-followup-witness-relay.test.mjs
run_gate node ../scripts/__tests__/ql255-response-disposition-owner-relay.test.mjs
run_gate node ../scripts/__tests__/ql256-connection-readiness.test.mjs
run_gate node ../scripts/__tests__/ql257-six-response-config-routing.test.mjs
run_gate npm run test -- src/operator/__tests__/ql258OwnerActionIntake.test.tsx
run_gate npm run test -- src/operator/__tests__/ql259SixAppReturnIntake.test.tsx
run_gate npm run test -- src/operator/__tests__/ql260NarrativeTriage.test.tsx
run_gate npm run test -- src/operator/__tests__/ql261SixAppPreflight.test.tsx
run_gate npm run test -- src/operator/__tests__/ql262EvidenceIsolationReview.test.tsx
run_gate npm run test -- src/operator/__tests__/ql263OriginalReceiptReadiness.test.tsx
run_gate npm run test -- src/operator/__tests__/ql264SixRepoDirectHandoff.test.tsx
run_gate node --test ../scripts/__tests__/ql261-six-app-guide-integrity.test.mjs
run_gate node --test ../scripts/__tests__/ql189-operations-safety-harness.test.mjs
run_gate node ../scripts/ql190-packet-integrity-audit.mjs
run_gate node --test ../scripts/__tests__/ql190-packet-integrity-audit.test.mjs
run_gate node ../scripts/ql171-operator-baseline.mjs
run_gate node --test ../scripts/__tests__/ql329-asset-budget.test.mjs
run_gate npm run build
run_gate node ../scripts/ql329-asset-budget.mjs
run_gate node --test ../scripts/__tests__/ql336a-ci-topology.test.mjs
run_gate node --test ../runtimes/master-broker/event-inbox.test.mjs
run_gate node --test ../runtimes/hub-relay/heartbeat.test.mjs
run_gate node --test ../runtimes/hub-relay/private-receiver.test.mjs ../runtimes/hub-relay/server.test.mjs
run_gate node --test ../runtimes/hub-relay/owner-authority-custody.test.mjs
run_gate node --test ../runtimes/hub-relay/ql340b-enrollment.test.mjs
run_gate node --test ../runtimes/hub-relay/ql340c-activation-check.test.mjs
run_gate node --test ../runtimes/hub-relay/ql341-private-readback.test.mjs
run_gate npm run test -- src/operator/__tests__/ql341PrivateConnectionDashboard.test.tsx
run_gate node --test ../runtimes/hub-relay/ql342-owner-decision.test.mjs
run_gate npm run test -- src/operator/__tests__/ql342OwnerGatePanel.test.tsx
run_gate node --test ../runtimes/hub-relay/ql342a-rollback-drill.test.mjs
run_gate npm run test -- src/operator/__tests__/ql342aRollbackDrillPanel.test.tsx
run_gate node --test ../runtimes/hub-relay/ql343-owner-evidence-review.test.mjs
run_gate npm run test -- src/operator/__tests__/ql343OwnerEvidencePanel.test.tsx
run_gate node --test ../runtimes/hub-relay/ql344-off-attestation.test.mjs
run_gate npm run test -- src/operator/__tests__/ql344ReceiverOffPanel.test.tsx
run_gate node --test ../runtimes/hub-relay/ql345-issuer-owner-preflight.test.mjs
run_gate npm run test -- src/operator/__tests__/ql345IssuerOwnerPanel.test.tsx
run_gate node --test ../runtimes/hub-relay/ql346-issuer-test-readiness.test.mjs
run_gate npm run test -- src/operator/__tests__/ql346IssuerTrustPanel.test.tsx
run_gate node --test ../runtimes/hub-relay/ql350-private-control-bridge.test.mjs
run_gate node --test ../runtimes/hub-relay/ql351-windows-private-adapter.test.mjs
run_gate node --test ../runtimes/hub-relay/ql352-tailnet-gateway.test.mjs ../runtimes/hub-relay/ql352-windows-tailnet-gateway.test.mjs
run_gate node --test ../runtimes/hub-relay/ql353-original-owner-session.test.mjs ../runtimes/hub-relay/ql353-windows-original-readback.test.mjs
run_gate node --test ../runtimes/hub-relay/ql354-original-owner-intake.test.mjs ../runtimes/hub-relay/ql354-windows-owner-handoff.test.mjs
run_gate node --test ../runtimes/hub-relay/ql355-independent-authority.test.mjs
run_gate node --test ../runtimes/hub-relay/ql356-original-field-readback.test.mjs ../runtimes/hub-relay/ql356-windows-field-handoff.test.mjs
run_gate node --test ../runtimes/hub-relay/ql357-original-activation.test.mjs ../runtimes/hub-relay/ql357-windows-owner-activation.test.mjs
run_gate node --test ../runtimes/hub-relay/ql358-field-credential-reconciliation.test.mjs ../runtimes/hub-relay/ql358-windows-original-field.test.mjs
run_gate node --test ../runtimes/hub-relay/ql359-supervised-private-closeout.test.mjs ../runtimes/hub-relay/ql359-windows-supervised-test.test.mjs
run_gate node --test ../runtimes/hub-relay/ql360-original-evidence-archive.test.mjs ../runtimes/hub-relay/ql360-windows-evidence-export.test.mjs ../runtimes/hub-relay/ql360-windows-private-storage.test.mjs
run_gate node --test ../runtimes/client-portal/journey.test.mjs
run_gate node --test ../supabase/functions/ql369-owner-enrollment/verify.test.mjs
run_gate node --test ../supabase/functions/ql369-owner-enrollment/ql370-progress.test.mjs
run_gate node --test ../scripts/__tests__/ql371-original-owner-guided-handoff.test.mjs
run_gate npm run test -- src/auth/__tests__/ql371OwnerCeremony.test.ts src/auth/__tests__/ql371OwnerCeremonyGuide.test.tsx
run_gate node --test ../scripts/__tests__/ql372-supervised-accessible-resume.test.mjs
run_gate npm run test -- src/auth/__tests__/ql372OwnerResume.test.ts src/auth/__tests__/ql372OwnerWalkthrough.test.tsx
run_gate node --test ../scripts/__tests__/ql373-safe-owner-readiness.test.mjs
run_gate npm run test -- src/auth/__tests__/ql373OwnerReadiness.test.ts src/auth/__tests__/ql373OwnerReadinessSupport.test.tsx
run_gate node --test ../scripts/__tests__/ql374-owner-entry-truth-review.test.mjs
run_gate npm run test -- src/auth/__tests__/ql374OwnerEntry.test.ts src/auth/__tests__/ql374MasterOperatorEntry.test.tsx
run_gate node --test ../scripts/__tests__/ql375-owner-six-app-status.test.mjs
run_gate npm run test -- src/auth/__tests__/ql375OwnerStatus.test.ts src/auth/__tests__/ql375OwnerSixAppDrilldown.test.tsx
run_gate node --test ../scripts/__tests__/ql376-owner-alert-freshness.test.mjs
run_gate npm run test -- src/auth/__tests__/ql376OwnerIncidents.test.ts src/auth/__tests__/ql376OwnerIncidentReview.test.tsx
run_gate node --test ../scripts/__tests__/ql377-owner-session-history.test.mjs
run_gate npm run test -- src/auth/__tests__/ql377OwnerIncidentHistory.test.ts src/auth/__tests__/ql377OwnerIncidentHistoryUI.test.tsx src/auth/__tests__/ql377OwnerShellNavigation.test.tsx
run_gate node --test ../scripts/__tests__/ql378-owner-incident-triage.test.mjs
run_gate node --test ../scripts/__tests__/ql379-owner-review-presets.test.mjs
run_gate npm run test -- src/auth/__tests__/ql378OwnerIncidentTriage.test.ts src/auth/__tests__/ql378OwnerIncidentTriageUI.test.tsx
run_gate node --test ../runtimes/hub-relay/ql369-activation-decision.test.mjs
