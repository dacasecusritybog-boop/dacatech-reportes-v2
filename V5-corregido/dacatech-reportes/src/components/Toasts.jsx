import React from 'react';
import { BellRing, X } from 'lucide-react';

export default function Toasts({ items, onOpen, onDismiss }) {
  return (
    <div className="toast-stack" role="status" aria-live="polite" aria-atomic="false">
      {items.map((t) => (
        <div className="toast" key={t.id}>
          <BellRing aria-hidden="true" size={18} />
          <button type="button" className="toast-main" onClick={() => onOpen(t)}>
            <b>{t.title}</b>
            {t.body && <span>{t.body}</span>}
          </button>
          <button type="button" className="toast-x" onClick={() => onDismiss(t.id)} aria-label="Descartar aviso"><X size={15} aria-hidden="true" /></button>
        </div>
      ))}
    </div>
  );
}
