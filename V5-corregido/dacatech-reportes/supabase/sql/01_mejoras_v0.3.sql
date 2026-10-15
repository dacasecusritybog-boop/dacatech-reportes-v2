-- =====================================================================
-- DACATECH Reportes v0.3 — Mejoras de base de datos (ejecutar UNA vez)
-- Supabase → SQL Editor → pegar todo → Run.
-- Es seguro volver a ejecutarlo: no borra datos ni políticas existentes.
-- =====================================================================

-- ---------- 1. Funciones auxiliares de rol (sin recursión en RLS) ----------
create or replace function public.dt_role()
returns text language sql stable security definer set search_path = public as $$
  select role::text from public.profiles where id = auth.uid() and is_active = true
$$;

create or replace function public.dt_is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.dt_role() = 'admin', false)
$$;

create or replace function public.dt_is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.dt_role() in ('admin','technician'), false)
$$;

grant execute on function public.dt_role(), public.dt_is_admin(), public.dt_is_staff() to authenticated;

-- ---------- 2. Panel de administración: el admin gestiona empresas y usuarios ----------
drop policy if exists dt_admin_profiles_select on public.profiles;
create policy dt_admin_profiles_select on public.profiles
  for select to authenticated using (public.dt_is_admin());

drop policy if exists dt_admin_profiles_update on public.profiles;
create policy dt_admin_profiles_update on public.profiles
  for update to authenticated using (public.dt_is_admin()) with check (public.dt_is_admin());

drop policy if exists dt_admin_companies_select on public.companies;
create policy dt_admin_companies_select on public.companies
  for select to authenticated using (public.dt_is_admin());

drop policy if exists dt_admin_companies_insert on public.companies;
create policy dt_admin_companies_insert on public.companies
  for insert to authenticated with check (public.dt_is_admin());

drop policy if exists dt_admin_companies_update on public.companies;
create policy dt_admin_companies_update on public.companies
  for update to authenticated using (public.dt_is_admin()) with check (public.dt_is_admin());

-- ---------- 3. Blindaje: nadie se sube de rol ni cambia de empresa por su cuenta ----------
create or replace function public.dt_guard_profiles()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Sin sesión de usuario (SQL Editor / service_role): se permite.
  if auth.uid() is null or public.dt_is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.role := 'customer';          -- un registro nuevo nunca puede ser admin/técnico
    new.company_id := null;          -- la empresa la asigna el administrador
    return new;
  end if;

  if new.role is distinct from old.role
     or new.company_id is distinct from old.company_id
     or new.is_active is distinct from old.is_active then
    raise exception 'No tienes permiso para cambiar rol, empresa o estado de la cuenta.';
  end if;
  return new;
end $$;

drop trigger if exists dt_guard_profiles_trg on public.profiles;
create trigger dt_guard_profiles_trg
  before insert or update on public.profiles
  for each row execute function public.dt_guard_profiles();

-- Un cliente no puede cambiar estado, asignación ni cierre de sus reportes.
create or replace function public.dt_guard_reports()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.dt_is_staff() then
    return new;
  end if;
  if new.status is distinct from old.status
     or new.assigned_to is distinct from old.assigned_to
     or new.resolution_summary is distinct from old.resolution_summary
     or new.closed_at is distinct from old.closed_at
     or new.company_id is distinct from old.company_id then
    raise exception 'Solo el personal de DACATECH puede cambiar el estado o la asignación.';
  end if;
  return new;
end $$;

drop trigger if exists dt_guard_reports_trg on public.reports;
create trigger dt_guard_reports_trg
  before update on public.reports
  for each row execute function public.dt_guard_reports();

-- ---------- 4. Notificaciones push: dispositivos suscritos ----------
create table if not exists public.push_subscriptions (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  user_agent  text,
  created_at  timestamptz not null default now()
);
create index if not exists push_subscriptions_user_idx on public.push_subscriptions(user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists dt_push_select_own on public.push_subscriptions;
create policy dt_push_select_own on public.push_subscriptions
  for select to authenticated using (user_id = auth.uid());

drop policy if exists dt_push_delete_own on public.push_subscriptions;
create policy dt_push_delete_own on public.push_subscriptions
  for delete to authenticated using (user_id = auth.uid());

-- El registro de un dispositivo se hace por esta función (maneja celulares compartidos).
create or replace function public.dt_register_push(p_endpoint text, p_p256dh text, p_auth text, p_ua text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'Sesión requerida';
  end if;
  insert into public.push_subscriptions(user_id, endpoint, p256dh, auth, user_agent)
  values (auth.uid(), p_endpoint, p_p256dh, p_auth, left(p_ua, 200))
  on conflict (endpoint) do update
    set user_id = auth.uid(), p256dh = excluded.p256dh, auth = excluded.auth, user_agent = excluded.user_agent;
end $$;

revoke all on function public.dt_register_push(text,text,text,text) from public, anon;
grant execute on function public.dt_register_push(text,text,text,text) to authenticated;

-- ---------- 5. Tiempo real (la lista se actualiza sola) ----------
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='reports') then
    alter publication supabase_realtime add table public.reports;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='report_updates') then
    alter publication supabase_realtime add table public.report_updates;
  end if;
end $$;

-- ---------- 6. Aviso automático a la función "notify" (envía las push) ----------
create extension if not exists pg_net;
create schema if not exists private;
create table if not exists private.dt_config (key text primary key, value text not null);
revoke all on schema private from anon, authenticated;
revoke all on private.dt_config from anon, authenticated;

create or replace function public.dt_notify()
returns trigger language plpgsql security definer set search_path = public, private as $$
declare
  v_url text; v_secret text;
begin
  select value into v_url    from private.dt_config where key = 'notify_url';
  select value into v_secret from private.dt_config where key = 'notify_secret';
  if v_url is null or v_secret is null then
    return new;  -- notificaciones aún no configuradas: no pasa nada
  end if;

  perform net.http_post(
    url     := v_url,
    headers := jsonb_build_object('Content-Type','application/json','x-webhook-secret', v_secret),
    body    := jsonb_build_object(
                 'table',      tg_table_name,
                 'type',       tg_op,
                 'record',     to_jsonb(new),
                 'old_record', case when tg_op = 'UPDATE' then to_jsonb(old) else null end,
                 'actor',      auth.uid())
  );
  return new;
exception when others then
  return new;   -- una falla al notificar JAMÁS debe impedir guardar el reporte
end $$;

drop trigger if exists dt_notify_reports_ins on public.reports;
create trigger dt_notify_reports_ins after insert on public.reports
  for each row execute function public.dt_notify();

drop trigger if exists dt_notify_reports_upd on public.reports;
create trigger dt_notify_reports_upd after update on public.reports
  for each row
  when (old.status is distinct from new.status or old.assigned_to is distinct from new.assigned_to)
  execute function public.dt_notify();

drop trigger if exists dt_notify_updates_ins on public.report_updates;
create trigger dt_notify_updates_ins after insert on public.report_updates
  for each row execute function public.dt_notify();

-- ---------- 7. Lista de usuarios con correo (solo la puede llamar un administrador) ----------
create or replace function public.dt_admin_users()
returns jsonb language sql stable security definer set search_path = public, auth as $$
  select case when public.dt_is_admin() then
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id, 'email', u.email, 'full_name', p.full_name, 'role', p.role,
        'company_id', p.company_id, 'is_active', p.is_active, 'created_at', u.created_at)
        order by u.created_at desc)
      from public.profiles p join auth.users u on u.id = p.id), '[]'::jsonb)
  else '[]'::jsonb end
$$;
revoke all on function public.dt_admin_users() from public, anon;
grant execute on function public.dt_admin_users() to authenticated;
