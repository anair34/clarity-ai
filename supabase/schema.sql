-- Clarity database schema for Supabase Postgres

-- Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz default now() not null
);

-- Reflection sessions
create table if not exists public.reflection_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  initial_mood text,
  final_mood text,
  primary_emotion text,
  secondary_emotions text[],
  intensity text,
  topic text,
  underlying_concern text,
  summary text,
  prompt_used text,
  created_at timestamptz default now() not null
);

-- Reflection messages
create table if not exists public.reflection_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.reflection_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz default now() not null
);

-- Prompt history
create table if not exists public.prompt_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  category text not null,
  prompt text not null,
  used boolean default false not null,
  created_at timestamptz default now() not null
);

-- Indexes
create index if not exists idx_reflection_sessions_user_id on public.reflection_sessions(user_id);
create index if not exists idx_reflection_sessions_created_at on public.reflection_sessions(created_at desc);
create index if not exists idx_reflection_messages_session_id on public.reflection_messages(session_id);
create index if not exists idx_prompt_history_user_id on public.prompt_history(user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.reflection_sessions enable row level security;
alter table public.reflection_messages enable row level security;
alter table public.prompt_history enable row level security;

-- Profiles policies
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Reflection sessions policies
create policy "Users can view own sessions"
  on public.reflection_sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert own sessions"
  on public.reflection_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own sessions"
  on public.reflection_sessions for update
  using (auth.uid() = user_id);

create policy "Users can delete own sessions"
  on public.reflection_sessions for delete
  using (auth.uid() = user_id);

-- Reflection messages policies
create policy "Users can view own messages"
  on public.reflection_messages for select
  using (
    exists (
      select 1 from public.reflection_sessions s
      where s.id = reflection_messages.session_id
      and s.user_id = auth.uid()
    )
  );

create policy "Users can insert own messages"
  on public.reflection_messages for insert
  with check (
    exists (
      select 1 from public.reflection_sessions s
      where s.id = reflection_messages.session_id
      and s.user_id = auth.uid()
    )
  );

create policy "Users can update own messages"
  on public.reflection_messages for update
  using (
    exists (
      select 1 from public.reflection_sessions s
      where s.id = reflection_messages.session_id
      and s.user_id = auth.uid()
    )
  );

create policy "Users can delete own messages"
  on public.reflection_messages for delete
  using (
    exists (
      select 1 from public.reflection_sessions s
      where s.id = reflection_messages.session_id
      and s.user_id = auth.uid()
    )
  );

-- Prompt history policies
create policy "Users can view own prompts"
  on public.prompt_history for select
  using (auth.uid() = user_id);

create policy "Users can insert own prompts"
  on public.prompt_history for insert
  with check (auth.uid() = user_id);

create policy "Users can update own prompts"
  on public.prompt_history for update
  using (auth.uid() = user_id);

create policy "Users can delete own prompts"
  on public.prompt_history for delete
  using (auth.uid() = user_id);

-- Grants (required — without these you get "permission denied for table")
grant usage on schema public to postgres, anon, authenticated, service_role;

grant all on all tables in schema public to postgres, anon, authenticated, service_role;
grant all on all routines in schema public to postgres, anon, authenticated, service_role;
grant all on all sequences in schema public to postgres, anon, authenticated, service_role;

alter default privileges in schema public
  grant all on tables to postgres, anon, authenticated, service_role;

alter default privileges in schema public
  grant all on routines to postgres, anon, authenticated, service_role;

alter default privileges in schema public
  grant all on sequences to postgres, anon, authenticated, service_role;
