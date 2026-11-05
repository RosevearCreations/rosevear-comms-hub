-- QL-336: broker metadata for two future reusable business shells. Does not
-- migrate, provision or authorize a Rosie or Devil business/child tenant.
-- Existing QL-335 YW/iCamp constraints and HOLD receipts remain unchanged.
ALTER TABLE public.master_shell_handshake_profiles
  DROP CONSTRAINT master_shell_handshake_profiles_check;
ALTER TABLE public.master_shell_handshake_profiles
  ADD CONSTRAINT master_shell_handshake_profiles_check CHECK (
    (shell_id='yw' AND source_app_id='yard-workers') OR
    (shell_id='icamp' AND source_app_id='icamp') OR
    (shell_id='rosiedazzlers' AND source_app_id='rosiedazzlers') OR
    (shell_id='devilndove' AND source_app_id='devilndove')
  );
INSERT INTO public.master_shell_handshake_profiles(shell_id,source_app_id) VALUES
  ('rosiedazzlers','rosiedazzlers'),('devilndove','devilndove')
  ON CONFLICT (shell_id) DO NOTHING;

CREATE TABLE public.master_owned_child_shell_gates_ql336 (
  shell_id text PRIMARY KEY REFERENCES public.master_shell_handshake_profiles(shell_id) ON DELETE RESTRICT,
  first_child_slug text NOT NULL CHECK (
    (shell_id='rosiedazzlers' AND first_child_slug='rosie-dazzlers') OR
    (shell_id='devilndove' AND first_child_slug='devil-n-dove')),
  original_data_backup_verified boolean NOT NULL DEFAULT false CHECK (original_data_backup_verified=false),
  source_migration_approved boolean NOT NULL DEFAULT false CHECK (source_migration_approved=false),
  child_isolation_verified boolean NOT NULL DEFAULT false CHECK (child_isolation_verified=false),
  source_owner_test_authorized boolean NOT NULL DEFAULT false CHECK (source_owner_test_authorized=false),
  status text NOT NULL DEFAULT 'HOLD' CHECK (status='HOLD'),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.master_owned_child_shell_gates_ql336 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_owned_child_shell_gates_ql336 FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.master_owned_child_shell_gates_ql336 FROM PUBLIC,anon,authenticated;
INSERT INTO public.master_owned_child_shell_gates_ql336(shell_id,first_child_slug) VALUES
  ('rosiedazzlers','rosie-dazzlers'),('devilndove','devil-n-dove');
