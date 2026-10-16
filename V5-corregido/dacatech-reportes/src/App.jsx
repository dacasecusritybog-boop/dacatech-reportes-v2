import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, ClipboardList, LogOut, Plus, UserCircle, Users, X } from 'lucide-react';
import { supabase } from './lib/supabase';
import { detachDevice, usePush } from './lib/push';
import { roleLabel } from './lib/constants';
import AuthScreen from './components/AuthScreen';
import ReportsView from './components/ReportsView';
import CreateReportModal from './components/CreateReportModal';
import AdminPanel from './components/AdminPanel';
import AccountView from './components/AccountView';
import ReportFormatSettings from './components/ReportFormatSettings';
import NotificationCard from './components/NotificationCard';
import Toasts from './components/Toasts';
import CookieNotice from './components/CookieNotice';
import Legal, { LegalLinks } from './components/Legal';

const REPORT_SELECT = '*, companies(name), report_photos(id,storage_path,photo_type,caption), report_updates(id,message,author_name,created_at)';
const BANNER_KEY = 'dt_banner_push_oculto';
const readFlag = (k) => { try { return sessionStorage.getItem(k) === '1'; } catch { return false; } };

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recovery, setRecovery] = useState(false);
  const [legal, setLegal] = useState(null);

  const [view, setView] = useState('reports');
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [staff, setStaff] = useState([]);
  const [active, setActive] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [modalError, setModalError] = useState('');
  const [toasts, setToasts] = useState([]);
  const [bannerHidden, setBannerHidden] = useState(readFlag(BANNER_KEY));

  const lastLocalWrite = useRef(0);
  const pendingOpen = useRef(new URLSearchParams(window.location.search).get('report'));
  const push = usePush(session?.user?.id);

  const isStaff = profile && profile.role !== 'customer';

  /* ---------- sesión ---------- */
  const loadProfile = useCallback(async (id) => {
    if (!supabase || !id) {
      setProfile(null);
      setLoading(false);
      return;
    }
    try {
      setError('');
      const { data, error: err } = await supabase
        .from('profiles')
        .select('id,company_id,full_name,role,is_active,companies(name)')
        .eq('id', id)
        .maybeSingle();
      if (err) {
        console.error('Error cargando perfil de Supabase:', err);
        setError('No se pudo cargar tu perfil: ' + err.message);
        setProfile(null);
      } else if (!data) {
        setError('Tu usuario inició sesión, pero no tiene un perfil creado en la tabla profiles. Pide al administrador que cree o vincule tu perfil.');
        setProfile(null);
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error('Error inesperado cargando perfil:', err);
      setError('No se pudo conectar con Supabase para cargar tu perfil. Comprueba la URL, la clave pública y los permisos de la tabla profiles.');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    const qs = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const isRecovery = hash.get('type') === 'recovery' || qs.get('reset-password') === '1';
    if (isRecovery) setRecovery(true);

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session && !isRecovery) loadProfile(data.session.user.id); else setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === 'PASSWORD_RECOVERY') { setRecovery(true); setProfile(null); setLoading(false); return; }
      if (!s) { setProfile(null); setReports([]); setActive(null); setLoading(false); return; }
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') setTimeout(() => loadProfile(s.user.id), 0);
    });
    return () => subscription.unsubscribe();
  }, [loadProfile]);

  /* ---------- datos ---------- */
  const loadReports = useCallback(async () => {
    if (!supabase || !profile) return;
    let q = supabase.from('reports').select(REPORT_SELECT).order('created_at', { ascending: false });
    if (profile.role === 'customer') q = q.eq('company_id', profile.company_id);
    else if (profile.role === 'technician') q = q.or(`assigned_to.eq.${profile.id},company_id.eq.${profile.company_id}`);
    const { data, error: err } = await q;
    if (err) setError('No se pudieron cargar los reportes: ' + err.message);
    else setReports(data || []);
  }, [profile]);

  useEffect(() => {
    if (!session || !profile?.is_active) return;
    setReportsLoading(true);
    loadReports().finally(() => setReportsLoading(false));
    if (profile.role === 'admin') {
      supabase.from('profiles').select('id,full_name,role').in('role', ['admin', 'technician']).eq('is_active', true).order('full_name')
        .then(({ data }) => setStaff(data || []));
    }
  }, [session?.user?.id, profile?.id, profile?.is_active, profile?.role, loadReports]); // eslint-disable-line

  /* ---------- tiempo real ---------- */
  const addToast = useCallback((t) => {
    const id = crypto.randomUUID();
    setToasts((x) => [...x.slice(-3), { ...t, id }]);
    setTimeout(() => setToasts((x) => x.filter((i) => i.id !== id)), 8000);
  }, []);

  useEffect(() => {
    if (!supabase || !session || !profile?.is_active) return;
    let timer;
    const refresh = () => { clearTimeout(timer); timer = setTimeout(loadReports, 400); };
    const mine = () => Date.now() - lastLocalWrite.current < 4000;

    const channel = supabase.channel('dt-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reports' }, (p) => {
        refresh();
        if (!mine()) addToast({ title: `Nuevo reporte #${p.new.ticket_number ?? ''}`, body: p.new.title, reportId: p.new.id });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'reports' }, (p) => {
        refresh();
        if (!mine()) addToast({ title: `Reporte #${p.new.ticket_number ?? ''}: ${p.new.status}`, body: p.new.title, reportId: p.new.id });
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'report_updates' }, (p) => {
        refresh();
        if (!mine()) addToast({ title: 'Nueva novedad en un reporte', body: p.new.message, reportId: p.new.report_id });
      })
      .subscribe();

    // al volver a la app (cambio de pestaña / celular desbloqueado) se refresca
    const onVisible = () => { if (document.visibilityState === 'visible') loadReports(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearTimeout(timer); document.removeEventListener('visibilitychange', onVisible); supabase.removeChannel(channel); };
  }, [session?.user?.id, profile?.id, profile?.is_active, loadReports, addToast]);

  // Título con contador de reportes abiertos (útil para el personal)
  useEffect(() => {
    const n = isStaff ? reports.filter((r) => !['Solucionado', 'Cerrado'].includes(r.status)).length : 0;
    document.title = n ? `(${n}) DACATECH Reportes` : 'DACATECH Reportes';
  }, [reports, isStaff]);

  /* ---------- abrir un reporte desde una notificación ---------- */
  const openReport = useCallback((id) => { setView('reports'); setActive(id); }, []);

  useEffect(() => {
    if (pendingOpen.current && reports.some((r) => r.id === pendingOpen.current)) {
      openReport(pendingOpen.current);
      pendingOpen.current = null;
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [reports, openReport]);

  useEffect(() => {
    const h = (e) => {
      if (e.data?.type !== 'open-report') return;
      const id = new URL(e.data.url).searchParams.get('report');
      if (id) { pendingOpen.current = id; loadReports(); openReport(id); }
    };
    navigator.serviceWorker?.addEventListener('message', h);
    return () => navigator.serviceWorker?.removeEventListener('message', h);
  }, [loadReports, openReport]);

  /* ---------- acciones ---------- */
  async function uploadPhotos(reportId, selected, photoType) {
    const rows = [];
    for (const file of selected) {
      if (!file.type.startsWith('image/')) throw new Error('Solo se permiten imágenes.');
      if (file.size > 10 * 1024 * 1024) throw new Error(`${file.name} supera el máximo de 10 MB.`);
      const path = `${reportId}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const { error: upErr } = await supabase.storage.from('report-photos').upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;
      rows.push({ report_id: reportId, uploaded_by: session.user.id, storage_path: path, photo_type: photoType, caption: file.name });
    }
    if (rows.length) {
      const { error: dbErr } = await supabase.from('report_photos').insert(rows);
      if (dbErr) throw dbErr;
    }
  }

  async function createReport({ title, category, priority, location, description, files }) {
    setSaving(true); setModalError(''); lastLocalWrite.current = Date.now();
    try {
      if (!profile?.company_id) throw new Error('Tu usuario aún no está vinculado a una empresa. Pide al administrador que configure tu perfil.');
      const { data, error: insErr } = await supabase.from('reports')
        .insert({ company_id: profile.company_id, created_by: session.user.id, title, category, location, priority, description }).select().single();
      if (insErr) throw insErr;
      if (files.length) await uploadPhotos(data.id, files, 'customer');
      setShowCreate(false); setNotice('Reporte creado correctamente. El equipo de DACATECH ya fue notificado.');
      await loadReports(); setActive(data.id);
    } catch (err) { setModalError(err.message || 'No fue posible crear el reporte.'); }
    finally { setSaving(false); }
  }

  async function saveFollowup({ report, newStatus, assigned, message, resolution, evidence, customer }) {
    setSaving(true); setError(''); lastLocalWrite.current = Date.now();
    try {
      const author = profile.full_name || session.user.email;
      if (evidence?.length) await uploadPhotos(report.id, evidence, customer ? 'customer' : 'service');
      if (!customer) {
        const patch = { status: newStatus, updated_at: new Date().toISOString() };
        if (profile.role === 'admin' && (assigned || null) !== (report.assigned_to || null)) patch.assigned_to = assigned || null;
        if (['Solucionado', 'Cerrado'].includes(newStatus)) { patch.resolution_summary = resolution; if (newStatus === 'Cerrado') patch.closed_at = new Date().toISOString(); }
        const { error: upErr } = await supabase.from('reports').update(patch).eq('id', report.id);
        if (upErr) throw upErr;
      }
      if (message?.trim()) {
        const { error: msgErr } = await supabase.from('report_updates').insert({ report_id: report.id, author_id: session.user.id, author_name: author, message: message.trim() });
        if (msgErr) throw msgErr;
      }
      setNotice(customer ? 'Mensaje enviado.' : 'Seguimiento guardado.');
      await loadReports();
    } catch (err) { setError(err.message || 'No fue posible guardar los cambios.'); }
    finally { setSaving(false); }
  }

  async function deleteReport(report) {
    if (profile?.role !== 'admin') {
      setError('Solo un administrador puede eliminar reportes.');
      return;
    }
    const ticket = report.ticket_number ? `#${report.ticket_number}` : report.id;
    const confirmed = window.confirm(`¿Eliminar permanentemente el reporte ${ticket}: “${report.title}”?\\n\\nSe eliminarán también el historial y los registros de fotografías. Esta acción no se puede deshacer.`);
    if (!confirmed) return;

    setSaving(true);
    setError('');
    setNotice('');
    try {
      const { data: photos, error: photosError } = await supabase
        .from('report_photos').select('storage_path').eq('report_id', report.id);
      if (photosError) throw photosError;

      const { error: deleteError } = await supabase.rpc('dt_admin_delete_report', { p_report_id: report.id });
      if (deleteError) throw deleteError;

      let storageWarning = false;
      const paths = (photos || []).map(p => p.storage_path).filter(Boolean);
      if (paths.length) {
        const { error: storageError } = await supabase.storage.from('report-photos').remove(paths);
        if (storageError) {
          console.error('Reporte eliminado; algunas fotografías podrían seguir almacenadas:', storageError);
          storageWarning = true;
        }
      }
      setReports(items => items.filter(item => item.id !== report.id));
      setActive(null);
      setNotice(storageWarning
        ? 'Reporte eliminado. Algunas fotografías podrían requerir limpieza de almacenamiento.'
        : 'Reporte eliminado correctamente, junto con su historial y registros de fotografías.');
      await loadReports();
    } catch (err) {
      setError('No se pudo eliminar el reporte: ' + (err.message || 'Error inesperado.'));
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    await detachDevice();
    await supabase.auth.signOut();
    setSession(null); setProfile(null); setView('reports');
  }

  const adminMessage = useCallback((type, text) => { if (type === 'error') { setError(text); setNotice(''); } else { setNotice(text); setError(''); } }, []);
  const hideBanner = () => { setBannerHidden(true); try { sessionStorage.setItem(BANNER_KEY, '1'); } catch { /* sin almacenamiento */ } };

  /* ---------- pantallas ---------- */
  const shell = (children) => (
    <>
      <a className="skip-link" href="#contenido">Saltar al contenido</a>
      {children}
      <CookieNotice onOpenLegal={setLegal} />
      {legal && <Legal initial={legal} onClose={() => setLegal(null)} />}
    </>
  );

  if (loading) return shell(<div className="center-screen" role="status"><div className="spinner" /><p>Cargando DACATECH Reportes…</p></div>);

  if (recovery || !session) {
    return shell(<main id="contenido"><AuthScreen recovery={recovery} onRecoveryDone={() => { setRecovery(false); }} onOpenLegal={setLegal} /></main>);
  }

  if (!profile || !profile.is_active) {
    return shell(
      <main id="contenido" className="center-screen">
        <div className="empty-icon" aria-hidden="true"><Users /></div>
        <h1 className="h2">Tu acceso está pendiente</h1>
        <p>Tu usuario necesita un perfil activo y una empresa asignada por DACATECH. Te avisaremos cuando esté listo; puedes volver a entrar más tarde.</p>
        {error && <div className="error-msg" role="alert">{error}</div>}
        <button type="button" className="primary-btn" onClick={signOut}>Cerrar sesión <LogOut size={17} aria-hidden="true" /></button>
        <LegalLinks onOpen={setLegal} className="center" />
      </main>
    );
  }

  const navItems = [
    { id: 'reports', label: 'Reportes', icon: <ClipboardList size={18} aria-hidden="true" />, count: reports.length },
    ...(profile.role === 'admin' ? [{ id: 'admin', label: 'Empresas y usuarios', short: 'Admin', icon: <Users size={18} aria-hidden="true" /> }, { id: 'report-format', label: 'Formato de informes', short: 'Formato', icon: <ClipboardList size={18} aria-hidden="true" /> }] : []),
    { id: 'account', label: 'Mi cuenta', short: 'Cuenta', icon: <UserCircle size={18} aria-hidden="true" /> },
  ];

  const showPushBanner = view === 'reports' && !bannerHidden && push.configured && (push.needsIOSInstall || (push.supported && push.permission === 'default' && !push.subscribed));
  const titles = { reports: profile.role === 'customer' ? 'Mis reportes' : 'Panel de reportes', admin: 'Administración', 'report-format': 'Formato de informes', account: 'Mi cuenta' };

  return shell(
    <div className="app-shell">
      <aside className="sidebar">
        <div className="logo-row"><div className="small-mark" aria-hidden="true">D<span>+</span></div><div><b>DACATECH</b><small>REPORTES</small></div></div>
        <div className="workspace-label">ESPACIO DE TRABAJO</div>
        <div className="company-pill"><span className="online-dot" aria-hidden="true" />{profile.companies?.name || 'Empresa'}</div>
        <nav aria-label="Principal">
          {navItems.map((n) => (
            <button type="button" key={n.id} className={`nav-item ${view === n.id ? 'selected' : ''}`} aria-current={view === n.id ? 'page' : undefined} onClick={() => setView(n.id)}>
              {n.icon} {n.label} {n.count != null && <span className="nav-count">{n.count}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="user-mini"><div className="avatar" aria-hidden="true">{(profile.full_name || 'D').slice(0, 1).toUpperCase()}</div><div><b>{profile.full_name || session.user.email}</b><small>{roleLabel[profile.role]}</small></div></div>
          <button type="button" className="logout-btn" onClick={signOut}><LogOut size={17} aria-hidden="true" /> Cerrar sesión</button>
          <LegalLinks onOpen={setLegal} className="side" />
        </div>
      </aside>

      <main className="main-area" id="contenido" tabIndex={-1}>
        <header className="topbar">
          <div><div className="eyebrow">CENTRO DE SOPORTE</div><h1>{titles[view]}</h1></div>
          <div className="top-actions">
            <div className="secure-tag"><span className="online-dot" aria-hidden="true" /> Conexión cifrada</div>
            <button type="button" className="primary-btn compact" onClick={() => { setShowCreate(true); setModalError(''); }}><Plus size={18} aria-hidden="true" /> Nuevo reporte</button>
          </div>
        </header>

        <div className="messages" aria-live="polite">
          {error && <div className="error-msg page-message" role="alert"><span><AlertCircle size={16} aria-hidden="true" /> {error}</span><button type="button" onClick={() => setError('')} aria-label="Cerrar mensaje"><X size={16} aria-hidden="true" /></button></div>}
          {notice && <div className="success-msg page-message" role="status"><span>{notice}</span><button type="button" onClick={() => setNotice('')} aria-label="Cerrar mensaje"><X size={16} aria-hidden="true" /></button></div>}
        </div>

        {showPushBanner && <NotificationCard push={push} compact onDismiss={hideBanner} />}

        {view === 'reports' && (
          <ReportsView profile={profile} reports={reports} staff={staff} active={active} setActive={setActive}
            onNew={() => setShowCreate(true)} onSaveFollowup={saveFollowup} onDeleteReport={deleteReport} saving={saving} loading={reportsLoading} />
        )}
        {view === 'admin' && profile.role === 'admin' && <AdminPanel onMessage={adminMessage} />}
        {view === 'report-format' && profile.role === 'admin' && <ReportFormatSettings profile={profile} onMessage={adminMessage} />}
        {view === 'account' && <AccountView profile={profile} session={session} push={push} onSignOut={signOut} onOpenLegal={setLegal} />}
      </main>

      <nav className="bottom-nav" aria-label="Navegación móvil">
        {navItems.map((n) => (
          <button type="button" key={n.id} className={view === n.id ? 'on' : ''} aria-current={view === n.id ? 'page' : undefined} onClick={() => setView(n.id)}>
            {n.icon}<span>{n.short || n.label}</span>
          </button>
        ))}
      </nav>

      {showCreate && <CreateReportModal onClose={() => setShowCreate(false)} onSubmit={createReport} saving={saving} error={modalError} />}
      <Toasts items={toasts} onOpen={(t) => { openReport(t.reportId); setToasts((x) => x.filter((i) => i.id !== t.id)); }} onDismiss={(id) => setToasts((x) => x.filter((i) => i.id !== id))} />
    </div>
  );
}
