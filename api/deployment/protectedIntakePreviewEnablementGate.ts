// QL-020 Protected Intake Preview Enablement Gate
//
// This helper decides whether the preview /api/intake route can be enabled for dry-run testing.
// It does not enable the endpoint, does not enable persistence, and does not connect public forms.

export type EnablementDecision = 'hold' | 'ready_for_dry_run_enablement' | 'blocked';
export type GateDecisionValue = 'approved' | 'pending' | 'blocked';

export interface ProtectedIntakePreviewEnablementEvidence {
  previewUrl?: string;
  disabledModeStatus?: number;
  disabledModeMode?: string;
  disabledModeAccepted?: boolean;
  sharedSecretStoredServerSide?: boolean;
  allowedOriginsConfigured?: boolean;
  rateLimitingDecision?: GateDecisionValue;
  idempotencyDecision?: GateDecisionValue;
  persistenceDisabled?: boolean;
  publicFormsDisconnected?: boolean;
  serviceRoleKeyBrowserExposed?: boolean;
}

export interface ProtectedIntakePreviewEnablementResult {
  decision: EnablementDecision;
  canSetProtectedEndpointTrueForDryRun: boolean;
  blockers: string[];
  requiredNextSteps: string[];
  safeEnvironment: Record<string, string>;
}

const safeEnvironment = {
  ENABLE_PROTECTED_INTAKE_ENDPOINT: 'false',
  ENABLE_INTAKE_PERSISTENCE: 'false',
  ENABLE_RATE_LIMITING: 'false',
  ENABLE_INTAKE_IDEMPOTENCY: 'false',
  PROTECTED_INTAKE_ENABLEMENT_GATE_STATUS: 'hold',
  PROTECTED_INTAKE_ENABLEMENT_ALLOWED: 'false'
};

export function evaluateProtectedIntakePreviewEnablementGate(
  evidence: ProtectedIntakePreviewEnablementEvidence
): ProtectedIntakePreviewEnablementResult {
  const blockers: string[] = [];

  if (!evidence.previewUrl) blockers.push('Preview URL is not recorded.');
  if (evidence.disabledModeStatus !== 503) blockers.push('Disabled-mode HTTP status evidence must be 503.');
  if (evidence.disabledModeMode !== 'disabled') blockers.push('Disabled-mode response mode must be disabled.');
  if (evidence.disabledModeAccepted !== false) blockers.push('Disabled-mode response accepted value must be false.');
  if (!evidence.sharedSecretStoredServerSide) blockers.push('INTAKE_SHARED_SECRET must be stored server-side only.');
  if (!evidence.allowedOriginsConfigured) blockers.push('ALLOWED_INTAKE_ORIGINS must be configured server-side.');
  if (evidence.rateLimitingDecision !== 'approved') blockers.push('Rate-limiting decision must be approved before enablement testing.');
  if (evidence.idempotencyDecision !== 'approved') blockers.push('Idempotency decision must be approved before enablement testing.');
  if (evidence.persistenceDisabled !== true) blockers.push('Persistence must remain disabled for preview enablement testing.');
  if (evidence.publicFormsDisconnected !== true) blockers.push('Public website forms must remain disconnected.');
  if (evidence.serviceRoleKeyBrowserExposed) blockers.push('Service-role keys must not be exposed to browser code.');

  const canSetProtectedEndpointTrueForDryRun = blockers.length === 0;

  return {
    decision: canSetProtectedEndpointTrueForDryRun ? 'ready_for_dry_run_enablement' : 'hold',
    canSetProtectedEndpointTrueForDryRun,
    blockers,
    requiredNextSteps: canSetProtectedEndpointTrueForDryRun
      ? [
          'Create a temporary preview-only enablement plan with ENABLE_PROTECTED_INTAKE_ENDPOINT=true.',
          'Keep ENABLE_INTAKE_PERSISTENCE=false.',
          'Test only approved dry-run payloads.',
          'Do not connect public forms.'
        ]
      : [
          'Record preview disabled-mode evidence.',
          'Confirm secret and allowed-origin placement.',
          'Approve rate-limiting and idempotency decisions.',
          'Keep endpoint and persistence disabled.'
        ],
    safeEnvironment
  };
}
