// QL-018 Protected Intake Preview Deployment Wiring
//
// Vercel-compatible preview route for the protected website intake endpoint.
// The handler remains disabled unless ENABLE_PROTECTED_INTAKE_ENDPOINT=true is set server-side.
// Persistence remains disabled unless a later build enables a reviewed repository adapter.

import { handleProtectedWebsiteIntake } from './endpoints/protectedIntakeEndpoint';

type HeaderValue = string | string[] | undefined;

type VercelLikeRequest = {
  method?: string;
  headers: Record<string, HeaderValue>;
  body?: unknown;
};

type VercelLikeResponse = {
  status: (statusCode: number) => VercelLikeResponse;
  setHeader: (name: string, value: string) => void;
  json: (body: unknown) => void;
};

type ServerEnvironment = Record<string, string | undefined>;

declare const process: { env: ServerEnvironment };

function normalizeHeaders(headers: Record<string, HeaderValue>): Record<string, string | undefined> {
  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key, Array.isArray(value) ? value.join(',') : value])
  );
}

function bodyToText(body: unknown): string {
  if (typeof body === 'string') return body;
  if (body === undefined || body === null) return '';
  return JSON.stringify(body);
}

export default async function intakeHandler(req: VercelLikeRequest, res: VercelLikeResponse) {
  const response = await handleProtectedWebsiteIntake(
    {
      method: req.method ?? 'GET',
      headers: normalizeHeaders(req.headers),
      bodyText: bodyToText(req.body)
    },
    process.env
  );

  Object.entries(response.headers).forEach(([name, value]) => {
    res.setHeader(name, value);
  });

  return res.status(response.status).json(response.body);
}
