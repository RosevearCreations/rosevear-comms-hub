# QL-172 — Unified Operator Shell & Accessible Navigation

**Scope:** UI navigation and context only; this release does not authorize or activate live service, Supabase customer-data writes, actual operator approvals, call/SMS dispatch, provider callbacks or persistence beyond the previously existing browser-local QL-004 demo.

## Delivered

1. `app/src/operator/OperatorShell.tsx` is now the shared entry point inside the existing `AdminSessionGate`. One labelled navigation selects **Local inbox**, **Synthetic conversations**, **Safety & hold review**, or **Phone/SMS safety**. The shared two-brand selector switches Rosie Dazzlers and Devil n Dove context.
2. Existing QL-004 inbox, QL-090 synthetic sample preview, QL-093–169 read-only review and QL-068 disabled console render as inline views rather than independent floating overlays. Legacy standalone components still support their prior non-modal panel behaviour when not embedded.
3. Selected business context passes into the local inbox and both synthetic views; switching the brand inside a preview updates the shell. This is browser display filtering, **not** a new cross-tenant authorization layer.
4. Each major view shares a persistent **DISABLED PREVIEW** banner, an explicit no-dispatch label, and accessible heading. Keyboard users get a skip link, native button navigation, current-page indication, visible focus rings and focus moved to the selected workspace heading on explicit navigation.
5. Mobile layout stacks navigation at narrow widths. The QL-004 local demo warns against entry of real personal information. The historical QL-068 panel is explicitly labelled a historical planning artifact so its references to future hosting cannot be mistaken for today's state.

## Acceptance checklist

| Scenario | Expected result |
| --- | --- |
| Initial load | One operator workspace navigation with four sections, two brand choices and a visible disabled-preview boundary |
| Rosie → Devil n Dove | Shared brand context updates the inbox and synthetic preview; the opposite brand is not shown as selected |
| Any section change | `aria-current` follows the chosen workspace and keyboard focus moves to its heading |
| Synthetic conversations | Embedded region shows local read-only drafts and disabled actions; no provider delivery |
| Governance review | Embedded region retains fixture provenance/fallback/hold evidence but does not become an owner-approval action |
| Phone/SMS safety | Clearly historical disabled reference; all action controls remain blocked |
| Responsive/forced colours | Navigation stacks, minimum 48px controls, visible focus, no popover overlay |
| Source drift | QL-171 audit remains passing after the new shared mount, with no unexpected browser data sinks |

## Verification

```bash
node scripts/ql171-operator-baseline.mjs
node --test scripts/__tests__/ql171-operator-baseline.test.mjs
cd app && npm run check && npm test && npm run build && npm run pages:build
```

**Residual gaps:** G01–G02 and G04–G14 in QL-171 remain unresolved and held for QL-173–182. Shared UI navigation does not replace server-side brand isolation, consent or private-data access controls. No real owner approval has been captured. Deployment GREEN only verifies the disabled preview artifact for the exact main revision.
