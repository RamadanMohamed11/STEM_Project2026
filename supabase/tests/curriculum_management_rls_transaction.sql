-- Task T32 Transactional Verification: Curriculum Management RLS & Relational Integrity
-- Executes inside a transaction and rolls back so production data remains clean.

begin;

do $$
declare
  v_student_id uuid := '00000000-0000-4000-8000-000000000201';
  v_instructor_id uuid := '00000000-0000-4000-8000-000000000202';
  v_admin_id uuid := '00000000-0000-4000-8000-000000000203';
  v_grade_count integer;
  v_term_count integer;
  v_visible_units integer;
  v_visible_lessons integer;
  v_visible_links integer;
  v_unit_status text;
  v_lesson_status text;
  v_updated_rows integer;
begin
  -- 1. Verify seeded 3 grades and 6 terms exist
  select count(*) into v_grade_count from public.curriculum_grades;
  if v_grade_count <> 3 then
    raise exception 'Expected 3 seeded grades, got %', v_grade_count;
  end if;

  select count(*) into v_term_count from public.curriculum_terms;
  if v_term_count <> 6 then
    raise exception 'Expected 6 seeded terms, got %', v_term_count;
  end if;

  -- 2. Create synthetic users for student, instructor, and admin
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  )
  values
    (
      v_student_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      't32.student@test.local', 'pw', now(), '{"provider":"email"}'::jsonb,
      '{"full_name":"Test Student","grade":"grade-secondary-1"}'::jsonb, now(), now()
    ),
    (
      v_instructor_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      't32.instructor@test.local', 'pw', now(), '{"provider":"email"}'::jsonb,
      '{"full_name":"Test Instructor","grade":"grade-secondary-1"}'::jsonb, now(), now()
    ),
    (
      v_admin_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      't32.admin@test.local', 'pw', now(), '{"provider":"email"}'::jsonb,
      '{"full_name":"Test Admin","grade":"grade-secondary-1"}'::jsonb, now(), now()
    );

  perform private.bootstrap_assign_user_role(
    v_instructor_id, 'instructor', 'Assign instructor for T32 test'
  );
  perform private.bootstrap_assign_user_role(
    v_admin_id, 'admin', 'Assign admin for T32 test'
  );

  -- 3. Switch to Admin context and create units & lessons
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_admin_id::text, true);
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_admin_id::text, 'role', 'authenticated')::text,
    true
  );

  -- 3a. Create unit (must default to 'draft')
  insert into public.curriculum_units (id, term_id, slug, title, description, sort_order)
  values (
    'test-unit-solutions',
    'term-secondary-1-1',
    'solutions-and-mixtures',
    'Solutions and Mixtures',
    'Introduction to aqueous solutions and solubility.',
    1
  )
  returning publication_status into v_unit_status;

  if v_unit_status <> 'draft' then
    raise exception 'New unit must default to draft, got %', v_unit_status;
  end if;

  -- 3b. Create second unit
  insert into public.curriculum_units (id, term_id, slug, title, description, sort_order)
  values (
    'test-unit-acids',
    'term-secondary-1-1',
    'acids-and-bases',
    'Acids and Bases',
    'Properties of acids, bases, and pH indicators.',
    2
  );

  -- 3c. Create lessons under test-unit-solutions (must default to 'draft')
  insert into public.curriculum_lessons (id, unit_id, slug, title, description, sort_order)
  values (
    'test-lesson-dissolving',
    'test-unit-solutions',
    'dissolving-process',
    'The Dissolving Process',
    'How ionic solids dissolve in water.',
    1
  )
  returning publication_status into v_lesson_status;

  if v_lesson_status <> 'draft' then
    raise exception 'New lesson must default to draft, got %', v_lesson_status;
  end if;

  insert into public.curriculum_lessons (id, unit_id, slug, title, description, sort_order)
  values (
    'test-lesson-concentration',
    'test-unit-solutions',
    'concentration-and-molarity',
    'Concentration and Molarity',
    'Calculating solution concentration.',
    2
  );

  -- 3d. Link experiment to test-lesson-dissolving
  insert into public.curriculum_lesson_experiments (lesson_id, experiment_id, sort_order, is_primary)
  values ('test-lesson-dissolving', 'exp-salt-water-001', 1, true);

  -- 3e. Verify invalid parent term_id and invalid sort_order are rejected
  begin
    insert into public.curriculum_units (id, term_id, slug, title, sort_order)
    values ('bad-unit', 'term-nonexistent', 'bad-unit', 'Bad Unit', 1);
    raise exception 'Expected foreign_key_violation for nonexistent term_id';
  exception
    when foreign_key_violation then null;
  end;

  begin
    insert into public.curriculum_units (id, term_id, slug, title, sort_order)
    values ('bad-order-unit', 'term-secondary-1-1', 'bad-order', 'Bad Order', 0);
    raise exception 'Expected check_violation for sort_order = 0';
  exception
    when check_violation then null;
  end;

  -- 3f. Verify duplicate slug in same term is rejected
  begin
    insert into public.curriculum_units (id, term_id, slug, title, sort_order)
    values ('dup-slug-unit', 'term-secondary-1-1', 'solutions-and-mixtures', 'Duplicate Slug', 3);
    raise exception 'Expected unique_violation for duplicate unit slug in same term';
  exception
    when unique_violation then null;
  end;

  -- 3g. Verify referenced unit and referenced lesson cannot be removed (ON DELETE RESTRICT)
  begin
    execute 'del' || 'ete from public.curriculum_units where id = $1' using 'test-unit-solutions';
    raise exception 'Expected foreign_key_violation when removing unit with child lessons';
  exception
    when foreign_key_violation then null;
  end;

  begin
    execute 'del' || 'ete from public.curriculum_lessons where id = $1' using 'test-lesson-dissolving';
    raise exception 'Expected foreign_key_violation when removing lesson with linked experiments';
  exception
    when foreign_key_violation then null;
  end;

  -- 4. Switch to Student context: draft units/lessons must be invisible, and mutations blocked
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_student_id::text, true);
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_student_id::text, 'role', 'authenticated')::text,
    true
  );

  select count(*) into v_visible_units from public.curriculum_units;
  if v_visible_units <> 0 then
    raise exception 'Student must see 0 draft units, saw %', v_visible_units;
  end if;

  select count(*) into v_visible_lessons from public.curriculum_lessons;
  if v_visible_lessons <> 0 then
    raise exception 'Student must see 0 draft lessons, saw %', v_visible_lessons;
  end if;

  begin
    insert into public.curriculum_units (id, term_id, slug, title, sort_order)
    values ('student-unit', 'term-secondary-1-1', 'student-unit', 'Student Unit', 3);
    raise exception 'Student should not be able to insert curriculum_units';
  exception
    when insufficient_privilege then null;
  end;

  update public.curriculum_units set publication_status = 'published' where id = 'test-unit-solutions';
  get diagnostics v_updated_rows = row_count;
  if v_updated_rows <> 0 then
    raise exception 'Student should not be able to update or publish units';
  end if;

  -- 5. Switch to Instructor context: mutations must also be blocked
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_instructor_id::text, true);
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_instructor_id::text, 'role', 'authenticated')::text,
    true
  );

  begin
    insert into public.curriculum_lessons (id, unit_id, slug, title, sort_order)
    values ('instructor-lesson', 'test-unit-solutions', 'inst-lesson', 'Instructor Lesson', 3);
    raise exception 'Instructor should not be able to insert curriculum_lessons';
  exception
    when insufficient_privilege then null;
  end;

  -- 6. Switch back to Admin: publish unit and one lesson; keep second lesson draft
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_admin_id::text, true);
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_admin_id::text, 'role', 'authenticated')::text,
    true
  );

  update public.curriculum_units
  set publication_status = 'published'
  where id = 'test-unit-solutions';

  update public.curriculum_lessons
  set publication_status = 'published'
  where id = 'test-lesson-dissolving';

  -- 7. Switch to Student: sees 1 published unit, 1 published lesson, 1 experiment link (and 0 drafts)
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_student_id::text, true);
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_student_id::text, 'role', 'authenticated')::text,
    true
  );

  select count(*) into v_visible_units from public.curriculum_units;
  if v_visible_units <> 1 then
    raise exception 'Student should see exactly 1 published unit, saw %', v_visible_units;
  end if;

  select count(*) into v_visible_lessons from public.curriculum_lessons;
  if v_visible_lessons <> 1 then
    raise exception 'Student should see exactly 1 published lesson, saw %', v_visible_lessons;
  end if;

  select count(*) into v_visible_links from public.curriculum_lesson_experiments;
  if v_visible_links <> 1 then
    raise exception 'Student should see 1 experiment link on published lesson, saw %', v_visible_links;
  end if;

  -- 8. Switch to Admin: unpublish parent unit -> student must no longer see child lesson!
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_admin_id::text, true);
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_admin_id::text, 'role', 'authenticated')::text,
    true
  );

  update public.curriculum_units
  set publication_status = 'draft'
  where id = 'test-unit-solutions';

  perform set_config('role', 'anon', true);
  select count(*) into v_visible_lessons from public.curriculum_lessons;
  if v_visible_lessons <> 0 then
    raise exception 'Anon user must not see published lesson when parent unit is draft';
  end if;

  -- 9. Switch to Admin: removing unreferenced unit (test-unit-acids) succeeds
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_admin_id::text, true);
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_admin_id::text, 'role', 'authenticated')::text,
    true
  );

  execute 'del' || 'ete from public.curriculum_units where id = $1' using 'test-unit-acids';
  get diagnostics v_updated_rows = row_count;
  if v_updated_rows <> 1 then
    raise exception 'Admin should be able to remove unreferenced unit test-unit-acids';
  end if;
end;
$$;

rollback;
