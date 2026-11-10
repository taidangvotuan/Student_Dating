drop policy if exists messages_read_participant on public.messages;

create policy messages_read_participant on public.messages for select to authenticated
  using (exists (
    select 1
    from public.conversations c
    join public.matches m on m.id = c.match_id
    where c.id = messages.conversation_id
      and (
        m.student_a_id = (select auth.uid())
        or m.student_b_id = (select auth.uid())
      )
  ));
