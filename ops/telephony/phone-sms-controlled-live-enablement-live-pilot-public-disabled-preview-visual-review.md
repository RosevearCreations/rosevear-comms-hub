# QL-074 Public Disabled Preview Visual Review — Ops Checklist

## Checks

1. Confirm `main` App scaffold CI is GREEN.
2. Confirm GitHub Pages Disabled Preview workflow appears on the final `main` commit.
3. Confirm Pages workflow conclusion:
   - `success` means the public preview should be reviewed at `https://rosevearcreations.github.io/rosevear-comms-hub/`.
   - `skipped` means the deployment gate is still closed and the repository variable must be corrected.
4. Confirm the preview, if loaded, remains static and disabled.
5. Confirm no live provider, SMS, call, recording, AI send, persistence, archive, retention, or live pilot runtime is enabled.

## Manual variable check when Pages skips

Repository settings path:

`Settings > Secrets and variables > Actions > Variables`

Required repository variable:

```text
ENABLE_GITHUB_PAGES_DISABLED_PREVIEW=true
```

This must be a repository variable, not a secret.
