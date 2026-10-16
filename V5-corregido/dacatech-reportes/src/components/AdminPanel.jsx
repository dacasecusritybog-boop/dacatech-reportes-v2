import React, { useCallback, useEffect, useState } from 'react';
import { Building2, CheckCircle2, Plus, Save, Users, UserCheck, UserX } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { fmtDate } from '../lib/constants';

function UserRow({ u, companies, onSave, onDeactivate }) {
  const [role, setRole] = useState(u.role || 'customer');
  const [company, setCompany] = useState(u.company_id ?? '');
  const [active, setActive] = useState(u.profile_exists ? Boolean(u.is_active) : true);
  const [fullName, setFullName] = useState(u.full_name || '');
  const [busy, setBusy] = useState(false);
  const pending = !u.profile_exists || !u.company_id;
  const dirty = role !== (u.role || 'customer') || String(company) !== String(u.company_id ?? '') ||
    active !== Boolean(u.is_active) || fullName !== (u.full_name || '');

  async function submit() {
    setBusy(true);
    try {
      await onSave(u.id, { role, company_id: company || null, is_active: active, full_name: fullName });
    } finally { setBusy(false); }
  }

  return (
    <div className={`user-row ${pending ? 'pending' : ''}`}>
      <div className="user-id">
        <div className="avatar" aria-hidden="true">{(fullName || u.email || 'D').slice(0, 1).toUpperCase()}</div>
        <div>
          <b>{fullName || 'Sin nombre'}</b>
          <small>{u.email}</small>
          <small>Registrado {fmtDate(u.created_at)}</small>
          {u.email_confirmed_at && <small>Correo confirmado</small>}
          {pending && <span className="status-badge en-revisión">Pendiente de aprobación</span>}
        </div>
      </div>
      <label>Nombre<input value={fullName} onChange={e => setFullName(e.target.value)} maxLength={120} placeholder="Nombre del usuario" /></label>
      <label>Rol
        <select value={role} onChange={e => setRole(e.target.value)}>
          <option value="customer">Cliente</option><option value="technician">Técnico</option>
          {u.profile_exists && u.role === 'admin' && <option value="admin">Administrador</option>}
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
        {u.role === 'customer' && (
          <button type="button" className="secondary-btn compact" disabled={busy}
            onClick={() => onDeactivate({ ...u, company_id: company || u.company_id, full_name: fullName })}>
            <UserX size={16} aria-hidden="true" /> {u.is_active ? 'Dar de baja' : 'Activar cliente'}
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
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [u, c] = await Promise.all([supabase.rpc('dt_admin_users'), supabase.from('companies').select('*').order('name')]);
    if (u.error) onMessage('error', 'No se pudieron cargar las solicitudes: ' + u.error.message);
    else setUsers(Array.isArray(u.data) ? u.data : []);
    if (c.error) onMessage('error', 'No se pudieron cargar las empresas: ' + c.error.message);
    else setCompanies(c.data || []);
    setLoading(false);
  }, [onMessage]);

  useEffect(() => { load(); }, [load]);

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
        p_full_name: patch.full_name || null
      });

      if (result.error) throw result.error;

      const saved = result.data;
      if (!saved || saved.id !== id || saved.is_active !== Boolean(patch.is_active) ||
          saved.company_id !== patch.company_id || saved.role !== patch.role) {
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
    if (user.role !== 'customer' || !user.company_id) { onMessage('error', 'Selecciona una empresa antes de dar de baja al cliente.'); return; }
    const nextActive = !user.is_active;
    const confirmed = window.confirm(nextActive
      ? `¿Activar a ${user.full_name || user.email}? Podrá volver a ingresar a DACATECH Reportes.`
      : `¿Dar de baja a ${user.full_name || user.email}?\n\nSe bloqueará su acceso a DACATECH Reportes. Sus reportes e historial se conservarán.`);
    if (!confirmed) return;
    try {
      const result = await supabase.rpc('dt_admin_save_user', {
        p_user_id: user.id,
        p_company_id: user.company_id,
        p_role: 'customer',
        p_is_active: nextActive,
        p_full_name: user.full_name || null
      });
      if (result.error) throw result.error;
      if (!result.data || result.data.id !== user.id || result.data.is_active !== nextActive) {
        throw new Error('Supabase no confirmó el cambio de estado del cliente.');
      }
      await load();
      onMessage('ok', nextActive
        ? 'Cliente activado correctamente.'
        : 'Cliente dado de baja. Sus reportes e historial se conservaron.');
    } catch (error) {
      onMessage('error', 'No se pudo cambiar el estado del cliente: ' + (error?.message || 'Error inesperado.'));
      await load();
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

  const pendingCount = users.filter(u => !u.profile_exists || !u.is_active || !u.company_id).length;
  const pendingUsers = users.filter(u => !u.profile_exists || !u.is_active || !u.company_id);

  return (
    <section className="content-card" aria-labelledby="adm-title">
      <div className="section-head">
        <div><h2 id="adm-title">Empresas y usuarios</h2><p className="muted">Aprueba usuarios que confirmaron su correo, asígnales una empresa y define su rol desde aquí, sin entrar a Supabase.</p></div>
      </div>
      <div className="filter-row" role="tablist" aria-label="Administración">
        <button type="button" role="tab" aria-selected={tab === 'users'} className={`chip ${tab === 'users' ? 'on' : ''}`} onClick={() => setTab('users')}><Users size={15} aria-hidden="true" /> Usuarios{pendingCount > 0 && ` (${pendingCount} pendientes)`}</button>
        <button type="button" role="tab" aria-selected={tab === 'companies'} className={`chip ${tab === 'companies' ? 'on' : ''}`} onClick={() => setTab('companies')}><Building2 size={15} aria-hidden="true" /> Empresas ({companies.length})</button>
      </div>
      {loading ? <div className="empty-state"><div className="spinner" /></div> : tab === 'users' ? (
        <div className="user-list">
          {pendingUsers.length > 0 && <h3>Solicitudes pendientes ({pendingUsers.length})</h3>}
          {users.length === 0 && <div className="empty-state"><p>No hay usuarios registrados todavía.</p></div>}
          {users.map(u => <UserRow key={u.id} u={u} companies={companies} onSave={saveUser} onDeactivate={deactivateCustomer} />)}
        </div>
      ) : (
        <div className="company-panel">
          <form className="inline-form" onSubmit={addCompany}>
            <label>Nueva empresa<input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre de la empresa cliente" required maxLength={120} /></label>
            <button className="primary-btn compact" disabled={busy}><Plus size={16} aria-hidden="true" /> Agregar</button>
          </form>
          <ul className="company-list">
            {companies.map(c => <li key={c.id}><Building2 size={17} aria-hidden="true" /> <b>{c.name}</b> <small>{users.filter(u => String(u.company_id) === String(c.id)).length} usuario(s)</small></li>)}
          </ul>
        </div>
      )}
    </section>
  );
}
