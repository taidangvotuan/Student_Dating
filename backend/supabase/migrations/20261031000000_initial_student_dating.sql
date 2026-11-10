-- Student Dating: initial schema for a fresh Supabase PostgreSQL project.
-- Supabase Auth owns credentials and OTPs. Application servers own verification,
-- matching and chat writes; never use the service role key in a client.

create schema if not exists student_private;
revoke all on schema student_private from public, anon, authenticated;

create table public.students (
  id uuid primary key references auth.users(id) on delete cascade,
  account_status text not null default 'HOAT_DONG'
    check (account_status in ('HOAT_DONG', 'TAM_KHOA', 'KHOA_VINH_VIEN')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table student_private.verifications (
  student_id uuid primary key references public.students(id) on delete cascade,
  student_number text,
  university_name text,
  card_storage_path text,
  status text not null default 'CHUA_XAC_THUC'
    check (status in ('CHUA_XAC_THUC', 'CHO_DUYET', 'DA_XAC_THUC', 'TU_CHOI')),
  reviewer_id uuid references auth.users(id) on delete restrict,
  rejection_reason text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (university_name, student_number),
  check (status = 'CHUA_XAC_THUC' or
    (student_number is not null and university_name is not null and card_storage_path is not null and submitted_at is not null)),
  check (status not in ('DA_XAC_THUC', 'TU_CHOI') or
    (reviewer_id is not null and reviewed_at is not null)),
  check (status <> 'TU_CHOI' or
    (rejection_reason is not null and btrim(rejection_reason) <> ''))
);

create table public.profiles (
  student_id uuid primary key references public.students(id) on delete cascade,
  full_name text not null check (nullif(btrim(full_name), '') is not null),
  birth_date date not null,
  gender text,
  bio text check (char_length(bio) <= 2000),
  faculty text,
  cohort text,
  connection_goal text,
  visibility text not null default 'BI_AN'
    check (visibility in ('CON_HOAT_DONG', 'BI_AN', 'BI_KHOA', 'NGUNG_SU_DUNG')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table student_private.profile_locations (
  student_id uuid primary key references public.profiles(student_id) on delete cascade,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  updated_at timestamptz not null default now()
);

create table public.interests (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (nullif(btrim(name), '') is not null),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profile_interests (
  student_id uuid not null references public.profiles(student_id) on delete cascade,
  interest_id uuid not null references public.interests(id) on delete restrict,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (student_id, interest_id)
);

create table public.search_preferences (
  student_id uuid primary key references public.profiles(student_id) on delete cascade,
  min_age smallint not null default 18 check (min_age between 18 and 100),
  max_age smallint not null default 100 check (max_age between 18 and 100),
  preferred_gender text,
  preferred_faculty text,
  max_distance_km integer check (max_distance_km between 1 and 1000),
  verified_only boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (min_age <= max_age)
);

create table public.interactions (
  actor_id uuid not null references public.profiles(student_id) on delete cascade,
  target_id uuid not null references public.profiles(student_id) on delete cascade,
  kind text not null check (kind in ('THICH', 'BO_QUA')),
  created_at timestamptz not null default now(),
  primary key (actor_id, target_id),
  check (actor_id <> target_id)
);

create table public.blocks (
  blocker_id uuid not null references public.profiles(student_id) on delete cascade,
  blocked_id uuid not null references public.profiles(student_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  student_a_id uuid not null references public.profiles(student_id) on delete cascade,
  student_b_id uuid not null references public.profiles(student_id) on delete cascade,
  status text not null default 'DA_GHEP_DOI'
    check (status in ('DA_GHEP_DOI', 'DANG_HOAT_DONG', 'DA_HUY')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_a_id, student_b_id),
  check (student_a_id < student_b_id)
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null unique references public.matches(id) on delete cascade,
  status text not null default 'HOAT_DONG'
    check (status in ('HOAT_DONG', 'KHONG_HOAT_DONG')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(student_id) on delete cascade,
  body text,
  status text not null default 'DA_GUI' check (status in ('DA_GUI', 'DA_XOA')),
  sent_at timestamptz not null default now(),
  deleted_at timestamptz,
  check ((status = 'DA_GUI' and body is not null and btrim(body) <> '' and char_length(body) <= 5000 and deleted_at is null)
      or (status = 'DA_XOA' and body is null and deleted_at is not null))
);

create table public.conversation_reads (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  student_id uuid not null references public.profiles(student_id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (conversation_id, student_id)
);

-- Index foreign keys not already covered by a primary/unique key's left prefix.
create index verifications_reviewer_id_idx on student_private.verifications (reviewer_id);
create index profile_interests_interest_id_idx on public.profile_interests (interest_id);
create index interactions_target_id_idx on public.interactions (target_id);
create index blocks_blocked_id_idx on public.blocks (blocked_id);
create index matches_student_b_id_idx on public.matches (student_b_id);
create index matches_active_a_idx on public.matches (student_a_id, created_at desc)
  where status <> 'DA_HUY';
create index matches_active_b_idx on public.matches (student_b_id, created_at desc)
  where status <> 'DA_HUY';
create index messages_conversation_sent_idx on public.messages (conversation_id, sent_at desc, id desc);
create index messages_sender_id_idx on public.messages (sender_id);
create index conversation_reads_student_id_idx on public.conversation_reads (student_id);

-- Explicit grants plus RLS: clients only read rows allowed below. Privileged
-- writes go through a trusted server which checks membership and transitions.
revoke all on public.students, public.profiles, public.interests,
  public.profile_interests, public.search_preferences, public.interactions,
  public.blocks, public.matches, public.conversations, public.messages,
  public.conversation_reads from public, anon, authenticated;
grant select on public.students, public.profiles, public.interests,
  public.profile_interests, public.search_preferences, public.interactions,
  public.blocks, public.matches, public.conversations, public.messages,
  public.conversation_reads to authenticated;
grant insert, update, delete on public.search_preferences, public.profile_interests to authenticated;
grant insert on public.profiles to authenticated;
grant update (full_name, birth_date, gender, bio, faculty, cohort, connection_goal, visibility)
  on public.profiles to authenticated;

alter table public.students enable row level security;
alter table student_private.verifications enable row level security;
alter table public.profiles enable row level security;
alter table student_private.profile_locations enable row level security;
alter table public.interests enable row level security;
alter table public.profile_interests enable row level security;
alter table public.search_preferences enable row level security;
alter table public.interactions enable row level security;
alter table public.blocks enable row level security;
alter table public.matches enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.conversation_reads enable row level security;

create policy students_read_self on public.students for select to authenticated
  using (id = (select auth.uid()));

create policy matches_read_participant on public.matches for select to authenticated
  using (student_a_id = (select auth.uid()) or student_b_id = (select auth.uid()));

create policy profiles_read on public.profiles for select to authenticated
  using (student_id = (select auth.uid()) or
    (visibility = 'CON_HOAT_DONG' and exists (
      select 1 from public.matches m
      where m.status <> 'DA_HUY'
        and ((m.student_a_id = student_id and m.student_b_id = (select auth.uid()))
          or (m.student_b_id = student_id and m.student_a_id = (select auth.uid())))
    )));
create policy profiles_insert_self on public.profiles for insert to authenticated
  with check (student_id = (select auth.uid()) and visibility = 'BI_AN');
create policy profiles_update_self on public.profiles for update to authenticated
  using (student_id = (select auth.uid()) and
    visibility in ('CON_HOAT_DONG', 'BI_AN'))
  with check (student_id = (select auth.uid()) and
    visibility in ('CON_HOAT_DONG', 'BI_AN'));

create policy interests_read_active on public.interests for select to authenticated
  using (is_active);
create policy profile_interests_read on public.profile_interests for select to authenticated
  using (is_visible and exists (
    select 1 from public.profiles p where p.student_id = profile_interests.student_id
  ) or student_id = (select auth.uid()));
create policy profile_interests_insert_self on public.profile_interests for insert to authenticated
  with check (student_id = (select auth.uid()));
create policy profile_interests_update_self on public.profile_interests for update to authenticated
  using (student_id = (select auth.uid())) with check (student_id = (select auth.uid()));
create policy profile_interests_delete_self on public.profile_interests for delete to authenticated
  using (student_id = (select auth.uid()));

create policy search_preferences_self on public.search_preferences for select to authenticated
  using (student_id = (select auth.uid()));
create policy search_preferences_insert_self on public.search_preferences for insert to authenticated
  with check (student_id = (select auth.uid()));
create policy search_preferences_update_self on public.search_preferences for update to authenticated
  using (student_id = (select auth.uid())) with check (student_id = (select auth.uid()));
create policy search_preferences_delete_self on public.search_preferences for delete to authenticated
  using (student_id = (select auth.uid()));

create policy interactions_read_actor on public.interactions for select to authenticated
  using (actor_id = (select auth.uid()));
create policy blocks_read_blocker on public.blocks for select to authenticated
  using (blocker_id = (select auth.uid()));

create policy conversations_read_participant on public.conversations for select to authenticated
  using (exists (
    select 1 from public.matches m where m.id = match_id
      and (m.student_a_id = (select auth.uid()) or m.student_b_id = (select auth.uid()))
  ));
create policy messages_read_participant on public.messages for select to authenticated
  using (exists (
    select 1 from public.conversations c where c.id = conversation_id
  ));
create policy conversation_reads_read_self on public.conversation_reads for select to authenticated
  using (student_id = (select auth.uid()));
