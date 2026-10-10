-- QL-088 migration-history adoption
-- Existing remote migration version: 20261003185925
-- Existing remote migration name: ql_007_security_performance_indexes
--
-- This file intentionally preserves Supabase GitHub integration history for an
-- already-applied remote migration that predated the repo's root supabase/
-- scaffold. Do not reapply destructive schema work here.
--
-- Runtime boundary: no live Phone/SMS/provider/customer/archive/retention work.
select 1 as ql_088_adopt_existing_migration_20261003185925;
