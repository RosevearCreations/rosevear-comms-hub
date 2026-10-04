# Vercel Preview Disabled-Mode Check

## Route

```text
/api/intake
```

## Expected disabled response

```text
HTTP 503
mode: disabled
accepted: false
```

## Required first-preview posture

```text
ENABLE_PROTECTED_INTAKE_ENDPOINT=false
ENABLE_INTAKE_PERSISTENCE=false
```

The route may exist in preview, but it must not accept website submissions until a later enablement gate.

## Manual preview note

After Vercel provides a preview URL, record it as:

```text
PROTECTED_INTAKE_PREVIEW_URL=<preview URL>
```

Do not add `INTAKE_SHARED_SECRET` as a browser-facing `VITE_` variable.
