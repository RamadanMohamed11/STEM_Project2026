# Environment configuration

## Browser-safe values

Copy `.env.example` to untracked `.env.local`, then configure:

```dotenv
VITE_SUPABASE_URL=https://pnwauxgwfvmsxemsbvfw.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_REPLACE_WITH_APPROVED_PUBLIC_KEY
```

Use the existing approved Supabase project. Publishable keys identify the project; PostgreSQL grants/RLS enforce access. Every `VITE_` value is public in the compiled browser bundle. Never put service-role keys, `sb_secret_` keys, access tokens or database URLs/passwords in Vite variables. The build-time validator rejects sensitive public variable names and non-publishable auth keys.

Missing configuration intentionally produces unavailable auth states and explicit sample-content fallback, not a fake signed-in account. Local science simulation does not require authentication.

## Vercel

Existing project: `stem-project2026`, production site: `https://stem-project2026.vercel.app`. Both public variables were confirmed in its production environment. Rebuild after changing a Vite variable; changing the dashboard value does not rewrite deployed JavaScript. Preview/development targets were not configured during T35. Do not copy private server credentials into any frontend target.

## Authentication redirects

The documented Site URL is `https://stem-project2026.vercel.app`. Allow exact production destinations:

```text
https://stem-project2026.vercel.app/auth/callback
https://stem-project2026.vercel.app/reset-password
```

For local email-based flows, add exact matching callbacks for the actual dev port, such as `http://localhost:5173/auth/callback` and `http://localhost:5173/reset-password`. T35 used port 4174 for UI QA and did not exercise an email redirect there. Avoid broad production wildcard redirects. Recheck the allowlist in Supabase before a real mailbox confirmation/recovery test.

Email confirmation is OFF under the owner's existing explicit approval. Auto-confirmed signup was tested; confirmation-email delivery was not. No SMTP or authentication setting was changed by T35. See [SUPABASE_AUTH.md](SUPABASE_AUTH.md) for the existing provider flow and [official redirect documentation](https://supabase.com/docs/guides/auth/redirect-urls).

## Opt-in QA

Normal `npm test` uses isolated fixtures, never live accounts. `scripts/qa/live-auth.mjs` requires `T35_RUN_LIVE_AUTH=1`, the approved project and auto-confirm enabled. It creates two disposable reserved-domain students, keeps passwords/tokens in memory, signs out and writes only fixture IDs plus safe check results to ignored artifacts. Run only with owner authorization and remove those exact fixtures afterward using their IDs and marker. It sends no recovery email. No secret/admin key is needed.
