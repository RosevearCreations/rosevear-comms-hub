# Remote Operator Checklist — QL-025 Purchase Evidence Intake

Use this checklist when completing or reviewing QL-025.

## Allowed

- Record the chosen provider label.
- Record the target use label.
- Record CAD monthly/setup costs as numbers.
- Record a safe alias for the purchased number.
- Record where the number and purchase documents are stored outside the repo.
- Confirm all redaction and safety checks.

## Not allowed

- Do not record the phone number.
- Do not record candidate numbers.
- Do not upload screenshots, invoices, receipts, or ownership documents.
- Do not record provider credentials, SIP credentials, tokens, passwords, or webhook secrets.
- Do not enable any live phone/SMS feature.

## Review before promotion

- QL-025 helper exists.
- QL-025 fixture exists.
- README, `.env.example`, and build sequence point to QL-025 and QL-026.
- CI passes on PR.
- `dev` and `main` are promoted to the exact same tree.
- CI passes on `main`.
