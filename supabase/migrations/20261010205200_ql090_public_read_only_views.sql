-- QL-090 public read-only synthetic views for the browser-safe client scaffold.
-- This migration exposes only synthetic sample data and non-secret readiness status.
-- It does not expose live customer, provider, SMS, call, archive, retention, admin, or audit records.

create or replace view public.ql_public_synthetic_conversations
with (security_invoker = true)
as
select
  c.id,
  c.brand_id,
  b.name as brand_name,
  c.title,
  c.status,
  c.summary,
  c.draft,
  c.created_at
from public.ql_synthetic_conversations c
join public.ql_brands b on b.id = c.brand_id
where c.is_synthetic = true
  and c.is_live_enabled = false
  and b.is_enabled = true;

create or replace view public.ql_public_system_status
with (security_invoker = true)
as
select
  id,
  label,
  status,
  detail,
  created_at
from public.ql_readiness_checks;

grant select on public.ql_public_synthetic_conversations to anon, authenticated;
grant select on public.ql_public_system_status to anon, authenticated;

comment on view public.ql_public_synthetic_conversations is
  'QL-090 browser-safe public read-only view. Synthetic rows only; no live customer/provider/phone/SMS/archive/retention data.';

comment on view public.ql_public_system_status is
  'QL-090 browser-safe public read-only view for non-secret synthetic readiness status.';
