# QL-166 — Operator Preview Readability & Accessibility Repair

The public disabled operator preview now has a responsive, keyboard-operable synthetic evidence panel. The QL-165 read-only fixture safeguards and owner authorization restrictions are unchanged.

## Implemented

- Added an explicitly labelled, non-modal dialog with stable `aria-controls`, `aria-expanded`, `aria-labelledby` and `aria-describedby` relationships.
- On opening, focus moves to the Close button. Close and Escape return focus to the toggle; all keyboard actions remain local UI state.
- The synthetic brand filter is a labelled group with `aria-pressed` reflecting the selected brand, not an approval or live action.
- A polite screen-reader status announces source/fallback and fixture-pin status. Three navigation links jump to current owner safeguards, synthetic acceptance, and runtime lock headings.
- Long status labels, mixed-size headings, nested grids and cards wrap without forcing horizontal overflow. Controls meet 44px touch targets, maintain visible keyboard focus, and have styles for narrow screens and forced-colours mode. The low-contrast teal eyebrow text was darkened.
- Dev-only jsdom interaction tests validate focus, Escape, Close, brand announcements, dialog labels, links and essential CSS rules.

## Acceptance evidence

- `npm ci --no-audit --no-fund` using the committed lockfile.
- `npm run check`, `npm test`, `npm run build`, `npm run pages:build` must pass.
- Application CI retains QL-164 + QL-165 tests, and now has **34 automated tests total** (7 new QL-166 checks).
- Feature PR exact-head `app-build` SUCCESS before `dev`, promotion PR exact-head `app-build` SUCCESS before `main`, and final `main` exact-SHA SUCCESS on all five release checks.

The synthetic display does **not** enable real customer communications, Phone/SMS, callbacks, exports, database writes, owner sign-offs, or live operations.

Next scoped: **QL-167 — Brand Isolation & Synthetic Safe-Read Fallback Regression**.
