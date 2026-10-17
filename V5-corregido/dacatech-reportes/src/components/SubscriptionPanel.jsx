import React, { useEffect, useState } from 'react';
import { CalendarClock, CreditCard, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';

const money = value => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(value || 0));
const date = value => value ? new Date(value).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Por definir';
const statusLabels = { trialing: 'Prueba gratuita', pending_payment: 'Pago pendiente de revisión', active: 'Activa', past_due: 'Pago vencido', expired: 'Vencida', suspended: 'Suspendida', legacy: 'Acceso existente' };

export default function SubscriptionPanel({ profile, onMessage }) {
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let alive = true;
    const loadSubscription = async () => {
      const [subResult, planResult] = await Promise.all([
        supabase.from('subscriptions').select('*, plans(*)').eq('company_id', profile.company_id).maybeSingle(),
        supabase.from('plans').select('*').eq('is_active', true).eq('is_public', true).order('monthly_price_cop')
      ]);
      if (!alive) return;
      if (subResult.error) setLoadError('No se pudo consultar la suscripción: ' + subResult.error.message);
      else { setSubscription(subResult.data || null); setLoadError(''); }
      if (planResult.error) setLoadError(current => current || ('No se pudieron cargar los planes: ' + planResult.error.message));
      else setPlans(planResult.data || []);
      setLoading(false);
    };
    setLoading(true);
    void loadSubscription();
    const onVisible = () => {
      if (document.visibilityState === 'visible') void loadSubscription();
    };
    window.addEventListener('focus', onVisible);
    document.addEventListener('visibilitychange', onVisible);
    const channel = supabase.channel('dt-subscription-' + profile.company_id)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'subscriptions',
        filter: 'company_id=eq.' + profile.company_id
      }, () => { void loadSubscription(); })
      .subscribe();
    return () => {
      alive = false;
      window.removeEventListener('focus', onVisible);
      document.removeEventListener('visibilitychange', onVisible);
      void supabase.removeChannel(channel);
    };
  }, [profile.company_id]);

  if (loading) return <section className="content-card"><p>Consultando el plan de tu empresa…</p></section>;

  const plan = subscription?.plans;
  const daysLeft = subscription?.trial_ends_at ? Math.max(0, Math.ceil((new Date(subscription.trial_ends_at).getTime() - Date.now()) / 86400000)) : null;

  return <section className="content-card" aria-labelledby="subscription-title">
    <div className="section-head">
      <div><h2 id="subscription-title"><CreditCard size={20} style={{ verticalAlign: 'middle' }} /> Plan y suscripción</h2>
      <p className="muted">Consulta el plan contratado y las fechas de acceso de tu empresa.</p></div>
    </div>
    {loadError && <div className="error-msg" role="alert">{loadError}</div>}
    {subscription ? <div className="company-panel">
      <div className="section-head">
        <div><h3>{plan?.name || 'Plan por configurar'}</h3><p className="muted">{plan?.description || 'Tu acceso actual se conserva mientras DACATECH configura las condiciones comerciales.'}</p></div>
        <span className="status-badge">{statusLabels[subscription.status] || subscription.status}</span>
      </div>
      {subscription.status === 'trialing' && <div className="success-msg"><CalendarClock size={18} style={{ verticalAlign: 'middle' }} /> {daysLeft > 0 ? `Te quedan ${daysLeft} día(s) de prueba.` : 'La prueba gratuita ha finalizado y requiere revisión administrativa.'} Finaliza: {date(subscription.trial_ends_at)}.</div>}
      <div className="two-col" style={{ marginTop: 16 }}>
        <div><small className="muted">Periodicidad</small><p><b>{subscription.billing_period === 'annual' ? 'Anual' : 'Mensual'}</b></p></div>
        <div><small className="muted">Próxima fecha de revisión</small><p><b>{date(subscription.current_period_end)}</b></p></div>
        <div><small className="muted">Marca personalizada</small><p><b>{subscription.white_label_enabled ? 'Activada' : 'No activada'}</b></p></div>
        <div><small className="muted">Forma de pago</small><p><b>Transferencia / revisión manual</b></p></div>
      </div>
      <p className="muted">Para contratar o renovar, solicita a DACATECH los datos de pago y envía el comprobante por el canal acordado. La activación se realizará después de verificar el pago; esta pantalla no procesa pagos ni confirma transferencias.</p>
    </div> : <div className="company-panel">
      <h3><ShieldCheck size={18} style={{ verticalAlign: 'middle' }} /> Acceso existente</h3>
      <p>Esta empresa no tiene una suscripción comercial registrada todavía. Para evitar interrumpir el servicio, tu acceso actual se conserva. DACATECH debe revisar y asignar el plan correspondiente antes de cobrar o aplicar límites.</p>
    </div>}
    <h3 style={{ marginTop: 24 }}>Planes disponibles</h3>
    <div className="two-col">
      {plans.map(item => <article className="company-panel" key={item.id}>
        <h3>{item.name}</h3><p className="muted">{item.description}</p>
        <p><b>{money(item.monthly_price_cop)} / mes</b></p>
        <p><b>{money(item.annual_price_cop)} / año</b></p>
        <small className="muted">{item.max_technicians ? `Hasta ${item.max_technicians} técnicos` : 'Capacidad de técnicos por cotizar'} · {item.max_customers ? `${item.max_customers} clientes` : 'Clientes por cotizar'}</small>
        {item.white_label_enabled && <p><small>Admite complemento de marca personalizada, sujeto a activación.</small></p>}
      </article>)}
    </div>
    <p className="muted" style={{ marginTop: 12 }}>Las empresas nuevas podrán tener una prueba de 14 días. La suscripción y los límites comerciales se están incorporando por etapas; los precios mostrados son los precios propuestos para el lanzamiento.</p>
  </section>;
}
