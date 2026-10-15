import React from 'react';
import { LogOut } from 'lucide-react';
import NotificationCard from './NotificationCard';
import { LegalLinks } from './Legal';
import { roleLabel } from '../lib/constants';
import { EMPRESA } from '../config/empresa';

export default function AccountView({ profile, session, push, onSignOut, onOpenLegal }) {
  return (
    <>
      <section className="content-card" aria-labelledby="acc-title">
        <div className="section-head"><div><h2 id="acc-title">Mi cuenta</h2><p className="muted">Datos de acceso y preferencias de este dispositivo.</p></div></div>
        <div className="detail-grid">
          <div><span className="detail-label">Nombre</span><b>{profile.full_name || '—'}</b></div>
          <div><span className="detail-label">Correo</span><b>{session.user.email}</b></div>
          <div><span className="detail-label">Rol</span><b>{roleLabel[profile.role] || profile.role}</b></div>
          <div><span className="detail-label">Empresa</span><b>{profile.companies?.name || '—'}</b></div>
        </div>
      </section>

      <section className="content-card" aria-labelledby="not-title">
        <div className="section-head"><div><h2 id="not-title">Notificaciones</h2><p className="muted">Avisos al celular o computador aunque la app esté cerrada.</p></div></div>
        <div className="pad"><NotificationCard push={push} /></div>
      </section>

      <section className="content-card" aria-labelledby="leg-title">
        <div className="section-head"><div><h2 id="leg-title">Legal y privacidad</h2><p className="muted">Consulta cómo cuidamos tus datos y las condiciones de uso.</p></div></div>
        <div className="pad">
          <LegalLinks onOpen={onOpenLegal} />
          <p className="muted small">Versión legal {EMPRESA.versionLegal}. Para ejercer tus derechos sobre tus datos personales escríbenos desde la sección Privacidad.</p>
        </div>
      </section>

      <div className="pad">
        <button type="button" className="secondary-btn" onClick={onSignOut}><LogOut size={17} aria-hidden="true" /> Cerrar sesión</button>
      </div>
    </>
  );
}
