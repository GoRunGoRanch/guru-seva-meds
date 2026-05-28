-- Migration 0002: drop Supabase Auth dependency, switch to cookie-based shared-password auth.
-- Safe to run on top of 0001. Idempotent. Run in Supabase Studio → SQL Editor.

-- 1. Drop trigger + helper functions
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.is_doctor() cascade;

-- 2. Drop ALL policies on these tables first, so nothing depends on the columns/functions
drop policy if exists meds_read_all on public.medications;
drop policy if exists meds_doctor_write on public.medications;
drop policy if exists admin_read_all on public.administrations;
drop policy if exists admin_insert_self on public.administrations;
drop policy if exists admin_doctor_delete on public.administrations;
drop policy if exists dialysis_read_all on public.dialysis_days;
drop policy if exists dialysis_insert on public.dialysis_days;
drop policy if exists dialysis_update on public.dialysis_days;
drop policy if exists settings_read_all on public.app_settings;
drop policy if exists settings_doctor_write on public.app_settings;

-- 3. Drop foreign-key constraints to auth.users
alter table public.medications drop constraint if exists medications_created_by_fkey;
alter table public.administrations drop constraint if exists administrations_given_by_fkey;
alter table public.dialysis_days drop constraint if exists dialysis_days_set_by_fkey;
alter table public.app_settings drop constraint if exists app_settings_updated_by_fkey;

-- 4. Drop the now-orphan auth.users-referencing columns
alter table public.medications drop column if exists created_by;
alter table public.administrations drop column if exists given_by;
alter table public.dialysis_days drop column if exists set_by;
alter table public.app_settings drop column if exists updated_by;

-- 5. Recreate read-only policies (server actions write via service_role, bypassing RLS)
create policy meds_read_all on public.medications for select using (true);
create policy admin_read_all on public.administrations for select using (true);
create policy dialysis_read_all on public.dialysis_days for select using (true);
create policy settings_read_all on public.app_settings for select using (true);

-- 6. Drop the profiles table — identity is now the cookie's name + role
drop table if exists public.profiles cascade;
