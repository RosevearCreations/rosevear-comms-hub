# API Folder

Future home for API route source, endpoint skeletons, persistence adapters, and contracts.

Current contract drafts live in `api/contracts/` and `docs/10_API_CONTRACTS.md`.

Current server-side drafts:

```text
api/endpoints/protectedIntakeEndpoint.ts
api/persistence/intakePersistenceAdapter.ts
```

Safety boundary:

- protected intake endpoint disabled by default;
- intake persistence disabled by default;
- no public anonymous Supabase table writes;
- no live customer-data writes yet.
