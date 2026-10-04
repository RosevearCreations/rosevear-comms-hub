// QL-018 Protected Intake Preview Deployment Wiring
//
// Describes the preview-route readiness state without enabling persistence or live forms.

export type PreviewWiringStatus = 'safe_disabled' | 'ready_for_disabled_preview' | 'blocked';

export interface ProtectedIntakePreviewEnvironment {
  DEPLOYMENT_TARGET?: string;
  DEPLOYMENT_RUNTIME_WRAPPER?: string;
  PROTECTED_INTAKE_PREVIEW_ROUTE?: string;
  PROTECTED_INTAKE_PREVIEW_URL?: string;
  ENABLE_PROTECTED_INTAKE_ENDPOINT?: string;
  ENABLE_INTAKE_PERSISTENCE?: string;
  ENABLE_RATE_LIMITING?: string;
  ENABLE_INTAKE_IDEMPOTENCY?: string;
  ALLOWED_INTAKE_ORIGINS?: string;
  INTAKE_SHARED_SECRET?: string;
}

export interface ProtectedIntakePreviewWiringReport {
  status: PreviewWiringStatus;
  routePath: string;
  target: string;
  blockingReasons: string[];
  warnings: string[];
}

function isPresent(value: string | undefined): boolean {
  return Boolean(value?.trim());
}

export function evaluateProtectedIntakePreviewWiring(
  env: ProtectedIntakePreviewEnvironment
): ProtectedIntakePreviewWiringReport {
  const routePath = env.PROTECTED_INTAKE_PREVIEW_ROUTE || '/api/intake';
  const target = env.DEPLOYMENT_TARGET || 'vercel';
  const blockingReasons: string[] = [];
  const warnings: string[] = [];

  if (target !== 'vercel') {
    blockingReasons.push('DEPLOYMENT_TARGET must remain vercel for the QL-018 preview route.');
  }

  if (env.DEPLOYMENT_RUNTIME_WRAPPER !== 'vercel_serverless_function') {
    blockingReasons.push('DEPLOYMENT_RUNTIME_WRAPPER must be vercel_serverless_function.');
  }

  if (routePath !== '/api/intake') {
    blockingReasons.push('PROTECTED_INTAKE_PREVIEW_ROUTE must be /api/intake for the preview route.');
  }

  if (env.ENABLE_INTAKE_PERSISTENCE === 'true') {
    blockingReasons.push('ENABLE_INTAKE_PERSISTENCE must remain false for preview wiring.');
  }

  if (env.ENABLE_PROTECTED_INTAKE_ENDPOINT === 'true' && !isPresent(env.INTAKE_SHARED_SECRET)) {
    blockingReasons.push('INTAKE_SHARED_SECRET is required before enabling the endpoint gate.');
  }

  if (env.ENABLE_PROTECTED_INTAKE_ENDPOINT === 'true' && !isPresent(env.ALLOWED_INTAKE_ORIGINS)) {
    blockingReasons.push('ALLOWED_INTAKE_ORIGINS is required before enabling the endpoint gate.');
  }

  if (env.ENABLE_RATE_LIMITING !== 'true') {
    warnings.push('Rate limiting is not enabled yet; keep the endpoint disabled outside controlled dry-run tests.');
  }

  if (env.ENABLE_INTAKE_IDEMPOTENCY !== 'true') {
    warnings.push('Idempotency is not enabled yet; keep persistence disabled.');
  }

  if (!isPresent(env.PROTECTED_INTAKE_PREVIEW_URL)) {
    warnings.push('Preview URL is not recorded yet; add it after Vercel creates the preview deployment.');
  }

  const status: PreviewWiringStatus = blockingReasons.length
    ? 'blocked'
    : env.ENABLE_PROTECTED_INTAKE_ENDPOINT === 'true'
      ? 'ready_for_disabled_preview'
      : 'safe_disabled';

  return {
    status,
    routePath,
    target,
    blockingReasons,
    warnings
  };
}
