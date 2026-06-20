# Supabase setup for Clarity

Follow these steps once. After this, `npm run dev` should work.

## 1. Create a Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **New project**
3. Pick an organization, name (e.g. `clarity`), database password, and region
4. Wait for the project to finish provisioning (~2 minutes)

## 2. Run the database schema

1. In your Supabase project, open **SQL Editor**
2. Click **New query**
3. Copy the entire contents of `supabase/schema.sql` from this repo
4. Paste and click **Run**

You should see success with no errors. This creates:

- `profiles`
- `reflection_sessions`
- `reflection_messages`
- `prompt_history`
- Row Level Security policies
- A trigger that auto-creates a profile when someone signs up

## 3. Configure Auth

1. Go to **Authentication → Providers**
2. Make sure **Email** is enabled
3. For local dev, go to **Authentication → Sign In / Providers → Email**
   - Turn **Confirm email** OFF (easier for testing)
   - Or leave it on and confirm via the email Supabase sends

4. Go to **Authentication → URL Configuration**
   - **Site URL:** `http://localhost:3000`
   - **Redirect URLs** (add both):
     - `http://localhost:3000/auth/callback`
     - `http://localhost:3000/**`

When you deploy to Vercel, add your production URL too, e.g.:

- `https://your-app.vercel.app/auth/callback`

## 4. Copy your API keys

1. Go to **Project Settings → API**
2. Copy these into `.env.local`:

| Supabase dashboard field | `.env.local` variable |
|--------------------------|------------------------|
| Project URL              | `NEXT_PUBLIC_SUPABASE_URL` |
| anon public key          | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

`SUPABASE_SERVICE_ROLE_KEY` is listed in the template but **not required for the current app** — everything uses the anon key + RLS.

## 5. Add your OpenAI key

1. Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Create an API key
3. Add it to `.env.local` as `OPENAI_API_KEY`

You need a small prepaid balance or billing enabled on OpenAI.

## 6. Start the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000):

1. Sign up at `/signup`
2. You should land on `/reflect`
3. Complete a reflection to verify Supabase + OpenAI are both working

## Troubleshooting

### "Failed to create session" or empty Insights

- Confirm you ran `supabase/schema.sql`
- Check **Table Editor** — tables should exist
- In browser devtools → Network, look for Supabase errors (often RLS or missing tables)

### Auth redirect loops or magic link not working

- Confirm redirect URLs in Supabase match step 3
- Magic links use `/auth/callback` — that route is already in the app

### OpenAI errors

- Confirm `OPENAI_API_KEY` is set in `.env.local`
- Restart `npm run dev` after changing env vars
- Check OpenAI billing / usage limits

### Still stuck?

Run the env check:

```bash
npm run check:env
```
