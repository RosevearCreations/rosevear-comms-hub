# ADR-0004 — Vite React TypeScript Scaffold

## Status

Accepted.

## Context

Rosevear Comms Hub needs a first runnable admin shell, but production hosting should remain undecided while existing Cloudflare/Vercel usage is reviewed.

## Decision

Use Vite + React + TypeScript for QL-002.

## Consequences

Positive:

- Small local development loop.
- Static-first app can later deploy to multiple providers.
- Simple TypeScript model for brand-aware workflows.
- No backend choice forced in QL-002.

Trade-offs:

- Routing, server rendering, and backend endpoints are not provided by default.
- A separate API or backend decision is still required in QL-003.
- Authentication is not implemented in QL-002.

## Guardrails

- Do not connect live phone/SMS in the UI scaffold.
- Do not store real customer data in static sample files.
- Keep AI/customer-send actions disabled until human approval and compliance rules are implemented.
