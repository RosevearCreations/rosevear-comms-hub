# QL-312 — Standard Theme Tokens, Graphic Cards, Typography & Visual Consistency

## Shared visual system in the disabled preview

The production application uses a single **Standard Theme** token layer at `app/src/operator/ql312-theme.css`. Its scoped variables define readable light cards, dark command panels, ink, muted text, borders, focus, shared card spacing and six category accents. The existing 56 functional workspaces and seven QL-311 navigation sections are retained.

The shell now exposes two **in-session, visual-only** choices:

| Setting | Options | Actual behaviour |
| --- | --- | --- |
| Card density | Comfortable (default) / Compact | Adjusts common operator/IT/management/statistics/status card padding, selected metric heights and grid gaps. Touch targets remain usable. |
| Contrast | Standard (default) / High | Strengthens card outlines, labels and selected-state borders in bright and dark surfaces. Keyboard focus stays visible. |

Changes are held in React memory for the current page. They **do not** add a local-storage key, modify a customer preference, change an authorization decision or turn on an integration. The earlier QL-272 layout preference inside I.T./Management/Statistical/System Status is a separate view-specific presentation control; it retains its existing verified behaviour.

## Cards, charts and status meanings

- **Front End / Operator:** bright dashboard KPI cards now have coordinated cyan/violet/gold/green top borders, clearer typographic hierarchy and shared radius/spacing.
- **Admin:** accessible operator-review cards receive the same padding and border standards without overwriting forms or disposition logic.
- **I.T. / Connections:** dark registry cards, six-app source cards and command KPIs adopt the shared card shell and stronger secondary text.
- **Management:** status cards and management metrics receive consistent graphic accents and focus-safe borders.
- **Statistical:** synthetic chart bars, labels and notes receive improved legibility and a larger contrast-bounded bar track; category names and values remain visible, not colour-only.
- **System Status:** hold and evidence badges retain their literal labels; high contrast adds stronger borders and underlined status wording.

The **ⓘ Colour & status guide** shows all six named accents and the meanings of **PREVIEW ONLY**, **DISCONNECTED / HOLD** and **UNDER REVIEW**. These three are different informational states, not success/integration indicators. The true six-app connection status remains **DISCONNECTED / HOLD** and ACK evidence stays **UNDER_REVIEW / PARKED_FOR_LATER**.

## Review and comparison matrix

The machine-readable [visual capture matrix](visual/ql312-standard-theme-capture-matrix.json) lists all six category landing screens, five viewports (320/375/768/1024/1440 px), 100/200/400% zoom and four density/contrast combinations. This is a **repeatable screenshot plan**, not a claim that screenshots or physical owner-device acceptance were captured. Automated regressions inspect the themed DOM, controls, legacy QL-291 layout compatibility, tokens, light/dark/status colour contrast and responsive/forced-colours CSS; physical-device and screenshot-difference review remains genuinely pending.

## Safe configuration and sources

This build does not require or set `VITE_ENABLE_SUPABASE_CLIENT`, `VITE_ENABLE_HOSTED_DATABASE`, `VITE_SUPABASE_URL` or `VITE_SUPABASE_PUBLISHABLE_KEY`. Public six-app proof handoff requires no key. The earlier [QL-311 setup guide](QL-311_NAVIGATION_AND_OPTIONAL_SUPABASE_SETUP.md) remains the authority for **local `app/.env.local`**, **Cloudflare Builds → Build variables and secrets**, and **GitHub Actions → Variables** under separate authorization. `VITE_` values are public browser build-time data, never appropriate for secret/service-role keys.

The theme does not authorize calls, SMS, dispatch, private gateway access, Supabase writes, signed proof publication, owner sign-off or TEST activation. Production GREEN verifies software deployment only.

## References

- [Shared theme CSS](../app/src/operator/ql312-theme.css)
- [Display controls](../app/src/operator/Ql312ThemeControls.tsx)
- [W3C WCAG contrast minimum guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
- [W3C reflow understanding (zoom and narrow viewports)](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)
- [MDN forced-colors](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors)
