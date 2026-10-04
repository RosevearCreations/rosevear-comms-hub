// QL-015 Protected Intake Deployment Readiness Gate
//
// This helper evaluates whether the protected intake endpoint should remain
// disabled, dry-run only, or ready for a future runtime wrapper review.
// It does not enable live intake and does not connect to Supabase.

export interface ProtectedIntakeDeploymentEnvironment {
  ENABLE_PROTECTED_INTAKE_ENDPOINT?: string;
  ENABLE_INTAKE_PERSISTENCE?: string;
  ALLOWED_INTAKE_ORIGINS?: string;
  INTAKE_SHARED_SECRET?: string;
  DEPLOYMENT_TARGET?: string;
  ENABLE_RATE_LIMITING?: string;
  ENABLE_INTAKE_IDEMPOTENCY?: string;
}

export interface ProtectedIntakeDeploymentReadiness {
  ready: boolean;
  mode: 'disabled' | 'dry_run_ready' | 'blocked';
  blockers: string[];
  warnings: string[];
}

function isTrue(value: string | undefined): boolean {
  return value === 'true';
}

function hasValue(value: string | undefined): boolean {
  return Boolean(value && value.trim());
}

export function evaluateProtectedIntakeDeploymentReadiness(
  env: ProtectedIntakeDeploymentEnvironment
): ProtectedIntakeDeploymentReadiness {
  const blockers: string[] = [];
  const warnings: string[] = [];

  const endpointEnabled = isTrue(env.ENABLE_PROTECTED_INTAKE_ENDPOINT);
  const persistenceEnabled = isTrue(env.ENABLE_INTAKE_PERSISTENCE);

  if (!endpointEnabled && !persistenceEnabled) {
    return {
      ready: true,
      mode: 'disabled',
      blockers: [],
      warnings: ['Safe default confirmed: endpoint and persistence are disabled.']
    };
  }

  if (!hasValue(env.DEPLOYMENT_TARGET)) {
    blockers.push('DEPLOYMENT_TARGET must be selected before enabling intake.');
  }

  if (!hasValue(env.ALLOWED_INTAKE_ORIGINS)) {
    blockers.push('ALLOWED_INTAKE_ORIGINS must be configured.');
  }

  if (!hasValue(env.INTAKE_SHARED_SECRET)) {
    blockers.push('INTAKE_SHARED_SECRET must be configured as a server-side secret.');
  }

  if (!isTrue(env.ENABLE_RATE_LIMITING)) {
    blockers.push('Rate limiting or abuse-control must be enabled before live intake.');
  }

  if (!isTrue(env.ENABLE_INTAKE_IDEMPOTENCY)) {
    blockers.push('Idempotency / duplicate-submission protection must be enabled before live intake.');
  }

  if (persistenceEnabled) {
    warnings.push('Persistence is enabled. Confirm server-side repository adapter and rollback plan before production.');
  }

  if (blockers.length) {
    return {
      ready: false,
      mode: 'blocked',
      blockers,
      warnings
    };
  }

  return {
    ready: true,
    mode: persistenceEnabled ? 'blocked' : 'dry_run_ready',
    blockers: persistenceEnabled ? ['Persistence requires final manual review before production.'] : [],
    warnings
  };
}
