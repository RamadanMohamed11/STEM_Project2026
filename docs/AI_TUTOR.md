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

# T46 — AI Tutor Chat UI

## Where it appears

| Place                                   | Behaviour                                                                                                                                                                                                                                                                       |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Experiment Details (`/experiments/:id`) | A collapsible "Ask the AI tutor" card below the learning stages, collapsed by default. It sends `stage: "details"`.                                                                                                                                                             |
| Virtual lab (`/experiments/:id/lab`)    | A toolbar button (sparkles icon) opens a right-side panel. It closes the guide, inventory and help, and they close it. The panel stays mounted while hidden, so closing it keeps the conversation. Each request sends the current stage title and a short summary of the bench. |

## Files

- `src/features/ai/components/AiTutorPanel.tsx`: the chat UI, with `page` (collapsible) and `overlay` (lab) variants.
- `src/features/ai/lib/aiTutorClient.ts`: `streamTutorReply` (fetch plus SSE parsing; it never throws and returns a student-safe outcome), `prepareHistory` (the last 20 non-empty messages, starting with a user turn, each at most 2,000 characters), `toStageLabel` and `clipLabState`. These make client requests pass the T45 server validation, and a test checks this.
- `src/features/ai/lib/tutorContext.ts`: `getSuggestedQuestions` (3 per surface or lab stage: setup, measurement, procedure, observation, review) and `summarizeLabState`. The summary covers the step, stage, equipment on the bench, water volumes, salt amounts and recorded measurements. It is at most 1,000 characters and is built from `getExperimentSessionSnapshot()` at send time.
- `EducationalAssistantPlaceholder.tsx` was removed. It was no longer rendered anywhere.

## States

| State                   | What the student sees                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------------ |
| Auth loading            | "Checking your account…"                                                                         |
| Supabase not configured | "The AI tutor is not available in this version of the site."                                     |
| Logged out              | A prompt and a Log in link                                                                       |
| Signed in, no messages  | An intro line, 3 suggested questions, the input                                                  |
| Answering               | Typing dots, then text as it streams; Send becomes **Stop**                                      |
| Stopped                 | The partial answer is kept and marked "(stopped)"; an empty answer is removed                    |
| 429                     | "You have reached the hourly limit…" (no retry button)                                           |
| 401 / session expired   | The message and a Log in link                                                                    |
| Other errors            | The message and a **Retry** button, which resends the last question; the failed reply is removed |

- Enter sends and Shift+Enter adds a new line. The input is limited to 2,000 characters and shows a counter.
- Answers are plain text (`white-space: pre-wrap`); no markdown library is used.
- The conversation is kept only in memory. The in-flight request is aborted when the panel unmounts.
- Accessibility:
  - The heading button has `aria-expanded`/`aria-controls`.
  - The input has a label.
  - There is one `aria-live="polite"` region. It announces "answering", then the full answer once it finishes, not every token.
  - Escape inside the input does not clear lab selections.
- The footer always reads "AI answers can be wrong — check with your teacher."

## Verification

- `tests/aiTutorClient.test.mjs` (11 tests) covers:
  - parsing split, CRLF and malformed events;
  - trimming history to valid server input;
  - stage and lab-state sanitising;
  - the request headers and body;
  - 401, 429, 5xx and offline outcomes;
  - error events, cut-off streams and network resets;
  - abort;
  - suggestions and the lab summary;
  - rendering of the logged-out details card and the signed-in overlay.
- Full suite: 379 tests pass; typecheck, lint and build pass.
- Browser (dev server, logged out):
  - The details card expands and shows the log-in prompt and disclaimer.
  - The lab toolbar button toggles the panel (`display: none` / `block`, 380 px wide).
- **Not yet verified:** a real signed-in conversation. The function is not deployed (see T45), and Claude did not sign in to the hosted Supabase project.

# T47 — "Explain this" AI explanations

## Where

- **Educational Learning Stages** on Experiment Details: an **Explain this** button under each stage's Scientific Explanation. It resets when the stage changes (`key={stage.id}`). It sends `stage: <stage title>` and the prompt `Explain what happens in the "<stage>" stage of "<experiment>"…`.
- **Lab results** (`ExperimentResults`): **Explain what happened** in the "Scientific principle & explanation" card. This appears in the lab completion overlay and on the results page. It sends `stage: "results"` and the prompt `Explain the observed change in "<experiment>": <observation headline. summary>…`. The prompt asks for a particle-level explanation and a physical-or-chemical classification.

The prompts are fixed templates from `buildExplainPrompt` (`src/features/ai/lib/tutorContext.ts`), filled only with our own titles and observations, and kept within 2,000 characters. A test confirms they pass the server validation. The AI is called **only on click**.

## Fallback

`explainStateFromOutcome` (`src/features/ai/lib/explainState.ts`) makes every failure end with the existing static text, under a reason line. The static text is the stage's `scientificExplanation` or, for results, the result explanation plus the ion-process and physical-change text.

| Outcome                                    | Shown                                                                                                                              |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| Done with text                             | The AI explanation and the "AI answers can be wrong — check with your teacher." disclaimer                                         |
| Logged out / 401                           | "Log in to get an AI explanation. Here is the saved explanation:" and the static text (no request is made when logged out)         |
| 429                                        | The server's limit message, then the static text                                                                                   |
| Network, 5xx, cut-off stream, empty answer | "The AI explanation is not available right now. Here is the saved explanation:" and the static text. Partial AI text is discarded. |
| Stopped by the student                     | The partial text is kept and marked "(stopped)". If there was no text yet, the panel returns to the button.                        |

While answering, the button becomes **Stop**; afterwards it reads **Explain again**. The output region is `aria-live="polite"` with `aria-busy` while streaming, so screen readers read the finished text.

`src/features/ai/lib/tutorSession.ts` (`askTutor`) now holds the Supabase config and session-token lookup. It is shared by the chat panel and Explain this.

## Verification

- `tests/explainThis.test.mjs` (3 tests) covers the prompt templates against the server validator, the full outcome-to-fallback table, and an SSR check that the button renders and no AI output appears until a click.
- Full suite: 382 pass. Typecheck, lint and build pass.
- Browser, logged out, on Details:
  - Clicking **Explain this** shows the log-in reason and the saved explanation, and the button becomes **Explain again**.
  - **Next Stage** resets it.
- **Not verified:** a live AI explanation (the function is not deployed yet), and the results-panel button in the browser. That button only appears after all 9 lab steps; it reuses the same component.
