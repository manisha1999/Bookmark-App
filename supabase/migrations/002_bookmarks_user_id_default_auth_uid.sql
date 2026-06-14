-- Ensure bookmarks are inserted for the currently authenticated user by default
alter table public.bookmarks
alter column user_id set default auth.uid();

-- Keep insert policy strict: inserted row must belong to current auth user
drop policy if exists "bookmarks_insert_own" on public.bookmarks;
create policy "bookmarks_insert_own"
on public.bookmarks
for insert
to authenticated
with check (auth.uid() = user_id);
