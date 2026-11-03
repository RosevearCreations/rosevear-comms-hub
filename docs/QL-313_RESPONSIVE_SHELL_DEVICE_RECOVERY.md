# QL-313 — Responsive Operator Shell, Touch Targets & Device Layout Recovery

**Mode:** disabled-preview only. **Authorization:** visual and local interaction improvements only. Six apps remain `DISCONNECTED / HOLD`; ACK delivery evidence remains `UNDER_REVIEW / PARKED_FOR_LATER`.

## What changes for an operator

- Desktop retains the existing categorized sidebar. At widths of **850 CSS pixels or less**, a prominent **Browse workspaces** control appears above the workspace; the long category menu is collapsed initially so the current task has room.
- Expand **Browse workspaces** to select a business or a workspace. Selecting a workspace closes the menu and restores focus to the destination heading. **Done browsing** or **Escape** closes it and returns keyboard focus to the Browse control.
- Rotating a phone or resizing a window beyond the mobile breakpoint closes the temporary menu. The selected business, current workspace, typed navigation search, and QL-312 compact/contrast settings are not reset by this layout change.
- Touch surfaces for navigation, controls, inputs and disclosure headings have a **44 CSS-pixel minimum height** at tablet and phone widths. Status text remains visible on narrow phones. Dense evidence tables scroll **inside their own card**, while the rest of the page remains readable.
- The contextual **Phone, tablet, zoom & table navigation help** is next to the theme controls in every workspace, with directions for menu focus and horizontal scrolling.

## Acceptance and evidence boundaries

The source-level/jsdom regressions check the menu, Escape, focus recovery, state retention, feature-gate text, breakpoint style rules and a planned matrix at **320, 375, 768, 1024, 1440 CSS px** with **100%, 200%, 400% zoom** and both orientations. A jsdom check does **not** render pixels or exercise a physical touch screen. Screenshots, full keyboard/AT exploration, real orientation recovery and owner device acceptance remain **PENDING** until evidence is collected.

The evidence template is [the QL-313 responsive viewport matrix](visual/ql313-responsive-viewports.json). For each actual device or browser check capture width, OS/browser, zoom, orientation, keyboard/touch observation, whether there was horizontal page overflow or clipped actions, screenshot link, reviewer and date. Do not populate these as passed without an observation.

## Connection and permissions reminder

This is a preview shell only: no provider key, live phone, SMS, customer dispatch or hosted database is necessary for a six-app proof handoff. Supabase settings `VITE_ENABLE_SUPABASE_CLIENT`, `VITE_ENABLE_HOSTED_DATABASE`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_PUBLISHABLE_KEY` are separate future browser-login configuration; **do not enable them for QL-313**. Production GREEN certifies this preview deployment, not six-app connection readiness or pilot authorization.
