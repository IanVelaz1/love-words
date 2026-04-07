-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────
-- INVITE CODES
-- ─────────────────────────────────────────────
create table if not exists invite_codes (
  code        text primary key,
  created_by  uuid references auth.users(id) on delete set null,
  used_by     uuid references auth.users(id) on delete set null,
  used_at     timestamptz,
  created_at  timestamptz default now() not null
);

-- ─────────────────────────────────────────────
-- PROFILES (extends auth.users)
-- ─────────────────────────────────────────────
create table if not exists profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  invite_code_used  text references invite_codes(code) on delete set null,
  is_active         boolean default true not null,
  created_at        timestamptz default now() not null
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────────
-- CREATIONS
-- ─────────────────────────────────────────────
create type expiry_type_enum as enum ('permanent', 'date', 'views');
create type creation_status_enum as enum ('draft', 'published');

create table if not exists creations (
  id                   uuid primary key default gen_random_uuid(),
  slug                 text unique not null,
  creator_id           uuid references auth.users(id) on delete cascade not null,

  -- Content
  title                text check (char_length(title) <= 100),
  dedication           text check (char_length(dedication) <= 200),

  -- Audio
  voice_audio_url      text not null,
  voice_duration_sec   float,

  -- Transcription: [{word, start, end}]
  transcription        jsonb default '[]'::jsonb not null,

  -- Music (Jamendo metadata)
  music_jamendo_id     text,
  music_name           text,
  music_artist         text,
  music_preview_url    text,

  -- Mixer
  voice_gain           float default 0.80 not null check (voice_gain >= 0 and voice_gain <= 1),
  music_gain           float default 0.25 not null check (music_gain >= 0 and music_gain <= 1),

  -- Expiry
  expiry_type          expiry_type_enum default 'permanent' not null,
  expiry_date          timestamptz,
  expiry_views         integer,
  view_count           integer default 0 not null,

  -- State
  status               creation_status_enum default 'draft' not null,
  published_at         timestamptz,
  created_at           timestamptz default now() not null,
  updated_at           timestamptz default now() not null
);

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger creations_updated_at
  before update on creations
  for each row execute procedure public.set_updated_at();

-- ─────────────────────────────────────────────
-- VIEW EVENTS (analytics)
-- ─────────────────────────────────────────────
create table if not exists view_events (
  id            uuid primary key default gen_random_uuid(),
  creation_id   uuid references creations(id) on delete cascade not null,
  viewed_at     timestamptz default now() not null,
  ip_hash       text,
  user_agent    text
);

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────

-- Profiles: users can only read/update their own
alter table profiles enable row level security;
create policy "profiles: own read" on profiles for select using (auth.uid() = id);
create policy "profiles: own update" on profiles for update using (auth.uid() = id);

-- Invite codes: authenticated users can read (to validate), only service role inserts
alter table invite_codes enable row level security;
create policy "invite_codes: auth read" on invite_codes for select to authenticated using (true);

-- Creations: creators own theirs; published ones are public for select
alter table creations enable row level security;
create policy "creations: own all" on creations for all using (auth.uid() = creator_id);
create policy "creations: public published" on creations for select using (status = 'published');

-- View events: insert public (viewer page), select own (creator analytics)
alter table view_events enable row level security;
create policy "view_events: public insert" on view_events for insert with check (true);
create policy "view_events: creator read" on view_events for select
  using (
    creation_id in (
      select id from creations where creator_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────
-- STORAGE BUCKET
-- ─────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('voice-audio', 'voice-audio', false)
on conflict do nothing;

-- Authenticated users can upload to their own folder
create policy "voice-audio: auth upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'voice-audio' and (storage.foldername(name))[1] = auth.uid()::text);

-- Creators can read their own files
create policy "voice-audio: own read" on storage.objects
  for select to authenticated
  using (bucket_id = 'voice-audio' and (storage.foldername(name))[1] = auth.uid()::text);

-- Service role can read all (for transcription API)
create policy "voice-audio: service read" on storage.objects
  for select to service_role
  using (bucket_id = 'voice-audio');
