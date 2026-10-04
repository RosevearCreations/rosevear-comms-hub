// QL-016 Vercel protected intake wrapper template.
//
// This file is intentionally stored under runtimes/vercel/ and is not live.
// Do not copy it to api/intake.ts until QL-017 preview verification.

import { handleProtectedWebsiteIntake } from '../../../api/endpoints/protectedIntakeEndpoint';

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
