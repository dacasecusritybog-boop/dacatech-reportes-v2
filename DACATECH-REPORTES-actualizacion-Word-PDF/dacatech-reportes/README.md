# DACATECH Reportes v0.3

App web instalable (PWA) en React + Vite + Supabase. Novedades frente a v0.2:

- Instalable en el celular (Android/iPhone) con ícono propio.
- **Notificaciones push** al celular: reporte nuevo, cambio de estado, asignación, mensajes.
- **Tiempo real**: la lista se actualiza sola, con avisos dentro de la app.
- Panel de **Empresas y usuarios** (activar clientes, asignar rol y empresa) y asignación de técnico.
- Seguridad reforzada en la base de datos (nadie se sube de rol; el cliente no cambia estados).
- Checklist legal y de accesibilidad: privacidad (Ley 1581), términos, cookies, garantías, accesibilidad, consentimiento al registrarse, contraste, teclado, etc.

## Pasos (en este orden)

### 1. Base de datos
Supabase → **SQL Editor** → pega todo `supabase/sql/01_mejoras_v0.3.sql` → Run.

### 2. Claves de notificaciones
Usa el par VAPID entregado aparte (o genera otro: `npx web-push generate-vapid-keys`).
- La **pública** va en `.env` / variables del hosting como `VITE_VAPID_PUBLIC_KEY`.
- La **privada** solo va como secreto de la función (paso 3).

### 3. Función que envía las push
Supabase → **Edge Functions** → crear función `notify` → pega `supabase/functions/notify/index.ts`.
- Desactiva **Verify JWT** en esa función.
- En **Secrets** crea: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (ej. `mailto:tucorreo@dominio.com`) y `WEBHOOK_SECRET`.
- (Con la CLI: `supabase functions deploy notify`.)

### 4. Conectar la base con la función
Edita `supabase/sql/02_configurar_notificaciones.sql` (tu URL de proyecto y el mismo `WEBHOOK_SECRET`) y ejecútalo en el SQL Editor.

### 5. Publicar la app (necesita HTTPS)
Sube la carpeta a GitHub y conéctala a **Vercel**, **Netlify** o **Cloudflare Pages** (build: `npm run build`, salida: `dist`). Agrega las 3 variables de `.env.example`. En Supabase → Authentication → URL Configuration, pon la URL publicada en *Site URL* y *Redirect URLs*.

### 6. Datos legales
Completa `src/config/empresa.js` (razón social, NIT, dirección, correo…) y haz revisar los textos de `src/components/Legal.jsx` por un abogado; luego pon `revisadoPorAbogado: true`.

### 7. Probar
Admin → Mi cuenta → **Activar notificaciones**. Con una cuenta de cliente crea un reporte: debe llegar el aviso. En iPhone: Compartir → *Añadir a pantalla de inicio*, abrir desde el ícono y activar (iOS 16.4+).

## Notas
- Un usuario nuevo queda "Pendiente"; el admin lo activa en *Empresas y usuarios*.
- Primer admin: `update profiles set role='admin', is_active=true where id='...'` en el SQL Editor.
- Revisa si los técnicos deben ver reportes de toda su empresa (política heredada de v0.2).
- Desarrollo local: `npm install`, `npm run dev`.
