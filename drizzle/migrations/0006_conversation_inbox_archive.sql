-- Persistent conversation archive for the staff inbox.
-- Additive only: existing conversation and message rows are preserved.
alter table public.conversations
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid references auth.users(id) on delete set null;

create index if not exists conversations_inbox_activity_idx
  on public.conversations (archived_at, last_message_at desc);

create index if not exists messages_conversation_unread_idx
  on public.messages (conversation_id, read_at, sender_id);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'conversations'
  ) then
    alter publication supabase_realtime add table public.conversations;
  end if;
end
$$;
