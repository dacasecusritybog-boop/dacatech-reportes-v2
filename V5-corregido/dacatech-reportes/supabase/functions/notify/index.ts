// DACATECH Reportes — Edge Function "notify"
// Recibe el aviso de la base de datos (trigger dt_notify) y envía notificaciones push
// a los celulares/computadores suscritos que correspondan.
//
// Secretos necesarios (Supabase → Edge Functions → Secrets):
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (mailto:tu@correo.com), WEBHOOK_SECRET
// SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY ya las inyecta Supabase automáticamente.
import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
});

webpush.setVapidDetails(
  Deno.env.get('VAPID_SUBJECT') ?? 'mailto:soporte@dacatech.com',
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!,
);

type Payload = {
  table: 'reports' | 'report_updates';
  type: 'INSERT' | 'UPDATE';
  record: Record<string, any>;
  old_record: Record<string, any> | null;
  actor: string | null;
};

type Message = { users: string[]; title: string; body: string; reportId: string };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

async function adminIds(): Promise<string[]> {
  const { data } = await supabase.from('profiles').select('id').eq('role', 'admin').eq('is_active', true);
  return (data ?? []).map((p) => p.id);
}

async function getReport(id: string) {
  const { data } = await supabase
    .from('reports')
    .select('id,ticket_number,title,priority,status,created_by,assigned_to,companies(name)')
    .eq('id', id)
    .maybeSingle();
  return data as any;
}

const short = (t: string, n = 110) => (t && t.length > n ? t.slice(0, n - 1) + '…' : t ?? '');

async function buildMessages(p: Payload): Promise<Message[]> {
  const out: Message[] = [];

  if (p.table === 'reports' && p.type === 'INSERT') {
    const r = await getReport(p.record.id);
    if (!r) return out;
    const urgent = ['Alta', 'Crítica'].includes(r.priority);
    out.push({
      users: [...(await adminIds()), ...(r.assigned_to ? [r.assigned_to] : [])],
      title: `${urgent ? '🚨 ' : ''}Nuevo reporte #${r.ticket_number} · ${r.companies?.name ?? 'Cliente'}`,
      body: `${short(r.title)} — prioridad ${r.priority}`,
      reportId: r.id,
    });
  }

  if (p.table === 'reports' && p.type === 'UPDATE' && p.old_record) {
    const r = await getReport(p.record.id);
    if (!r) return out;
    if (p.record.assigned_to && p.record.assigned_to !== p.old_record.assigned_to) {
      out.push({
        users: [p.record.assigned_to],
        title: `Te asignaron el reporte #${r.ticket_number}`,
        body: `${short(r.title)} · ${r.companies?.name ?? ''}`,
        reportId: r.id,
      });
    }
    if (p.record.status !== p.old_record.status) {
      out.push({
        users: [r.created_by, ...(await adminIds())],
        title: `Reporte #${r.ticket_number}: ${p.record.status}`,
        body: short(r.title),
        reportId: r.id,
      });
    }
  }

  if (p.table === 'report_updates' && p.type === 'INSERT') {
    const r = await getReport(p.record.report_id);
    if (!r) return out;
    const { data: actor } = p.actor
      ? await supabase.from('profiles').select('role').eq('id', p.actor).maybeSingle()
      : { data: null };
    const staffAuthor = actor?.role === 'admin' || actor?.role === 'technician';
    out.push({
      users: staffAuthor
        ? [r.created_by]
        : [...(await adminIds()), ...(r.assigned_to ? [r.assigned_to] : [])],
      title: staffAuthor
        ? `Novedad en tu reporte #${r.ticket_number}`
        : `Mensaje del cliente · reporte #${r.ticket_number}`,
      body: short(p.record.message),
      reportId: r.id,
    });
  }

  return out;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  if (req.headers.get('x-webhook-secret') !== Deno.env.get('WEBHOOK_SECRET')) {
    return json({ error: 'unauthorized' }, 401);
  }

  let payload: Payload;
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'bad json' }, 400);
  }

  const messages = await buildMessages(payload);
  let sent = 0;
  let removed = 0;

  for (const m of messages) {
    // Quita duplicados y a quien hizo la acción (no se notifica a sí mismo).
    const users = [...new Set(m.users.filter((u) => u && u !== payload.actor))];
    if (!users.length) continue;

    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('id,endpoint,p256dh,auth')
      .in('user_id', users);

    const body = JSON.stringify({
      title: m.title,
      body: m.body,
      url: `/?report=${m.reportId}`,
      tag: `report-${m.reportId}`,
    });

    await Promise.all(
      (subs ?? []).map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            body,
            { TTL: 60 * 60 * 24, urgency: 'high' },
          );
          sent++;
        } catch (err: any) {
          if (err?.statusCode === 404 || err?.statusCode === 410) {
            await supabase.from('push_subscriptions').delete().eq('id', s.id); // dispositivo ya no existe
            removed++;
          } else {
            console.error('push error', err?.statusCode, err?.body);
          }
        }
      }),
    );
  }

  return json({ ok: true, sent, removed });
});
