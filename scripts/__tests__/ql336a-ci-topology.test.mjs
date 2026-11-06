import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const root = fileURLToPath(new URL('../../', import.meta.url));
const read = (path) => readFileSync(new URL(path, `file://${root}/`), 'utf8');
const appCi = read('.github/workflows/app-ci.yml');
const manualParity = read('.github/workflows/ql328-public-assets.yml');
const pages = read('.github/workflows/pages-disabled-preview.yml');
const scheduledSourceAudit = read('.github/workflows/ql333-public-contract-discovery.yml');
const gates = read('scripts/ql336a-required-gates.sh');

test('QL-336A retains all 43 existing application checks in their original order', () => {
  const commands = gates.split('\n')
    .filter((line) => line.startsWith('run_gate ')
      && !line.includes('ql336a-ci-topology.test.mjs')
      && !line.includes('master-broker/event-inbox.test.mjs')
      && !line.includes('hub-relay/heartbeat.test.mjs')
      && !line.includes('hub-relay/private-receiver.test.mjs')
      && !line.includes('hub-relay/owner-authority-custody.test.mjs')
      && !line.includes('hub-relay/ql340b-enrollment.test.mjs')
      && !line.includes('hub-relay/ql340c-activation-check.test.mjs')
      && !line.includes('hub-relay/ql341-private-readback.test.mjs')
      && !line.includes('ql341PrivateConnectionDashboard.test.tsx')
      && !line.includes('hub-relay/ql342-owner-decision.test.mjs')
      && !line.includes('ql342OwnerGatePanel.test.tsx')
      && !line.includes('ql342a-rollback-drill.test.mjs')
      && !line.includes('ql342aRollbackDrillPanel.test.tsx')
      && !line.includes('ql343-owner-evidence-review.test.mjs')
      && !line.includes('ql343OwnerEvidencePanel.test.tsx')
      && !line.includes('ql344-off-attestation.test.mjs')
      && !line.includes('ql344ReceiverOffPanel.test.tsx')
      && !line.includes('ql345-issuer-owner-preflight.test.mjs')
      && !line.includes('ql345IssuerOwnerPanel.test.tsx')
      && !line.includes('ql346-issuer-test-readiness.test.mjs')
      && !line.includes('ql346IssuerTrustPanel.test.tsx')
      && !line.includes('hub-relay/ql350-private-control-bridge.test.mjs')
      && !line.includes('hub-relay/ql351-windows-private-adapter.test.mjs')
      && !line.includes('hub-relay/ql352-tailnet-gateway.test.mjs')
      && !line.includes('hub-relay/ql353-original-owner-session.test.mjs')
      && !line.includes('hub-relay/ql354-original-owner-intake.test.mjs')
      && !line.includes('hub-relay/ql355-independent-authority.test.mjs')
      && !line.includes('client-portal/journey.test.mjs'))
    .map((line) => line.slice('run_gate '.length));
  // SHA-256 of the 43 exact gate commands in origin/dev's pre-QL336A app-ci.yml,
  // excluding the npm ci step, which remains an independent workflow step.
  const fingerprint = createHash('sha256').update(commands.join('\n') + '\n').digest('hex');
  assert.equal(commands.length, 43);
  assert.equal(fingerprint, 'a8eca667fae03b9078cef1c701c09f41a49d1e1dea5a758efcaf4106bfd496ec');
  assert.match(gates, /set -euo pipefail/);
  assert.match(gates, /"\$@"/);
  assert.match(appCi, /npm ci --no-audit --no-fund/);
  assert.match(appCi, /bash \.\.\/scripts\/ql336a-required-gates\.sh/);
  const originalHubGate = 'run_gate node --test ../runtimes/hub-relay/heartbeat.test.mjs';
  const newReceiverGate = 'run_gate node --test ../runtimes/hub-relay/private-receiver.test.mjs ../runtimes/hub-relay/server.test.mjs';
  const portalGate = 'run_gate node --test ../runtimes/client-portal/journey.test.mjs';
  assert.ok(gates.includes(newReceiverGate), 'QL-339B receiver verifier is required');
  assert.ok(gates.indexOf(originalHubGate) < gates.indexOf(newReceiverGate));
  assert.ok(gates.indexOf(newReceiverGate) < gates.indexOf(portalGate));
  const ownerKeyGate = 'run_gate node --test ../runtimes/hub-relay/owner-authority-custody.test.mjs';
  assert.ok(gates.includes(ownerKeyGate), 'QL-340 owner signer custody gate remains required');
  assert.ok(gates.indexOf(newReceiverGate) < gates.indexOf(ownerKeyGate));
  assert.ok(gates.indexOf(ownerKeyGate) < gates.indexOf(portalGate));
  const ceremonyGate = 'run_gate node --test ../runtimes/hub-relay/ql340b-enrollment.test.mjs';
  assert.ok(gates.includes(ceremonyGate), 'QL-340B signed enrollment ceremony gate is required');
  assert.ok(gates.indexOf(ownerKeyGate) < gates.indexOf(ceremonyGate));
  assert.ok(gates.indexOf(ceremonyGate) < gates.indexOf(portalGate));
  const activationGate = 'run_gate node --test ../runtimes/hub-relay/ql340c-activation-check.test.mjs';
  assert.ok(gates.includes(activationGate), 'QL-340C fail-closed receiver activation checks are required');
  assert.ok(gates.indexOf(ceremonyGate) < gates.indexOf(activationGate));
  assert.ok(gates.indexOf(activationGate) < gates.indexOf(portalGate));
  const witnessGate = 'run_gate node --test ../runtimes/hub-relay/ql341-private-readback.test.mjs';
  const dashboardGate = 'run_gate npm run test -- src/operator/__tests__/ql341PrivateConnectionDashboard.test.tsx';
  assert.ok(gates.includes(witnessGate), 'QL-341 signed receipt/database readback gate is required');
  assert.ok(gates.includes(dashboardGate), 'QL-341 six-app read-only dashboard gate is required');
  assert.ok(gates.indexOf(activationGate) < gates.indexOf(witnessGate));
  assert.ok(gates.indexOf(witnessGate) < gates.indexOf(dashboardGate));
  const decisionGate = 'run_gate node --test ../runtimes/hub-relay/ql342-owner-decision.test.mjs';
  const ownerPanelGate = 'run_gate npm run test -- src/operator/__tests__/ql342OwnerGatePanel.test.tsx';
  assert.ok(gates.includes(decisionGate), 'QL-342 original owner and one TEST receipt gate is required');
  assert.ok(gates.includes(ownerPanelGate), 'QL-342 owner decision UI gate is required');
  assert.ok(gates.indexOf(dashboardGate) < gates.indexOf(decisionGate));
  assert.ok(gates.indexOf(decisionGate) < gates.indexOf(ownerPanelGate));
  assert.ok(gates.indexOf(ownerPanelGate) < gates.indexOf(portalGate));
  const inertGate='run_gate node --test ../runtimes/hub-relay/ql342a-rollback-drill.test.mjs';
  const inertPanelGate='run_gate npm run test -- src/operator/__tests__/ql342aRollbackDrillPanel.test.tsx';
  assert.ok(gates.includes(inertGate),'QL-342A local-only child stop verification is required');
  assert.ok(gates.includes(inertPanelGate),'QL-342A owner-safe drill guidance is required');
  assert.ok(gates.indexOf(ownerPanelGate)<gates.indexOf(inertGate));
  assert.ok(gates.indexOf(inertGate)<gates.indexOf(inertPanelGate));
  assert.ok(gates.indexOf(inertPanelGate)<gates.indexOf(portalGate));
  const ownerEvidenceGate='run_gate node --test ../runtimes/hub-relay/ql343-owner-evidence-review.test.mjs';
  const ownerEvidenceUiGate='run_gate npm run test -- src/operator/__tests__/ql343OwnerEvidencePanel.test.tsx';
  assert.ok(gates.includes(ownerEvidenceGate),'QL-343 original evidence and offline request comparison are mandatory');
  assert.ok(gates.includes(ownerEvidenceUiGate),'QL-343 guided original-owner UI review is mandatory');
  assert.ok(gates.indexOf(inertPanelGate)<gates.indexOf(ownerEvidenceGate));
  assert.ok(gates.indexOf(ownerEvidenceGate)<gates.indexOf(ownerEvidenceUiGate));
  assert.ok(gates.indexOf(ownerEvidenceUiGate)<gates.indexOf(portalGate));
  const receiverOffGate='run_gate node --test ../runtimes/hub-relay/ql344-off-attestation.test.mjs';
  const receiverOffUiGate='run_gate npm run test -- src/operator/__tests__/ql344ReceiverOffPanel.test.tsx';
  assert.ok(gates.includes(receiverOffGate),'QL-344 original bytes and receiver-OFF review are required');
  assert.ok(gates.includes(receiverOffUiGate),'QL-344 safe owner review dashboard is required');
  assert.ok(gates.indexOf(ownerEvidenceUiGate)<gates.indexOf(receiverOffGate));
  assert.ok(gates.indexOf(receiverOffGate)<gates.indexOf(receiverOffUiGate));
  assert.ok(gates.indexOf(receiverOffUiGate)<gates.indexOf(portalGate));
  const issuerGate='run_gate node --test ../runtimes/hub-relay/ql345-issuer-owner-preflight.test.mjs';
  const issuerUiGate='run_gate npm run test -- src/operator/__tests__/ql345IssuerOwnerPanel.test.tsx';
  assert.ok(gates.includes(issuerGate),'QL-345 offline issuer/owner signature preflight is required');
  assert.ok(gates.includes(issuerUiGate),'QL-345 signing-HOLD guidance is required');
  assert.ok(gates.indexOf(receiverOffUiGate)<gates.indexOf(issuerGate));
  assert.ok(gates.indexOf(issuerGate)<gates.indexOf(issuerUiGate));
  assert.ok(gates.indexOf(issuerUiGate)<gates.indexOf(portalGate));
  const verifiedIssuerGate='run_gate node --test ../runtimes/hub-relay/ql346-issuer-test-readiness.test.mjs';
  const verifiedIssuerUiGate='run_gate npm run test -- src/operator/__tests__/ql346IssuerTrustPanel.test.tsx';
  assert.ok(gates.includes(verifiedIssuerGate),'QL-346 original signed heartbeat and distinct owner TEST consent are required');
  assert.ok(gates.includes(verifiedIssuerUiGate),'QL-346 read-only issuer trust and owner guidance are required');
  assert.ok(gates.indexOf(issuerUiGate)<gates.indexOf(verifiedIssuerGate));
  assert.ok(gates.indexOf(verifiedIssuerGate)<gates.indexOf(verifiedIssuerUiGate));
  assert.ok(gates.indexOf(verifiedIssuerUiGate)<gates.indexOf(portalGate));
  const privateBridgeGate='run_gate node --test ../runtimes/hub-relay/ql350-private-control-bridge.test.mjs';
  assert.ok(gates.includes(privateBridgeGate),'QL-350 private operator and signed TEST gate is required');
  assert.ok(gates.indexOf(verifiedIssuerUiGate)<gates.indexOf(privateBridgeGate));
  const windowsAdapterGate='run_gate node --test ../runtimes/hub-relay/ql351-windows-private-adapter.test.mjs';
  assert.ok(gates.includes(windowsAdapterGate),'QL-351 original Windows adapter provenance and HOLD gate is required');
  assert.ok(gates.indexOf(privateBridgeGate)<gates.indexOf(windowsAdapterGate));
  assert.ok(gates.indexOf(windowsAdapterGate)<gates.indexOf(portalGate));
  const tailnetGatewayGate='run_gate node --test ../runtimes/hub-relay/ql352-tailnet-gateway.test.mjs ../runtimes/hub-relay/ql352-windows-tailnet-gateway.test.mjs';
  assert.ok(gates.includes(tailnetGatewayGate),'QL-352 private Tailnet transport-only HOLD gate is required');
  assert.ok(gates.indexOf(windowsAdapterGate)<gates.indexOf(tailnetGatewayGate));
  assert.ok(gates.indexOf(tailnetGatewayGate)<gates.indexOf(portalGate));
  const ownerSessionGate='run_gate node --test ../runtimes/hub-relay/ql353-original-owner-session.test.mjs ../runtimes/hub-relay/ql353-windows-original-readback.test.mjs';
  assert.ok(gates.includes(ownerSessionGate),'QL-353 original owner session and first receipt verification gate is required');
  assert.ok(gates.indexOf(tailnetGatewayGate)<gates.indexOf(ownerSessionGate));
  assert.ok(gates.indexOf(ownerSessionGate)<gates.indexOf(portalGate));
  assert.ok(gates.indexOf(privateBridgeGate)<gates.indexOf(portalGate));
});

test('main and PR application CI retain required gate names and fail-closed dependency', () => {
  assert.match(appCi, /name: App scaffold CI/);
  assert.match(appCi, /on:\s*\n\s*pull_request:\s*\n\s*push:\s*\n\s*branches: \[main\]/);
  assert.match(appCi, /\n\s*app-build:\s*\n/);
  assert.match(appCi, /\n\s*public-worker-asset-parity:\s*\n\s*name: Public Worker JS\/CSS SHA-256 parity/);
  assert.match(appCi, /needs: app-build/);
  assert.match(appCi, /github\.event_name == 'push' && github\.ref == 'refs\/heads\/main'/);
  assert.match(appCi, /timeout-minutes: 12/);
  assert.match(appCi, /python3 scripts\/ql328-public-asset-parity\.py/);
  assert.match(appCi, /persist-credentials: false/);
  assert.match(appCi, /permissions:\s*\n\s*contents: read/);
  assert.match(appCi, /original-owner-keys-windows:\s*\n\s*name: QL-340 Windows encrypted owner key safety/);
  assert.match(appCi, /runs-on: windows-latest/);
  assert.match(appCi, /git config --global core\.longpaths true/);
  assert.match(appCi, /node --test runtimes\/hub-relay\/owner-authority-custody\.test\.mjs/);
  assert.match(appCi, /node --test runtimes\/hub-relay\/ql340b-enrollment\.test\.mjs/);
  assert.match(appCi, /node --test runtimes\/hub-relay\/ql340c-activation-check\.test\.mjs/);
  assert.match(appCi, /ql340c-windows-operator\.ps1 -SelfTest/);
  assert.match(appCi, /node --test runtimes\/hub-relay\/ql341-private-readback\.test\.mjs/);
  assert.match(appCi, /node --test runtimes\/hub-relay\/ql342-owner-decision\.test\.mjs/);
  assert.match(appCi, /ql340c-windows-operator\.ps1 -OwnerPreflight/);
  assert.match(appCi, /node --test runtimes\/hub-relay\/ql342a-rollback-drill\.test\.mjs/);
  assert.match(appCi, /node --test runtimes\/hub-relay\/ql343-owner-evidence-review\.test\.mjs/);
  assert.match(appCi, /node --test runtimes\/hub-relay\/ql344-off-attestation\.test\.mjs/);
  assert.match(appCi, /ql344-windows-off-observer\.ps1 -Status/);
  assert.match(appCi, /node --test runtimes\/hub-relay\/ql345-issuer-owner-preflight\.test\.mjs/);
  assert.match(appCi, /node --test runtimes\/hub-relay\/ql346-issuer-test-readiness\.test\.mjs/);
  assert.match(appCi, /node --test runtimes\/hub-relay\/ql350-private-control-bridge\.test\.mjs/);
  assert.match(appCi, /node --test runtimes\/hub-relay\/ql351-windows-private-adapter\.test\.mjs/);
  assert.match(appCi, /ql351-windows-private-adapter\.ps1 -Status/);
  assert.match(appCi, /node --test runtimes\/hub-relay\/ql352-tailnet-gateway\.test\.mjs runtimes\/hub-relay\/ql352-windows-tailnet-gateway\.test\.mjs/);
  assert.match(appCi, /ql352-windows-tailnet-gateway\.ps1 -Status/);
  assert.match(appCi, /node --test runtimes\/hub-relay\/ql353-original-owner-session\.test\.mjs runtimes\/hub-relay\/ql353-windows-original-readback\.test\.mjs/);
  assert.match(appCi, /ql353-windows-original-readback\.ps1 -Status/);
  assert.match(appCi, /node --test runtimes\/hub-relay\/ql354-original-owner-intake\.test\.mjs runtimes\/hub-relay\/ql354-windows-owner-handoff\.test\.mjs/);
  assert.match(appCi, /ql354-windows-owner-handoff\.ps1 -Status/);
  assert.match(gates, /run_gate node --test \.\.\/runtimes\/hub-relay\/ql354-original-owner-intake\.test\.mjs/);
  const ql354Gate='run_gate node --test ../runtimes/hub-relay/ql354-original-owner-intake.test.mjs ../runtimes/hub-relay/ql354-windows-owner-handoff.test.mjs';
  const ql355Gate='run_gate node --test ../runtimes/hub-relay/ql355-independent-authority.test.mjs';
  assert.ok(gates.includes(ql355Gate),'QL-355 original external authority and first genuine TEST acceptance gate is required');
  assert.ok(gates.indexOf(ql354Gate)<gates.indexOf(ql355Gate));
  assert.match(appCi,/node --test runtimes\/hub-relay\/ql355-independent-authority\.test\.mjs/);
});

test('production parity has one push trigger; an independently runnable manual proof remains', () => {
  assert.match(manualParity, /name: Public Disabled-Preview Asset Verification \(QL-328 onward\)/);
  assert.match(manualParity, /on:\s*\n\s*workflow_dispatch:/);
  assert.doesNotMatch(manualParity, /^\s+push:/m);
  assert.match(manualParity, /name: Public Worker JS\/CSS SHA-256 parity/);
  assert.match(manualParity, /python3 scripts\/ql328-public-asset-parity\.py/);
  assert.match(pages, /ENABLE_GITHUB_PAGES_DISABLED_PREVIEW == 'true'/);
  assert.match(pages, /name: Deploy disabled preview/);
  assert.match(scheduledSourceAudit, /schedule:/);
});

test('both parity jobs explicitly disable provider/customer integrations', () => {
  const flags = [
    'VITE_ENABLE_SUPABASE_CLIENT',
    'VITE_ENABLE_HOSTED_DATABASE',
    'VITE_PHONE_SMS_PROVIDER_ENABLED',
    'VITE_PHONE_SMS_LIVE_PILOT_ENABLED',
    'VITE_PHONE_SMS_CALLBACKS_ENABLED',
    'VITE_PHONE_SMS_PERSISTENCE_ENABLED',
  ];
  for (const flag of flags) {
    for (const workflow of [appCi, manualParity]) {
      assert.ok(workflow.includes(`${flag}: 'false'`), `Expected disabled ${flag}`);
    }
  }
});
