import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Activity, AlertCircle, ArrowRight, CheckCircle2, ClipboardList, Clock3, FileDown, FileText, Plus, Search, Ticket, UploadCloud, X } from 'lucide-react';
import PhotoGallery from './PhotoGallery';
import { fmtDate, roleLabel, statusClass, statuses } from '../lib/constants';


const htmlEscape = (value = '') => String(value).replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));

async function reportDocumentHtml(report, settings = {}) {
  const cfg = { report_title: 'INFORME DE SERVICIO TÉCNICO', header_text: 'DACATECH · Reportes', footer_text: 'DACATECH REPORTES · Informe generado desde el sistema. Verifique los datos antes de entregar.', primary_color: '#0878e8', accent_color: '#111827', show_logo: true, show_report_number: true, show_priority: true, show_status: true, show_description: true, show_resolution: true, show_history: true, show_customer_photos: true, show_service_photos: true, page_size: 'A4', ...settings };
  const updates = (report.report_updates || []).slice().sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  let photos = [];
  if (report.report_photos?.length) {
    try {
      const { data } = await (await import('../lib/supabase')).supabase.storage
        .from('report-photos')
        .createSignedUrls(report.report_photos.map((p) => p.storage_path), 300);
      photos = await Promise.all((report.report_photos || []).map(async (p, i) => {
        const url = data?.[i]?.signedUrl;
        if (!url) return { ...p, dataUrl: '' };
        try {
          const response = await fetch(url);
          if (!response.ok) return { ...p, dataUrl: url };
          const blob = await response.blob();
          const dataUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => resolve(url);
            reader.readAsDataURL(blob);
          });
          return { ...p, dataUrl };
        } catch { return { ...p, dataUrl: url }; }
      }));
    } catch { photos = []; }
  }
  const lastUpdate = updates.length ? updates[updates.length - 1] : null;
  const visiblePhotos = photos.filter(p => p.photo_type === 'service' ? cfg.show_service_photos : cfg.show_customer_photos);
  const photoHtml = visiblePhotos.length
    ? visiblePhotos.map((p) => p.dataUrl ? `<figure><img src="${p.dataUrl}" alt="Evidencia del reporte"><figcaption>${htmlEscape(p.photo_type === 'service' ? 'Evidencia de atención' : 'Foto inicial')}${p.caption ? ` — ${htmlEscape(p.caption)}` : ''}</figcaption></figure>` : `<p>${htmlEscape(p.caption || 'Fotografía adjunta (no disponible para incrustar)')}</p>`).join('')
    : '<p>No hay fotografías disponibles.</p>';
  return `<!doctype html><html><head><meta charset="utf-8"><title>Reporte DACATECH #${htmlEscape(report.ticket_number)}</title>
  <style>@page{size:${cfg.page_size === 'Letter' ? 'Letter' : 'A4'};margin:18mm}body{font-family:Arial,sans-serif;color:#182334;margin:32px;font-size:11pt}h1{color:${htmlEscape(cfg.primary_color)};font-size:22pt;margin-bottom:4px}h2{font-size:14pt;border-bottom:1px solid #ccd6e2;padding-bottom:6px;margin-top:24px}.brand{letter-spacing:3px;color:${htmlEscape(cfg.primary_color)};font-weight:bold}.muted{color:#596b80}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.field{padding:10px;border:1px solid #d9e2ec;border-radius:6px}.label{display:block;color:#596b80;font-size:9pt;margin-bottom:4px}.text{white-space:pre-wrap;line-height:1.5}figure{margin:14px 0;page-break-inside:avoid}img{max-width:100%;max-height:520px;object-fit:contain}figcaption{font-size:9pt;color:#596b80;margin-top:5px}.footer{margin-top:30px;border-top:1px solid #ccd6e2;padding-top:8px;font-size:9pt;color:#596b80}@media print{body{margin:18mm}}</style></head><body>
  ${cfg.show_logo && cfg.logo_url ? `<img class="logo" src="${htmlEscape(cfg.logo_url)}" alt="Logo" style="max-width:180px;max-height:80px;object-fit:contain">` : ''}<div class="brand">${htmlEscape(cfg.header_text || 'DACATECH · Reportes')}</div><h1>${htmlEscape(cfg.report_title)}${cfg.show_report_number ? ` · #${htmlEscape(report.ticket_number)}` : ''} — ${htmlEscape(report.title)}</h1><p class="muted">Documento generado: ${htmlEscape(new Date().toLocaleString('es-CO'))}</p>
  <h2>Datos del servicio</h2><div class="grid">
  <div class="field"><span class="label">Cliente / empresa</span>${htmlEscape(report.companies?.name || 'No especificado')}</div>
  <div class="field"><span class="label">Tipo de servicio</span>${htmlEscape(report.category)}</div>
  <div class="field"><span class="label">Ubicación</span>${htmlEscape(report.location || 'No especificada')}</div>
  ${cfg.show_priority ? `<div class="field"><span class="label">Prioridad</span>${htmlEscape(report.priority)}</div>` : ''}
  ${cfg.show_status ? `<div class="field"><span class="label">Estado</span>${htmlEscape(report.status)}</div>` : ''}
  <div class="field"><span class="label">Fecha de creación</span>${htmlEscape(fmtDate(report.created_at))}</div>
  ${lastUpdate ? `<div class="field"><span class="label">Último seguimiento registrado</span>${htmlEscape(fmtDate(lastUpdate.created_at))}</div>` : ''}
  </div>
  ${cfg.show_description ? `<h2>Descripción de la novedad</h2><div class="text">${htmlEscape(report.description || '')}</div>` : ''}
  ${cfg.show_resolution ? `<h2>Solución / trabajo realizado</h2><div class="text">${htmlEscape(report.resolution_summary || 'No se registró resumen de solución.')}</div>` : ''}
  ${cfg.show_history ? `<h2>Historial de seguimiento</h2>${updates.length ? updates.map((u) => `<p><b>${htmlEscape(u.author_name || 'Equipo DACATECH')}</b> — ${htmlEscape(fmtDate(u.created_at))}<br><span class="text">${htmlEscape(u.message || '')}</span></p>`).join('') : '<p>No hay seguimientos registrados.</p>'}` : ''}
  <h2>Fotografías y evidencias</h2>${photoHtml}
  <div class="footer">${htmlEscape(cfg.footer_text)}</div></body></html>`;
}

async function exportReport(report, format, companyId) {
  const popup = format === 'pdf' ? window.open('', '_blank') : null;
  if (format === 'pdf' && !popup) {
    alert('El navegador bloqueó la ventana. Permite las ventanas emergentes e inténtalo de nuevo.');
    return;
  }
  try {
    const { data: settings } = await (await import('../lib/supabase')).supabase.from('company_report_settings').select('*').eq('company_id', companyId).maybeSingle();
    const html = await reportDocumentHtml(report, settings || {});
    if (format === 'word') {
      const blob = new Blob(['\uFEFF', html], { type: 'application/msword;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DACATECH-reporte-${report.ticket_number}.doc`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    } else {
      popup.document.open();
      popup.document.write(html);
      popup.document.close();
      setTimeout(() => popup.print(), 700);
    }
  } catch (error) {
    if (popup) popup.close();
    alert('No se pudo generar el informe. Inténtalo nuevamente.');
    console.error('Export report', error);
  }
}

function Stat({ icon, label, value, tone }) {
  return <div className="stat-card"><div className={`stat-icon ${tone}`} aria-hidden="true">{icon}</div><div><div className="stat-value">{value}</div><div className="stat-label">{label}</div></div></div>;
}

const FILTERS = [
  ['todos', 'Todos'],
  ['abiertos', 'Abiertos'],
  ['urgentes', 'Prioridad alta'],
  ['cerrados', 'Cerrados'],
];

export default function ReportsView({ profile, reports, staff, active, setActive, onNew, onSaveFollowup, saving, loading }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('todos');
  const isStaff = profile.role !== 'customer';
  const detailRef = useRef(null);

  const open = (r) => !['Solucionado', 'Cerrado'].includes(r.status);
  const urgent = (r) => ['Alta', 'Crítica'].includes(r.priority) && r.status !== 'Cerrado';

  const filtered = useMemo(() => reports.filter((r) => {
    const okText = `${r.title} ${r.ticket_number} ${r.category} ${r.status} ${r.companies?.name || ''}`.toLowerCase().includes(search.toLowerCase());
    const okFilter = filter === 'todos' || (filter === 'abiertos' && open(r)) || (filter === 'urgentes' && urgent(r)) || (filter === 'cerrados' && r.status === 'Cerrado');
    return okText && okFilter;
  }), [reports, search, filter]);

  const current = reports.find((r) => r.id === active);

  // formulario de seguimiento (personal)
  const [newStatus, setNewStatus] = useState('En revisión');
  const [assigned, setAssigned] = useState('');
  const [message, setMessage] = useState('');
  const [resolution, setResolution] = useState('');
  const [evidence, setEvidence] = useState([]);

  useEffect(() => {
    if (!current) return;
    setNewStatus(current.status === 'Recibido' ? 'En revisión' : current.status);
    setAssigned(current.assigned_to || '');
    setResolution(current.resolution_summary || '');
    setMessage(''); setEvidence([]);
    detailRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  }, [current?.id]); // eslint-disable-line

  const timeline = current ? [
    { id: 'creado', author_name: 'Reporte creado', message: current.companies?.name ? `Registrado por ${current.companies.name}.` : 'Reporte registrado.', created_at: current.created_at },
    ...(current.report_updates || []).slice().sort((a, b) => new Date(a.created_at) - new Date(b.created_at)),
  ] : [];

  return (
    <>
      <section className="stats-grid" aria-label="Resumen">
        <Stat icon={<Ticket />} label="Reportes totales" value={reports.length} tone="blue" />
        <Stat icon={<Clock3 />} label="En atención" value={reports.filter((r) => ['Asignado', 'En atención', 'En revisión'].includes(r.status)).length} tone="orange" />
        <Stat icon={<CheckCircle2 />} label="Cerrados" value={reports.filter((r) => r.status === 'Cerrado').length} tone="green" />
        <Stat icon={<AlertCircle />} label="Prioridad alta" value={reports.filter(urgent).length} tone="red" />
      </section>

      <section className="content-card" aria-labelledby="seg-title">
        <div className="section-head">
          <div><h2 id="seg-title">Seguimiento de novedades</h2><p className="muted">Consulta el estado y las evidencias de cada solicitud. Se actualiza en tiempo real.</p></div>
          <div className="search-wrap">
            <Search size={17} aria-hidden="true" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar reporte…" aria-label="Buscar reporte" />
          </div>
        </div>
        <div className="filter-row" role="group" aria-label="Filtrar reportes">
          {FILTERS.map(([id, label]) => (
            <button type="button" key={id} className={`chip ${filter === id ? 'on' : ''}`} aria-pressed={filter === id} onClick={() => setFilter(id)}>{label}</button>
          ))}
        </div>

        {loading && !reports.length ? (
          <div className="empty-state"><div className="spinner" /><p>Cargando reportes…</p></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon" aria-hidden="true"><ClipboardList /></div>
            <h3>{reports.length ? 'No encontramos resultados' : 'Todavía no hay reportes'}</h3>
            <p>{reports.length ? 'Prueba con otro filtro o término de búsqueda.' : 'Crea un reporte para iniciar el seguimiento de una novedad.'}</p>
            {!isStaff && !reports.length && <button type="button" className="primary-btn" onClick={onNew}><Plus size={18} aria-hidden="true" /> Crear primer reporte</button>}
          </div>
        ) : (
          <div className="report-list">
            {filtered.map((r) => (
              <button type="button" className={`report-row ${active === r.id ? 'active' : ''}`} key={r.id} onClick={() => setActive(r.id)} aria-current={active === r.id ? 'true' : undefined}>
                <div className="report-symbol" aria-hidden="true"><ClipboardList size={20} /></div>
                <div className="report-main">
                  <div className="report-title-line"><b>{r.title}</b><span className={`status-badge ${statusClass(r.status)}`}>{r.status}</span></div>
                  <div className="report-meta"><span>#{r.ticket_number}</span><span>{r.category}</span><span>{r.companies?.name || 'Empresa'}</span><span>{fmtDate(r.created_at)}</span></div>
                </div>
                <div className={`priority-dot ${statusClass(r.priority)}`}>{r.priority}</div>
                <ArrowRight className="row-arrow" size={18} aria-hidden="true" />
              </button>
            ))}
          </div>
        )}
      </section>

      {current && (
        <section className="content-card detail-card" ref={detailRef} aria-labelledby="det-title">
          <div className="section-head">
            <div><div className="eyebrow">REPORTE #{current.ticket_number}</div><h2 id="det-title">{current.title}</h2><p className="muted">Creado {fmtDate(current.created_at)}</p></div>
            <button type="button" className="icon-btn" onClick={() => setActive(null)} aria-label="Cerrar detalle"><X aria-hidden="true" /></button>
          </div>
         <div className="export-actions" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '18px' }}>
  <button type="button" className="primary-btn" onClick={() => exportReport(current, 'word', profile.company_id)}><FileText size={17} aria-hidden="true" /> Descargar Word</button>
  <button type="button" className="secondary-btn" onClick={() => exportReport(current, 'pdf', profile.company_id)}><FileDown size={17} aria-hidden="true" /> Descargar PDF</button>
</div>
          <div className="detail-grid">
            <div><span className="detail-label">Tipo de servicio</span><b>{current.category}</b></div>
            <div><span className="detail-label">Ubicación</span><b>{current.location || 'No especificada'}</b></div>
            <div><span className="detail-label">Prioridad</span><b>{current.priority}</b></div>
            <div><span className="detail-label">Estado actual</span><b>{current.status}</b></div>
          </div>
          <div className="description-box"><span className="detail-label">Descripción de la novedad</span><p>{current.description}</p></div>
          {current.resolution_summary && <div className="description-box"><span className="detail-label">Resumen de solución</span><p>{current.resolution_summary}</p></div>}
          <PhotoGallery photos={current.report_photos || []} />
          <div className="timeline"><h3>Historial de seguimiento</h3>
            {timeline.map((u) => (
              <div className="timeline-item" key={u.id}><div className="timeline-dot" aria-hidden="true" /><div><b>{u.author_name || 'Equipo DACATECH'}</b><p>{u.message}</p><small>{fmtDate(u.created_at)}</small></div></div>
            ))}
          </div>

          {isStaff && (
            <form className="staff-panel" onSubmit={(e) => { e.preventDefault(); onSaveFollowup({ report: current, newStatus, assigned, message, resolution, evidence }); }}>
              <h3><Activity size={18} aria-hidden="true" /> Actualizar atención</h3>
              <div className="two-col">
                <label>Estado<select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>{statuses.map((s) => <option key={s}>{s}</option>)}</select></label>
                {profile.role === 'admin' && (
                  <label>Asignado a
                    <select value={assigned} onChange={(e) => setAssigned(e.target.value)}>
                      <option value="">Sin asignar</option>
                      {staff.map((s) => <option key={s.id} value={s.id}>{s.full_name || s.id.slice(0, 8)} · {roleLabel[s.role]}</option>)}
                    </select>
                  </label>
                )}
              </div>
              <label>Nota de seguimiento<textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Describe la revisión, trabajo realizado o recomendación…" rows="3" /></label>
              {['Solucionado', 'Cerrado'].includes(newStatus) && (
                <label>Resumen de solución<textarea value={resolution} onChange={(e) => setResolution(e.target.value)} placeholder="Qué se corrigió y cómo se verificó…" rows="3" required /></label>
              )}
              <label className="upload-box">
                <UploadCloud size={20} aria-hidden="true" />
                <span><b>Adjuntar evidencias de atención</b><small>Fotos JPG, PNG o WebP · máximo 10 MB por archivo</small></span>
                <input type="file" accept="image/*" multiple onChange={(e) => setEvidence([...e.target.files])} />
              </label>
              {evidence.length > 0 && <small>{evidence.length} archivo(s) seleccionado(s)</small>}
              <button className="primary-btn" disabled={saving}>{saving ? 'Guardando…' : 'Guardar seguimiento'} <ArrowRight size={17} aria-hidden="true" /></button>
            </form>
          )}

          {!isStaff && current.status !== 'Cerrado' && (
            <form className="staff-panel" onSubmit={(e) => { e.preventDefault(); onSaveFollowup({ report: current, message, evidence, customer: true }); }}>
              <h3><Activity size={18} aria-hidden="true" /> Agregar información</h3>
              <label>Mensaje para el equipo<textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Agrega detalles o responde a una pregunta del técnico…" rows="3" required /></label>
              <label className="upload-box">
                <UploadCloud size={20} aria-hidden="true" />
                <span><b>Adjuntar fotografías</b><small>Máximo 10 MB por archivo</small></span>
                <input type="file" accept="image/*" multiple onChange={(e) => setEvidence([...e.target.files])} />
              </label>
              {evidence.length > 0 && <small>{evidence.length} archivo(s) seleccionado(s)</small>}
              <button className="primary-btn" disabled={saving}>{saving ? 'Enviando…' : 'Enviar mensaje'} <ArrowRight size={17} aria-hidden="true" /></button>
            </form>
          )}
        </section>
      )}
    </>
  );
}
