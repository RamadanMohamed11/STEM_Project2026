-- Task T32: Admin Curriculum Management System
-- Depends on: 202611070002_user_roles_and_permissions.sql (public.has_permission)
-- Non-destructive migration creating the academic curriculum hierarchy tables,
-- publication status controls, relational integrity constraints, and RLS policies.

-- 1. Academic Grades Table (Secondary 1, 2, 3)
create table if not exists public.curriculum_grades (
  id text primary key check (char_length(btrim(id)) between 3 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  stage text not null default 'secondary' check (stage = 'secondary'),
  level smallint not null unique check (level in (1, 2, 3)),
  title text not null check (char_length(btrim(title)) between 3 and 120),
  description text not null default '' check (char_length(description) <= 500),
  sort_order integer not null check (sort_order >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_curriculum_grades_order
  on public.curriculum_grades(sort_order, id);

create trigger curriculum_grades_updated_at
  before update on public.curriculum_grades
  for each row execute function private.set_student_profile_updated_at();

-- 2. Academic Terms Table (First Term, Second Term per Grade)
create table if not exists public.curriculum_terms (
  id text primary key check (char_length(btrim(id)) between 3 and 80),
  grade_id text not null references public.curriculum_grades(id) on delete restrict,
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  term_number smallint not null check (term_number in (1, 2)),
  title text not null check (char_length(btrim(title)) between 3 and 120),
  description text not null default '' check (char_length(description) <= 500),
  sort_order integer not null check (sort_order >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (grade_id, term_number),
  unique (grade_id, slug)
);

create index if not exists idx_curriculum_terms_grade_order
  on public.curriculum_terms(grade_id, sort_order, id);

create trigger curriculum_terms_updated_at
  before update on public.curriculum_terms
  for each row execute function private.set_student_profile_updated_at();

-- 3. Curriculum Units Table
-- Newly created units default to 'draft' and require explicit publishing.
create table if not exists public.curriculum_units (
  id text primary key check (char_length(btrim(id)) between 3 and 100),
  term_id text not null references public.curriculum_terms(id) on delete restrict,
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (char_length(btrim(title)) between 2 and 160),
  description text not null default '' check (char_length(description) <= 1000),
  sort_order integer not null default 1 check (sort_order >= 1),
  publication_status text not null default 'draft'
    check (publication_status in ('draft', 'published', 'archived')),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (term_id, slug)
);

create index if not exists idx_curriculum_units_term_order
  on public.curriculum_units(term_id, sort_order, id);

create index if not exists idx_curriculum_units_publication_status
  on public.curriculum_units(publication_status, term_id, sort_order);

create trigger curriculum_units_updated_at
  before update on public.curriculum_units
  for each row execute function private.set_student_profile_updated_at();

-- 4. Curriculum Lessons Table
-- Newly created lessons default to 'draft' and require explicit publishing.
-- Deleting a unit that still has lessons is blocked by ON DELETE RESTRICT.
create table if not exists public.curriculum_lessons (
  id text primary key check (char_length(btrim(id)) between 3 and 100),
  unit_id text not null references public.curriculum_units(id) on delete restrict,
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (char_length(btrim(title)) between 2 and 160),
  description text not null default '' check (char_length(description) <= 1000),
  sort_order integer not null default 1 check (sort_order >= 1),
  publication_status text not null default 'draft'
    check (publication_status in ('draft', 'published', 'archived')),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (unit_id, slug)
);

create index if not exists idx_curriculum_lessons_unit_order
  on public.curriculum_lessons(unit_id, sort_order, id);

create index if not exists idx_curriculum_lessons_publication_status
  on public.curriculum_lessons(publication_status, unit_id, sort_order);

create trigger curriculum_lessons_updated_at
  before update on public.curriculum_lessons
  for each row execute function private.set_student_profile_updated_at();

-- 5. Lesson-Experiment Relationships Table
-- Preserves existing and future lesson-experiment associations.
-- Deleting a lesson that is linked to an experiment is blocked by ON DELETE RESTRICT.
create table if not exists public.curriculum_lesson_experiments (
  lesson_id text not null references public.curriculum_lessons(id) on delete restrict,
  experiment_id text not null check (char_length(btrim(experiment_id)) between 3 and 100),
  sort_order integer not null default 1 check (sort_order >= 1),
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (lesson_id, experiment_id)
);

create index if not exists idx_curriculum_lesson_experiments_lesson_order
  on public.curriculum_lesson_experiments(lesson_id, sort_order, experiment_id);

-- 6. Seed Standard Secondary Academic Grades and Terms (Non-destructive)
-- Note: Only structural grades and terms are seeded. Official units and lessons are
-- never fabricated or auto-published; administrators manage and publish them explicitly.
insert into public.curriculum_grades (id, slug, stage, level, title, description, sort_order)
values
  (
    'grade-secondary-1',
    'secondary-1',
    'secondary',
    1,
    'First Secondary Grade',
    'Foundational secondary chemistry structure.',
    1
  ),
  (
    'grade-secondary-2',
    'secondary-2',
    'secondary',
    2,
    'Second Secondary Grade',
    'Intermediate secondary chemistry structure.',
    2
  ),
  (
    'grade-secondary-3',
    'secondary-3',
    'secondary',
    3,
    'Third Secondary Grade',
    'Advanced secondary chemistry structure.',
    3
  )
on conflict (id) do update
  set slug = excluded.slug,
      stage = excluded.stage,
      level = excluded.level,
      title = excluded.title,
      description = excluded.description,
      sort_order = excluded.sort_order;

insert into public.curriculum_terms (id, grade_id, slug, term_number, title, description, sort_order)
values
  (
    'term-secondary-1-1',
    'grade-secondary-1',
    'first-term',
    1,
    'First Term',
    'First academic term for First Secondary Grade.',
    1
  ),
  (
    'term-secondary-1-2',
    'grade-secondary-1',
    'second-term',
    2,
    'Second Term',
    'Second academic term for First Secondary Grade.',
    2
  ),
  (
    'term-secondary-2-1',
    'grade-secondary-2',
    'first-term',
    1,
    'First Term',
    'First academic term for Second Secondary Grade.',
    1
  ),
  (
    'term-secondary-2-2',
    'grade-secondary-2',
    'second-term',
    2,
    'Second Term',
    'Second academic term for Second Secondary Grade.',
    2
  ),
  (
    'term-secondary-3-1',
    'grade-secondary-3',
    'first-term',
    1,
    'First Term',
    'First academic term for Third Secondary Grade.',
    1
  ),
  (
    'term-secondary-3-2',
    'grade-secondary-3',
    'second-term',
    2,
    'Second Term',
    'Second academic term for Third Secondary Grade.',
    2
  )
on conflict (id) do update
  set grade_id = excluded.grade_id,
      slug = excluded.slug,
      term_number = excluded.term_number,
      title = excluded.title,
      description = excluded.description,
      sort_order = excluded.sort_order;

-- 7. Row Level Security & Least-Privilege Grants
alter table public.curriculum_grades enable row level security;
alter table public.curriculum_grades force row level security;

alter table public.curriculum_terms enable row level security;
alter table public.curriculum_terms force row level security;

alter table public.curriculum_units enable row level security;
alter table public.curriculum_units force row level security;

alter table public.curriculum_lessons enable row level security;
alter table public.curriculum_lessons force row level security;

alter table public.curriculum_lesson_experiments enable row level security;
alter table public.curriculum_lesson_experiments force row level security;

revoke all on public.curriculum_grades from public, anon, authenticated;
revoke all on public.curriculum_terms from public, anon, authenticated;
revoke all on public.curriculum_units from public, anon, authenticated;
revoke all on public.curriculum_lessons from public, anon, authenticated;
revoke all on public.curriculum_lesson_experiments from public, anon, authenticated;

grant select on
  public.curriculum_grades,
  public.curriculum_terms,
  public.curriculum_units,
  public.curriculum_lessons,
  public.curriculum_lesson_experiments
to anon, authenticated;

grant insert, update, delete on
  public.curriculum_grades,
  public.curriculum_terms,
  public.curriculum_units,
  public.curriculum_lessons,
  public.curriculum_lesson_experiments
to authenticated;

-- 7a. Grades Policies
create policy curriculum_grades_select_all
  on public.curriculum_grades
  for select
  to anon, authenticated
  using (true);

create policy curriculum_grades_admin_insert
  on public.curriculum_grades
  for insert
  to authenticated
  with check ((select public.has_permission('admin:manage_content')));

create policy curriculum_grades_admin_update
  on public.curriculum_grades
  for update
  to authenticated
  using ((select public.has_permission('admin:manage_content')))
  with check ((select public.has_permission('admin:manage_content')));

create policy curriculum_grades_admin_delete
  on public.curriculum_grades
  for delete
  to authenticated
  using ((select public.has_permission('admin:manage_content')));

-- 7b. Terms Policies
create policy curriculum_terms_select_all
  on public.curriculum_terms
  for select
  to anon, authenticated
  using (true);

create policy curriculum_terms_admin_insert
  on public.curriculum_terms
  for insert
  to authenticated
  with check ((select public.has_permission('admin:manage_content')));

create policy curriculum_terms_admin_update
  on public.curriculum_terms
  for update
  to authenticated
  using ((select public.has_permission('admin:manage_content')))
  with check ((select public.has_permission('admin:manage_content')));

create policy curriculum_terms_admin_delete
  on public.curriculum_terms
  for delete
  to authenticated
  using ((select public.has_permission('admin:manage_content')));

-- 7c. Units Policies
-- Public/students see only published units; admins see all units (draft, published, archived).
create policy curriculum_units_select_published
  on public.curriculum_units
  for select
  to anon, authenticated
  using (publication_status = 'published');

create policy curriculum_units_select_admin
  on public.curriculum_units
  for select
  to authenticated
  using ((select public.has_permission('admin:manage_content')));

create policy curriculum_units_admin_insert
  on public.curriculum_units
  for insert
  to authenticated
  with check ((select public.has_permission('admin:manage_content')));

create policy curriculum_units_admin_update
  on public.curriculum_units
  for update
  to authenticated
  using ((select public.has_permission('admin:manage_content')))
  with check ((select public.has_permission('admin:manage_content')));

create policy curriculum_units_admin_delete
  on public.curriculum_units
  for delete
  to authenticated
  using ((select public.has_permission('admin:manage_content')));

-- 7d. Lessons Policies
-- Public/students see only published lessons belonging to published units; admins see all lessons.
create policy curriculum_lessons_select_published
  on public.curriculum_lessons
  for select
  to anon, authenticated
  using (
    publication_status = 'published'
    and exists (
      select 1
      from public.curriculum_units as cu
      where cu.id = curriculum_lessons.unit_id
        and cu.publication_status = 'published'
    )
  );

create policy curriculum_lessons_select_admin
  on public.curriculum_lessons
  for select
  to authenticated
  using ((select public.has_permission('admin:manage_content')));

create policy curriculum_lessons_admin_insert
  on public.curriculum_lessons
  for insert
  to authenticated
  with check ((select public.has_permission('admin:manage_content')));

create policy curriculum_lessons_admin_update
  on public.curriculum_lessons
  for update
  to authenticated
  using ((select public.has_permission('admin:manage_content')))
  with check ((select public.has_permission('admin:manage_content')));

create policy curriculum_lessons_admin_delete
  on public.curriculum_lessons
  for delete
  to authenticated
  using ((select public.has_permission('admin:manage_content')));

-- 7e. Lesson-Experiment Links Policies
-- Public/students see links only when both the lesson and its parent unit are published.
create policy curriculum_lesson_experiments_select_published
  on public.curriculum_lesson_experiments
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.curriculum_lessons as cl
      inner join public.curriculum_units as cu
        on cu.id = cl.unit_id
      where cl.id = curriculum_lesson_experiments.lesson_id
        and cl.publication_status = 'published'
        and cu.publication_status = 'published'
    )
  );

create policy curriculum_lesson_experiments_select_admin
  on public.curriculum_lesson_experiments
  for select
  to authenticated
  using ((select public.has_permission('admin:manage_content')));

create policy curriculum_lesson_experiments_admin_insert
  on public.curriculum_lesson_experiments
  for insert
  to authenticated
  with check ((select public.has_permission('admin:manage_content')));

create policy curriculum_lesson_experiments_admin_update
  on public.curriculum_lesson_experiments
  for update
  to authenticated
  using ((select public.has_permission('admin:manage_content')))
  with check ((select public.has_permission('admin:manage_content')));

create policy curriculum_lesson_experiments_admin_delete
  on public.curriculum_lesson_experiments
  for delete
  to authenticated
  using ((select public.has_permission('admin:manage_content')));
