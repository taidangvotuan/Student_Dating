-- Run after all migrations on a test database; no application data is changed.
begin;
set local plpgsql.check_asserts = on;

do $$
declare
  api_role text;
  operation text;
begin
  assert to_regclass('public.verifications') is not null,
    'Verification records must be in public for Prisma and the signup trigger';
  assert to_regclass('student_private.verifications') is null,
    'The old verification table must not remain in student_private';
  assert to_regclass('public.students') is not null,
    'Student accounts must remain in public';
  assert to_regclass('student_private.profile_locations') is not null,
    'Exact profile locations must remain in student_private';
  assert (select relrowsecurity from pg_class where oid = 'public.verifications'::regclass),
    'Verification RLS must remain enabled';
  assert exists (
    select 1 from pg_constraint
    where conrelid = 'public.verifications'::regclass
      and confrelid = 'public.students'::regclass and contype = 'f'
  ), 'Verification records must still reference student accounts';

  foreach api_role in array array['anon', 'authenticated'] loop
    foreach operation in array array['SELECT', 'INSERT', 'UPDATE', 'DELETE'] loop
      assert not has_table_privilege(api_role, 'public.verifications', operation),
        'Verification data must remain accessible only through the backend';
    end loop;
  end loop;
end;
$$;

select 'Verification schema and access checks passed' as result;
rollback;
