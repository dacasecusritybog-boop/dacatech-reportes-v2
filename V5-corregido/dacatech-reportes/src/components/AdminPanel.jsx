import React, { useCallback, useEffect, useState } from 'react';
import { Building2, Plus, Save, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { fmtDate } from '../lib/constants';

function UserRow({ u, companies, onSave }) {
  const [role, setRole] = useState(u.role || 'customer');
  const [company, setCompany] = useState(u.company_id ?? '');
  const [active, setActive] = useState(Boolean(u.is_active));
  const [busy, setBusy] = useState(false);
  const dirty = role !== (u.role || 'customer') || String(company) !== String(u.company_id ?? '') || active !== Boolean(u.is_active);
  const pending = !u.is_active || !u.company_id;

  return (
    <div className={`user-row ${pending ? 'pending' : ''}`}>
      <div className="user-id">
        <div className="avatar" aria-hidden="true">{(u.full_name || u.email || 'D').slice(0, 1).toUpperCase()}</div>
        <div>
          <b>{u.full_name || 'Sin nombre'}</b>
          <small>{u.email}</small>
          <small>Registrado {fmtDate(u.created_at)}</small>
          {pending && <span className="status-badge en-revisión">Pendiente de activar</span>}
        </div>
      </div>
      <label>Rol
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="customer">Cliente</option><option value="technician">Técnico</option><option value="admin">Administrador</option>
        </select>
      </label>
      <label>Empresa
        <select value={company} onChange={(e) => setCompany(e.target.value)}>
          <option value="">— Sin empresa —</option>
          {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>
      <label className="check-row inline"><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /><span>Activo</span></label>
      <button type="button" className="primary-btn compact" disabled={!dirty || busy}
        onClick={async () => { setBusy(true); await onSave(u.id, { role, company_id: company === '' ? null : company, is_active: active }); setBusy(false); }}>
        <Save size={16} aria-hidden="true" /> Guardar
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
    const [u, c] = await Promise.all([supabase.rpc('dt_admin_users'), supabase.from('companies').select('*').order('name')]);
    if (u.error) onMessage('error', 'No se pudieron cargar los usuarios: ' + u.error.message + ' (¿ejecutaste el SQL 01_mejoras_v0.3?)');
    else setUsers(u.data || []);
    if (c.error) onMessage('error', 'No se pudieron cargar las empresas: ' + c.error.message);
    else setCompanies(c.data || []);
    setLoading(false);
  }, [onMessage]);

  useEffect(() => { load(); }, [load]);

  async function saveUser(id, patch) {
    const { error } = await supabase.from('profiles').update(patch).eq('id', id);
    if (error) onMessage('error', 'No se pudo guardar: ' + error.message);
    else { onMessage('ok', 'Usuario actualizado.'); await load(); }
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

  const pendingCount = users.filter((u) => !u.is_active || !u.company_id).length;

  return (
    <section className="content-card" aria-labelledby="adm-title">
      <div className="section-head">
        <div><h2 id="adm-title">Empresas y usuarios</h2><p className="muted">Crea empresas, vincula a cada cliente y define quién es técnico o administrador.</p></div>
      </div>
      <div className="filter-row" role="tablist" aria-label="Administración">
        <button type="button" role="tab" aria-selected={tab === 'users'} className={`chip ${tab === 'users' ? 'on' : ''}`} onClick={() => setTab('users')}><Users size={15} aria-hidden="true" /> Usuarios{pendingCount > 0 && ` (${pendingCount} pendientes)`}</button>
        <button type="button" role="tab" aria-selected={tab === 'companies'} className={`chip ${tab === 'companies' ? 'on' : ''}`} onClick={() => setTab('companies')}><Building2 size={15} aria-hidden="true" /> Empresas ({companies.length})</button>
      </div>

      {loading ? <div className="empty-state"><div className="spinner" /></div> : tab === 'users' ? (
        <div className="user-list">
          {users.length === 0 && <div className="empty-state"><p>No hay usuarios registrados todavía.</p></div>}
          {users.map((u) => <UserRow key={u.id + String(u.role) + String(u.company_id) + String(u.is_active)} u={u} companies={companies} onSave={saveUser} />)}
        </div>
      ) : (
        <div className="company-panel">
          <form className="inline-form" onSubmit={addCompany}>
            <label>Nueva empresa<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre de la empresa cliente" required maxLength={120} /></label>
            <button className="primary-btn compact" disabled={busy}><Plus size={16} aria-hidden="true" /> Agregar</button>
          </form>
          <ul className="company-list">
            {companies.map((c) => <li key={c.id}><Building2 size={17} aria-hidden="true" /> <b>{c.name}</b> <small>{users.filter((u) => String(u.company_id) === String(c.id)).length} usuario(s)</small></li>)}
          </ul>
        </div>
      )}
    </section>
  );
}
