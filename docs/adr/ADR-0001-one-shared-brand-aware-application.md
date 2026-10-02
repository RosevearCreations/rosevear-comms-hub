# ADR-0001 — One Shared Brand-Aware Application

## Status

Accepted.

## Context

RosieDazzlers and DevilnDove both need the same communication foundation: contacts, conversations, messages, tasks, phone/SMS records, AI drafts, templates, and consent logs.

## Decision

Build one shared app with brand workspaces.

## Consequences

Positive:

- Less duplicated code.
- One place to improve phone/SMS/AI features.
- Future brands can be added.
- Shared reporting becomes possible.

Tradeoffs:

- Brand separation must be handled carefully.
- Permissions must be designed from the start.
- Brand-specific wording/templates must not bleed across workspaces.
