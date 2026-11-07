-- Task T34: Admin MCQ Question Bank Management
-- Depends on:
--   202611070002_user_roles_and_permissions.sql (public.has_permission)
--   202611070004_experiment_management.sql (public.experiments)
-- Non-destructive migration creating experiment assessments, multiple-choice questions,
-- and immutable assessment version snapshots with Row Level Security.
--
-- Security Architecture Note:
-- Published assessments in this table are formative post-experiment practice quizzes
-- (is_practice_assessment = true). Published practice questions and explanations are
-- delivered to the client so students receive immediate educational feedback upon submission.
-- This client-side practice quiz model is not intended for high-stakes official examinations.
-- Draft, reviewed (unpublished), and archived assessments and questions are restricted strictly
-- to authorized administrators via Row Level Security.

-- 1. Experiment Assessments Table
create table if not exists public.experiment_assessments (
  id text primary key check (char_length(btrim(id)) between 3 and 100),
  experiment_id text not null references public.experiments(id) on delete restrict,
  title text not null check (char_length(btrim(title)) between 2 and 160),
  description text not null check (char_length(btrim(description)) between 5 and 800),
  version text not null default '1.0.0'
    check (version ~ '^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$'),
  publication_status text not null default 'draft'
    check (publication_status in ('draft', 'reviewed', 'published', 'archived')),
  availability_status text not null default 'draft-demo'
    check (availability_status in ('draft-demo', 'available', 'coming-soon', 'archived')),
  review_status text not null default 'draft'
    check (review_status in ('draft', 'reviewed', 'approved')),
  question_ordering text not null default 'fixed'
    check (question_ordering in ('fixed', 'shuffle-when-configured')),
  passing_score jsonb not null default '{"status": "unconfigured-draft"}'::jsonb
    check (jsonb_typeof(passing_score) = 'object'),
  is_practice_assessment boolean not null default true,
  sort_order integer not null default 1 check (sort_order >= 1),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_experiment_assessments_experiment
  on public.experiment_assessments(experiment_id, publication_status, sort_order);

create index if not exists idx_experiment_assessments_publication
  on public.experiment_assessments(publication_status, sort_order, id);

create trigger experiment_assessments_updated_at
  before update on public.experiment_assessments
  for each row execute function private.set_student_profile_updated_at();

-- 2. Assessment Questions Table
create table if not exists public.assessment_questions (
  id text primary key check (char_length(btrim(id)) between 3 and 120),
  assessment_id text not null references public.experiment_assessments(id) on delete cascade,
  experiment_id text not null references public.experiments(id) on delete restrict,
  sort_order integer not null default 1 check (sort_order >= 1),
  prompt text not null check (char_length(btrim(prompt)) between 5 and 800),
  options jsonb not null
    check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) >= 2),
  correct_option_id text not null check (char_length(btrim(correct_option_id)) between 1 and 120),
  explanation text not null check (char_length(btrim(explanation)) between 5 and 1200),
  difficulty text not null default 'beginner'
    check (difficulty in ('beginner', 'intermediate', 'advanced')),
  learning_objective_id text
    check (learning_objective_id is null or char_length(btrim(learning_objective_id)) between 1 and 120),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_assessment_questions_assessment_order
  on public.assessment_questions(assessment_id, sort_order, id);

create index if not exists idx_assessment_questions_experiment
  on public.assessment_questions(experiment_id, sort_order);

create trigger assessment_questions_updated_at
  before update on public.assessment_questions
  for each row execute function private.set_student_profile_updated_at();

-- 3. Immutable Assessment Version Snapshots Table
-- Preserves prior published assessment definitions when an administrator edits and bumps
-- an assessment version so historical student attempts remain linked to their original version.
create table if not exists public.assessment_version_snapshots (
  id uuid primary key default gen_random_uuid(),
  assessment_id text not null references public.experiment_assessments(id) on delete cascade,
  version text not null
    check (version ~ '^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$'),
  snapshot jsonb not null check (jsonb_typeof(snapshot) = 'object'),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (assessment_id, version)
);

create index if not exists idx_assessment_version_snapshots_lookup
  on public.assessment_version_snapshots(assessment_id, created_at desc);

-- 4. Seed Canonical Repository Assessments & Questions (Non-destructive)
insert into public.experiment_assessments (
  id,
  experiment_id,
  title,
  description,
  version,
  publication_status,
  availability_status,
  review_status,
  question_ordering,
  passing_score,
  is_practice_assessment,
  sort_order
)
values
  (
    'assessment-salt-water-001',
    'exp-salt-water-001',
    'Dissolving Salt in Water — Post-Lab Review',
    'Review the laboratory tools, measurements, and observations from the Dissolving Salt in Water demonstration. This draft question bank is designed for learning practice.',
    '1.0.0',
    'published',
    'draft-demo',
    'draft',
    'fixed',
    '{"status": "unconfigured-draft"}'::jsonb,
    true,
    1
  ),
  (
    'assessment-volume-002',
    'exp-volume-002',
    'Measuring Liquid Volume — Planned Review',
    'Planned post-experiment review covering graduated glassware scales and reading the liquid meniscus at eye level.',
    '1.0.0',
    'draft',
    'coming-soon',
    'draft',
    'fixed',
    '{"status": "unconfigured-draft"}'::jsonb,
    true,
    2
  ),
  (
    'assessment-ph-003',
    'exp-ph-003',
    'Exploring pH Indicators — Planned Review',
    'Planned post-experiment review covering acidic, neutral, and basic classifications using indicator colors.',
    '1.0.0',
    'draft',
    'coming-soon',
    'draft',
    'fixed',
    '{"status": "unconfigured-draft"}'::jsonb,
    true,
    3
  )
on conflict (id) do update
  set experiment_id = excluded.experiment_id,
      title = excluded.title,
      description = excluded.description,
      version = excluded.version,
      publication_status = excluded.publication_status,
      availability_status = excluded.availability_status,
      review_status = excluded.review_status,
      question_ordering = excluded.question_ordering,
      passing_score = excluded.passing_score,
      is_practice_assessment = excluded.is_practice_assessment,
      sort_order = excluded.sort_order;

insert into public.assessment_questions (
  id,
  assessment_id,
  experiment_id,
  sort_order,
  prompt,
  options,
  correct_option_id,
  explanation,
  difficulty,
  learning_objective_id
)
values
  (
    'salt-q-01-volume-tool',
    'assessment-salt-water-001',
    'exp-salt-water-001',
    1,
    'Which laboratory tool is used in this virtual demonstration to measure the volume of water before pouring it into the beaker?',
    '[
      {"id": "salt-q-01-opt-cylinder", "text": "Graduated cylinder", "order": 1},
      {"id": "salt-q-01-opt-balance", "text": "Digital balance", "order": 2},
      {"id": "salt-q-01-opt-rod", "text": "Glass stirring rod", "order": 3},
      {"id": "salt-q-01-opt-boat", "text": "Weighing boat", "order": 4}
    ]'::jsonb,
    'salt-q-01-opt-cylinder',
    'In the demonstration, the graduated cylinder is used to measure the volume of water in milliliters (mL), while the digital balance and weighing boat are used to measure the mass of solid salt in grams (g).',
    'beginner',
    'salt-tools'
  ),
  (
    'salt-q-02-mass-measurement',
    'assessment-salt-water-001',
    'exp-salt-water-001',
    2,
    'Which tool is used together with the weighing boat to measure the mass of sodium chloride (salt) in grams?',
    '[
      {"id": "salt-q-02-opt-beaker", "text": "Beaker", "order": 1},
      {"id": "salt-q-02-opt-balance", "text": "Digital balance", "order": 2},
      {"id": "salt-q-02-opt-cylinder", "text": "Graduated cylinder", "order": 3},
      {"id": "salt-q-02-opt-rod", "text": "Glass stirring rod", "order": 4}
    ]'::jsonb,
    'salt-q-02-opt-balance',
    'The digital balance measures the mass of solid sodium chloride (in grams) placed in the weighing boat before the salt is transferred to the beaker.',
    'beginner',
    'salt-mass'
  ),
  (
    'salt-q-03-stirring-effect',
    'assessment-salt-water-001',
    'exp-salt-water-001',
    3,
    'In the virtual lab model, what happens when you stir the salt and water mixture with the glass stirring rod?',
    '[
      {"id": "salt-q-03-opt-progress", "text": "Stirring helps the solid salt dissolve into the water until no more can dissolve in that water volume.", "order": 1},
      {"id": "salt-q-03-opt-evaporate", "text": "Stirring removes the water from the beaker and leaves only dry salt behind.", "order": 2},
      {"id": "salt-q-03-opt-destroy", "text": "Stirring makes the salt disappear completely so it is no longer in the beaker.", "order": 3},
      {"id": "salt-q-03-opt-freeze", "text": "Stirring turns the liquid water into solid ice crystals.", "order": 4}
    ]'::jsonb,
    'salt-q-03-opt-progress',
    'Stirring increases mixing between the solid salt grains and water, helping the salt dissolve up to the capacity of the selected water volume in the simplified model.',
    'beginner',
    'salt-dissolving'
  ),
  (
    'salt-q-04-dissolved-state',
    'assessment-salt-water-001',
    'exp-salt-water-001',
    4,
    'When all of the added salt dissolves in the water and no solid grains are visible at the bottom of the beaker, which statement is correct?',
    '[
      {"id": "salt-q-04-opt-gone", "text": "The salt is no longer present in the beaker.", "order": 1},
      {"id": "salt-q-04-opt-even", "text": "The salt is still present and is spread evenly through the water as a solution.", "order": 2},
      {"id": "salt-q-04-opt-gas", "text": "The salt has turned into a gas and escaped into the air.", "order": 3},
      {"id": "salt-q-04-opt-water", "text": "The salt has changed into extra liquid water molecules.", "order": 4}
    ]'::jsonb,
    'salt-q-04-opt-even',
    'A solution is an evenly mixed mixture. Even when you cannot see solid salt grains, the dissolved sodium chloride is still present as tiny particles spread throughout the water.',
    'beginner',
    'salt-observation'
  ),
  (
    'salt-q-05-undissolved-solid',
    'assessment-salt-water-001',
    'exp-salt-water-001',
    5,
    'Why can solid salt grains remain at the bottom of the beaker even after complete stirring when a large mass of salt is added to a small volume of water?',
    '[
      {"id": "salt-q-05-opt-capacity", "text": "The chosen volume of water can only dissolve a limited amount of salt, so the extra salt stays as undissolved solid.", "order": 1},
      {"id": "salt-q-05-opt-broken-rod", "text": "The glass stirring rod stops working whenever more than 5 grams of salt are added.", "order": 2},
      {"id": "salt-q-05-opt-insoluble", "text": "Sodium chloride cannot dissolve in water at all.", "order": 3},
      {"id": "salt-q-05-opt-sand", "text": "The remaining salt has changed into sand during stirring.", "order": 4}
    ]'::jsonb,
    'salt-q-05-opt-capacity',
    'A given volume of water can dissolve only a certain amount of salt. Once that limit is reached in the model, any additional salt remains visible as undissolved solid grains.',
    'intermediate',
    'salt-observation'
  ),
  (
    'salt-q-06-water-volume-comparison',
    'assessment-salt-water-001',
    'exp-salt-water-001',
    6,
    'Suppose two beakers each receive the same large mass of salt and are stirred completely, but Beaker A has 100 mL of water and Beaker B has 250 mL of water. What does the virtual model show?',
    '[
      {"id": "salt-q-06-opt-more-dissolves", "text": "The larger water volume in Beaker B can dissolve more salt than the smaller water volume in Beaker A.", "order": 1},
      {"id": "salt-q-06-opt-less-dissolves", "text": "The larger water volume in Beaker B dissolves less salt than Beaker A.", "order": 2},
      {"id": "salt-q-06-opt-no-effect", "text": "Water volume has no effect on how much salt can dissolve.", "order": 3},
      {"id": "salt-q-06-opt-no-stirring", "text": "Neither beaker can dissolve any salt once water is added.", "order": 4}
    ]'::jsonb,
    'salt-q-06-opt-more-dissolves',
    'Comparing measurements with observations shows that a larger volume of water can dissolve a greater mass of salt before undissolved solid remains.',
    'intermediate',
    'salt-water-volume'
  )
on conflict (id) do update
  set assessment_id = excluded.assessment_id,
      experiment_id = excluded.experiment_id,
      sort_order = excluded.sort_order,
      prompt = excluded.prompt,
      options = excluded.options,
      correct_option_id = excluded.correct_option_id,
      explanation = excluded.explanation,
      difficulty = excluded.difficulty,
      learning_objective_id = excluded.learning_objective_id;

-- 5. Row Level Security & Least-Privilege Grants
alter table public.experiment_assessments enable row level security;
alter table public.experiment_assessments force row level security;

alter table public.assessment_questions enable row level security;
alter table public.assessment_questions force row level security;

alter table public.assessment_version_snapshots enable row level security;
alter table public.assessment_version_snapshots force row level security;

revoke all on public.experiment_assessments from public, anon, authenticated;
revoke all on public.assessment_questions from public, anon, authenticated;
revoke all on public.assessment_version_snapshots from public, anon, authenticated;

grant select on public.experiment_assessments, public.assessment_questions to anon, authenticated;
grant select on public.assessment_version_snapshots to authenticated;
grant insert, update, delete on public.experiment_assessments, public.assessment_questions, public.assessment_version_snapshots to authenticated;

-- 5a. Experiment Assessments Policies
-- Students and anonymous visitors can only read published assessments.
-- Administrators with admin:manage_content can read and mutate all assessments (draft, reviewed, published, archived).
create policy experiment_assessments_select_published
  on public.experiment_assessments
  for select
  to anon, authenticated
  using (publication_status = 'published');

create policy experiment_assessments_select_admin
  on public.experiment_assessments
  for select
  to authenticated
  using ((select public.has_permission('admin:manage_content')));

create policy experiment_assessments_admin_insert
  on public.experiment_assessments
  for insert
  to authenticated
  with check ((select public.has_permission('admin:manage_content')));

create policy experiment_assessments_admin_update
  on public.experiment_assessments
  for update
  to authenticated
  using ((select public.has_permission('admin:manage_content')))
  with check ((select public.has_permission('admin:manage_content')));

create policy experiment_assessments_admin_delete
  on public.experiment_assessments
  for delete
  to authenticated
  using ((select public.has_permission('admin:manage_content')));

-- 5b. Assessment Questions Policies
-- Students and anonymous visitors can only read questions belonging to a published assessment.
create policy assessment_questions_select_published
  on public.assessment_questions
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.experiment_assessments a
      where a.id = assessment_questions.assessment_id
        and a.publication_status = 'published'
    )
  );

create policy assessment_questions_select_admin
  on public.assessment_questions
  for select
  to authenticated
  using ((select public.has_permission('admin:manage_content')));

create policy assessment_questions_admin_insert
  on public.assessment_questions
  for insert
  to authenticated
  with check ((select public.has_permission('admin:manage_content')));

create policy assessment_questions_admin_update
  on public.assessment_questions
  for update
  to authenticated
  using ((select public.has_permission('admin:manage_content')))
  with check ((select public.has_permission('admin:manage_content')));

create policy assessment_questions_admin_delete
  on public.assessment_questions
  for delete
  to authenticated
  using ((select public.has_permission('admin:manage_content')));

-- 5c. Assessment Version Snapshots Policies
-- Only authorized administrators can inspect or record immutable version snapshots.
create policy assessment_version_snapshots_select_admin
  on public.assessment_version_snapshots
  for select
  to authenticated
  using ((select public.has_permission('admin:manage_content')));

create policy assessment_version_snapshots_admin_insert
  on public.assessment_version_snapshots
  for insert
  to authenticated
  with check ((select public.has_permission('admin:manage_content')));

create policy assessment_version_snapshots_admin_update
  on public.assessment_version_snapshots
  for update
  to authenticated
  using ((select public.has_permission('admin:manage_content')))
  with check ((select public.has_permission('admin:manage_content')));

create policy assessment_version_snapshots_admin_delete
  on public.assessment_version_snapshots
  for delete
  to authenticated
  using ((select public.has_permission('admin:manage_content')));
