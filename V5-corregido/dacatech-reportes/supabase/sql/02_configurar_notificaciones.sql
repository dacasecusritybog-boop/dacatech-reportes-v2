-- =====================================================================
-- Paso 2: conectar la base de datos con la función "notify"
-- Cambia SOLO los dos textos entre comillas y ejecuta en SQL Editor.
--
--  1) notify_url    → https://TU-PROYECTO.supabase.co/functions/v1/notify
--  2) notify_secret → una clave larga inventada por ti (la MISMA que pondrás
--                     en el secreto WEBHOOK_SECRET de la función).
-- =====================================================================
insert into private.dt_config(key, value) values
  ('notify_url',    'https://TU-PROYECTO.supabase.co/functions/v1/notify'),
  ('notify_secret', 'CAMBIA-ESTA-CLAVE-LARGA')
on conflict (key) do update set value = excluded.value;
