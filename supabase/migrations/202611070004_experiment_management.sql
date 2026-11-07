-- Task T33: Admin Experiment Management System
-- Depends on:
--   202611070002_user_roles_and_permissions.sql (public.has_permission)
--   202611070003_curriculum_management.sql (public.curriculum_lessons)
-- Non-destructive migration creating experiment categories and experiment metadata tables
-- with simulation registry validation, publication workflow, and Row Level Security.

-- 1. Experiment Categories Table
create table if not exists public.experiment_categories (
  id text primary key check (char_length(btrim(id)) between 2 and 80),
  label text not null check (char_length(btrim(label)) between 2 and 120),
  description text not null default '' check (char_length(description) <= 500),
  sort_order integer not null default 1 check (sort_order >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_experiment_categories_order
  on public.experiment_categories(sort_order, id);

create trigger experiment_categories_updated_at
  before update on public.experiment_categories
  for each row execute function private.set_student_profile_updated_at();

insert into public.experiment_categories (id, label, description, sort_order)
values
  ('chemistry', 'Chemistry', 'Substances and their properties', 1),
  ('measurement', 'Measurement', 'Practical measuring techniques', 2)
on conflict (id) do update
  set label = excluded.label,
      description = excluded.description,
      sort_order = excluded.sort_order;

-- 2. Experiments Metadata Table
-- Separates educational content publication ('draft', 'published', 'archived')
-- from 3D simulation availability ('demo', 'planned').
-- Prevents unregistered simulations from being marked playable ('demo').
create table if not exists public.experiments (
  id text primary key check (char_length(btrim(id)) between 3 and 100),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (char_length(btrim(title)) between 2 and 160),
  short_description text not null check (char_length(btrim(short_description)) between 5 and 600),
  category_id text not null references public.experiment_categories(id) on delete restrict,
  difficulty text not null default 'beginner'
    check (difficulty in ('beginner', 'intermediate', 'advanced')),
  estimated_duration_minutes integer not null default 15
    check (estimated_duration_minutes between 1 and 240),
  simulation_status text not null default 'planned'
    check (simulation_status in ('demo', 'planned')),
  simulation_id text
    check (simulation_id is null or simulation_id in ('exp-salt-water-001')),
  illustration text not null default 'salt-dissolution'
    check (illustration in ('salt-dissolution', 'liquid-volume', 'ph-indicators')),
  content_review_status text not null default 'draft'
    check (content_review_status in ('draft', 'reviewed')),
  publication_status text not null default 'draft'
    check (publication_status in ('draft', 'published', 'archived')),
  about_paragraphs jsonb not null default '[]'::jsonb
    check (jsonb_typeof(about_paragraphs) = 'array'),
  learning_objectives jsonb not null default '[]'::jsonb
    check (jsonb_typeof(learning_objectives) = 'array'),
  model_note text
    check (model_note is null or char_length(model_note) <= 500),
  required_tools jsonb not null default '[]'::jsonb
    check (jsonb_typeof(required_tools) = 'array'),
  required_materials jsonb not null default '[]'::jsonb
    check (jsonb_typeof(required_materials) = 'array'),
  safety_metadata jsonb
    check (safety_metadata is null or jsonb_typeof(safety_metadata) = 'object'),
  safety_review_status text not null default 'draft'
    check (safety_review_status in ('draft', 'reviewed')),
  media_references jsonb not null default '[]'::jsonb
    check (jsonb_typeof(media_references) = 'array'),
  lesson_id text references public.curriculum_lessons(id) on delete set null,
  sort_order integer not null default 1 check (sort_order >= 1),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint experiments_registered_simulation_check check (
    simulation_status = 'planned'
    or (simulation_id is not null and simulation_id = id)
  ),
  constraint experiments_published_content_check check (
    publication_status <> 'published'
    or (
      jsonb_array_length(about_paragraphs) >= 1
      and jsonb_array_length(learning_objectives) >= 1
    )
  )
);

create index if not exists idx_experiments_publication_order
  on public.experiments(publication_status, sort_order, id);

create index if not exists idx_experiments_category
  on public.experiments(category_id, publication_status);

create index if not exists idx_experiments_lesson
  on public.experiments(lesson_id)
  where lesson_id is not null;

create trigger experiments_updated_at
  before update on public.experiments
  for each row execute function private.set_student_profile_updated_at();

-- 3. Seed Canonical Repository Experiments (Non-destructive)
insert into public.experiments (
  id,
  slug,
  title,
  short_description,
  category_id,
  difficulty,
  estimated_duration_minutes,
  simulation_status,
  simulation_id,
  illustration,
  content_review_status,
  publication_status,
  about_paragraphs,
  learning_objectives,
  model_note,
  required_tools,
  required_materials,
  safety_metadata,
  safety_review_status,
  media_references,
  sort_order
)
values
  (
    'exp-salt-water-001',
    'dissolving-salt-in-water',
    'Dissolving Salt in Water',
    'Observe how sodium chloride disperses in water and distinguish a homogeneous solution from undissolved solid.',
    'chemistry',
    'beginner',
    10,
    'demo',
    'exp-salt-water-001',
    'salt-dissolution',
    'draft',
    'published',
    '[
      "Explore what happens when salt dissolves in water. A solution is a mixture that is evenly mixed. The salt is still present even when you cannot see solid grains.",
      "During the demonstration, you use virtual tools to measure water volume and salt mass. You then mix the salt with water and observe the amount of solid salt as you stir.",
      "This activity helps you connect measurements with observations. Dissolved salt is spread through the water as tiny particles. Undissolved salt remains as solid grains."
    ]'::jsonb,
    '[
      {"id": "salt-tools", "text": "Identify the main laboratory tools."},
      {"id": "salt-water-volume", "text": "Measure water volume using the virtual tools."},
      {"id": "salt-mass", "text": "Measure the mass of salt using the virtual balance."},
      {"id": "salt-dissolving", "text": "Observe how salt dissolves in water."},
      {"id": "salt-observation", "text": "Explain the difference between dissolved and undissolved salt."}
    ]'::jsonb,
    'The measurements come from a simplified computer model. They are not readings from real laboratory equipment.',
    '["Beaker", "Graduated Cylinder", "Glass Stirring Rod", "Digital Balance", "Laboratory Spatula", "Weighing Boat"]'::jsonb,
    '["Water (H₂O)", "Sodium Chloride (NaCl)"]'::jsonb,
    '{
      "level": "low",
      "requiresSupervision": true,
      "note": "Wear suitable eye protection as instructed, handle glassware carefully, never taste substances, and clean up water spills.",
      "recommendedPpe": ["Eye protection as directed by the instructor"]
    }'::jsonb,
    'draft',
    '["salt-dissolution"]'::jsonb,
    1
  ),
  (
    'exp-volume-002',
    'measuring-liquid-volume',
    'Measuring Liquid Volume',
    'Introduce the use of graduated glassware and reading the liquid meniscus at eye level.',
    'measurement',
    'beginner',
    15,
    'planned',
    null,
    'liquid-volume',
    'draft',
    'published',
    '[
      "This planned activity introduces graduated glassware and reading water volume. Graduated glassware has marks that help you read a volume.",
      "The planned focus is reading the meniscus at eye level. The meniscus is the curved surface of a liquid. This helps you understand how to read a volume scale carefully.",
      "The activity is not available yet. Its materials and instructions are still being reviewed."
    ]'::jsonb,
    '[
      {"id": "volume-scale", "text": "Recognize the volume scale on graduated glassware."},
      {"id": "volume-meniscus", "text": "Describe what a meniscus is."},
      {"id": "volume-reading", "text": "Explain why a water volume reading should be taken at eye level."}
    ]'::jsonb,
    null,
    '["Graduated Cylinder"]'::jsonb,
    '["Water (H₂O)"]'::jsonb,
    '{
      "level": "low",
      "requiresSupervision": true,
      "note": "Handle laboratory glassware carefully and report damaged equipment."
    }'::jsonb,
    'draft',
    '["liquid-volume"]'::jsonb,
    2
  ),
  (
    'exp-ph-003',
    'exploring-ph-indicators',
    'Exploring pH Indicators',
    'Explore how indicator colors can help classify aqueous samples as acidic, neutral, or basic.',
    'chemistry',
    'beginner',
    20,
    'planned',
    null,
    'ph-indicators',
    'draft',
    'published',
    '[
      "This planned activity introduces how indicator colors can help describe solutions as acidic, neutral or basic.",
      "The planned focus is comparing indicator colors. This helps you connect a visible observation with the properties of a solution.",
      "The activity is not available yet. Its chemicals and instructions are still being reviewed."
    ]'::jsonb,
    '[
      {"id": "ph-groups", "text": "Recognize the words acidic, neutral and basic."},
      {"id": "ph-colors", "text": "Describe how indicator colors can help compare solutions."}
    ]'::jsonb,
    null,
    '[]'::jsonb,
    '[]'::jsonb,
    null,
    'draft',
    '["ph-indicators"]'::jsonb,
    3
  )
on conflict (id) do update
  set slug = excluded.slug,
      title = excluded.title,
      short_description = excluded.short_description,
      category_id = excluded.category_id,
      difficulty = excluded.difficulty,
      estimated_duration_minutes = excluded.estimated_duration_minutes,
      simulation_status = excluded.simulation_status,
      simulation_id = excluded.simulation_id,
      illustration = excluded.illustration,
      sort_order = excluded.sort_order;

-- 4. Row Level Security & Least-Privilege Grants
alter table public.experiment_categories enable row level security;
alter table public.experiment_categories force row level security;

alter table public.experiments enable row level security;
alter table public.experiments force row level security;

revoke all on public.experiment_categories from public, anon, authenticated;
revoke all on public.experiments from public, anon, authenticated;

grant select on public.experiment_categories, public.experiments to anon, authenticated;
grant insert, update, delete on public.experiment_categories, public.experiments to authenticated;

-- 4a. Experiment Categories Policies
create policy experiment_categories_select_all
  on public.experiment_categories
  for select
  to anon, authenticated
  using (true);

create policy experiment_categories_admin_insert
  on public.experiment_categories
  for insert
  to authenticated
  with check ((select public.has_permission('admin:manage_content')));

create policy experiment_categories_admin_update
  on public.experiment_categories
  for update
  to authenticated
  using ((select public.has_permission('admin:manage_content')))
  with check ((select public.has_permission('admin:manage_content')));

create policy experiment_categories_admin_delete
  on public.experiment_categories
  for delete
  to authenticated
  using ((select public.has_permission('admin:manage_content')));

-- 4b. Experiments Policies
-- Public/students see only published experiments; admins see all (draft, published, archived).
create policy experiments_select_published
  on public.experiments
  for select
  to anon, authenticated
  using (publication_status = 'published');

create policy experiments_select_admin
  on public.experiments
  for select
  to authenticated
  using ((select public.has_permission('admin:manage_content')));

create policy experiments_admin_insert
  on public.experiments
  for insert
  to authenticated
  with check ((select public.has_permission('admin:manage_content')));

create policy experiments_admin_update
  on public.experiments
  for update
  to authenticated
  using ((select public.has_permission('admin:manage_content')))
  with check ((select public.has_permission('admin:manage_content')));

create policy experiments_admin_delete
  on public.experiments
  for delete
  to authenticated
  using ((select public.has_permission('admin:manage_content')));
