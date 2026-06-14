-- Create bookmarks table for user-owned bookmark CRUD
create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  url text not null,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Helpful indexes for owner queries and recent sorting
create index if not exists bookmarks_user_id_idx on public.bookmarks (user_id);
create index if not exists bookmarks_created_at_idx on public.bookmarks (created_at desc);

-- Keep updated_at current on update
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists bookmarks_set_updated_at on public.bookmarks;
create trigger bookmarks_set_updated_at
before update on public.bookmarks
for each row
execute function public.set_updated_at();

-- Row Level Security so users manage only their own records
alter table public.bookmarks enable row level security;

-- Users can view their own bookmarks; public bookmarks are visible to all
drop policy if exists "bookmarks_select_own_or_public" on public.bookmarks;
create policy "bookmarks_select_own_or_public"
on public.bookmarks
for select
using (auth.uid() = user_id or is_public = true);

-- Users can create only rows owned by themselves
drop policy if exists "bookmarks_insert_own" on public.bookmarks;
create policy "bookmarks_insert_own"
on public.bookmarks
for insert
to authenticated
with check (auth.uid() = user_id);

-- Users can update only their own bookmarks
drop policy if exists "bookmarks_update_own" on public.bookmarks;
create policy "bookmarks_update_own"
on public.bookmarks
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Users can delete only their own bookmarks
drop policy if exists "bookmarks_delete_own" on public.bookmarks;
create policy "bookmarks_delete_own"
on public.bookmarks
for delete
to authenticated
using (auth.uid() = user_id);
