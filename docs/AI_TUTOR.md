# T45 — AI Tutor Backend (Supabase Edge Function → NVIDIA NIM)

The browser never talks to NVIDIA. It calls the `ai-tutor` Supabase Edge Function with the student's session token. The function checks the student, loads the experiment, enforces the hourly limit, builds the instructions on the server and streams the answer back. The NVIDIA key exists only as a Supabase secret.

```
Browser ──POST + Bearer JWT──▶ ai-tutor (Edge Function) ──Bearer NVIDIA_API_KEY──▶ integrate.api.nvidia.com
            ◀── SSE events ───┘        │ RLS as the student
                                       ├─ public.experiments (published only)
                                       └─ public.consume_ai_tutor_quota()
```

## Files

| File                                                  | Purpose                                                                                                   |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `supabase/functions/ai-tutor/core.ts`                 | Validation, system prompt, NVIDIA streaming parser, HTTP handler. Web-standard APIs only, tested in Node. |
| `supabase/functions/ai-tutor/index.ts`                | Deno wiring: env secrets, Supabase client using the student's token, `Deno.serve`.                        |
| `supabase/migrations/202611080002_ai_tutor_usage.sql` | `public.ai_usage` (user + timestamp only), RLS, `consume_ai_tutor_quota(limit)`.                          |
| `supabase/tests/ai_usage_rls_transaction.sql`         | Transactional RLS/quota verification (rolls back).                                                        |
| `tests/aiTutor.test.mjs`                              | 13 Node tests: validation, prompt, streaming, 401, 429, 404, 413, 503, 504, error masking, CORS.          |

## API contract (for T46)

`POST {SUPABASE_URL}/functions/v1/ai-tutor`

Headers: `Authorization: Bearer <student access token>`, `apikey: <anon key>`, `Content-Type: application/json`. `supabase.functions.invoke` sets these automatically, but use `fetch` if you need to read the stream incrementally.

```json
{
  "experimentId": "exp-salt-water-001",
  "stage": "results",
  "labState": "Beaker: 50 mL water, 5 g NaCl, stirred 30 s, no solid visible.",
  "messages": [{ "role": "user", "content": "Why did the salt disappear?" }]
}
```

| Field          | Rules                                                                                                           |
| -------------- | --------------------------------------------------------------------------------------------------------------- |
| `experimentId` | Required. `^[A-Za-z0-9][A-Za-z0-9_-]{2,99}$`. Must be readable by the student (published).                      |
| `stage`        | Optional. Short label, letters/digits/space/`-`/`_`, max 80 characters.                                         |
| `labState`     | Optional short summary, max 1,000 characters. It is treated as data, never as instructions.                     |
| `messages`     | 1–20 items. Role is `user` or `assistant` only (no `system`). Each 1–2,000 characters; last one must be `user`. |
| Body           | Max 64 KB.                                                                                                      |

**Success (200)** is `text/event-stream`. Each event is `data: <json>\n\n`:

```
data: {"type":"delta","text":"Salt "}
data: {"type":"delta","text":"dissolved because..."}
data: {"type":"done","finishReason":"stop"}
```

When a stream fails partway, it ends with `data: {"type":"error","message":"The AI tutor stopped unexpectedly. Please try again."}`. Reasoning fields from the model are dropped. Headers `X-RateLimit-Limit` and `X-RateLimit-Remaining` are exposed to the browser.

**Errors** return JSON `{ "error": "<student-safe message>" }`:

| Status | When                                                                                        |
| ------ | ------------------------------------------------------------------------------------------- |
| 400    | Invalid JSON or fields                                                                      |
| 401    | Missing, invalid or anonymous session                                                       |
| 403    | `Origin` not in `AI_TUTOR_ALLOWED_ORIGINS`                                                  |
| 404    | Experiment missing or not published                                                         |
| 405    | Method other than POST/OPTIONS                                                              |
| 413    | Body larger than 64 KB                                                                      |
| 429    | More than 30 requests in the last hour (“You have reached the hourly limit…”)               |
| 502    | NVIDIA unreachable or returned an error (the status is logged; the body is never forwarded) |
| 503    | `NVIDIA_API_KEY` not configured                                                             |
| 504    | No response from NVIDIA within 30 s                                                         |

Quota is used only when a request will actually reach the model. Failures at 400, 401, 404, 413 or 503 do not count.

## Limits and model settings

These are set in `AI_TUTOR_LIMITS` in `core.ts`: 30 requests per user per hour (sliding window), 20 messages, 2,000 characters per message, a 1,000-character lab state, a 64 KB body, a 30 s overall timeout, `max_tokens` 600, `temperature` 0.3 and `stream: true`. When the student disconnects, the upstream request is aborted.

## Security notes

- Every database call runs with the student's JWT (anon key plus `Authorization`), so RLS applies. No service-role key is used.
- `ai_usage` stores only `user_id` and `created_at`. Chat contents are never stored or logged, and logs contain only status codes and error names.
- The client cannot send `system` messages. The system prompt is built on the server from `public.experiments`. It limits answers to chemistry and this experiment, at secondary level, in English, refusing off-topic requests and forbidding instructions for unsupervised or dangerous practical work.
- Students can select and insert only their own usage rows. They cannot update or delete them, so they cannot reset their limit. `consume_ai_tutor_quota` is `SECURITY INVOKER` and uses a per-user advisory lock, so parallel requests cannot exceed the limit.

## Deploy (owner)

The Supabase CLI is not installed on this machine. Run these where it is available, linked to the project:

```bash
supabase db push
```

This applies `202611080002_ai_tutor_usage.sql`. Or paste the file into the SQL editor.

```bash
supabase secrets set NVIDIA_API_KEY=nvapi-xxxxxxxx NVIDIA_MODEL=meta/llama-3.3-70b-instruct
```

```bash
supabase secrets set AI_TUTOR_ALLOWED_ORIGINS=https://stem-project2026.vercel.app,http://localhost:5173
```

```bash
supabase functions deploy ai-tutor
```

- Get the key at <https://build.nvidia.com> (API key, starts with `nvapi-`). Never put it in `.env`, Vercel or frontend code.
- `NVIDIA_MODEL` is optional. The default is `meta/llama-3.3-70b-instruct`; confirm the exact model ID on build.nvidia.com.
- `AI_TUTOR_ALLOWED_ORIGINS` is optional. When it is empty, any origin is allowed. Requests still need a valid student session.

## Local test

```bash
supabase start
```

```bash
supabase functions serve ai-tutor --env-file supabase/functions/.env.local
```

`supabase/functions/.env.local` contains `NVIDIA_API_KEY=...` and is ignored by git (`.env.*`).

```bash
curl -N -X POST http://127.0.0.1:54321/functions/v1/ai-tutor -H "Authorization: Bearer $STUDENT_JWT" -H "Content-Type: application/json" -d '{"experimentId":"exp-salt-water-001","messages":[{"role":"user","content":"Why does salt dissolve?"}]}'
```

- Without `Authorization` the function returns 401.
- The 31st call within an hour returns 429.

## Verification done in T45

- `tests/aiTutor.test.mjs`: 13/13 pass. They use fake dependencies, including a fake NVIDIA stream, and check:
  - the upstream request shape and streaming;
  - 401 for missing, invalid or anonymous sessions;
  - 429 on request 31 with no upstream call;
  - 400, 404, 413 and 503 without using quota;
  - 502 masking of the key and upstream body;
  - 504 timeout and mid-stream error events;
  - CORS allow-list and preflight;
  - a generic 500.
- `core.ts` passes a strict `tsc` check (DOM + ES2022). ESLint passes.
- The migration and `ai_usage_rls_transaction.sql` were run in an in-memory Postgres (PGlite) with minimal stubs for `auth.uid()`, `auth.users` and the roles, and passed. A deliberately broken select policy made the test fail as expected.
- **Not yet verified:** a real call to NVIDIA, the deployed Deno runtime, and the migration on the real Supabase project. These need the owner's key and deploy. The migration was **not** applied to production.
