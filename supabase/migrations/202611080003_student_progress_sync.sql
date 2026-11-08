-- T48: Account-based student progress and quiz attempts.
-- Students read/write only their own rows. Admins (permission 'admin:access_portal') can read all
-- rows for reports (T49). No answer keys are stored: `answers` holds only the student's choices.
-- These are practice records calculated in the browser, not secure examination results.

-- 1. Per-experiment laboratory progress (one row per student and experiment).
create table if not exists public.student_experiment_progress (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  experiment_id text not null references public.experiments(id) on delete cascade,
  definition_version text not null check (char_length(definition_version) between 1 and 40),
  status text not null default 'not-started'
    check (status in ('not-started', 'in-progress', 'completed')),
  current_step_id text check (current_step_id is null or char_length(current_step_id) <= 100),
  current_step_index integer not null default 0 check (current_step_index between 0 and 1000),
  -- Number of validated laboratory steps completed ("stage completed" progress).
  completed_step_count integer not null default 0 check (completed_step_count >= 0),
  total_step_count integer not null default 0 check (total_step_count between 0 and 1000),
  lab_completed_at timestamptz,
  last_activity_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, experiment_id),
  constraint student_experiment_progress_steps_within_total
    check (completed_step_count <= total_step_count),
  constraint student_experiment_progress_completed_has_date
    check (status <> 'completed' or lab_completed_at is not null)
);

create index if not exists student_experiment_progress_experiment_idx
  on public.student_experiment_progress(experiment_id);

-- 2. Submitted practice quiz attempts (append-only for students).
create table if not exists public.student_quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  -- Client-generated attempt id; unique per student so re-syncing never duplicates attempts.
  attempt_id text not null check (char_length(attempt_id) between 1 and 120),
  experiment_id text not null references public.experiments(id) on delete cascade,
  assessment_id text not null check (char_length(assessment_id) between 1 and 120),
  assessment_version text not null check (char_length(assessment_version) between 1 and 40),
  score numeric not null check (score >= 0),
  total numeric not null check (total >= 0),
  percentage numeric not null check (percentage between 0 and 100),
  correct_count integer not null check (correct_count >= 0),
  total_questions integer not null check (total_questions between 0 and 500),
  -- Student's selected option per question id (or null). Never the correct answers.
  answers jsonb not null default '{}'::jsonb
    check (jsonb_typeof(answers) = 'object' and pg_column_size(answers) <= 16384),
  submitted_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint student_quiz_attempts_score_within_total check (score <= total),
  constraint student_quiz_attempts_correct_within_total check (correct_count <= total_questions),
  constraint student_quiz_attempts_unique_attempt unique (user_id, attempt_id)
);

create index if not exists student_quiz_attempts_user_submitted_idx
  on public.student_quiz_attempts(user_id, submitted_at desc);
create index if not exists student_quiz_attempts_experiment_idx
  on public.student_quiz_attempts(experiment_id);

create trigger student_experiment_progress_updated_at
  before update on public.student_experiment_progress
  for each row execute function private.set_student_profile_updated_at();

-- 3. Row level security.
alter table public.student_experiment_progress enable row level security;
alter table public.student_quiz_attempts enable row level security;

-- Supabase default privileges grant ALL on new public tables; narrow them explicitly.
revoke all on public.student_experiment_progress from anon, authenticated;
revoke all on public.student_quiz_attempts from anon, authenticated;
grant select, insert, update on public.student_experiment_progress to authenticated;
grant select, insert on public.student_quiz_attempts to authenticated;

drop policy if exists student_experiment_progress_select on public.student_experiment_progress;
create policy student_experiment_progress_select
  on public.student_experiment_progress for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or (select public.has_permission('admin:access_portal'))
  );

drop policy if exists student_experiment_progress_insert_own on public.student_experiment_progress;
create policy student_experiment_progress_insert_own
  on public.student_experiment_progress for insert
  to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists student_experiment_progress_update_own on public.student_experiment_progress;
create policy student_experiment_progress_update_own
  on public.student_experiment_progress for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists student_quiz_attempts_select on public.student_quiz_attempts;
create policy student_quiz_attempts_select
  on public.student_quiz_attempts for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or (select public.has_permission('admin:access_portal'))
  );

drop policy if exists student_quiz_attempts_insert_own on public.student_quiz_attempts;
create policy student_quiz_attempts_insert_own
  on public.student_quiz_attempts for insert
  to authenticated
  with check (user_id = (select auth.uid()));

-- No delete policies and no update policy on attempts: students cannot rewrite or erase history.

comment on table public.student_experiment_progress is
  'T48 per-student 3D lab progress. Self-reported by the browser; practice data, not certification.';
comment on table public.student_quiz_attempts is
  'T48 practice quiz attempts. answers = student choices only; no answer keys are stored.';
