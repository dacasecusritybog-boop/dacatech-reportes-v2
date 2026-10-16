-- DACATECH Reportes: aprobación de usuarios desde el panel Admin.
-- Aplicada al proyecto Supabase dukcvkrlolrhjbcdplse el 2026-10-16.

create or replace function public.dt_admin_users()
returns jsonb language sql stable security definer set search_path = public, auth as $$
  select case when public.dt_is_admin() then
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', u.id,
        'email', u.email,
        'full_name', coalesce(p.full_name, split_part(u.email, '@', 1)),
        'role', coalesce(p.role, 'customer'),
        'company_id', p.company_id,
        'is_active', coalesce(p.is_active, false),
        'created_at', u.created_at,
        'email_confirmed_at', u.email_confirmed_at,
        'profile_exists', (p.id is not null)
      ) order by u.created_at desc)
      from auth.users u
      left join public.profiles p on p.id = u.id
      where u.email_confirmed_at is not null
    ), '[]'::jsonb)
  else '[]'::jsonb end
$$;

create or replace function public.dt_admin_approve_user(p_user_id uuid, p_company_id uuid, p_role text default 'customer', p_full_name text default null)
returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare
  v_email text;
  v_name text;
  v_role text;
begin
  if not public.dt_is_admin() then raise exception 'Solo un administrador puede aprobar usuarios.'; end if;
  if p_role not in ('customer','technician') then raise exception 'Rol no permitido para aprobación.'; end if;
  if p_company_id is null or not exists (select 1 from public.companies c where c.id = p_company_id) then raise exception 'Selecciona una empresa válida.'; end if;
  select u.email into v_email from auth.users u where u.id = p_user_id and u.email_confirmed_at is not null;
  if v_email is null then raise exception 'Usuario no encontrado o correo sin confirmar.'; end if;
  v_name := coalesce(nullif(trim(p_full_name), ''), split_part(v_email, '@', 1));
  v_role := p_role;
  insert into public.profiles (id, full_name, role, company_id, is_active)
  values (p_user_id, v_name, v_role, p_company_id, true)
  on conflict (id) do update set full_name = excluded.full_name, role = excluded.role, company_id = excluded.company_id, is_active = true;
  return jsonb_build_object('id', p_user_id, 'email', v_email, 'full_name', v_name, 'role', v_role, 'company_id', p_company_id, 'is_active', true);
end $$;

revoke all on function public.dt_admin_approve_user(uuid, uuid, text, text) from public, anon;
grant execute on function public.dt_admin_approve_user(uuid, uuid, text, text) to authenticated;
revoke all on function public.dt_admin_users() from public, anon;
grant execute on function public.dt_admin_users() to authenticated;
