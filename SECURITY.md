# Security

How Clarity handles secrets and user data.

## Secrets

| Secret | Where it lives | Committed to git? |
|--------|----------------|-------------------|
| `OPENAI_API_KEY` | `.env.local`, Vercel env | **No** — gitignored |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `.env.local`, Vercel env | **No** — gitignored |
| `NEXT_PUBLIC_SUPABASE_URL` | `.env.local`, Vercel env | **No** — gitignored |

Use `.env.local.example` as a template only. It contains placeholders, not real keys.

If a key is ever committed by mistake, rotate it immediately in the OpenAI or Supabase dashboard and remove it from git history.

## Why the Supabase anon key can be public

The anon key is meant for browser use. Access is restricted by **Row Level Security (RLS)** in `supabase/schema.sql`:

- Users can only read/write rows where `user_id = auth.uid()` (or equivalent joins for messages).
- There is no admin bypass in the app; the service role key is not used.

Still treat production keys as sensitive: rotate if leaked, enable Supabase auth hardening, and review policies after schema changes.

## OpenAI usage

- All OpenAI calls go through Next.js route handlers under `src/app/api/`.
- The key is read from `process.env.OPENAI_API_KEY` on the server only.
- The browser never receives the OpenAI key.

Each authenticated reflection session triggers a small number of `gpt-4o-mini` calls. Monitor usage in the OpenAI dashboard and set billing limits there.

## Authentication

- `/reflect` and `/insights` are protected by middleware.
- API routes call `supabase.auth.getUser()` and return `401` when unauthenticated.
- Session lookups also filter by `user_id` so one user cannot analyze another user’s session by ID guessing alone (returns 404).

## Before you push to GitHub

```bash
# Confirm env files are ignored
git check-ignore -v .env.local

# Scan staged files for accidental key patterns (optional)
git diff --cached | rg -i 'sk-proj|service_role' && echo 'Found a possible secret' || echo 'Clean'
```

## Reporting issues

If you find a security problem in a deployed instance, rotate affected keys first, then fix the code and redeploy.
