-- Align verification storage with Prisma and the auth signup trigger.
-- public.students already exists in public; its data and policies stay intact.
-- Keep identity-document metadata accessible only to the trusted backend.

begin;
set local lock_timeout = '5s';

do $$
begin
  if to_regclass('student_private.verifications') is not null
     and to_regclass('public.verifications') is not null then
    raise exception 'Both student_private.verifications and public.verifications exist. Reconcile their data before retrying.';
  elsif to_regclass('student_private.verifications') is not null then
    alter table student_private.verifications set schema public;
  elsif to_regclass('public.verifications') is null then
    raise exception 'Verification table is missing from both schemas. Apply the initial migration first.';
  end if;
end;
$$;

alter table public.verifications enable row level security;
revoke all on table public.verifications from public, anon, authenticated;

commit;
