-- Migration: Add normalized mutual notifications schema
-- 1. Notifications table: Stores shared event context without static text.
-- 2. Notification recipients table: Tracks per-user delivery, read status, and timestamps.

create type public.notification_type as enum (
  'GHEP_DOI',
  'HUY_GHEP_DOI',
  'TIN_NHAN_MOI',
  'XAC_THUC_DUYET',
  'XAC_THUC_TU_CHOI'
);

create type public.notification_status as enum (
  'CHUA_DOC',
  'DA_DOC'
);

-- Shared notification event entity (Zero static text, rich relational IDs)
create table public.notifications (
  id              uuid primary key default gen_random_uuid(),
  type            public.notification_type not null,
  actor_id        uuid references public.students(id) on delete set null,
  match_id        uuid references public.matches(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete cascade,
  metadata        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);

create index notifications_match_id_idx on public.notifications (match_id);
create index notifications_conversation_id_idx on public.notifications (conversation_id);
create index notifications_actor_id_idx on public.notifications (actor_id);

-- Recipient inbox & status tracking (Mutual notifications share 1 notification row across multiple recipients)
create table public.notification_recipients (
  id              uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.notifications(id) on delete cascade,
  recipient_id    uuid not null references public.students(id) on delete cascade,
  status          public.notification_status not null default 'CHUA_DOC',
  read_at         timestamptz,
  created_at      timestamptz not null default now(),

  constraint notification_recipients_notif_recipient_uq unique (notification_id, recipient_id),
  constraint notification_recipients_read_at_check check (
    (status = 'CHUA_DOC' and read_at is null) or
    (status = 'DA_DOC' and read_at is not null)
  )
);

create index notification_recipients_recipient_created_idx
  on public.notification_recipients (recipient_id, created_at desc);

create index notification_recipients_recipient_status_idx
  on public.notification_recipients (recipient_id, status);

-- Enable RLS
alter table public.notifications enable row level security;
alter table public.notification_recipients enable row level security;

-- Authenticated students can view notification events that belong to their inbox
create policy notifications_select_recipients_only
  on public.notifications
  for select
  to authenticated
  using (
    exists (
      select 1 from public.notification_recipients nr
      where nr.notification_id = public.notifications.id
        and nr.recipient_id = (select auth.uid())
    )
  );

-- Authenticated students can view only their own inbox receipts
create policy notification_recipients_select_own
  on public.notification_recipients
  for select
  to authenticated
  using (recipient_id = (select auth.uid()));

-- Authenticated students can update only their own inbox receipts (e.g. mark as read)
create policy notification_recipients_update_own
  on public.notification_recipients
  for update
  to authenticated
  using (recipient_id = (select auth.uid()))
  with check (recipient_id = (select auth.uid()));
