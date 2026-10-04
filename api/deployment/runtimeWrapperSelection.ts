// QL-016 Deployment Runtime Wrapper Selection
//
// Documents the first selected runtime wrapper for the protected website intake endpoint.
// This file is safe to import in server-side planning code; it does not enable deployment.

export type DeploymentRuntimeTarget = 'none' | 'vercel_serverless_function';

export interface RuntimeWrapperSelectionEnvironment {
  DEPLOYMENT_TARGET?: string;
  DEPLOYMENT_RUNTIME_WRAPPER?: string;
  ENABLE_PROTECTED_INTAKE_ENDPOINT?: string;
  ENABLE_INTAKE_PERSISTENCE?: string;
  ENABLE_RATE_LIMITING?: string;
  ENABLE_INTAKE_IDEMPOTENCY?: string;
}

export interface RuntimeWrapperSelectionStatus {
  selectedTarget: DeploymentRuntimeTarget;
  templatePath: string;
  liveRoutePath: string;
  readyForPreview: boolean;
  safeForProduction: boolean;
  blockers: string[];
}

export const ql016RuntimeWrapperSelection = {
  selectedTarget: 'vercel_serverless_function' as const,
  templatePath: 'runtimes/vercel/api/intake.ts',
  plannedLiveRoutePath: 'api/intake.ts',
  endpointEnabledByDefault: false,
  persistenceEnabledByDefault: false,
  notes: [
    'The Vercel wrapper is a template only in QL-016.',
    'Do not move it to the live route path until preview deployment is reviewed.',
    'Do not enable persistence until idempotency and abuse controls are ready.'
  ]
};

export function evaluateRuntimeWrapperSelection(
  env: RuntimeWrapperSelectionEnvironment
): RuntimeWrapperSelectionStatus {
  const blockers: string[] = [];

  const selectedTarget: DeploymentRuntimeTarget =
    env.DEPLOYMENT_RUNTIME_WRAPPER === 'vercel_serverless_function' || env.DEPLOYMENT_TARGET === 'vercel'
      ? 'vercel_serverless_function'
      : 'none';

  if (selectedTarget === 'none') {
    blockers.push('DEPLOYMENT_TARGET=vercel or DEPLOYMENT_RUNTIME_WRAPPER=vercel_serverless_function is not set.');
  }

  if (env.ENABLE_PROTECTED_INTAKE_ENDPOINT === 'true') {
    blockers.push('Protected intake endpoint should remain disabled until QL-017 preview verification.');
  }

  if (env.ENABLE_INTAKE_PERSISTENCE === 'true') {
    blockers.push('Intake persistence should remain disabled until idempotency and abuse controls are ready.');
  }

  if (env.ENABLE_RATE_LIMITING === 'true' && env.ENABLE_INTAKE_IDEMPOTENCY === 'true') {
    blockers.push('Rate limiting and idempotency are marked enabled, but QL-016 has not verified their implementations.');
  }

  return {
    selectedTarget,
    templatePath: ql016RuntimeWrapperSelection.templatePath,
    liveRoutePath: ql016RuntimeWrapperSelection.plannedLiveRoutePath,
    readyForPreview: selectedTarget === 'vercel_serverless_function' && env.ENABLE_PROTECTED_INTAKE_ENDPOINT !== 'true',
    safeForProduction: env.ENABLE_PROTECTED_INTAKE_ENDPOINT !== 'true' && env.ENABLE_INTAKE_PERSISTENCE !== 'true',
    blockers
  };
}
