import React, { useEffect, useState } from 'react';
import { Save, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';

const defaults = {
  report_title: 'INFORME DE SERVICIO TÉCNICO', logo_url: '', header_text: 'DACATECH · Reportes',
  footer_text: 'Documento generado desde DACATECH Reportes.', primary_color: '#0878e8',
  accent_color: '#111827', show_logo: true, show_company_contact: true, show_report_number: true,
  show_priority: true, show_status: true, show_description: true, show_diagnosis: true,
  show_resolution: true, show_history: true, show_customer_photos: true, show_service_photos: true,
  show_signatures: true, page_size: 'A4'
};
const switches = [
 ['show_logo','Mostrar logo'], ['show_company_contact','Contacto de la empresa'],
 ['show_report_number','Número del reporte'], ['show_priority','Prioridad'], ['show_status','Estado'],
 ['show_description','Descripción de la novedad'], ['show_diagnosis','Diagnóstico'],
 ['show_resolution','Solución / trabajo realizado'], ['show_history','Historial de seguimiento'],
 ['show_customer_photos','Fotos iniciales'], ['show_service_photos','Evidencias de atención'],
 ['show_signatures','Firmas']
];
export default function ReportFormatSettings({ profile, onMessage }) {
 const [settings, setSettings] = useState(defaults);
 const [busy, setBusy] = useState(false);
 const [loading, setLoading] = useState(true);
 useEffect(() => {
   let alive = true;
   (async () => {
     const { data, error } = await supabase.from('company_report_settings').select('*').eq('company_id', profile.company_id).maybeSingle();
     if (!alive) return;
     if (data) setSettings({ ...defaults, ...data });
     else if (error) onMessage('error', 'No se pudo cargar el formato: ' + error.message);
     setLoading(false);
   })();
   return () => { alive = false; };
 }, [profile.company_id, onMessage]);
 const set = (key, value) => setSettings(s => ({ ...s, [key]: value }));
 async function save(e) {
   e.preventDefault(); setBusy(true);
   const payload = { ...settings, company_id: profile.company_id, updated_by: profile.id, updated_at: new Date().toISOString() };
   delete payload.id;
   const { error } = await supabase.from('company_report_settings').upsert(payload, { onConflict: 'company_id' });
   setBusy(false);
   if (error) onMessage('error', 'No se pudo guardar el formato: ' + error.message);
   else onMessage('ok', 'Formato de informes guardado.');
 }
 if (loading) return <section className="content-card"><p>Cargando formato de informes…</p></section>;
 return <section className="content-card" aria-labelledby="format-title">
  <div className="section-head"><div><h2 id="format-title"><FileText size={20} style={{verticalAlign:'middle'}}/> Formato de informes</h2><p className="muted">Personaliza el documento descargable de tu empresa.</p></div></div>
  <form className="staff-panel" onSubmit={save}>
   <div className="two-col">
    <label>Título del informe<input maxLength={120} value={settings.report_title || ''} onChange={e=>set('report_title',e.target.value)} required /></label>
    <label>Texto del encabezado<input maxLength={180} value={settings.header_text || ''} onChange={e=>set('header_text',e.target.value)} /></label>
   </div>
   <label>URL pública del logo<input type="url" placeholder="https://..." value={settings.logo_url || ''} onChange={e=>set('logo_url',e.target.value)} /></label>
   <label>Texto del pie de página<textarea rows="2" maxLength={500} value={settings.footer_text || ''} onChange={e=>set('footer_text',e.target.value)} /></label>
   <div className="two-col">
    <label>Color principal<input type="color" value={settings.primary_color || '#0878e8'} onChange={e=>set('primary_color',e.target.value)} /></label>
    <label>Color secundario<input type="color" value={settings.accent_color || '#111827'} onChange={e=>set('accent_color',e.target.value)} /></label>
   </div>
   <label>Tamaño de página<select value={settings.page_size || 'A4'} onChange={e=>set('page_size',e.target.value)}><option value="A4">A4</option><option value="Letter">Carta</option></select></label>
   <h3>Secciones visibles en el informe</h3>
   <div className="two-col">{switches.map(([key,label])=><label className="check-row" key={key}><input type="checkbox" checked={Boolean(settings[key])} onChange={e=>set(key,e.target.checked)}/><span>{label}</span></label>)}</div>
   <button className="primary-btn" disabled={busy}>{busy ? 'Guardando…' : 'Guardar formato'} <Save size={17}/></button>
  </form>
 </section>;
}