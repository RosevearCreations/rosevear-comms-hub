# ADR-0002 — Provider-Neutral Telephony First

## Status

Accepted.

## Context

Possible paths include 3CX, FreePBX/Asterisk, direct API providers, VoIP.ms, and forwarding existing numbers.

Existing numbers include Bell Fibe home phone, RosieDazzlers cell, and a DevilnDove/personal dual-use cell.

## Decision

Do not choose a permanent phone provider in QL-001. Design neutral call/SMS records and test with a safe test number later.

## Consequences

Positive:

- Existing numbers are protected.
- We can compare providers fairly.
- Data model will support different providers.

Tradeoffs:

- Phone automation comes later.
- Early workflow testing may be manual.
