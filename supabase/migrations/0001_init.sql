-- =========================================================
-- Sistema de Controle de Aulas — Migration inicial (0001)
-- Baseado no SDD v1.1
-- =========================================================

-- ---------------------------------------------------------
-- Extensões necessárias
-- ---------------------------------------------------------
create extension if not exists "uuid-ossp";   -- uuid_generate_v4()
create extension if not exists "pgcrypto";     -- gen_random_bytes() para share_token
create extension if not exists "btree_gist";   -- necessário para EXCLUDE USING gist com uuid

-- ---------------------------------------------------------
-- Função utilitária: atualizar updated_at automaticamente
-- ---------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- =========================================================
-- users (perfil do professor, vinculado ao auth.users do Supabase)
-- =========================================================
create table public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null,
  email       text not null,
  timezone    text not null default 'UTC',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger trg_users_updated_at
before update on public.users
for each row execute function set_updated_at();

-- =========================================================
-- students
-- =========================================================
create table public.students (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references public.users(id) on delete cascade,
  name         text not null,
  email        text not null,                          -- meio de comunicação principal (obrigatório)
  whatsapp     text,                                    -- opcional
  share_token  text not null unique
               default encode(gen_random_bytes(16), 'hex'),  -- 128 bits, não sequencial
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint students_email_format
    check (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

create index idx_students_user_id on public.students(user_id);
create index idx_students_share_token on public.students(share_token);

create trigger trg_students_updated_at
before update on public.students
for each row execute function set_updated_at();

-- =========================================================
-- lesson_packages
-- =========================================================
create table public.lesson_packages (
  id             uuid primary key default uuid_generate_v4(),
  student_id     uuid not null references public.students(id) on delete cascade,
  package_size   integer not null check (package_size > 0),
  price          numeric(10,2) not null check (price >= 0),
  paid_at        timestamptz not null default now(),
  status         text not null default 'ACTIVE'
                 check (status in ('ACTIVE', 'FINISHED')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index idx_lesson_packages_student_id on public.lesson_packages(student_id);

-- Regra de negócio 4: apenas um pacote ACTIVE por aluno
create unique index one_active_package_per_student
  on public.lesson_packages(student_id)
  where (status = 'ACTIVE');

create trigger trg_lesson_packages_updated_at
before update on public.lesson_packages
for each row execute function set_updated_at();

-- =========================================================
-- lessons
-- =========================================================
create table public.lessons (
  id             uuid primary key default uuid_generate_v4(),
  student_id     uuid not null references public.students(id) on delete cascade,
  professor_id   uuid not null references public.users(id) on delete cascade,
  package_id     uuid references public.lesson_packages(id),
  start_at       timestamptz not null,
  end_at         timestamptz not null,
  status         text not null default 'SCHEDULED'
                 check (status in ('SCHEDULED', 'COMPLETED', 'CANCELLED')),
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint lessons_end_after_start check (end_at > start_at)
);

create index idx_lessons_student_id on public.lessons(student_id);
create index idx_lessons_professor_start on public.lessons(professor_id, start_at);

-- Regra de negócio 6: sem sobreposição de horários por professor
-- (aulas CANCELLED não entram na checagem)
alter table public.lessons
add constraint no_overlapping_lessons
exclude using gist (
  professor_id with =,
  tstzrange(start_at, end_at) with &&
) where (status <> 'CANCELLED');

create trigger trg_lessons_updated_at
before update on public.lessons
for each row execute function set_updated_at();

-- =========================================================
-- lesson_reschedules (histórico de remarcações)
-- =========================================================
create table public.lesson_reschedules (
  id            uuid primary key default uuid_generate_v4(),
  lesson_id     uuid not null references public.lessons(id) on delete cascade,
  old_start_at  timestamptz not null,
  new_start_at  timestamptz not null,
  reason        text,
  changed_by    uuid not null references public.users(id),
  changed_at    timestamptz not null default now()
);

create index idx_lesson_reschedules_lesson_id on public.lesson_reschedules(lesson_id);

-- =========================================================
-- audit_logs (histórico de auditoria genérico)
-- =========================================================
create table public.audit_logs (
  id           uuid primary key default uuid_generate_v4(),
  table_name   text not null,
  record_id    uuid not null,
  action       text not null,              -- INSERT / UPDATE / DELETE
  old_value    jsonb,
  new_value    jsonb,
  actor_id     uuid references public.users(id),
  created_at   timestamptz not null default now()
);

create index idx_audit_logs_table_record on public.audit_logs(table_name, record_id);

-- =========================================================
-- Row Level Security
-- Todas as policies são escopadas por professor (user_id/professor_id),
-- nunca assumindo professor único — pronto para multi-tenant no futuro.
-- =========================================================

alter table public.users enable row level security;
alter table public.students enable row level security;
alter table public.lesson_packages enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_reschedules enable row level security;
alter table public.audit_logs enable row level security;

-- users: cada professor só vê/edita o próprio perfil
create policy users_select_own on public.users
  for select using (id = auth.uid());
create policy users_update_own on public.users
  for update using (id = auth.uid());

-- students: escopado por user_id (professor dono do aluno)
create policy students_select_own on public.students
  for select using (user_id = auth.uid());
create policy students_insert_own on public.students
  for insert with check (user_id = auth.uid());
create policy students_update_own on public.students
  for update using (user_id = auth.uid());
create policy students_delete_own on public.students
  for delete using (user_id = auth.uid());

-- lesson_packages: escopado via join implícito (student pertence ao professor)
create policy lesson_packages_select_own on public.lesson_packages
  for select using (
    exists (
      select 1 from public.students s
      where s.id = lesson_packages.student_id and s.user_id = auth.uid()
    )
  );
create policy lesson_packages_insert_own on public.lesson_packages
  for insert with check (
    exists (
      select 1 from public.students s
      where s.id = lesson_packages.student_id and s.user_id = auth.uid()
    )
  );
create policy lesson_packages_update_own on public.lesson_packages
  for update using (
    exists (
      select 1 from public.students s
      where s.id = lesson_packages.student_id and s.user_id = auth.uid()
    )
  );

-- lessons: escopado diretamente por professor_id
create policy lessons_select_own on public.lessons
  for select using (professor_id = auth.uid());
create policy lessons_insert_own on public.lessons
  for insert with check (professor_id = auth.uid());
create policy lessons_update_own on public.lessons
  for update using (professor_id = auth.uid());

-- lesson_reschedules: escopado via join com lessons
create policy lesson_reschedules_select_own on public.lesson_reschedules
  for select using (
    exists (
      select 1 from public.lessons l
      where l.id = lesson_reschedules.lesson_id and l.professor_id = auth.uid()
    )
  );
create policy lesson_reschedules_insert_own on public.lesson_reschedules
  for insert with check (
    exists (
      select 1 from public.lessons l
      where l.id = lesson_reschedules.lesson_id and l.professor_id = auth.uid()
    )
  );

-- audit_logs: apenas leitura pelo próprio ator (ajustar conforme necessidade)
create policy audit_logs_select_own on public.audit_logs
  for select using (actor_id = auth.uid());

-- =========================================================
-- Observação sobre a rota pública (GET /share/:token)
-- =========================================================
-- A página pública NÃO deve depender de auth.uid() (o visitante não está
-- autenticado). O Route Handler dessa rota deve usar a service_role key
-- do Supabase (que bypassa RLS) e validar o share_token manualmente no
-- código do servidor antes de retornar qualquer dado — nunca expor a
-- service_role key no client.
