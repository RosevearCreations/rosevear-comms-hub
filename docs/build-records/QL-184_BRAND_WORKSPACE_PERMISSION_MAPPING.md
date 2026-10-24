# QL-184 — Brand Workspace Permission Mapping

**Repo:** `RosevearCreations/rosevear-comms-hub`  
**Release target:** `dev` → `main` exact-main GREEN; public disabled preview only.

## Delivered implementation

- New pure proposed permission model `ql184BrandWorkspacePermissions.ts`, aligned with QL-009 `AppAdminRole` and two existing `BrandId`s. It defines 11 resource actions, strict assigned-brand and active-brand checks, denied unknown fields/scopes, and an unconditional runtime deny even for illustrative owner roles.
- New `Ql184BrandWorkspacePermissionPreview.tsx`, integrated into the existing Safety & hold review workspace with illustrative role, assigned brand, requested brand and operation selectors. Includes a semantic role/action table, accessible outcomes and an explanatory help panel. All state is in-memory and resets when the active business changes.
- Tests cover both brands, signed-out/staff/admin/owner, scope omission, cross-brand traversal, malformed/tampered inputs, all action combinations, DOM labels, no storage/network writes and disabled live controls.
- Security design record `docs/QL-184_BRAND_WORKSPACE_PERMISSION_MAPPING.md` reconciles existing synthetic public Data API/RLS views and the private-data authorization work still required.

## Never activated

No production or staging Supabase role grant, RLS migration, auth change, owner permission, real customer access/export, private business identity, phone/SMS provider, database write, personal line, or pilot is created or enabled. QL-181 continues to hold all **12/12** live prerequisites. QL-184's green application deployment would mean **only that this synthetic design preview ships**, not that any human/independent security review has approved real access.

## Evidence gate

Local tests, exact-main check names/SHA and public Pages artifact receipt must be appended to the merged promotion PR after successful verification. This checked-in draft record does **not** claim GREEN in advance.
