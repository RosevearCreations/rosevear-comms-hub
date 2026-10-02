# 01 — Decision Record

This file records major decisions so we do not keep re-litigating the same architecture questions.

## DR-001 — Create a new repository

**Decision:** Create a new repo for the shared communications hub.

**Status:** Accepted.

**Reason:** The hub is not purely part of RosieDazzlers or DevilnDove. It is a reusable shared system for both brands and future brands.

**Result:** Repository: `RosevearCreations/rosevear-comms-hub`.

## DR-002 — One shared app, brand workspaces

**Decision:** Build one application with brand-aware records instead of two separate applications.

**Status:** Accepted.

**Reason:** Both businesses need contacts, conversations, messages, phone logs, tasks, AI drafts, templates, and consent logs. Duplicating those systems would increase maintenance.

**Implementation rule:** Every customer-facing record must include a `brand` value.

Accepted brand keys:

- `rosiedazzlers`
- `devilndove`

## DR-003 — RosieDazzlers first operational workflow

**Decision:** Build RosieDazzlers first, while keeping DevilnDove in the data model and configs.

**Status:** Accepted.

**Reason:** RosieDazzlers has the urgent phone/quote/missed-call workflow need.

## DR-004 — Provider-neutral telephony first

**Decision:** Do not choose 3CX, FreePBX, Asterisk, Twilio, Telnyx, VoIP.ms, or any other provider as the permanent answer in QL-001.

**Status:** Accepted.

**Reason:** Existing numbers matter. We need a safe test path before forwarding or porting. Provider choice should follow the workflow, not lead it.

## DR-005 — Do not port existing numbers first

**Decision:** Do not port Bell Fibe, RosieDazzlers cell, or Laurie personal/DevilnDove dual-use number during the first implementation phase.

**Status:** Accepted.

**Reason:** Porting has risk. A test number or forwarding experiment is safer.

## DR-006 — AI drafts only

**Decision:** AI may draft, summarize, tag, and recommend. AI must not send customer messages without human approval.

**Status:** Accepted.

**Reason:** Price quotes, expectations, health/privacy context, and customer commitments need human review.

## DR-007 — Documentation-first build

**Decision:** QL-001 creates repo structure and documentation before code.

**Status:** Accepted.

**Reason:** We need a shared source of truth before building phone, SMS, AI, and brand integrations.

## DR-008 — Hosting decision deferred

**Decision:** Do not choose final hosting in QL-001.

**Status:** Accepted.

**Reason:** Existing Cloudflare and Vercel free resources are already constrained. The repo can be built first, and deployment can be chosen when we know runtime needs.

Possible future options:

- add to existing Vercel app if practical
- add to existing Cloudflare/Supabase stack if practical
- host on a small VPS if telephony requires persistent services
- hybrid: website/app on static hosting, telephony worker on VPS
