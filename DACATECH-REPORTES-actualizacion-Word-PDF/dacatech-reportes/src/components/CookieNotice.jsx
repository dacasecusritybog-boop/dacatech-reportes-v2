import React, { useEffect, useState } from 'react';
import { Cookie } from 'lucide-react';

const KEY = 'dt_aviso_almacenamiento_v1';
const seen = () => { try { return localStorage.getItem(KEY) === '1'; } catch { return false; } };

export default function CookieNotice({ onOpenLegal }) {
  const [hidden, setHidden] = useState(seen());
  useEffect(() => {
    document.body.classList.toggle('has-cookie', !hidden);
    return () => document.body.classList.remove('has-cookie');
  }, [hidden]);
  if (hidden) return null;
  const accept = () => { try { localStorage.setItem(KEY, '1'); } catch { /* sin almacenamiento */ } setHidden(true); };
  return (
    <aside className="cookie-notice" role="region" aria-label="Aviso de cookies y almacenamiento">
      <Cookie aria-hidden="true" size={22} />
      <p>
        Usamos únicamente almacenamiento <b>esencial</b> para mantener tu sesión y recordar tus preferencias. No usamos cookies
        de publicidad ni de seguimiento. <button type="button" className="link-btn" onClick={() => onOpenLegal('cookies')}>Más información</button>
      </p>
      <button type="button" className="primary-btn compact" onClick={accept}>Entendido</button>
    </aside>
  );
}
