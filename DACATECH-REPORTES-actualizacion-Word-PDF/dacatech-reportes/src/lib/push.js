import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';

const VAPID = import.meta.env.VITE_VAPID_PUBLIC_KEY;

export const pushSupported = () =>
  typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

export const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
export const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

function b64ToUint8(b64) {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

async function currentSubscription() {
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

async function register(sub) {
  const j = sub.toJSON();
  const { error } = await supabase.rpc('dt_register_push', {
    p_endpoint: j.endpoint,
    p_p256dh: j.keys.p256dh,
    p_auth: j.keys.auth,
    p_ua: navigator.userAgent,
  });
  if (error) throw error;
}

/** Al cerrar sesión: este dispositivo deja de recibir avisos de la cuenta que salió. */
export async function detachDevice() {
  try {
    if (!pushSupported() || !supabase) return;
    const sub = await currentSubscription();
    if (sub) await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
  } catch (_) { /* no bloquea el cierre de sesión */ }
}

export function usePush(userId) {
  const supported = pushSupported();
  const configured = Boolean(VAPID);
  const [permission, setPermission] = useState(supported ? Notification.permission : 'unsupported');
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [installEvt, setInstallEvt] = useState(window.__dtInstallPrompt || null);

  useEffect(() => {
    const h = (e) => { e.preventDefault(); window.__dtInstallPrompt = e; setInstallEvt(e); };
    window.addEventListener('beforeinstallprompt', h);
    return () => window.removeEventListener('beforeinstallprompt', h);
  }, []);

  // Si el dispositivo ya estaba suscrito, lo vincula a la cuenta actual (útil si cambia de usuario).
  useEffect(() => {
    if (!supported || !configured || !userId || Notification.permission !== 'granted') return;
    (async () => {
      try {
        const sub = await currentSubscription();
        if (sub) { await register(sub); setSubscribed(true); } else setSubscribed(false);
      } catch (e) { console.warn('push sync', e); }
    })();
  }, [supported, configured, userId]);

  const enable = useCallback(async () => {
    setBusy(true); setError('');
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') throw new Error('El permiso fue rechazado. Puedes activarlo en los ajustes del navegador o del teléfono.');
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToUint8(VAPID) });
      await register(sub);
      setSubscribed(true);
    } catch (e) { setError(e.message || 'No se pudieron activar las notificaciones.'); }
    finally { setBusy(false); }
  }, []);

  const disable = useCallback(async () => {
    setBusy(true); setError('');
    try {
      const sub = await currentSubscription();
      if (sub) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } catch (e) { setError(e.message || 'No se pudieron desactivar.'); }
    finally { setBusy(false); }
  }, []);

  const install = useCallback(async () => {
    if (!installEvt) return;
    installEvt.prompt();
    await installEvt.userChoice;
    window.__dtInstallPrompt = null; setInstallEvt(null);
  }, [installEvt]);

  return {
    supported, configured, permission, subscribed, busy, error,
    needsIOSInstall: isIOS() && !isStandalone(),
    canInstall: Boolean(installEvt) && !isStandalone(),
    enable, disable, install,
  };
}
