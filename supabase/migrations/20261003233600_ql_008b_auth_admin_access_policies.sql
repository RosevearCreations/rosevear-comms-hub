-- QL-088 migration-history adoption
-- Existing remote migration version: 20261003233600
-- Existing remote migration name: ql_008b_auth_admin_access_policies
--
-- This file intentionally preserves Supabase GitHub integration history for an
-- already-applied remote migration that predated the repo's root supabase/
-- scaffold. Do not reapply destructive schema work here.
--
-- Runtime boundary: no live Phone/SMS/provider/customer/archive/retention work.
select 1 as ql_088_adopt_existing_migration_20261003233600;
