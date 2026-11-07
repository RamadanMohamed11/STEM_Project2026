-- Task T33 Transactional Verification: Experiment Management RLS, Simulation Registry & Validation
-- Executes inside a transaction and rolls back so production data remains clean.

begin;

do $$
declare
  v_student_id uuid := '00000000-0000-4000-8000-000000000301';
  v_instructor_id uuid := '00000000-0000-4000-8000-000000000302';
  v_admin_id uuid := '00000000-0000-4000-8000-000000000303';
  v_cat_count integer;
  v_exp_count integer;
  v_visible_exps integer;
  v_pub_status text;
  v_sim_status text;
  v_updated_rows integer;
begin
  -- 1. Verify 2 categories and 3 seeded experiments exist
  select count(*) into v_cat_count from public.experiment_categories;
  if v_cat_count <> 2 then
    raise exception 'Expected 2 seeded categories, got %', v_cat_count;
  end if;

  select count(*) into v_exp_count from public.experiments;
  if v_exp_count <> 3 then
    raise exception 'Expected 3 seeded experiments, got %', v_exp_count;
  end if;

  -- 2. Create synthetic users for student, instructor, and admin
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  )
  values
    (
      v_student_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      't33.student@test.local', 'pw', now(), '{"provider":"email"}'::jsonb,
      '{"full_name":"Test Student","grade":"grade-secondary-1"}'::jsonb, now(), now()
    ),
    (
      v_instructor_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      't33.instructor@test.local', 'pw', now(), '{"provider":"email"}'::jsonb,
      '{"full_name":"Test Instructor","grade":"grade-secondary-1"}'::jsonb, now(), now()
    ),
    (
      v_admin_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      't33.admin@test.local', 'pw', now(), '{"provider":"email"}'::jsonb,
      '{"full_name":"Test Admin","grade":"grade-secondary-1"}'::jsonb, now(), now()
    );

  perform private.bootstrap_assign_user_role(
    v_instructor_id, 'instructor', 'Assign instructor for T33 test'
  );
  perform private.bootstrap_assign_user_role(
    v_admin_id, 'admin', 'Assign admin for T33 test'
  );

  -- 3. Switch to Admin context and create a new draft experiment
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_admin_id::text, true);
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_admin_id::text, 'role', 'authenticated')::text,
    true
  );

  insert into public.experiments (
    id, slug, title, short_description, category_id, difficulty,
    estimated_duration_minutes, illustration,
    about_paragraphs, learning_objectives, required_tools, required_materials,
    sort_order
  )
  values (
    'exp-filtration-004',
    'separating-sand-and-water',
    'Separating Sand and Water by Filtration',
    'Observe how filter paper separates insoluble solid particles from water.',
    'chemistry',
    'beginner',
    15,
    'liquid-volume',
    '["Filtration separates insoluble solids from liquids using a porous barrier."]'::jsonb,
    '[{"id": "obj-1", "text": "Identify the residue and filtrate in a filtration setup."}]'::jsonb,
    '["Beaker", "Filter Funnel"]'::jsonb,
    '["Water (H₂O)"]'::jsonb,
    4
  )
  returning publication_status, simulation_status into v_pub_status, v_sim_status;

  if v_pub_status <> 'draft' or v_sim_status <> 'planned' then
    raise exception 'New experiment must default to draft/planned, got %/%', v_pub_status, v_sim_status;
  end if;

  -- 4. Verify unregistered simulation cannot be marked playable ('demo')
  begin
    update public.experiments
    set simulation_status = 'demo'
    where id = 'exp-filtration-004';
    raise exception 'Expected check_violation when marking unregistered experiment as demo';
  exception
    when check_violation then null;
  end;

  begin
    update public.experiments
    set simulation_status = 'demo', simulation_id = 'exp-salt-water-001'
    where id = 'exp-filtration-004';
    raise exception 'Expected check_violation when linking mismatched simulation_id';
  exception
    when check_violation then null;
  end;

  -- 5. Verify incomplete experiment (missing objectives) cannot be published
  begin
    insert into public.experiments (
      id, slug, title, short_description, category_id, publication_status
    )
    values (
      'exp-incomplete-005',
      'incomplete-exp',
      'Incomplete Experiment',
      'Short description without about paragraphs or objectives.',
      'chemistry',
      'published'
    );
    raise exception 'Expected check_violation when publishing experiment without about/objectives';
  exception
    when check_violation then null;
  end;

  -- 6. Switch to Student: sees 3 published experiments, does NOT see draft exp-filtration-004
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_student_id::text, true);
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_student_id::text, 'role', 'authenticated')::text,
    true
  );

  select count(*) into v_visible_exps from public.experiments;
  if v_visible_exps <> 3 then
    raise exception 'Student should see 3 published experiments (not draft), saw %', v_visible_exps;
  end if;

  -- Student cannot insert or update experiments
  begin
    insert into public.experiments (id, slug, title, short_description, category_id)
    values ('exp-student-hack', 'student-hack', 'Student Hack', 'Unauthorized insert attempt.', 'chemistry');
    raise exception 'Student should not be able to insert into public.experiments';
  exception
    when insufficient_privilege then null;
  end;

  update public.experiments set publication_status = 'published' where id = 'exp-filtration-004';
  get diagnostics v_updated_rows = row_count;
  if v_updated_rows <> 0 then
    raise exception 'Student should not be able to publish draft experiments';
  end if;

  -- 7. Switch to Instructor: cannot insert or update experiments
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_instructor_id::text, true);
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_instructor_id::text, 'role', 'authenticated')::text,
    true
  );

  begin
    insert into public.experiments (id, slug, title, short_description, category_id)
    values ('exp-inst-hack', 'inst-hack', 'Instructor Hack', 'Unauthorized insert attempt.', 'chemistry');
    raise exception 'Instructor should not be able to insert into public.experiments';
  exception
    when insufficient_privilege then null;
  end;

  -- 8. Switch to Admin: publish exp-filtration-004 -> Student now sees 4 published experiments
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_admin_id::text, true);
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_admin_id::text, 'role', 'authenticated')::text,
    true
  );

  update public.experiments
  set publication_status = 'published'
  where id = 'exp-filtration-004';

  perform set_config('role', 'anon', true);
  select count(*) into v_visible_exps from public.experiments;
  if v_visible_exps <> 4 then
    raise exception 'Anon/student should see 4 published experiments after publish, saw %', v_visible_exps;
  end if;

  -- 9. Switch to Admin: archive exp-filtration-004 -> Student sees 3 published experiments again
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_admin_id::text, true);
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_admin_id::text, 'role', 'authenticated')::text,
    true
  );

  update public.experiments
  set publication_status = 'archived'
  where id = 'exp-filtration-004';

  perform set_config('role', 'anon', true);
  select count(*) into v_visible_exps from public.experiments;
  if v_visible_exps <> 3 then
    raise exception 'Anon/student should see 3 published experiments after archive, saw %', v_visible_exps;
  end if;
end;
$$;

rollback;
