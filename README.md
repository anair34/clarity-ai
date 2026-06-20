# Clarity

Clarity is a private reflection journal. You check in with how you feel, answer a few guided follow-up questions, and see whether reflection helped over time.

This is a self-reflection tool, not therapy or medical advice.

## What it does

- **Reflect** — mood check-in, guided follow-up questions, final mood check, session summary
- **Insights** — mood trends, common emotions/topics, improvement rate
- **Prompts** — starter questions by category when you are not sure what to write

## Stack

- Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui
- Supabase (Postgres + Auth)
- OpenAI (`gpt-4o-mini`)
- Recharts on the insights page

---

## Run it locally

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project
- An [OpenAI](https://platform.openai.com) API key with billing enabled

### 1. Clone and install

```bash
git clone https://github.com/anair34/clarity-ai.git
cd clarity-ai
npm install
```

### 2. Environment variables

```bash
cp .env.local.example .env.local
```

Fill in `.env.local`:

| Variable | Where to get it |
|----------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → **Project URL** (no `/rest/v1/` suffix) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → **anon public** key |
| `OPENAI_API_KEY` | [OpenAI API keys](https://platform.openai.com/api-keys) |

Never commit `.env.local`. It is gitignored.

### 3. Set up Supabase

1. In the Supabase SQL Editor, run `supabase/schema.sql`.
2. If inserts fail with “permission denied”, also run `supabase/fix-permissions.sql`.
3. Under **Authentication → URL Configuration**:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/auth/callback`
4. Enable email auth under **Authentication → Providers**.

Step-by-step notes live in `docs/SUPABASE_SETUP.md`.

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign up, and try a reflection on `/reflect`.

### 5. Verify env vars (optional)

```bash
npm run check:env
```

### 6. Run tests

```bash
npm test
```

Tests mock OpenAI and Supabase — no API charges when running the suite.

---

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm run start` | Run production build |
| `npm test` | Unit + API route tests |
| `npm run lint` | ESLint |
| `npm run check:env` | Confirm `.env.local` is filled in |

---

## Deploy (Vercel)

1. Push this repo to GitHub.
2. Import the project in [Vercel](https://vercel.com).
3. Add the same three env vars from `.env.local` in Vercel project settings.
4. Add your production URL to Supabase redirect URLs, e.g. `https://your-app.vercel.app/auth/callback`.

Do not expose `OPENAI_API_KEY` in client code or `NEXT_PUBLIC_*` variables.

---

## Security

See [SECURITY.md](./SECURITY.md) for how keys are handled and how row-level security protects user data.

Quick summary:

- OpenAI key stays on the server (API routes only).
- Supabase **anon** key is public by design; **RLS** limits each user to their own rows.
- Reflection pages require auth (middleware).
- `.env.local` and other secret files are gitignored.

---

## Project layout

```
src/
  app/
    (app)/        # reflect, insights, prompts (auth required)
    api/          # OpenAI-backed route handlers
    auth/         # OAuth/magic-link callback
    login/ signup/
  components/
  lib/            # Supabase clients, insights helpers, AI prompts
  test/           # Vitest helpers and mocks
supabase/
  schema.sql
  fix-permissions.sql
docs/
  SUPABASE_SETUP.md
```

---

## License

Private project. All rights reserved unless you add a license file.
