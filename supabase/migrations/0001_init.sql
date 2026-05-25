-- Guru Seva Meds — initial schema
-- Run this in Supabase Studio → SQL Editor → New query, then click "Run".

create extension if not exists "uuid-ossp";

-- ---------- enums ----------
do $$ begin
  create type user_role as enum ('servant', 'doctor');
exception when duplicate_object then null; end $$;

do $$ begin
  create type day_type as enum ('regular', 'dialysis');
exception when duplicate_object then null; end $$;

-- ---------- profiles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role user_role not null default 'servant',
  created_at timestamptz not null default now()
);

-- ---------- medications ----------
create table if not exists public.medications (
  id uuid primary key default uuid_generate_v4(),
  sort_order int not null default 0,
  name text not null,
  brand text,
  dosage text not null,
  frequency_count int not null check (frequency_count > 0),
  frequency_label text,
  scheduled_times text[] not null default '{}',
  routine text,
  meal_relation text,
  special_note text,
  suggestions text,
  dialysis_dosage text,
  dialysis_scheduled_times text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  -- Enforce frequency == number of timings (the nebulization-mishap safety rule)
  constraint chk_freq_matches_times
    check (cardinality(scheduled_times) = frequency_count),
  constraint chk_dialysis_freq_matches_times
    check (
      cardinality(dialysis_scheduled_times) = 0
      or cardinality(dialysis_scheduled_times) = frequency_count
    )
);

create index if not exists medications_active_idx on public.medications(active, sort_order);

-- ---------- administrations ----------
create table if not exists public.administrations (
  id uuid primary key default uuid_generate_v4(),
  medication_id uuid not null references public.medications(id) on delete cascade,
  scheduled_time text not null,
  dose_date date not null,
  day_type day_type not null default 'regular',
  given_at timestamptz not null default now(),
  given_by uuid not null references auth.users(id),
  given_by_name text not null,
  latitude double precision,
  longitude double precision,
  city text,
  notes text,
  unique (medication_id, scheduled_time, dose_date)
);

create index if not exists administrations_dose_date_idx on public.administrations(dose_date);

-- ---------- dialysis_days ----------
create table if not exists public.dialysis_days (
  dose_date date primary key,
  is_dialysis boolean not null default true,
  set_by uuid references auth.users(id),
  set_by_name text,
  set_at timestamptz not null default now()
);

-- ---------- app_settings (key/value, doctor-editable) ----------
create table if not exists public.app_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),
  updated_by_name text
);

-- Seed the patient's current timezone. Doctors can change this from /manage/settings.
insert into public.app_settings (key, value)
values ('current_timezone', 'America/Chicago')
on conflict (key) do nothing;

-- ---------- updated_at trigger ----------
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists trg_meds_updated on public.medications;
create trigger trg_meds_updated before update on public.medications
  for each row execute function public.set_updated_at();

-- ---------- auto-create profile on signup ----------
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, nullif(new.raw_user_meta_data->>'full_name', ''), 'servant')
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ===================================================================
-- Row-Level Security
-- ===================================================================
alter table public.profiles enable row level security;
alter table public.medications enable row level security;
alter table public.administrations enable row level security;
alter table public.dialysis_days enable row level security;
alter table public.app_settings enable row level security;

-- Helper: is the calling user a doctor?
create or replace function public.is_doctor() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'doctor'
  );
$$;

-- profiles
drop policy if exists profiles_read_all on public.profiles;
create policy profiles_read_all on public.profiles
  for select using (auth.uid() is not null);

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists profiles_doctor_update_any on public.profiles;
create policy profiles_doctor_update_any on public.profiles
  for update using (public.is_doctor()) with check (public.is_doctor());

-- medications: everyone signed in reads; only doctors write
drop policy if exists meds_read_all on public.medications;
create policy meds_read_all on public.medications
  for select using (auth.uid() is not null);

drop policy if exists meds_doctor_write on public.medications;
create policy meds_doctor_write on public.medications
  for all using (public.is_doctor()) with check (public.is_doctor());

-- administrations: everyone signed in reads; anyone signed in inserts as themselves; doctors can delete (correction)
drop policy if exists admin_read_all on public.administrations;
create policy admin_read_all on public.administrations
  for select using (auth.uid() is not null);

drop policy if exists admin_insert_self on public.administrations;
create policy admin_insert_self on public.administrations
  for insert with check (auth.uid() = given_by);

drop policy if exists admin_doctor_delete on public.administrations;
create policy admin_doctor_delete on public.administrations
  for delete using (public.is_doctor());

-- dialysis_days: everyone signed in reads + upserts; doctors can delete
drop policy if exists dialysis_read_all on public.dialysis_days;
create policy dialysis_read_all on public.dialysis_days
  for select using (auth.uid() is not null);

drop policy if exists dialysis_insert on public.dialysis_days;
create policy dialysis_insert on public.dialysis_days
  for insert with check (auth.uid() is not null);

drop policy if exists dialysis_update on public.dialysis_days;
create policy dialysis_update on public.dialysis_days
  for update using (auth.uid() is not null) with check (auth.uid() is not null);

-- app_settings: everyone reads; only doctors write
drop policy if exists settings_read_all on public.app_settings;
create policy settings_read_all on public.app_settings
  for select using (auth.uid() is not null);

drop policy if exists settings_doctor_write on public.app_settings;
create policy settings_doctor_write on public.app_settings
  for all using (public.is_doctor()) with check (public.is_doctor());

-- ===================================================================
-- Realtime publication
-- ===================================================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'medications'
  ) then
    alter publication supabase_realtime add table public.medications;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'administrations'
  ) then
    alter publication supabase_realtime add table public.administrations;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'dialysis_days'
  ) then
    alter publication supabase_realtime add table public.dialysis_days;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'app_settings'
  ) then
    alter publication supabase_realtime add table public.app_settings;
  end if;
end $$;
