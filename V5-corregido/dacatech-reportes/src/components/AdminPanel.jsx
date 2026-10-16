import React, { useCallback, useEffect, useState } from 'react';
import { Building2, CheckCircle2, Plus, Save, Users, UserCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { fmtDate } from '../lib/constants';

function UserRow({ u, companies, onSave }) {
  const [role, setRole] = useState(u.role || 'customer');
  const [company, setCompany] = useState(u.company_id ?? '');
  const [active, setActive] = useState(Boolean(u.is_active));
  const [fullName, setFullName] = useState(u.full_name || '');
  const [busy, setBusy] = useState(false);
  const pending = !u.profile_exists || !u.is_active || !u.company_id;
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
      {u.profile_exists && <label className="check-row inline"><input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} /><span>Activo</span></label>}
      <button type="button" className="primary-btn compact" disabled={busy || (u.profile_exists ? !dirty : !company)}
        onClick={submit}>
        {u.profile_exists ? <Save size={16} aria-hidden="true" /> : <UserCheck size={16} aria-hidden="true" />}
        {busy ? 'Guardando…' : u.profile_exists ? 'Guardar cambios' : 'Aprobar usuario'}
      </button>
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
      onMessage('error', 'Selecciona una empresa antes de aprobar al usuario.');
      return;
    }

    const current = users.find(u => u.id === id);
    let error = null;
    let savedProfile = null;

    // El RPC devuelve el perfil confirmado y evita el falso éxito de UPDATE
    // cuando RLS no permite modificar ninguna fila.
    if (patch.role === 'customer' || patch.role === 'technician') {
      const result = await supabase.rpc('dt_admin_approve_user', {
        p_user_id: id,
        p_company_id: patch.company_id,
        p_role: patch.role,
        p_full_name: patch.full_name || null
      });
      error = result.error;
      savedProfile = result.data;
      if (!error && (!savedProfile || savedProfile.is_active !== true ||
          savedProfile.company_id !== patch.company_id || savedProfile.id !== id)) {
        error = new Error('Supabase no confirmó la activación del usuario. Recarga y verifica el estado antes de continuar.');
      }
    } else if (current?.profile_exists && current.role === 'admin') {
      const result = await supabase.from('profiles')
        .update({ role: 'admin', company_id: patch.company_id, is_active: patch.is_active, full_name: patch.full_name })
        .eq('id', id)
        .select('id,role,company_id,is_active')
        .maybeSingle();
      error = result.error;
      if (!error && !result.data) error = new Error('No se modificó el perfil. Comprueba tus permisos y vuelve a intentarlo.');
      savedProfile = result.data;
    } else {
      error = new Error('No se puede asignar ese rol a este usuario.');
    }

    if (error) {
      onMessage('error', 'No se pudo guardar la aprobación: ' + (error.message || String(error)));
      return;
    }

    await load();
    onMessage('ok', savedProfile?.is_active
      ? 'Aprobación confirmada: usuario activo y empresa asignada.'
      : 'Cambios guardados y verificados.');
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
          {users.map(u => <UserRow key={u.id} u={u} companies={companies} onSave={saveUser} />)}
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
