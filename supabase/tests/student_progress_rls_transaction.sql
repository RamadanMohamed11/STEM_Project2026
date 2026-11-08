-- Task T48 Transactional Verification: account progress and quiz attempt RLS.
-- Executes inside a transaction and rolls back so data remains clean.
-- Requires migrations up to 202611080003_student_progress_sync.sql and the seeded
-- experiment 'exp-salt-water-001'. All privileged setup happens before switching roles.

begin;

do $$
declare
  v_a uuid := '00000000-0000-4000-8000-000000000481';
  v_b uuid := '00000000-0000-4000-8000-000000000482';
  v_admin uuid := '00000000-0000-4000-8000-000000000483';
  v_count integer;
  v_failed boolean;
begin
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  )
  select u.id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         u.email, 'pw', now(), '{"provider":"email"}'::jsonb,
         '{"full_name":"T48 Test","grade":"grade-secondary-1"}'::jsonb, now(), now()
  from (values (v_a, 't48.a@test.local'), (v_b, 't48.b@test.local'), (v_admin, 't48.admin@test.local'))
    as u(id, email);

  perform private.bootstrap_assign_user_role(v_admin, 'admin', 'Assign admin for T48 test');

  -- Student B already has a row and an attempt.
  insert into public.student_experiment_progress
    (user_id, experiment_id, definition_version, status, completed_step_count, total_step_count, last_activity_at)
  values (v_b, 'exp-salt-water-001', '1.0.0', 'in-progress', 2, 9, now());
  insert into public.student_quiz_attempts
    (user_id, attempt_id, experiment_id, assessment_id, assessment_version, score, total,
     percentage, correct_count, total_questions, answers, submitted_at)
  values (v_b, 'b-1', 'exp-salt-water-001', 'assess-salt', '1.0.0', 3, 6, 50, 3, 6, '{}', now());

  -- Privileges.
  if has_table_privilege('anon', 'public.student_experiment_progress', 'select')
     or has_table_privilege('anon', 'public.student_quiz_attempts', 'select') then
    raise exception 'anon must not read progress tables';
  end if;
  if has_table_privilege('authenticated', 'public.student_experiment_progress', 'delete')
     or has_table_privilege('authenticated', 'public.student_quiz_attempts', 'update')
     or has_table_privilege('authenticated', 'public.student_quiz_attempts', 'delete') then
    raise exception 'students must not delete progress or rewrite attempts';
  end if;

  -- Student A context.
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_a::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', v_a, 'role', 'authenticated')::text, true);

  select count(*) into v_count from public.student_experiment_progress;
  if v_count <> 0 then raise exception 'Student A must not see student B progress (saw %)', v_count; end if;
  select count(*) into v_count from public.student_quiz_attempts;
  if v_count <> 0 then raise exception 'Student A must not see student B attempts'; end if;

  -- Own insert, then upsert-style update.
  insert into public.student_experiment_progress
    (experiment_id, definition_version, status, completed_step_count, total_step_count, last_activity_at)
  values ('exp-salt-water-001', '1.0.0', 'in-progress', 3, 9, now());
  insert into public.student_experiment_progress
    (user_id, experiment_id, definition_version, status, completed_step_count, total_step_count,
     lab_completed_at, last_activity_at)
  values (v_a, 'exp-salt-water-001', '1.0.0', 'completed', 9, 9, now(), now())
  on conflict (user_id, experiment_id) do update
    set status = excluded.status,
        completed_step_count = excluded.completed_step_count,
        lab_completed_at = excluded.lab_completed_at,
        last_activity_at = excluded.last_activity_at;
  select count(*) into v_count from public.student_experiment_progress
  where user_id = v_a and status = 'completed' and completed_step_count = 9;
  if v_count <> 1 then raise exception 'Own progress upsert failed'; end if;

  -- Cannot write rows for someone else (insert or update).
  v_failed := false;
  begin
    insert into public.student_experiment_progress
      (user_id, experiment_id, definition_version, total_step_count)
    values (v_b, 'exp-ph-003', '1.0.0', 0);
  exception when insufficient_privilege then v_failed := true;
  end;
  if not v_failed then raise exception 'Inserting progress for another user must fail'; end if;

  update public.student_experiment_progress set completed_step_count = 0 where user_id = v_b;
  get diagnostics v_count = row_count;
  if v_count <> 0 then raise exception 'Updating another user progress must affect 0 rows'; end if;

  v_failed := false;
  begin
    update public.student_experiment_progress set user_id = v_b where user_id = v_a;
  exception when insufficient_privilege then v_failed := true;
  end;
  if not v_failed then raise exception 'Re-assigning own row to another user must fail'; end if;

  -- Constraints.
  v_failed := false;
  begin
    update public.student_experiment_progress set lab_completed_at = null where user_id = v_a;
  exception when check_violation then v_failed := true;
  end;
  if not v_failed then raise exception 'completed without lab_completed_at must fail'; end if;

  -- Attempts: insert own, duplicates ignored, no update/delete, answers must be an object.
  insert into public.student_quiz_attempts
    (attempt_id, experiment_id, assessment_id, assessment_version, score, total,
     percentage, correct_count, total_questions, answers, submitted_at)
  values ('a-1', 'exp-salt-water-001', 'assess-salt', '1.0.0', 6, 6, 100, 6, 6,
          '{"q1":"opt-1","q2":null}', now());
  insert into public.student_quiz_attempts
    (user_id, attempt_id, experiment_id, assessment_id, assessment_version, score, total,
     percentage, correct_count, total_questions, submitted_at)
  values (v_a, 'a-1', 'exp-salt-water-001', 'assess-salt', '1.0.0', 0, 6, 0, 0, 6, now())
  on conflict (user_id, attempt_id) do nothing;
  select count(*) into v_count from public.student_quiz_attempts where score = 6;
  if v_count <> 1 then raise exception 'Duplicate attempt must be ignored, not merged'; end if;

  v_failed := false;
  begin
    update public.student_quiz_attempts set score = 0;
  exception when insufficient_privilege then v_failed := true;
  end;
  if not v_failed then raise exception 'Students must not update attempts'; end if;

  v_failed := false;
  begin
    delete from public.student_experiment_progress;
  exception when insufficient_privilege then v_failed := true;
  end;
  if not v_failed then raise exception 'Students must not delete progress'; end if;

  v_failed := false;
  begin
    insert into public.student_quiz_attempts
      (attempt_id, experiment_id, assessment_id, assessment_version, score, total,
       percentage, correct_count, total_questions, answers, submitted_at)
    values ('a-2', 'exp-salt-water-001', 'assess-salt', '1.0.0', 1, 6, 17, 1, 6, '[1,2]', now());
  exception when check_violation then v_failed := true;
  end;
  if not v_failed then raise exception 'answers must be a JSON object'; end if;

  v_failed := false;
  begin
    insert into public.student_quiz_attempts
      (user_id, attempt_id, experiment_id, assessment_id, assessment_version, score, total,
       percentage, correct_count, total_questions, submitted_at)
    values (v_b, 'forged', 'exp-salt-water-001', 'assess-salt', '1.0.0', 6, 6, 100, 6, 6, now());
  exception when insufficient_privilege then v_failed := true;
  end;
  if not v_failed then raise exception 'Inserting an attempt for another user must fail'; end if;

  -- Admin reads all rows (for reports).
  perform set_config('request.jwt.claim.sub', v_admin::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);
  select count(*) into v_count from public.student_experiment_progress;
  if v_count <> 2 then raise exception 'Admin must see all progress rows (saw %)', v_count; end if;
  select count(*) into v_count from public.student_quiz_attempts;
  if v_count <> 2 then raise exception 'Admin must see all attempts (saw %)', v_count; end if;

  raise notice 'T48 student progress RLS checks passed';
end;
$$;

rollback;
