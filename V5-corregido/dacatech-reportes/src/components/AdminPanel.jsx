import React, { useCallback, useEffect, useState } from 'react';
import { Building2, CheckCircle2, Plus, Save, Users, UserCheck, UserX, UserPlus, PauseCircle, PlayCircle, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { fmtDate } from '../lib/constants';

const JOB_TITLE_SUGGESTIONS = [
  "Administrador de empresa",
  "Gerente",
  "Director",
  "Coordinador",
  "Supervisor",
  "Jefe de área",
  "Asistente administrativo",
  "Auxiliar administrativo",
  "Recepcionista",
  "Recursos humanos",
  "Contabilidad",
  "Finanzas",
  "Compras",
  "Atención al cliente",
  "Comercial / ventas",
  "Marketing y comunicaciones",
  "Organizador de eventos",
  "Coordinador de eventos",
  "Logística",
  "Almacén e inventario",
  "Mensajería",
  "Conductor",
  "Aseo y limpieza",
  "Servicios generales",
  "Mantenimiento",
  "Electricista",
  "Soldador",
  "Plomero",
  "Obras civiles",
  "Pintor",
  "Carpintero",
  "Técnico de redes",
  "Soporte técnico",
  "Sistemas / TI",
  "CCTV y cámaras",
  "Control de acceso",
  "Detección de incendios",
  "Técnico de alarmas",
  "Sonido",
  "Sonido e iluminación",
  "Operador audiovisual",
  "Operario",
  "Auxiliar operativo",
  "Calidad",
  "Seguridad y salud en el trabajo",
  "Vigilancia",
  "Gestión documental",
  "Docente / instructor",
  "Profesional de salud",
  "Enfermería",
  "Cocina",
  "Servicios de alimentación",
  "Otro cargo",
  "Analista de datos",
  "Auditor",
  "Abogado",
  "Asesor jurídico",
  "Arquitecto",
  "Ingeniero civil",
  "Ingeniero eléctrico",
  "Ingeniero electrónico",
  "Ingeniero industrial",
  "Ingeniero de sistemas",
  "Ingeniero de sonido",
  "Productor audiovisual",
  "Fotógrafo",
  "Diseñador gráfico",
  "Diseñador UX/UI",
  "Desarrollador de software",
  "Administrador de redes",
  "Ciberseguridad",
  "Analista de soporte",
  "Técnico de impresoras",
  "Técnico de telecomunicaciones",
  "Instalador de fibra óptica",
  "Técnico electricista",
  "Técnico electrónico",
  "Técnico de refrigeración",
  "Técnico de ascensores",
  "Mecánico",
  "Mecánico automotriz",
  "Conductor de maquinaria",
  "Operador de maquinaria",
  "Topógrafo",
  "Maestro de obra",
  "Oficial de construcción",
  "Ayudante de obra",
  "Inspector de obra",
  "Residente de obra",
  "Interventor",
  "Diseñador de interiores",
  "Jardinero",
  "Agricultor",
  "Veterinario",
  "Odontólogo",
  "Médico",
  "Psicólogo",
  "Fisioterapeuta",
  "Farmacéutico",
  "Auxiliar de enfermería",
  "Laboratorista",
  "Nutricionista",
  "Entrenador deportivo",
  "Instructor de gimnasio",
  "Bibliotecario",
  "Investigador",
  "Traductor",
  "Intérprete",
  "Periodista",
  "Community manager",
  "Ejecutivo de cuenta",
  "Representante comercial",
  "Agente de ventas",
  "Cajero",
  "Tesorero",
  "Auxiliar contable",
  "Revisor fiscal",
  "Analista de nómina",
  "Gestor de proyectos",
  "Project manager",
  "Scrum master",
  "Analista de procesos",
  "Gestor de calidad",
  "Gestor ambiental",
  "Brigadista",
  "Coordinador HSEQ",
  "Inspector SST",
  "Portero",
  "Controlador de acceso",
  "Operador de monitoreo",
  "Despachador",
  "Coordinador de transporte",
  "Auxiliar de bodega",
  "Empacador",
  "Operario de producción",
  "Operador de planta",
  "Técnico de laboratorio",
  "Chef",
  "Mesero",
  "Barista",
  "Panadero",
  "Pastelero",
  "Hotelero",
  "Agente de viajes",
  "Guía turístico",
  "Organizador de bodas",
  "DJ",
  "Músico",
  "Técnico de luces",
  "Operador de cámara",
  "Editor de video",
  "Animador",
  "Asistente personal",
  "Cuidador",
  "Trabajador social",
  "Auxiliar de farmacia",
  "Optómetra",
  "Terapeuta ocupacional",
  "Docente universitario",
  "Orientador escolar",
  "Entrenador",
  "Emprendedor",
  "Propietario",
  "Consultor",
  "Freelancer",
  "Practicante",
  "Aprendiz",
  "Voluntario"
];

function UserRow({ u, companies, onSave, onDeactivate }) {
  const [role, setRole] = useState(u.role || 'customer');
  const [company, setCompany] = useState(u.company_id ?? '');
  const [active, setActive] = useState(u.profile_exists ? Boolean(u.is_active) : true);
  const [fullName, setFullName] = useState(u.full_name || '');
  const [jobTitle, setJobTitle] = useState(u.job_title || '');
  const [busy, setBusy] = useState(false);
  const pending = Boolean(u.is_active) && (!u.profile_exists || !u.company_id);
  const dirty = role !== (u.role || 'customer') || String(company) !== String(u.company_id ?? '') ||
    active !== Boolean(u.is_active) || fullName !== (u.full_name || '') || jobTitle !== (u.job_title || '');

  async function submit() {
    setBusy(true);
    try {
      await onSave(u.id, { role, company_id: company || null, is_active: active, full_name: fullName, job_title: jobTitle });
    } finally { setBusy(false); }
  }

  return (
    <div className={`user-row ${pending ? 'pending' : ''}`}>
      <div className="user-id">
        <div className="avatar" aria-hidden="true">{(fullName || u.email || 'D').slice(0, 1).toUpperCase()}</div>
        <div>
          <b>{fullName || 'Sin nombre'}</b>
          {jobTitle && <small>Cargo: {jobTitle}</small>}
          <small>{u.email}</small>
          <small>Registrado {fmtDate(u.created_at)}</small>
          {u.email_confirmed_at && <small>Correo confirmado</small>}
          {pending && <span className="status-badge en-revisión">Pendiente de aprobación</span>}
        </div>
      </div>
      <label>Nombre<input value={fullName} onChange={e => setFullName(e.target.value)} maxLength={120} placeholder="Nombre del usuario" /></label>
      <label>Cargo / área de trabajo<input value={jobTitle} onChange={e => setJobTitle(e.target.value)} maxLength={120} list="job-title-suggestions" placeholder="Escribe cualquier cargo…" /><select aria-label="Elegir cargo sugerido" defaultValue="" onChange={e => { if (e.target.value) setJobTitle(e.target.value); e.target.value = ""; }}><option value="">Ver catálogo de cargos…</option>{JOB_TITLE_SUGGESTIONS.map(v => <option key={v} value={v}>{v}</option>)}</select></label>
      <label>Rol de acceso
        <select value={role} onChange={e => setRole(e.target.value)}>
          <option value="customer">Cliente / solicitante</option><option value="technician">Responsable operativo</option>
          <option value="supervisor">Supervisor / coordinador</option><option value="admin">Administrador de empresa</option>
        </select>
      </label>
      <label>Empresa
        <select value={company} onChange={e => setCompany(e.target.value)}>
          <option value="">— Seleccionar empresa —</option>
          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>
      <label className="check-row inline"><input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} /><span>Activo</span></label>
      <div className="user-actions">
        <button type="button" className="primary-btn compact" disabled={busy || !company || (u.profile_exists && !dirty)}
          onClick={submit}>
          {u.profile_exists ? <Save size={16} aria-hidden="true" /> : <UserCheck size={16} aria-hidden="true" />}
          {busy ? 'Guardando…' : u.profile_exists ? 'Guardar cambios' : 'Aprobar usuario'}
        </button>
        {u.is_active && (
          <button type="button" className="secondary-btn compact" disabled={busy}
            onClick={() => onDeactivate({ ...u, company_id: company || u.company_id, full_name: fullName })}>
            <UserX size={16} aria-hidden="true" /> Dar de baja
          </button>
        )}
      </div>
    </div>
  );
}

export default function AdminPanel({ onMessage }) {
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [name, setName] = useState('');
  const [newUser, setNewUser] = useState({ full_name: '', email: '', password: '', company_id: '', role: 'customer', job_title: '' });
  const [createBusy, setCreateBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [companyBusy, setCompanyBusy] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const [u, c] = await Promise.all([supabase.rpc('dt_admin_users'), supabase.from('companies').select('*').order('name')]);
    if (u.error) onMessage('error', 'No se pudieron cargar las solicitudes: ' + u.error.message);
    else setUsers(Array.isArray(u.data) ? u.data : []);
    if (c.error) onMessage('error', 'No se pudieron cargar las empresas: ' + c.error.message);
    else setCompanies(c.data || []);
    setLoading(false);
  }, [onMessage]);

  useEffect(() => {
    load();
    // Supabase Auth no emite cambios de auth.users por Realtime; refrescar solicitudes automáticamente.
    const refreshPendingUsers = () => {
      if (document.visibilityState === 'visible') void load();
    };
    const intervalId = window.setInterval(refreshPendingUsers, 10000);
    document.addEventListener('visibilitychange', refreshPendingUsers);
    window.addEventListener('focus', refreshPendingUsers);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', refreshPendingUsers);
      window.removeEventListener('focus', refreshPendingUsers);
    };
  }, [load]);

  async function saveUser(id, patch) {
    if (!patch.company_id) {
      onMessage('error', 'Selecciona una empresa antes de guardar.');
      return;
    }

    try {
      const result = await supabase.rpc('dt_admin_save_user', {
        p_user_id: id,
        p_company_id: patch.company_id,
        p_role: patch.role,
        p_is_active: patch.is_active,
        p_full_name: patch.full_name || null,
        p_job_title: patch.job_title || ''
      });

      if (result.error) throw result.error;

      const saved = result.data;
      if (!saved || saved.id !== id || saved.is_active !== Boolean(patch.is_active) ||
          saved.company_id !== patch.company_id || saved.role !== patch.role || (saved.job_title || '') !== (patch.job_title || '')) {
        throw new Error('Supabase no confirmó todos los cambios. Recarga la lista y verifica el usuario.');
      }

      await load();
      onMessage('ok', saved.is_active
        ? 'Usuario activado y cambios confirmados en la base de datos.'
        : 'Cambios guardados y estado inactivo confirmado.');
    } catch (error) {
      onMessage('error', 'No se pudo guardar el usuario: ' + (error?.message || 'Error inesperado.'));
      await load();
    }
  }

  async function deactivateCustomer(user) {
    if (!user.company_id) { onMessage('error', 'Selecciona una empresa antes de cambiar el estado del usuario.'); return; }
    const nextActive = !user.is_active;
    const confirmed = window.confirm(nextActive
      ? `¿Activar a ${user.full_name || user.email}? Podrá volver a ingresar a DACATECH Reportes.`
      : `¿Dar de baja a ${user.full_name || user.email}?\n\nSe bloqueará su acceso a DACATECH Reportes. Sus reportes e historial se conservarán.`);
    if (!confirmed) return;
    try {
      const result = await supabase.rpc('dt_admin_save_user', {
        p_user_id: user.id,
        p_company_id: user.company_id,
        p_role: user.role || 'customer',
        p_is_active: nextActive,
        p_full_name: user.full_name || null,
        p_job_title: user.job_title || ''
      });
      if (result.error) throw result.error;
      if (!result.data || result.data.id !== user.id || result.data.is_active !== nextActive) {
        throw new Error('Supabase no confirmó el cambio de estado del cliente.');
      }
      await load();
      onMessage('ok', nextActive
        ? 'Usuario activado correctamente.'
        : 'Usuario dado de baja. Sus reportes e historial se conservaron.');
    } catch (error) {
      onMessage('error', 'No se pudo cambiar el estado del cliente: ' + (error?.message || 'Error inesperado.'));
      await load();
    }
  }

  async function createAccount(e) {
    e.preventDefault();
    if (!newUser.full_name.trim() || !newUser.email.trim() || newUser.password.length < 8 || !newUser.company_id) {
      onMessage('error', 'Completa nombre, correo, contraseña (mínimo 8 caracteres) y empresa.'); return;
    }
    setCreateBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: {
          full_name: newUser.full_name.trim(),
          email: newUser.email.trim(),
          password: newUser.password,
          company_id: newUser.company_id,
          role: newUser.role,
          job_title: newUser.job_title.trim()
        }
      });
      if (error) {
        let detail = error.message || 'Error inesperado.';
        try {
          const response = error.context;
          if (response && typeof response.json === 'function') {
            const payload = await response.json();
            if (payload?.error) detail = payload.error;
          }
        } catch { /* conservar el mensaje disponible */ }
        throw new Error(detail);
      }
      if (data?.error || !data?.user?.id || data?.user?.company_id !== newUser.company_id || data?.user?.role !== newUser.role) {
        throw new Error(data?.error || 'El servidor no confirmó la cuenta con la empresa y el rol seleccionados.');
      }
      setNewUser({ full_name: '', email: '', password: '', company_id: '', role: 'customer', job_title: '' });
      await load();
      onMessage('ok', 'Cuenta creada, vinculada a su empresa y configurada con el rol seleccionado.');
    } catch (error) {
      const detail = error?.message || 'Error inesperado.';
      const duplicateEmail = /already been registered|already registered|user already exists|email.*already/i.test(detail);
      onMessage('error', duplicateEmail
        ? 'Ese correo ya tiene una cuenta en DACATECH. No crees otra: ve a Usuarios, busca el correo y asígnale la empresa y el rol correctos. Si no aparece en la lista, revisa la cuenta existente antes de volver a intentarlo.'
        : 'No se pudo crear la cuenta: ' + detail);
    }
    finally { setCreateBusy(false); }
  }


  async function toggleCompanyStatus(company) {
    const nextActive = company.is_active === false;
    const confirmed = window.confirm(nextActive
      ? `¿Reactivar la empresa ${company.name}? Revisa también su suscripción en Plataforma.`
      : `¿Suspender la empresa ${company.name}? Sus reportes, archivos y usuarios se conservarán. No se eliminarán datos.`);
    if (!confirmed) return;
    setCompanyBusy(company.id);
    try {
      const { data, error } = await supabase.functions.invoke('platform-admin', {
        body: { action: 'set_company_status', company_id: company.id, is_active: nextActive }
      });
      if (error || data?.error) throw new Error(data?.error || error?.message || 'Error inesperado.');
      await load();
      onMessage('ok', nextActive
        ? 'Empresa reactivada. Verifica la suscripción antes de restablecer el servicio.'
        : 'Empresa suspendida; los datos se conservaron.');
    } catch (error) {
      onMessage('error', 'No se pudo cambiar el estado de la empresa: ' + (error?.message || 'Error inesperado.'));
    } finally {
      setCompanyBusy('');
    }
  }

  async function addCompany(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    const { error } = await supabase.from('companies').insert({ name: name.trim() });
    setBusy(false);
    if (error) onMessage('error', 'No se pudo crear la empresa: ' + error.message);
    else { setName(''); onMessage('ok', 'Empresa creada.'); await load(); }
  }

  // Los clientes dados de baja desaparecen de la lista de gestión; sus perfiles e historial se conservan.
  const visibleUsers = users.filter(u => !(u.role === 'customer' && u.is_active === false));
  const pendingCount = visibleUsers.filter(u => Boolean(u.is_active) && (!u.profile_exists || !u.company_id)).length;
  const pendingUsers = visibleUsers.filter(u => Boolean(u.is_active) && (!u.profile_exists || !u.company_id));

  return (
    <section className="content-card" aria-labelledby="adm-title">
<datalist id="job-title-suggestions">{JOB_TITLE_SUGGESTIONS.map(v => <option key={v} value={v} />)}</datalist>
      <div className="section-head">
        <div><h2 id="adm-title">Empresas y usuarios</h2><p className="muted">Gestiona los usuarios de tu empresa, asigna sus cargos libremente y define sus permisos. El administrador maestro DACATECH conserva el control global de la plataforma.</p></div>
      </div>
      <div className="company-panel" style={{ marginBottom: 20 }}>
        <h3><UserPlus size={18} aria-hidden="true" /> Crear cuenta desde DACATECH</h3>
        <p className="muted">Registra usuarios de tu empresa, escribe el cargo laboral que necesites y asigna el nivel de acceso correspondiente.</p>
        <form className="inline-form" onSubmit={createAccount}>
          <label>Nombre completo<input value={newUser.full_name} onChange={e => setNewUser(v => ({ ...v, full_name: e.target.value }))} required maxLength={120} autoComplete="name" /></label>
          <label>Correo electrónico<input type="email" value={newUser.email} onChange={e => setNewUser(v => ({ ...v, email: e.target.value }))} required autoComplete="email" /></label>
          <label>Contraseña inicial<input type="password" value={newUser.password} onChange={e => setNewUser(v => ({ ...v, password: e.target.value }))} required minLength={8} autoComplete="new-password" /></label>
          <label>Empresa<select value={newUser.company_id} onChange={e => setNewUser(v => ({ ...v, company_id: e.target.value }))} required><option value="">Seleccionar empresa</option>{companies.map(company => <option key={company.id} value={company.id}>{company.name}</option>)}</select></label>
          <label>Cargo / área de trabajo<input value={newUser.job_title} onChange={e => setNewUser(v => ({ ...v, job_title: e.target.value }))} maxLength={120} list="job-title-suggestions" placeholder="Escribe cualquier cargo…" /><select aria-label="Elegir cargo sugerido" defaultValue="" onChange={e => { if (e.target.value) setNewUser(v => ({ ...v, job_title: e.target.value })); e.target.value = ""; }}><option value="">Ver catálogo de cargos…</option>{JOB_TITLE_SUGGESTIONS.map(v => <option key={v} value={v}>{v}</option>)}</select></label>
          <label>Rol de acceso<select value={newUser.role} onChange={e => setNewUser(v => ({ ...v, role: e.target.value }))} required><option value="customer">Cliente / solicitante</option><option value="technician">Responsable operativo</option><option value="supervisor">Supervisor / coordinador</option><option value="admin">Administrador de empresa</option></select></label>
          <button className="primary-btn compact" disabled={createBusy || !companies.length}><UserPlus size={16} aria-hidden="true" /> {createBusy ? 'Creando cuenta…' : 'Crear cuenta'}</button>
        </form>
      </div>
      <div className="filter-row" role="tablist" aria-label="Administración">
        <button type="button" role="tab" aria-selected={tab === 'users'} className={`chip ${tab === 'users' ? 'on' : ''}`} onClick={() => setTab('users')}><Users size={15} aria-hidden="true" /> Usuarios{pendingCount > 0 && ` (${pendingCount} pendientes)`}</button>
        <button type="button" role="tab" aria-selected={tab === 'companies'} className={`chip ${tab === 'companies' ? 'on' : ''}`} onClick={() => setTab('companies')}><Building2 size={15} aria-hidden="true" /> Empresas ({companies.length})</button>
      </div>
      {loading ? <div className="empty-state"><div className="spinner" /></div> : tab === 'users' ? (
        <div className="user-list">
          {pendingUsers.length > 0 && <h3>Solicitudes pendientes ({pendingUsers.length})</h3>}
          {visibleUsers.length === 0 && <div className="empty-state"><p>No hay usuarios activos para mostrar.</p></div>}
          {visibleUsers.map(u => <UserRow key={u.id} u={u} companies={companies} onSave={saveUser} onDeactivate={deactivateCustomer} />)}
        </div>
      ) : (
        <div className="company-panel">
          <form className="inline-form" onSubmit={addCompany}>
            <label>Nueva empresa<input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre de la empresa cliente" required maxLength={120} /></label>
            <button className="primary-btn compact" disabled={busy}><Plus size={16} aria-hidden="true" /> Agregar</button>
          </form>
          <ul className="company-list">
            {companies.map(c => <li key={c.id} style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
              <Building2 size={17} aria-hidden="true" />
              <b>{c.name}</b>
              <small>{users.filter(u => String(u.company_id) === String(c.id)).length} usuario(s)</small>
              <small className={c.is_active === false ? 'status-badge en-revisión' : 'status-badge'}>{c.is_active === false ? 'Suspendida' : 'Activa'}</small>
              <button type="button" className="secondary-btn compact" disabled={companyBusy===c.id} onClick={()=>toggleCompanyStatus(c)}>
                {c.is_active === false ? <><PlayCircle size={15}/> Reactivar</> : <><PauseCircle size={15}/> Suspender</>}
              </button>
            </li>)}
          </ul>
          <p className="muted"><ShieldCheck size={14} style={{verticalAlign:'middle'}}/> Solo el operador maestro puede usar estas acciones. Suspender no elimina reportes ni usuarios.</p>
        </div>
      )}
    </section>
  );
}
