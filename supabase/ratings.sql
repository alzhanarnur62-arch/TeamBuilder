-- TeamBuilder: взаимная оценка участников команды (1–5 звёзд + комментарий).
-- Запускать в SQL Editor после schema.sql. Повторный запуск безопасен.

create table if not exists public.ratings (
  id text primary key,                -- '<projectId>:<fromId>:<toId>' — одна оценка от человека человеку
  project_id text not null references public.projects(id) on delete cascade,
  from_id text not null references public.profiles(id) on delete cascade,
  to_id text not null references public.profiles(id) on delete cascade,
  score int not null check (score between 1 and 5),
  comment text not null default '',
  created_at timestamptz not null default now(),
  unique (project_id, from_id, to_id),
  check (from_id <> to_id)
);

-- Является ли конкретный человек участником проекта (руководитель или принятая заявка)?
create or replace function public.is_user_member(p_project text, p_user text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from projects where id = p_project and owner_id = p_user)
      or exists (select 1 from applications
                 where project_id = p_project and student_id = p_user and status = 'accepted');
$$;

alter table public.ratings enable row level security;

-- Видят только участники команды. Оценивать можно только участников своей команды и только от своего имени.
drop policy if exists ratings_select on public.ratings;
create policy ratings_select on public.ratings for select to authenticated
  using (public.is_member(project_id));

drop policy if exists ratings_insert on public.ratings;
create policy ratings_insert on public.ratings for insert to authenticated
  with check (
    from_id = auth.uid()::text
    and public.is_member(project_id)
    and public.is_user_member(project_id, to_id)
  );

drop policy if exists ratings_update on public.ratings;
create policy ratings_update on public.ratings for update to authenticated
  using (from_id = auth.uid()::text)
  with check (from_id = auth.uid()::text and public.is_user_member(project_id, to_id));

drop policy if exists ratings_delete on public.ratings;
create policy ratings_delete on public.ratings for delete to authenticated
  using (from_id = auth.uid()::text);

-- Живое обновление
do $$
begin
  alter publication supabase_realtime add table public.ratings;
exception when duplicate_object then null;
end $$;

notify pgrst, 'reload schema';
