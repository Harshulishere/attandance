-- Touchline: monthly fees migration
-- Run this in Supabase SQL Editor (in addition to the original schema).
-- Adds per-month fee tracking so every student starts the month unpaid.

create table student_fees (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  owner_id uuid references profiles(id) on delete cascade,
  year int not null,
  month int not null check (month between 1 and 12),
  fee_status text default 'Unpaid',
  fee_amount numeric,
  fee_notes text default '',
  created_at timestamptz default now(),
  unique(student_id, year, month)
);

alter table student_fees enable row level security;

create policy "student_fees select" on student_fees for select using (
  owner_id = auth.uid() or owner_id in (select owner_id from permissions where grantee_id = auth.uid())
);
create policy "student_fees insert" on student_fees for insert with check (owner_id = auth.uid());
create policy "student_fees update" on student_fees for update using (
  owner_id = auth.uid() or owner_id in (select owner_id from permissions where grantee_id = auth.uid())
);
create policy "student_fees delete" on student_fees for delete using (
  owner_id = auth.uid() or owner_id in (select owner_id from permissions where grantee_id = auth.uid())
);
