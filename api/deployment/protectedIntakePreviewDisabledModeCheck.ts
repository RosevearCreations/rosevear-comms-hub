// QL-019 Protected Intake Preview Disabled-Mode Check
//
// Verifies that the protected intake preview route stays safely disabled by default.
// This helper does not enable the endpoint, does not connect public forms, and does not
// write customer data.

import {
  handleProtectedWebsiteIntake,
  type ProtectedIntakeEnvironment,
  type ProtectedIntakeRequest
} from '../endpoints/protectedIntakeEndpoint';

export interface DisabledModeExpectation {
  expectedStatus: 503;
  expectedMode: 'disabled';
  expectedAccepted: false;
}

export interface DisabledModeCheckResult extends DisabledModeExpectation {
  checkedAt: string;
  target: 'contract' | 'preview_url';
  route: string;
  actualStatus: number;
  actualMode: string;
  actualAccepted: boolean;
  passed: boolean;
  error?: string;
}

export interface DisabledModePreviewConfig {
  previewUrl?: string;
  route?: string;
}

type FetchLike = (input: string, init?: { method?: string; headers?: Record<string, string>; body?: string }) => Promise<{
  status: number;
  json: () => Promise<{ mode?: string; accepted?: boolean; error?: string }>;
}>;

const expectation: DisabledModeExpectation = {
  expectedStatus: 503,
  expectedMode: 'disabled',
  expectedAccepted: false
};

const disabledContractRequest: ProtectedIntakeRequest = {
  method: 'POST',
  headers: {
    origin: 'https://rosiedazzlers.ca',
    'content-type': 'application/json'
  },
  bodyText: JSON.stringify({})
};

const disabledContractEnv: ProtectedIntakeEnvironment = {
  ENABLE_PROTECTED_INTAKE_ENDPOINT: 'false',
  ENABLE_INTAKE_PERSISTENCE: 'false',
  ALLOWED_INTAKE_ORIGINS: 'https://rosiedazzlers.ca,https://devilndove.com,https://devilndove.online'
};

export async function runProtectedIntakeDisabledModeContractCheck(): Promise<DisabledModeCheckResult> {
  const response = await handleProtectedWebsiteIntake(disabledContractRequest, disabledContractEnv);
  const actualMode = response.body.mode;
  const actualAccepted = response.body.accepted;
  const passed =
    response.status === expectation.expectedStatus &&
    actualMode === expectation.expectedMode &&
    actualAccepted === expectation.expectedAccepted;

  return {
    ...expectation,
    checkedAt: new Date().toISOString(),
    target: 'contract',
    route: '/api/intake',
    actualStatus: response.status,
    actualMode,
    actualAccepted,
    passed,
    error: passed ? undefined : response.body.error
  };
}

export async function runProtectedIntakePreviewDisabledModeCheck(
  config: DisabledModePreviewConfig,
  fetcher: FetchLike
): Promise<DisabledModeCheckResult> {
  const route = config.route ?? '/api/intake';
  const previewUrl = config.previewUrl?.replace(/\/$/, '');

  if (!previewUrl) {
    return {
      ...expectation,
      checkedAt: new Date().toISOString(),
      target: 'preview_url',
      route,
      actualStatus: 0,
      actualMode: 'missing_preview_url',
      actualAccepted: false,
      passed: false,
      error: 'PROTECTED_INTAKE_PREVIEW_URL is not configured.'
    };
  }

  const response = await fetcher(`${previewUrl}${route}`, {
    method: 'POST',
    headers: {
      origin: 'https://rosiedazzlers.ca',
      'content-type': 'application/json'
    },
    body: JSON.stringify({})
  });
  const body = await response.json();
  const actualMode = body.mode ?? 'missing_mode';
  const actualAccepted = body.accepted === true;
  const passed =
    response.status === expectation.expectedStatus &&
    actualMode === expectation.expectedMode &&
    actualAccepted === expectation.expectedAccepted;

  return {
    ...expectation,
    checkedAt: new Date().toISOString(),
    target: 'preview_url',
    route,
    actualStatus: response.status,
    actualMode,
    actualAccepted,
    passed,
    error: passed ? undefined : body.error
  };
}
