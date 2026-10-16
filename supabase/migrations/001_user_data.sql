-- Optional account snapshots. Anonymous reading never requires a database.
create table public.user_snapshots (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb check (jsonb_typeof(data) = 'object'),
  updated_at timestamptz not null default now()
);
alter table public.user_snapshots enable row level security;
create policy "read own snapshot" on public.user_snapshots for select to authenticated using ((select auth.uid()) = user_id);
create policy "insert own snapshot" on public.user_snapshots for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "update own snapshot" on public.user_snapshots for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "delete own snapshot" on public.user_snapshots for delete to authenticated using ((select auth.uid()) = user_id);
revoke all on public.user_snapshots from anon;
grant select, insert, update, delete on public.user_snapshots to authenticated;
