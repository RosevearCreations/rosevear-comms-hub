# QL-092 — Browser-safe Supabase safe-read implementation plan

QL-092 is a planning build for the first visible safe-read implementation in the public disabled preview. It does not hydrate the UI from Supabase yet and does not change the QL-090/QL-091 runtime gates.

## Existing scaffold retained

The existing browser-safe read-only client remains the only approved Supabase browser client boundary:

- Expected project URL: `https://gxujcwpktaickcgzyvnu.supabase.co`
- Required env values: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_QL_ENABLE_SUPABASE_READS=true`
- Allowed public synthetic views: `public.ql_public_synthetic_conversations` and `public.ql_public_system_status`
- Default fallback: hard-coded local synthetic samples

## Implementation plan for the next build

The next implementation build may hydrate display-only preview state from Supabase only after all gates pass and every remote row validates. The implementation must:

1. Keep local synthetic samples as the initial and fallback state.
2. Call only the existing read-only loader functions.
3. Validate the returned source, row shape, brand id, sample id, status text, and bounded display strings.
4. Merge only known synthetic brands and samples into the disabled preview.
5. Show the active source as either local fallback or validated synthetic Supabase read.
6. Record failures as display-only fallback reasons.
7. Avoid aggressive retries and avoid browser mutation or persistence.

## Payload validation rules

Conversation rows must include string values for `id`, `brand_id`, `brand_name`, `title`, `status`, `summary`, `draft`, and `created_at`. System status rows must include `id`, `label`, `status`, `detail`, and `created_at`, and `status` must be `ready`, `blocked`, or `planned`.

Rows must be discarded if they include unknown brand ids, unknown sample ids, unexpected payload shapes, oversized display strings, or any provider/customer/admin/archive/retention fields.

## Explicitly blocked

QL-092 does not enable live customer data, provider payloads, SMS or call events, recordings, archives, retention records, audit/admin sources, browser writes, Supabase mutations, AI send, callback registration, provider connection, live number attachment, or live pilot runtime.

## Next queued build

QL-093 can implement validated synthetic safe reads behind the existing read-enable gate while preserving local fallback defaults.
