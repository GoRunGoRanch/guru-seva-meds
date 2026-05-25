-- Optional seed data, mirroring the existing Google Sheet (Modafinil intentionally omitted per Dr. Baluja, 2026-05-25).
-- Run AFTER 0001_init.sql, in Supabase Studio → SQL Editor. Safe to re-run (truncates first).

truncate table public.medications restart identity cascade;

insert into public.medications
  (sort_order, name, brand, dosage, frequency_count, frequency_label, scheduled_times, routine, meal_relation, special_note, suggestions, active)
values
  (1, 'Thyroxine Sodium', 'ELTROXIN', '150 mcg', 1, 'ONCE', array['05:15'], 'MRNG', 'EMPTY STOMACH', 'bottle guard juice / ash guard juice', null, true),
  (3, 'Tacrolimus', 'ADVAGRAF only', '3.5 mg', 1, 'ONCE', array['06:15'], 'MRNG', 'EMPTY STOMACH', 'punarnava gokshura tea', 'Go up to 3.5', true),
  (4, 'Mycophenolate Mofetil', 'CellCept', '250 mg', 2, 'TWICE', array['06:15','18:15'], 'MRNG & EVNG', 'EMPTY STOMACH', null, null, true);
