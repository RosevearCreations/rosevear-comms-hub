# API Folder

Future home for API route source and contracts.

Current contract drafts live in `api/contracts/` and `docs/10_API_CONTRACTS.md`.

Provider-neutral endpoint and persistence drafts live in:

```text
api/endpoints/
api/persistence/
api/deployment/
```

Runtime-specific wrapper templates are intentionally stored outside the live API route path under:

```text
runtimes/
```

Do not move a runtime wrapper into a live deployed API route until the relevant deployment readiness build says it is safe.
