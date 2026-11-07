-- Task T34 Transactional Verification: Question Bank RLS, Draft Visibility, Versioning & Constraints
-- Executes inside a transaction and rolls back so production data remains clean.

begin;

do $$
declare
  v_student_id uuid := '00000000-0000-4000-8000-000000000401';
  v_instructor_id uuid := '00000000-0000-4000-8000-000000000402';
  v_admin_id uuid := '00000000-0000-4000-8000-000000000403';
  v_assessment_count integer;
  v_question_count integer;
  v_visible_assessments integer;
  v_visible_questions integer;
  v_visible_snapshots integer;
  v_updated_rows integer;
begin
  -- 1. Verify 3 seeded assessments and 6 seeded questions exist
  select count(*) into v_assessment_count from public.experiment_assessments;
  if v_assessment_count <> 3 then
    raise exception 'Expected 3 seeded assessments, got %', v_assessment_count;
  end if;

  select count(*) into v_question_count from public.assessment_questions;
  if v_question_count <> 6 then
    raise exception 'Expected 6 seeded questions, got %', v_question_count;
  end if;

  -- 2. Create synthetic users for student, instructor, and admin
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  )
  values
    (
      v_student_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      't34.student@test.local', 'pw', now(), '{"provider":"email"}'::jsonb,
      '{"full_name":"Test Student","grade":"grade-secondary-1"}'::jsonb, now(), now()
    ),
    (
      v_instructor_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      't34.instructor@test.local', 'pw', now(), '{"provider":"email"}'::jsonb,
      '{"full_name":"Test Instructor","grade":"grade-secondary-1"}'::jsonb, now(), now()
    ),
    (
      v_admin_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      't34.admin@test.local', 'pw', now(), '{"provider":"email"}'::jsonb,
      '{"full_name":"Test Admin","grade":"grade-secondary-1"}'::jsonb, now(), now()
    );

  perform private.bootstrap_assign_user_role(
    v_instructor_id, 'instructor', 'Assign instructor for T34 test'
  );
  perform private.bootstrap_assign_user_role(
    v_admin_id, 'admin', 'Assign admin for T34 test'
  );

  -- 3. Switch to Admin context: sees all 3 assessments (1 published + 2 draft)
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_admin_id::text, true);
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_admin_id::text, 'role', 'authenticated')::text,
    true
  );

  select count(*) into v_visible_assessments from public.experiment_assessments;
  if v_visible_assessments <> 3 then
    raise exception 'Admin should see all 3 assessments, saw %', v_visible_assessments;
  end if;

  -- Admin adds a draft question to draft assessment-volume-002
  insert into public.assessment_questions (
    id, assessment_id, experiment_id, sort_order, prompt, options,
    correct_option_id, explanation, difficulty, learning_objective_id
  )
  values (
    'vol-q-01-meniscus',
    'assessment-volume-002',
    'exp-volume-002',
    1,
    'At what position should you read the water level in a graduated cylinder?',
    '[
      {"id": "vol-q-01-opt-eye", "text": "At eye level with the bottom of the meniscus", "order": 1},
      {"id": "vol-q-01-opt-top", "text": "From above looking down at the rim", "order": 2}
    ]'::jsonb,
    'vol-q-01-opt-eye',
    'Reading the bottom of the curved meniscus at eye level prevents parallax error.',
    'beginner',
    'volume-meniscus'
  );

  -- Verify check constraint rejects a question with fewer than 2 options
  begin
    insert into public.assessment_questions (
      id, assessment_id, experiment_id, sort_order, prompt, options,
      correct_option_id, explanation, difficulty
    )
    values (
      'vol-q-invalid-opts',
      'assessment-volume-002',
      'exp-volume-002',
      2,
      'Invalid single-option question prompt?',
      '[{"id": "opt-1", "text": "Only one option", "order": 1}]'::jsonb,
      'opt-1',
      'Valid explanation text for constraint check.',
      'beginner'
    );
    raise exception 'Expected check_violation when inserting question with < 2 options';
  exception
    when check_violation then null;
  end;

  -- Verify check constraint rejects invalid semantic version
  begin
    update public.experiment_assessments
    set version = 'v1-bad-semver'
    where id = 'assessment-volume-002';
    raise exception 'Expected check_violation when setting invalid semantic version';
  exception
    when check_violation then null;
  end;

  -- Admin records a version snapshot for assessment-salt-water-001
  insert into public.assessment_version_snapshots (
    assessment_id, version, snapshot, created_by
  )
  values (
    'assessment-salt-water-001',
    '1.0.0',
    '{"id": "assessment-salt-water-001", "version": "1.0.0", "questionCount": 6}'::jsonb,
    v_admin_id
  );

  -- 4. Switch to Student: sees ONLY 1 published assessment and its 6 questions (draft vol-q-01-meniscus is hidden!)
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_student_id::text, true);
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_student_id::text, 'role', 'authenticated')::text,
    true
  );

  select count(*) into v_visible_assessments from public.experiment_assessments;
  if v_visible_assessments <> 1 then
    raise exception 'Student should see only 1 published assessment, saw %', v_visible_assessments;
  end if;

  select count(*) into v_visible_questions from public.assessment_questions;
  if v_visible_questions <> 6 then
    raise exception 'Student should see only 6 questions from published assessment, saw %', v_visible_questions;
  end if;

  select count(*) into v_visible_snapshots from public.assessment_version_snapshots;
  if v_visible_snapshots <> 0 then
    raise exception 'Student should see 0 admin version snapshots, saw %', v_visible_snapshots;
  end if;

  -- Student cannot insert or update assessments or questions
  begin
    insert into public.experiment_assessments (id, experiment_id, title, description)
    values ('assessment-hack', 'exp-salt-water-001', 'Hack Quiz', 'Unauthorized student quiz.');
    raise exception 'Student should not be able to insert into public.experiment_assessments';
  exception
    when insufficient_privilege then null;
  end;

  update public.experiment_assessments
  set publication_status = 'published'
  where id = 'assessment-volume-002';
  get diagnostics v_updated_rows = row_count;
  if v_updated_rows <> 0 then
    raise exception 'Student should not be able to publish draft assessments';
  end if;

  -- 5. Switch to Instructor: cannot insert or update assessments or questions
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_instructor_id::text, true);
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_instructor_id::text, 'role', 'authenticated')::text,
    true
  );

  begin
    insert into public.assessment_questions (
      id, assessment_id, experiment_id, sort_order, prompt, options,
      correct_option_id, explanation
    )
    values (
      'inst-hack-q',
      'assessment-salt-water-001',
      'exp-salt-water-001',
      7,
      'Unauthorized instructor question prompt?',
      '[{"id":"a","text":"A","order":1},{"id":"b","text":"B","order":2}]'::jsonb,
      'a',
      'Unauthorized instructor explanation.'
    );
    raise exception 'Instructor should not be able to insert into public.assessment_questions';
  exception
    when insufficient_privilege then null;
  end;

  -- 6. Switch to Admin: publish assessment-volume-002 -> Anon/student now sees 2 published assessments and 7 questions
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_admin_id::text, true);
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_admin_id::text, 'role', 'authenticated')::text,
    true
  );

  update public.experiment_assessments
  set publication_status = 'published',
      availability_status = 'available',
      review_status = 'approved'
  where id = 'assessment-volume-002';

  perform set_config('role', 'anon', true);
  select count(*) into v_visible_assessments from public.experiment_assessments;
  select count(*) into v_visible_questions from public.assessment_questions;
  if v_visible_assessments <> 2 or v_visible_questions <> 7 then
    raise exception 'Anon/student should see 2 published assessments and 7 questions after publish, saw %/%',
      v_visible_assessments, v_visible_questions;
  end if;
end;
$$;

rollback;
