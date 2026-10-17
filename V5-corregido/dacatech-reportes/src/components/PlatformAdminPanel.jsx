import React, { useCallback, useEffect, useState } from 'react';
import { Building2, CheckCircle2, CreditCard, RefreshCw, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';

const money = value => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(value || 0));
const date = value => value ? new Date(value).toLocaleDateString('es-CO') : '—';
const statusLabels = { trialing: 'Prueba', pending_payment: 'Pago pendiente', active: 'Activa', past_due: 'Vencida', expired: 'Expirada', suspended: 'Suspendida', legacy: 'Acceso anterior' };

export default function PlatformAdminPanel({ onMessage }) {
  const [data, setData] = useState({ companies: [], plans: [], subscriptions: [], payments: [] });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [selection, setSelection] = useState({});
  const [paymentNotes, setPaymentNotes] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    const { data: result, error } = await supabase.functions.invoke('platform-admin', { body: { action: 'overview' } });
    if (error || result?.error) {
      onMessage('error', 'No se pudo cargar el panel maestro: ' + (result?.error || error?.message || 'Error inesperado.'));
    } else setData(result);
    setLoading(false);
  }, [onMessage]);

  useEffect(() => { void load(); }, [load]);

  const updateSelection = (companyId, patch) => setSelection(current => ({
    ...current, [companyId]: { ...(current[companyId] || {}), ...patch }
  }));

  async function configure(company) {
    const selected = selection[company.id] || {};
    const planId = selected.plan_id || data.subscriptions.find(s => s.company_id === company.id)?.plan_id || data.plans.find(p => p.code === 'profesional')?.id;
    if (!planId) { onMessage('error', 'No hay planes disponibles.'); return; }
    setBusy(company.id);
    const { data: result, error } = await supabase.functions.invoke('platform-admin', { body: {
      action: 'configure_subscription', company_id: company.id, plan_id: planId,
      billing_period: selected.billing_period || 'monthly', white_label_enabled: Boolean(selected.white_label_enabled),
      admin_notes: selected.admin_notes || ''
    }});
    setBusy('');
    if (error || result?.error) onMessage('error', 'No se pudo configurar la suscripción: ' + (result?.error || error?.message));
    else { onMessage('ok', 'Plan guardado. El estado queda pendiente de pago; aún no se activó el servicio.'); await load(); }
  }

  async function changeStatus(companyId, status) {
    setBusy(companyId);
    const { data: result, error } = await supabase.functions.invoke('platform-admin', { body: { action: 'set_subscription_status', company_id: companyId, status } });
    setBusy('');
    if (error || result?.error) onMessage('error', 'No se pudo cambiar el estado: ' + (result?.error || error?.message));
    else { onMessage('ok', 'Estado actualizado.'); await load(); }
  }

  async function createPayment(companyId) {
    const selected = selection[companyId] || {};
    setBusy(companyId);
    const { data: result, error } = await supabase.functions.invoke('platform-admin', { body: {
      action: 'create_payment_request', company_id: companyId,
      billing_period: selected.payment_period || 'monthly',
      white_label_enabled: Boolean(selected.white_label_enabled),
      payment_reference: selected.payment_reference || '',
      notes: selected.payment_notes || ''
    }});
    setBusy('');
    if (error || result?.error) onMessage('error', 'No se pudo registrar el cobro: ' + (result?.error || error?.message));
    else { onMessage('ok', 'Cobro pendiente registrado. Confirma el pago únicamente después de verificar la transferencia.'); await load(); }
  }

  async function confirmPayment(payment) {
    const confirmed = window.confirm('¿Confirmaste que la transferencia de ' + money(payment.amount_cop) + ' ingresó a la cuenta de DACATECH? Solo confirma si verificaste el dinero.');
    if (!confirmed) return;
    setBusy(payment.id);
    const { data: result, error } = await supabase.functions.invoke('platform-admin', { body: {
      action: 'confirm_payment', payment_id: payment.id, notes: paymentNotes[payment.id] || payment.notes || ''
    }});
    setBusy('');
    if (error || result?.error) onMessage('error', 'No se pudo confirmar: ' + (result?.error || error?.message));
    else { onMessage('ok', 'Pago confirmado y suscripción activada hasta ' + date(result.current_period_end) + '.'); await load(); }
  }

  if (loading) return <section className="content-card"><p><RefreshCw size={16} style={{verticalAlign:'middle'}}/> Cargando panel maestro de DACATECH…</p></section>;

  return <section className="content-card" aria-labelledby="platform-admin-title">
    <div className="section-head">
      <div><h2 id="platform-admin-title"><ShieldCheck size={21} style={{verticalAlign:'middle'}}/> Panel maestro DACATECH</h2>
      <p className="muted">Administra las empresas de la plataforma, asigna planes y activa pagos manuales verificados.</p></div>
      <button className="secondary-btn compact" type="button" onClick={load}><RefreshCw size={16}/> Actualizar</button>
    </div>
    <div className="two-col">
      <div className="company-panel"><small className="muted">Empresas</small><h3>{data.companies.length}</h3></div>
      <div className="company-panel"><small className="muted">Pagos pendientes</small><h3>{data.payments.filter(p => p.status === 'pending').length}</h3></div>
    </div>
    <h3 style={{marginTop:24}}><Building2 size={18} style={{verticalAlign:'middle'}}/> Empresas y suscripciones</h3>
    <div className="user-list">
      {data.companies.map(company => {
        const sub = data.subscriptions.find(s => s.company_id === company.id);
        const selected = selection[company.id] || {};
        const currentPlan = sub?.plans;
        return <article className="user-row" key={company.id}>
          <div className="user-id"><div className="avatar"><Building2 size={18}/></div><div><b>{company.name}</b><small>Creada {date(company.created_at)}</small><small>{sub ? (statusLabels[sub.status] || sub.status) + ' · ' + (currentPlan?.name || 'Sin plan') : 'Sin suscripción comercial registrada'}</small><small>Vence / revisión: {date(sub?.current_period_end || sub?.trial_ends_at)}</small></div></div>
          <label>Plan<select value={selected.plan_id || sub?.plan_id || data.plans.find(p=>p.code==='profesional')?.id || ''} onChange={e=>updateSelection(company.id,{plan_id:e.target.value})}>{data.plans.map(p=><option key={p.id} value={p.id}>{p.name} — {money(p.monthly_price_cop)}/mes</option>)}</select></label>
          <label>Periodicidad<select value={selected.billing_period || sub?.billing_period || 'monthly'} onChange={e=>updateSelection(company.id,{billing_period:e.target.value})}><option value="monthly">Mensual</option><option value="annual">Anual</option></select></label>
          <label className="check-row"><input type="checkbox" checked={Boolean(selected.white_label_enabled ?? sub?.white_label_enabled)} onChange={e=>updateSelection(company.id,{white_label_enabled:e.target.checked})}/><span>Marca personalizada (adicional)</span></label>
          <label>Notas administrativas<input maxLength={1000} value={selected.admin_notes || ''} onChange={e=>updateSelection(company.id,{admin_notes:e.target.value})} placeholder="Opcional"/></label>
          <div className="user-actions">
            <button type="button" className="primary-btn compact" disabled={busy===company.id} onClick={()=>configure(company)}>{busy===company.id?'Guardando…':'Guardar plan / solicitar pago'}</button>
            {sub && <label>Estado<select value={sub.status} disabled={busy===company.id} onChange={e=>changeStatus(company.id,e.target.value)}>{Object.entries(statusLabels).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>}
          </div>
          {sub && <div className="company-panel">
            <b>Registrar solicitud de cobro</b>
            <label>Periodo<select value={selected.payment_period || sub.billing_period || 'monthly'} onChange={e=>updateSelection(company.id,{payment_period:e.target.value})}><option value="monthly">Mensual</option><option value="annual">Anual</option></select></label>
            <label>Referencia / comprobante<input maxLength={180} value={selected.payment_reference || ''} onChange={e=>updateSelection(company.id,{payment_reference:e.target.value})} placeholder="Referencia de transferencia"/></label>
            <label>Notas<input maxLength={1000} value={selected.payment_notes || ''} onChange={e=>updateSelection(company.id,{payment_notes:e.target.value})} placeholder="Observaciones"/></label>
            <button type="button" className="secondary-btn compact" disabled={busy===company.id} onClick={()=>createPayment(company.id)}>Registrar cobro pendiente</button>
          </div>}
        </article>;
      })}
    </div>
    <h3 style={{marginTop:24}}><CreditCard size={18} style={{verticalAlign:'middle'}}/> Pagos manuales</h3>
    {data.payments.length===0 ? <p className="muted">Todavía no hay pagos registrados.</p> : <div className="user-list">
      {data.payments.map(payment=><article className="user-row" key={payment.id}>
        <div className="user-id"><div className="avatar"><CreditCard size={18}/></div><div><b>{payment.companies?.name || 'Empresa'}</b><small>{money(payment.amount_cop)} · {payment.billing_period==='annual'?'Anual':'Mensual'}</small><small>Estado: {payment.status} · {date(payment.created_at)}</small><small>Referencia: {payment.payment_reference || 'Sin referencia'}</small></div></div>
        <label>Nota de confirmación<input value={paymentNotes[payment.id] ?? payment.notes ?? ''} onChange={e=>setPaymentNotes(current=>({...current,[payment.id]:e.target.value}))} maxLength={1000}/></label>
        {payment.status==='pending' && <button type="button" className="primary-btn compact" disabled={busy===payment.id} onClick={()=>confirmPayment(payment)}><CheckCircle2 size={16}/>{busy===payment.id?'Confirmando…':'Confirmar transferencia verificada'}</button>}
      </article>)}
    </div>}
    <p className="muted" style={{marginTop:16}}>La activación es manual. Verifica el abono en la cuenta bancaria antes de confirmar. Este panel no consulta automáticamente bancos ni procesa transferencias.</p>
  </section>;
}
