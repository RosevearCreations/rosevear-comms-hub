# Remote Operator Note — QL-090 Browser-Safe Supabase Read-Only Client Scaffold

QL-090 adds a guarded Supabase read-only client scaffold for the disabled public preview.

## What to look for

- Floating preview badge says QL-090.
- Supabase read-only gate shows current env/readiness status.
- Allowed read sources are synthetic public views only.
- Blocked source list includes live/customer/provider/admin/archive/retention families.
- Locked actions remain disabled.

## Expected default state

Without Cloudflare/Vite browser env values, the preview should report missing env or disabled read flag and keep local synthetic fallback samples.

## Do not enable manually without a later build

Do not enable live phone/SMS, provider callbacks, archive writes, retention writes, AI sending, or live pilot runtime from this build.
