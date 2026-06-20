-- Run this in Supabase SQL Editor if you see:
-- "permission denied for table reflection_sessions"

-- Allow API roles to access the public schema
grant usage on schema public to postgres, anon, authenticated, service_role;

-- Table permissions (RLS still restricts which rows each user sees)
grant all on all tables in schema public to postgres, anon, authenticated, service_role;
grant all on all routines in schema public to postgres, anon, authenticated, service_role;
grant all on all sequences in schema public to postgres, anon, authenticated, service_role;

-- Ensure future tables get the same grants
alter default privileges in schema public
  grant all on tables to postgres, anon, authenticated, service_role;

alter default privileges in schema public
  grant all on routines to postgres, anon, authenticated, service_role;

alter default privileges in schema public
  grant all on sequences to postgres, anon, authenticated, service_role;

-- Backfill profile for users who signed up before the signup trigger existed
insert into public.profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;
