# Remote Operator Supabase Setup Checklist

QL-006 supports remote GitHub-first work. The owner does not need local Bash for this stage.

## Current project target

```text
Project/account name: rosevearcreations
Project ref: gxujcwpktaickcgzyvnu
Project URL: https://gxujcwpktaickcgzyvnu.supabase.co
```

## Connector issue

The ChatGPT Supabase connector cannot access project `gxujcwpktaickcgzyvnu` yet.

## Owner action needed before QL-007 can apply migrations automatically

Authorize the Supabase connector for the organization/project that contains `gxujcwpktaickcgzyvnu`, or use the manual SQL Editor route.

## Manual SQL route

1. Open Supabase dashboard.
2. Open project `gxujcwpktaickcgzyvnu`.
3. Go to SQL Editor.
4. Copy the contents of `database/migrations/0004_supabase_dev_schema.sql`.
5. Review it.
6. Run it only if this is the intended development database.
7. Run the verification query in `docs/18_SUPABASE_PROJECT_SETUP_GATE.md`.

## Do not share in chat

- database password;
- service-role key;
- JWT secret;
- full connection string;
- private customer data.
