-- Engranet Digital: chat en vivo entre el visitante y el panel.
-- Requiere haber ejecutado antes supabase/schema.sql. Es seguro repetirlo.

alter table public.leads
  add column if not exists chat_token uuid unique,
  add column if not exists last_message text,
  add column if not exists last_message_at timestamptz,
  add column if not exists unread_admin int not null default 0;

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  sender text not null check (sender in ('client', 'agent')),
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists chat_messages_lead_idx on public.chat_messages (lead_id, created_at);

-- Solo los administradores leen y escriben la tabla directamente.
alter table public.chat_messages enable row level security;
drop policy if exists "solo admin" on public.chat_messages;
create policy "solo admin" on public.chat_messages for all to authenticated using (public.is_admin()) with check (public.is_admin());
grant select, insert, update, delete on public.chat_messages to authenticated;

-- El visitante no tiene cuenta: entra con el código secreto de su conversación.
create or replace function public.chat_send(p_token uuid, p_body text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lead uuid;
  v_body text := btrim(coalesce(p_body, ''));
begin
  select id into v_lead from public.leads where chat_token = p_token;
  if v_lead is null then
    raise exception 'conversacion no encontrada';
  end if;
  if char_length(v_body) = 0 or char_length(v_body) > 2000 then
    raise exception 'mensaje vacio o demasiado largo';
  end if;
  if (select count(*) from public.chat_messages
      where lead_id = v_lead and sender = 'client' and created_at > now() - interval '1 minute') >= 20 then
    raise exception 'demasiados mensajes, espera un momento';
  end if;
  insert into public.chat_messages (lead_id, sender, body) values (v_lead, 'client', v_body);
  update public.leads
     set last_message = left(v_body, 140), last_message_at = now(), unread_admin = unread_admin + 1
   where id = v_lead;
end;
$$;

create or replace function public.chat_fetch(p_token uuid)
returns table (id uuid, sender text, body text, created_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select m.id, m.sender, m.body, m.created_at
    from public.chat_messages m
    join public.leads l on l.id = m.lead_id
   where l.chat_token = p_token
   order by m.created_at;
$$;

grant execute on function public.chat_send(uuid, text) to anon, authenticated;
grant execute on function public.chat_fetch(uuid) to anon, authenticated;

-- Avisos en tiempo real para el panel.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables
                     where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'chat_messages') then
    alter publication supabase_realtime add table public.chat_messages;
  end if;
end $$;

select
  (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'leads' and column_name = 'chat_token') as columna_chat_token,
  (select count(*) from information_schema.tables where table_schema = 'public' and table_name = 'chat_messages') as tabla_chat_messages,
  (select count(*) from pg_proc where proname in ('chat_send', 'chat_fetch')) as funciones,
  (select count(*) from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'chat_messages') as tiempo_real;
