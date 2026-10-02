# 00 — Master Source of Truth

## Project name

**Rosevear Comms Hub**

Internal concept name: **Quo-lite**.

## Purpose

Build one shared communication hub for both Rosevear businesses:

- **RosieDazzlers** — mobile auto detailing, quote requests, bookings, missed calls, text follow-ups, photos, packages, add-ons, fleet inquiries.
- **DevilnDove** — custom order intake, product questions, personalization, material questions, maker-story capture, customer follow-up.

The system should reduce communication chaos, protect our time, and help us respond professionally without losing messages across personal phones, business phones, email, website forms, and future phone/SMS providers.

## One-sentence product definition

A brand-aware inbox that captures every customer conversation, organizes it into contacts and workflows, creates follow-up tasks, and uses AI only to summarize, recommend, and draft messages for human approval.

## Core decision

Build **one shared app** with separate brand workspaces.

```text
Rosevear Comms Hub
  ├─ RosieDazzlers workspace
  └─ DevilnDove workspace
```

Each workspace has its own:

- public name
- phone/SMS settings later
- website integration settings
- intake forms
- templates
- tags
- workflows
- AI knowledge rules
- compliance copy

The shared app has one common data model and one admin experience.

## Why one shared app

A separate app for each business would duplicate the same hard parts: contacts, conversations, phone logging, SMS, AI summaries, consent logs, task reminders, templates, attachments, and search.

One shared app is cleaner because both companies need the same communication foundation, but different workflows.

## Immediate business problem

The issue is not only getting leads. The issue is managing the lead after it arrives:

- missed calls
- repeated texts
- quote confusion
- unpaid extras
- low-fit customers
- incomplete information
- forgotten follow-ups
- messages split across phones
- personal/business number overlap
- no clear record of what was promised

## First brand priority

RosieDazzlers first.

Reason: the detailing business has the strongest immediate need for phone support, missed-call handling, quote intake, photo requests, service-area checks, package selection, and follow-up tasks.

DevilnDove second, but included from day one in the schema and brand config.

## Current phone reality

Known starting constraints:

- There is a Bell Fibe home phone number.
- RosieDazzlers currently uses a cell phone.
- DevilnDove currently uses another number that is also a personal cell for Laurie.
- Existing hosting resources are already in use: two free Cloudflare projects and one Vercel project.

## Phone decision rule

Do **not** port or risk existing numbers until the system proves itself.

Start with phone-provider-neutral design. Later test with a new VoIP number or forwarding before any porting.

## MVP promise

QL-001 and QL-002 do not need live phone service. They need the structure that phone service will feed into.

The first useful phone workflow is:

```text
missed call → auto text or manual follow-up prompt → quote/custom-order link → admin task → AI summary/draft
```

## Human approval rule

AI may:

- summarize
- suggest tags
- suggest next action
- draft replies
- identify missing information
- flag possible low-fit/high-effort leads

AI may **not** send customer messages without human approval.

## Privacy rule

No call recording, transcription, or AI processing of calls should go live until consent language, retention rules, and access controls are implemented.

## Stage definitions

### QL-001 — Structure and documentation foundation

Create repository structure, source-of-truth documents, brand configs, data model draft, telephony option notes, compliance notes, and build roadmap.

### QL-002 — App foundation

Create the actual project scaffold and local admin shell.

### QL-003 — Database foundation

Implement brand-aware contacts, conversations, messages, intake requests, follow-up tasks, tags, consent logs, and audit fields.

### QL-004 — RosieDazzlers intake workflow

Connect detailing quote intake into the shared hub.

### QL-005 — DevilnDove intake workflow

Connect custom order/product question intake into the shared hub.

### QL-006 — Phone-ready records

Add call, voicemail, missed-call, SMS-ready records without live provider integration.

### QL-007 — Test provider integration

Connect one test phone/SMS provider or PBX path. No existing number porting yet.

## Repository status

This repo is the source of truth for the shared communication hub. Existing RosieDazzlers and DevilnDove repos remain the source of truth for their public websites/apps until integrations are intentionally added.
