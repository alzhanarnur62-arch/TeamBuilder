-- TeamBuilder: таблицы, правила доступа (RLS) и живое обновление.
-- Запускать в Supabase → SQL Editor. Можно запускать повторно — ничего не сломается.

-- ============ Таблицы ============

create table if not exists public.profiles (
  id text primary key,                 -- для настоящих пользователей = auth.uid()
  email text,
  name text not null,
  grp text not null default '',
  role text not null,
  skills text[] not null default '{}',
  interests text[] not null default '{}',
  free_slots text[] not null default '{}',
  age text not null default '',
  city text not null default '',
  about text not null default '',
  photo text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id text primary key,
  owner_id text not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null default '',
  needed_roles text[] not null default '{}',
  needed_skills text[] not null default '{}',
  interests text[] not null default '{}',
  slots text[] not null default '{}',
  team_size int not null default 4,
  created_at timestamptz not null default now()
);

create table if not exists public.applications (
  id text primary key,
  project_id text not null references public.projects(id) on delete cascade,
  student_id text not null references public.profiles(id) on delete cascade,
  role text not null,
  message text not null default '',
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  unique (project_id, student_id)
);

create table if not exists public.tasks (
  id text primary key,
  project_id text not null references public.projects(id) on delete cascade,
  title text not null,
  assignee_id text not null references public.profiles(id) on delete cascade,
  status text not null default 'todo' check (status in ('todo', 'doing', 'done')),
  points int not null default 1,
  created_at timestamptz not null default now()
);

-- chat_id: 'p:<projectId>' — чат проекта, 'd:<id1>|<id2>' — личный чат (id по алфавиту)
create table if not exists public.messages (
  id text primary key,
  chat_id text not null,
  author_id text not null references public.profiles(id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);
create index if not exists messages_chat_idx on public.messages (chat_id, created_at);

-- ============ Вспомогательные функции ============

-- Я руководитель проекта или моя заявка принята?
create or replace function public.is_member(p_project text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from projects where id = p_project and owner_id = auth.uid()::text)
      or exists (select 1 from applications
                 where project_id = p_project and student_id = auth.uid()::text and status = 'accepted');
$$;

-- Могу ли я видеть этот чат?
create or replace function public.can_see_chat(p_chat text)
returns boolean language sql stable security definer set search_path = public as $$
  select case
    when p_chat like 'p:%' then public.is_member(substr(p_chat, 3))
    when p_chat like 'd:%' then auth.uid()::text = any (string_to_array(substr(p_chat, 3), '|'))
    else false
  end;
$$;

-- ============ Правила доступа (RLS) ============

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.applications enable row level security;
alter table public.tasks enable row level security;
alter table public.messages enable row level security;

-- Профили: видят все вошедшие, менять можно только свой.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated using (true);
drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles for insert to authenticated with check (id = auth.uid()::text);
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated using (id = auth.uid()::text);

-- Проекты: видят все, создаёт и меняет только руководитель.
drop policy if exists projects_select on public.projects;
create policy projects_select on public.projects for select to authenticated using (true);
drop policy if exists projects_insert on public.projects;
create policy projects_insert on public.projects for insert to authenticated with check (owner_id = auth.uid()::text);
drop policy if exists projects_update on public.projects;
create policy projects_update on public.projects for update to authenticated using (owner_id = auth.uid()::text);
drop policy if exists projects_delete on public.projects;
create policy projects_delete on public.projects for delete to authenticated using (owner_id = auth.uid()::text);

-- Заявки: видят все; подаёт студент от своего имени; решение принимает руководитель.
drop policy if exists apps_select on public.applications;
create policy apps_select on public.applications for select to authenticated using (true);
drop policy if exists apps_insert on public.applications;
create policy apps_insert on public.applications for insert to authenticated
  with check (student_id = auth.uid()::text and status = 'pending');
drop policy if exists apps_update on public.applications;
create policy apps_update on public.applications for update to authenticated
  using (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()::text));
drop policy if exists apps_delete on public.applications;
create policy apps_delete on public.applications for delete to authenticated using (student_id = auth.uid()::text);

-- Задачи: только участники проекта.
drop policy if exists tasks_select on public.tasks;
create policy tasks_select on public.tasks for select to authenticated using (public.is_member(project_id));
drop policy if exists tasks_insert on public.tasks;
create policy tasks_insert on public.tasks for insert to authenticated with check (public.is_member(project_id));
drop policy if exists tasks_update on public.tasks;
create policy tasks_update on public.tasks for update to authenticated using (public.is_member(project_id));
drop policy if exists tasks_delete on public.tasks;
create policy tasks_delete on public.tasks for delete to authenticated using (public.is_member(project_id));

-- Сообщения: только участники чата, писать — только от своего имени.
drop policy if exists messages_select on public.messages;
create policy messages_select on public.messages for select to authenticated using (public.can_see_chat(chat_id));
drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages for insert to authenticated
  with check (author_id = auth.uid()::text and public.can_see_chat(chat_id));

-- ============ Живое обновление (Realtime) ============

do $$
declare t text;
begin
  foreach t in array array['messages', 'projects', 'applications', 'tasks'] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;

-- Обновить кэш API, чтобы новые таблицы сразу стали доступны приложению
notify pgrst, 'reload schema';
