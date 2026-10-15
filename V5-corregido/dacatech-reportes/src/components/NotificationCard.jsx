import React from 'react';
import { Bell, BellOff, Download, Share, Smartphone } from 'lucide-react';

/** Activa/desactiva avisos push en este dispositivo y ayuda a instalar la app. */
export default function NotificationCard({ push, compact, onDismiss }) {
  const { supported, configured, permission, subscribed, busy, error, needsIOSInstall, canInstall, enable, disable, install } = push;

  if (!configured) {
    return compact ? null : <div className="notify-card"><p className="muted">Las notificaciones aún no están configuradas (falta <code>VITE_VAPID_PUBLIC_KEY</code>).</p></div>;
  }

  if (needsIOSInstall) {
    return (
      <div className="notify-card" role="region" aria-label="Instalar la app en iPhone">
        <div className="notify-icon"><Smartphone aria-hidden="true" /></div>
        <div className="notify-text">
          <b>Instala la app para recibir avisos en tu iPhone</b>
          <p>Toca <Share size={14} aria-label="Compartir" style={{ verticalAlign: '-2px' }} /> <b>Compartir</b> y luego <b>«Añadir a pantalla de inicio»</b>. Abre DACATECH desde ese ícono y activa las notificaciones.</p>
        </div>
        {onDismiss && <button type="button" className="secondary-btn compact" onClick={onDismiss}>Luego</button>}
      </div>
    );
  }

  if (!supported) {
    return compact ? null : <div className="notify-card"><p className="muted">Este navegador no admite notificaciones push. Prueba con Chrome, Edge, Firefox o Safari actualizado.</p></div>;
  }

  if (permission === 'denied') {
    return compact ? null : <div className="notify-card"><div className="notify-icon off"><BellOff aria-hidden="true" /></div><div className="notify-text"><b>Notificaciones bloqueadas</b><p>Permítelas desde los ajustes del navegador o del teléfono para este sitio y vuelve a intentarlo.</p></div></div>;
  }

  if (subscribed) {
    if (compact) return null;
    return (
      <div className="notify-card ok">
        <div className="notify-icon"><Bell aria-hidden="true" /></div>
        <div className="notify-text"><b>Notificaciones activas en este dispositivo</b><p>Recibirás un aviso cuando haya novedades en tus reportes.</p></div>
        <button type="button" className="secondary-btn compact" onClick={disable} disabled={busy}>Desactivar</button>
      </div>
    );
  }

  return (
    <div className="notify-card" role="region" aria-label="Activar notificaciones">
      <div className="notify-icon"><Bell aria-hidden="true" /></div>
      <div className="notify-text">
        <b>Activa las notificaciones</b>
        <p>Entérate al instante en tu celular cuando llegue un reporte o cambie su estado.</p>
        {error && <p className="notify-error" role="alert">{error}</p>}
      </div>
      <div className="notify-actions">
        <button type="button" className="primary-btn compact" onClick={enable} disabled={busy}>{busy ? 'Activando…' : 'Activar'}</button>
        {canInstall && <button type="button" className="secondary-btn compact" onClick={install}><Download size={16} aria-hidden="true" /> Instalar app</button>}
        {onDismiss && <button type="button" className="text-btn inline" onClick={onDismiss}>Ahora no</button>}
      </div>
    </div>
  );
}
