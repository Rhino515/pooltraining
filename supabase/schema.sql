-- Pool IQ v13 · online accounts schema (Supabase free tier)
-- Safe to re-run: every statement is idempotent. Contains NO secrets.
-- Apply: Supabase dashboard → SQL Editor → paste → Run  (or the Management API database query endpoint).
--
-- Tables (all in schema public, all with row-level security):
--   profiles      one row per user: display name + avatar URL          read: signed-in users · write: owner only
--   saves         one JSON backup per user (pool-iq-backup format)     read + write: owner only (private)
--   public_stats  leaderboard numbers from the public stats export     read: signed-in users · write: owner only
--   text_overrides  published on-screen words (v14-35)                   read: everyone · write: owner email only
-- Storage:
--   avatars       public bucket, <user id>/avatar (≤ 200 KB, JPEG/PNG/WebP)   write: owner's own folder only

-- ---------------------------------------------------------------- helpers
create or replace function public.pooliq_touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------- profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 24),
  avatar_url text check (avatar_url is null or char_length(avatar_url) <= 500),
  local_profile_id text check (local_profile_id is null or char_length(local_profile_id) <= 64),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- saves (private cloud backup)
create table if not exists public.saves (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  data jsonb not null,
  summary jsonb not null default '{}'::jsonb,
  app_version text check (app_version is null or char_length(app_version) <= 16),
  device_id text check (device_id is null or char_length(device_id) <= 64),
  device_label text check (device_label is null or char_length(device_label) <= 40),
  local_saved_at bigint,
  updated_at timestamptz not null default now(),
  constraint saves_backup_format check (data ->> 'format' = 'pool-iq-backup'),
  constraint saves_size check (pg_column_size(data) <= 8 * 1024 * 1024)
);

-- ---------------------------------------------------------------- public_stats (friends leaderboard)
create table if not exists public.public_stats (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 24),
  avatar_url text check (avatar_url is null or char_length(avatar_url) <= 500),
  rank_index int not null default 0,
  rank_name text not null default '' check (char_length(rank_name) <= 40),
  ball int,
  rank_title text check (rank_title is null or char_length(rank_title) <= 60),
  champion boolean not null default false,
  lifetime_xp int not null default 0,
  drill_rank int not null default 0,
  drill_rank_name text not null default '' check (char_length(drill_rank_name) <= 40),
  drill_xp int not null default 0,
  stars int not null default 0,
  ghost_matches int not null default 0,
  ghost_wins int not null default 0,
  pvp_wins int,
  pvp_losses int,
  stats jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint public_stats_size check (pg_column_size(stats) <= 32 * 1024)
);

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before insert or update on public.profiles
  for each row execute function public.pooliq_touch_updated_at();
drop trigger if exists saves_touch on public.saves;
create trigger saves_touch before insert or update on public.saves
  for each row execute function public.pooliq_touch_updated_at();
drop trigger if exists public_stats_touch on public.public_stats;
create trigger public_stats_touch before insert or update on public.public_stats
  for each row execute function public.pooliq_touch_updated_at();

-- ---------------------------------------------------------------- row-level security
alter table public.profiles enable row level security;
alter table public.saves enable row level security;
alter table public.public_stats enable row level security;

-- only signed-in users use the API; the anon (signed-out) role gets nothing
revoke all on public.profiles, public.saves, public.public_stats from anon;
grant select, insert, update, delete on public.profiles, public.saves, public.public_stats to authenticated;

-- profiles: everyone signed in can read (leaderboard photos / names); only the owner writes
drop policy if exists "profiles: signed-in read" on public.profiles;
create policy "profiles: signed-in read" on public.profiles for select to authenticated using (true);
drop policy if exists "profiles: owner insert" on public.profiles;
create policy "profiles: owner insert" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
drop policy if exists "profiles: owner update" on public.profiles;
create policy "profiles: owner update" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
drop policy if exists "profiles: owner delete" on public.profiles;
create policy "profiles: owner delete" on public.profiles for delete to authenticated using ((select auth.uid()) = id);

-- saves: private — only the owner can read or write
drop policy if exists "saves: owner read" on public.saves;
create policy "saves: owner read" on public.saves for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "saves: owner insert" on public.saves;
create policy "saves: owner insert" on public.saves for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "saves: owner update" on public.saves;
create policy "saves: owner update" on public.saves for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "saves: owner delete" on public.saves;
create policy "saves: owner delete" on public.saves for delete to authenticated using ((select auth.uid()) = user_id);

-- public_stats: readable by signed-in users, written only by the owner
drop policy if exists "public_stats: signed-in read" on public.public_stats;
create policy "public_stats: signed-in read" on public.public_stats for select to authenticated using (true);
drop policy if exists "public_stats: owner insert" on public.public_stats;
create policy "public_stats: owner insert" on public.public_stats for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "public_stats: owner update" on public.public_stats;
create policy "public_stats: owner update" on public.public_stats for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "public_stats: owner delete" on public.public_stats;
create policy "public_stats: owner delete" on public.public_stats for delete to authenticated using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------- avatars storage bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 204800, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- public bucket: photos are served by their public URL. Writes only inside the user's own folder: avatars/<user id>/...
drop policy if exists "avatars: owner read" on storage.objects;
create policy "avatars: owner read" on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "avatars: owner insert" on storage.objects;
create policy "avatars: owner insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "avatars: owner update" on storage.objects;
create policy "avatars: owner update" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "avatars: owner delete" on storage.objects;
create policy "avatars: owner delete" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- ---------------------------------------------------------------- drill_overrides (v14-26 published drills)
-- Everyone, including signed-out visitors, can read. Only the owner account can write.
-- The phone cannot git-push. SAVE upserts one row; a row replaces that shipped drill on load.
create table if not exists public.drill_overrides (
  drill_id text primary key check (char_length(drill_id) between 1 and 80),
  doc jsonb not null,
  updated_by uuid default auth.uid() references auth.users (id),
  updated_at timestamptz not null default now(),
  constraint drill_overrides_shape check (
    doc ->> 'format' = 'pooliq'
    and doc ->> 'contentType' = 'drill'
    and doc ->> 'id' = drill_id
  ),
  constraint drill_overrides_size check (pg_column_size(doc) <= 512 * 1024)
);

drop trigger if exists drill_overrides_touch on public.drill_overrides;
create trigger drill_overrides_touch before insert or update on public.drill_overrides
  for each row execute function public.pooliq_touch_updated_at();

alter table public.drill_overrides enable row level security;

revoke all on public.drill_overrides from anon, authenticated;
grant select on public.drill_overrides to anon, authenticated;
grant insert, update, delete on public.drill_overrides to authenticated;

drop policy if exists "drill_overrides: public read" on public.drill_overrides;
create policy "drill_overrides: public read" on public.drill_overrides
  for select to anon, authenticated
  using (true);

drop policy if exists "drill_overrides: owner insert" on public.drill_overrides;
create policy "drill_overrides: owner insert" on public.drill_overrides
  for insert to authenticated
  with check (
    lower(coalesce((select auth.jwt() ->> 'email'), '')) = 'andrewaphay@gmail.com'
    and (select auth.uid()) = updated_by
  );

drop policy if exists "drill_overrides: owner update" on public.drill_overrides;
create policy "drill_overrides: owner update" on public.drill_overrides
  for update to authenticated
  using (lower(coalesce((select auth.jwt() ->> 'email'), '')) = 'andrewaphay@gmail.com')
  with check (
    lower(coalesce((select auth.jwt() ->> 'email'), '')) = 'andrewaphay@gmail.com'
    and (select auth.uid()) = updated_by
  );

drop policy if exists "drill_overrides: owner delete" on public.drill_overrides;
create policy "drill_overrides: owner delete" on public.drill_overrides
  for delete to authenticated
  using (lower(coalesce((select auth.jwt() ->> 'email'), '')) = 'andrewaphay@gmail.com');

-- ---------------------------------------------------------------- drill_hidden (v14-29)
-- Everyone, including signed-out visitors, can read the ids.
-- Only the owner account can insert or delete. The shipped drill file is not removed.
create table if not exists public.drill_hidden (
  drill_id text primary key check (char_length(drill_id) between 1 and 80),
  updated_by uuid default auth.uid() references auth.users (id),
  updated_at timestamptz not null default now()
);

drop trigger if exists drill_hidden_touch on public.drill_hidden;
create trigger drill_hidden_touch before insert or update on public.drill_hidden
  for each row execute function public.pooliq_touch_updated_at();

alter table public.drill_hidden enable row level security;

revoke all on public.drill_hidden from anon, authenticated;
grant select on public.drill_hidden to anon, authenticated;
grant insert, update, delete on public.drill_hidden to authenticated;

drop policy if exists "drill_hidden: public read" on public.drill_hidden;
create policy "drill_hidden: public read" on public.drill_hidden
  for select to anon, authenticated
  using (true);

drop policy if exists "drill_hidden: owner insert" on public.drill_hidden;
create policy "drill_hidden: owner insert" on public.drill_hidden
  for insert to authenticated
  with check (
    lower(coalesce((select auth.jwt() ->> 'email'), '')) = 'andrewaphay@gmail.com'
    and (select auth.uid()) = updated_by
  );

drop policy if exists "drill_hidden: owner delete" on public.drill_hidden;
create policy "drill_hidden: owner delete" on public.drill_hidden
  for delete to authenticated
  using (lower(coalesce((select auth.jwt() ->> 'email'), '')) = 'andrewaphay@gmail.com');

-- ---------------------------------------------------------------- text_overrides (v14-35 published on-screen words)
-- Everyone, including signed-out visitors, can read.
-- Only the owner account can insert, update, or delete.
-- A row replaces that text block for every visitor. Shipped files stay in git.
create table if not exists public.text_overrides (
  copy_key text primary key check (char_length(copy_key) between 1 and 280),
  body text not null check (
    char_length(body) between 1 and 2000
    and char_length(btrim(body)) >= 1
    and body !~ '[<>]'
  ),
  updated_by uuid default auth.uid() references auth.users (id),
  updated_at timestamptz not null default now()
);

drop trigger if exists text_overrides_touch on public.text_overrides;
create trigger text_overrides_touch before insert or update on public.text_overrides
  for each row execute function public.pooliq_touch_updated_at();

alter table public.text_overrides enable row level security;

revoke all on public.text_overrides from anon, authenticated;
grant select on public.text_overrides to anon, authenticated;
grant insert, update, delete on public.text_overrides to authenticated;

drop policy if exists "text_overrides: public read" on public.text_overrides;
create policy "text_overrides: public read" on public.text_overrides
  for select to anon, authenticated
  using (true);

drop policy if exists "text_overrides: owner insert" on public.text_overrides;
create policy "text_overrides: owner insert" on public.text_overrides
  for insert to authenticated
  with check (
    lower(coalesce((select auth.jwt() ->> 'email'), '')) = 'andrewaphay@gmail.com'
    and (select auth.uid()) = updated_by
  );

drop policy if exists "text_overrides: owner update" on public.text_overrides;
create policy "text_overrides: owner update" on public.text_overrides
  for update to authenticated
  using (lower(coalesce((select auth.jwt() ->> 'email'), '')) = 'andrewaphay@gmail.com')
  with check (
    lower(coalesce((select auth.jwt() ->> 'email'), '')) = 'andrewaphay@gmail.com'
    and (select auth.uid()) = updated_by
  );

drop policy if exists "text_overrides: owner delete" on public.text_overrides;
create policy "text_overrides: owner delete" on public.text_overrides
  for delete to authenticated
  using (lower(coalesce((select auth.jwt() ->> 'email'), '')) = 'andrewaphay@gmail.com');
