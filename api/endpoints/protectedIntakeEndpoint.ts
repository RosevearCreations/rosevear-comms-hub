// QL-013 Protected Intake Endpoint Skeleton
//
// Provider-neutral server-side handler skeleton for website intake submissions.
// This file is not wired to a live deployment yet.
// Public websites must not write directly to Supabase app tables.

import {
  allowedWebsiteIntakeBrands,
  isAllowedWebsiteIntakeType,
  type WebsiteIntakePayload
} from '../../integrations/website-intake/websiteIntakeContract';

export interface ProtectedIntakeEnvironment {
  ENABLE_PROTECTED_INTAKE_ENDPOINT?: string;
  INTAKE_SHARED_SECRET?: string;
  ALLOWED_INTAKE_ORIGINS?: string;
}

export interface ProtectedIntakeRequest {
  method: string;
  headers: Record<string, string | undefined>;
  bodyText: string;
}

export interface ProtectedIntakeResponseBody {
  accepted: boolean;
  mode: 'disabled' | 'dry_run' | 'stored' | 'rejected';
  intakeId?: string;
  error?: string;
  warnings?: string[];
}

export interface ProtectedIntakeResponse {
  status: number;
  headers: Record<string, string>;
  body: ProtectedIntakeResponseBody;
}

export interface ProtectedIntakePersistResult {
  intakeId: string;
}

export interface ProtectedIntakeDependencies {
  persistIntake?: (payload: WebsiteIntakePayload) => Promise<ProtectedIntakePersistResult>;
}

const responseHeaders = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store'
};

function getHeader(headers: Record<string, string | undefined>, name: string): string {
  const wanted = name.toLowerCase();
  const entry = Object.entries(headers).find(([key]) => key.toLowerCase() === wanted);
  return entry?.[1]?.trim() ?? '';
}

function splitCsv(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function constantTimeEquals(left: string, right: string): boolean {
  if (left.length !== right.length) return false;

  let result = 0;
  for (let index = 0; index < left.length; index += 1) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return result === 0;
}

function makeResponse(status: number, body: ProtectedIntakeResponseBody): ProtectedIntakeResponse {
  return {
    status,
    headers: responseHeaders,
    body
  };
}

function validateOrigin(request: ProtectedIntakeRequest, env: ProtectedIntakeEnvironment): string | null {
  const allowedOrigins = splitCsv(env.ALLOWED_INTAKE_ORIGINS);
  if (!allowedOrigins.length) return null;

  const origin = getHeader(request.headers, 'origin') || getHeader(request.headers, 'referer');
  if (!origin) return 'Missing origin header.';

  const normalizedOrigin = origin.replace(/\/$/, '');
  const allowed = allowedOrigins.some((allowedOrigin) => normalizedOrigin.startsWith(allowedOrigin.replace(/\/$/, '')));

  return allowed ? null : 'Origin is not allowed.';
}

function validateSharedSecret(request: ProtectedIntakeRequest, env: ProtectedIntakeEnvironment): string | null {
  const configuredSecret = env.INTAKE_SHARED_SECRET?.trim() ?? '';
  if (!configuredSecret) return 'INTAKE_SHARED_SECRET is not configured.';

  const suppliedSecret = getHeader(request.headers, 'x-rosevear-intake-secret');
  if (!suppliedSecret) return 'Missing x-rosevear-intake-secret header.';

  return constantTimeEquals(configuredSecret, suppliedSecret) ? null : 'Invalid intake secret.';
}

function parsePayload(bodyText: string): WebsiteIntakePayload | string {
  try {
    return JSON.parse(bodyText) as WebsiteIntakePayload;
  } catch {
    return 'Request body must be valid JSON.';
  }
}

export function validateWebsiteIntakePayload(payload: WebsiteIntakePayload): string[] {
  const errors: string[] = [];

  if (!payload || typeof payload !== 'object') {
    return ['Payload must be an object.'];
  }

  if (!allowedWebsiteIntakeBrands.includes(payload.brand)) {
    errors.push('brand must be rosiedazzlers or devilndove.');
  }

  if (payload.brand && !isAllowedWebsiteIntakeType(payload.brand, payload.intakeType)) {
    errors.push('intakeType is not allowed for the selected brand.');
  }

  if (!payload.source?.site) errors.push('source.site is required.');
  if (!payload.source?.formName) errors.push('source.formName is required.');
  if (!payload.source?.submittedAt) errors.push('source.submittedAt is required.');
  if (!payload.contact?.name) errors.push('contact.name is required.');
  if (!payload.contact?.email && !payload.contact?.phone) errors.push('contact.email or contact.phone is required.');
  if (!payload.request?.subject) errors.push('request.subject is required.');
  if (!payload.request?.message) errors.push('request.message is required.');

  return errors;
}

export async function handleProtectedWebsiteIntake(
  request: ProtectedIntakeRequest,
  env: ProtectedIntakeEnvironment,
  dependencies: ProtectedIntakeDependencies = {}
): Promise<ProtectedIntakeResponse> {
  if (env.ENABLE_PROTECTED_INTAKE_ENDPOINT !== 'true') {
    return makeResponse(503, {
      accepted: false,
      mode: 'disabled',
      error: 'Protected intake endpoint is disabled.'
    });
  }

  if (request.method.toUpperCase() !== 'POST') {
    return makeResponse(405, {
      accepted: false,
      mode: 'rejected',
      error: 'Only POST is allowed.'
    });
  }

  const originError = validateOrigin(request, env);
  if (originError) {
    return makeResponse(403, {
      accepted: false,
      mode: 'rejected',
      error: originError
    });
  }

  const secretError = validateSharedSecret(request, env);
  if (secretError) {
    return makeResponse(401, {
      accepted: false,
      mode: 'rejected',
      error: secretError
    });
  }

  const parsedPayload = parsePayload(request.bodyText);
  if (typeof parsedPayload === 'string') {
    return makeResponse(400, {
      accepted: false,
      mode: 'rejected',
      error: parsedPayload
    });
  }

  const validationErrors = validateWebsiteIntakePayload(parsedPayload);
  if (validationErrors.length) {
    return makeResponse(422, {
      accepted: false,
      mode: 'rejected',
      error: 'Payload validation failed.',
      warnings: validationErrors
    });
  }

  if (!dependencies.persistIntake) {
    return makeResponse(202, {
      accepted: true,
      mode: 'dry_run',
      warnings: ['Payload passed validation, but no live persistence adapter is wired yet.']
    });
  }

  const result = await dependencies.persistIntake(parsedPayload);

  return makeResponse(202, {
    accepted: true,
    mode: 'stored',
    intakeId: result.intakeId
  });
}
