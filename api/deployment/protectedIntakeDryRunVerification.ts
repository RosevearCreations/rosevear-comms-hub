// QL-017 Protected Intake Dry-Run Runtime Verification
//
// This helper verifies the protected-intake handler contract without deploying a live route.
// It does not connect a public website, does not write customer data, and does not require
// anonymous Supabase policies.

import {
  handleProtectedWebsiteIntake,
  type ProtectedIntakeEnvironment,
  type ProtectedIntakeRequest
} from '../endpoints/protectedIntakeEndpoint';

export type DryRunCaseId = 'disabled_gate' | 'invalid_secret' | 'valid_dry_run';

export interface ProtectedIntakeDryRunExpectation {
  caseId: DryRunCaseId;
  expectedStatus: number;
  expectedMode: 'disabled' | 'rejected' | 'dry_run';
  expectedAccepted: boolean;
}

export interface ProtectedIntakeDryRunResult extends ProtectedIntakeDryRunExpectation {
  actualStatus: number;
  actualMode: string;
  actualAccepted: boolean;
  passed: boolean;
  error?: string;
}

export interface ProtectedIntakeDryRunReport {
  generatedAt: string;
  allPassed: boolean;
  results: ProtectedIntakeDryRunResult[];
  warnings: string[];
}

const sharedSecret = 'ql017-dry-run-secret-do-not-use-in-production';
const allowedOrigin = 'https://rosiedazzlers.ca';

const validPayload = {
  brand: 'rosiedazzlers',
  intakeType: 'detailing_quote',
  source: {
    site: 'rosiedazzlers.ca',
    formName: 'QL-017 Dry Run Intake Test',
    pageUrl: 'https://rosiedazzlers.ca/contact',
    submittedAt: '2026-10-04T00:00:00.000Z'
  },
  contact: {
    name: 'Dry Run Test Customer',
    email: 'dry-run@example.invalid',
    phone: '555-0100',
    town: 'Tillsonburg',
    preferredReplyChannel: 'email'
  },
  request: {
    subject: 'Dry-run protected intake verification',
    message: 'This is a non-production dry-run payload used to verify handler behavior only.',
    flags: ['human_review'],
    recommendedService: 'basic_detail'
  },
  consent: {
    canContact: true,
    canText: false,
    marketingOptIn: false,
    consentText: 'Dry-run test payload only. No customer record should be stored.'
  }
};

function makeRequest(secret: string): ProtectedIntakeRequest {
  return {
    method: 'POST',
    headers: {
      origin: allowedOrigin,
      'content-type': 'application/json',
      'x-rosevear-intake-secret': secret
    },
    bodyText: JSON.stringify(validPayload)
  };
}

const cases: Array<{
  expectation: ProtectedIntakeDryRunExpectation;
  env: ProtectedIntakeEnvironment;
  request: ProtectedIntakeRequest;
}> = [
  {
    expectation: {
      caseId: 'disabled_gate',
      expectedStatus: 503,
      expectedMode: 'disabled',
      expectedAccepted: false
    },
    env: {
      ENABLE_PROTECTED_INTAKE_ENDPOINT: 'false',
      INTAKE_SHARED_SECRET: sharedSecret,
      ALLOWED_INTAKE_ORIGINS: allowedOrigin
    },
    request: makeRequest(sharedSecret)
  },
  {
    expectation: {
      caseId: 'invalid_secret',
      expectedStatus: 401,
      expectedMode: 'rejected',
      expectedAccepted: false
    },
    env: {
      ENABLE_PROTECTED_INTAKE_ENDPOINT: 'true',
      INTAKE_SHARED_SECRET: sharedSecret,
      ALLOWED_INTAKE_ORIGINS: allowedOrigin
    },
    request: makeRequest('wrong-secret')
  },
  {
    expectation: {
      caseId: 'valid_dry_run',
      expectedStatus: 202,
      expectedMode: 'dry_run',
      expectedAccepted: true
    },
    env: {
      ENABLE_PROTECTED_INTAKE_ENDPOINT: 'true',
      INTAKE_SHARED_SECRET: sharedSecret,
      ALLOWED_INTAKE_ORIGINS: allowedOrigin
    },
    request: makeRequest(sharedSecret)
  }
];

export async function runProtectedIntakeDryRunVerification(): Promise<ProtectedIntakeDryRunReport> {
  const results: ProtectedIntakeDryRunResult[] = [];

  for (const testCase of cases) {
    const response = await handleProtectedWebsiteIntake(testCase.request, testCase.env);
    const actualMode = response.body.mode;
    const actualAccepted = response.body.accepted;
    const passed =
      response.status === testCase.expectation.expectedStatus &&
      actualMode === testCase.expectation.expectedMode &&
      actualAccepted === testCase.expectation.expectedAccepted;

    results.push({
      ...testCase.expectation,
      actualStatus: response.status,
      actualMode,
      actualAccepted,
      passed,
      error: passed ? undefined : response.body.error
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    allPassed: results.every((result) => result.passed),
    results,
    warnings: [
      'Dry-run verification uses a non-production shared secret and example.invalid email.',
      'This helper does not deploy or expose a public endpoint.',
      'Production persistence remains disabled until a later gate.'
    ]
  };
}
