import React, { useState } from 'react';
import { Activity, AlertCircle, ArrowRight, Camera, ShieldCheck } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { EMPRESA } from '../config/empresa';
import { LegalLinks } from './Legal';

export default function AuthScreen({ recovery, onRecoveryDone, onOpenLegal }) {
  const [mode, setMode] = useState(recovery ? 'reset' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const go = (m) => { setMode(m); setError(''); setNotice(''); setPassword(''); };

  async function submit(e) {
    e.preventDefault(); setError(''); setNotice('');
    if (!supabase) { setError('Falta configurar el archivo .env con la URL y la clave pública de Supabase.'); return; }
    setBusy(true);
    try {
      if (mode === 'forgot') {
        const { error: err } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/?reset-password=1` });
        if (err) throw err;
        setNotice('Si el correo está registrado, te enviamos un enlace para restablecer la contraseña. Ábrelo en este mismo navegador.');
        return;
      }
      if (mode === 'reset') {
        if (password.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres.');
        const { error: err } = await supabase.auth.updateUser({ password });
        if (err) throw err;
        await supabase.auth.signOut();
        window.history.replaceState({}, document.title, window.location.pathname);
        onRecoveryDone();
        setMode('login'); setPassword('');
        setNotice('Contraseña actualizada correctamente. Ya puedes iniciar sesión.');
        return;
      }
      if (mode === 'signup') {
        if (!accepted) throw new Error('Debes aceptar la política de privacidad y los términos para crear tu cuenta.');
        const { data, error: err } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: fullName, accepted_terms_at: new Date().toISOString(), terms_version: EMPRESA.versionLegal } },
        });
        if (err) throw err;
        setNotice(data.session
          ? 'Cuenta creada. Un administrador de DACATECH debe vincularte a tu empresa antes de usar el portal.'
          : 'Cuenta creada. Revisa tu correo para confirmar el acceso; luego un administrador debe vincularte a tu empresa.');
        return;
      }
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) throw err;
    } catch (err) {
      setError(err.message === 'Invalid login credentials' ? 'Correo o contraseña incorrectos.' : err.message);
    } finally { setBusy(false); }
  }

  const titles = { login: 'Inicia sesión', signup: 'Crea tu cuenta', forgot: 'Restablecer contraseña', reset: 'Crear nueva contraseña' };
  const subs = {
    login: 'Ingresa para consultar y gestionar tus reportes de servicio.',
    signup: 'Registra tu acceso; el administrador debe vincularlo a tu empresa.',
    forgot: 'Te enviaremos un enlace para crear una contraseña nueva.',
    reset: 'Escribe una contraseña nueva para tu cuenta. Debe tener al menos 8 caracteres.',
  };

  return (
    <div className="auth-layout">
      <div className="auth-glow" aria-hidden="true" />
      <section className="brand-panel">
        <div className="brand-mark" aria-hidden="true">D<span>+</span></div>
        <div className="eyebrow">PORTAL DE SERVICIO</div>
        <h1>DACATECH<br /><span>REPORTES</span></h1>
        <p>Atención técnica, seguimiento y evidencias en un solo lugar.</p>
        <ul className="auth-features">
          <li><ShieldCheck size={17} aria-hidden="true" /> Acceso por empresa</li>
          <li><Camera size={17} aria-hidden="true" /> Evidencias fotográficas</li>
          <li><Activity size={17} aria-hidden="true" /> Seguimiento de novedades en tiempo real</li>
        </ul>
      </section>

      <section className="auth-card" aria-labelledby="auth-title">
        <div className="mobile-brand">DACATECH <span>REPORTES</span></div>
        <div className="eyebrow">{mode === 'reset' ? 'SEGURIDAD DE LA CUENTA' : 'BIENVENIDO'}</div>
        <h2 id="auth-title">{titles[mode]}</h2>
        <p className="muted">{subs[mode]}</p>
        {!isSupabaseConfigured && <div className="warning"><AlertCircle size={18} aria-hidden="true" /> Configura primero el archivo <code>.env</code> usando <code>.env.example</code>.</div>}
        {error && <div className="error-msg" role="alert">{error}</div>}
        {notice && <div className="success-msg" role="status">{notice}</div>}

        <form onSubmit={submit} className="form-stack">
          {mode === 'signup' && (
            <label>Nombre completo<input value={fullName} onChange={(e) => setFullName(e.target.value)} required autoComplete="name" placeholder="Tu nombre" /></label>
          )}
          {mode !== 'reset' && (
            <label>Correo electrónico<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="nombre@empresa.com" autoComplete="email" /></label>
          )}
          {mode !== 'forgot' && (
            <label>{mode === 'reset' ? 'Nueva contraseña' : 'Contraseña'}
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} placeholder="Mínimo 8 caracteres"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
            </label>
          )}
          {mode === 'signup' && (
            <label className="check-row">
              <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
              <span>He leído y acepto la <button type="button" className="link-btn" onClick={() => onOpenLegal('privacidad')}>política de privacidad</button> y los <button type="button" className="link-btn" onClick={() => onOpenLegal('terminos')}>términos de uso</button>, y autorizo el tratamiento de mis datos personales.</span>
            </label>
          )}
          <button className="primary-btn" disabled={!isSupabaseConfigured || busy}>
            {busy ? 'Un momento…' : { login: 'Iniciar sesión', signup: 'Crear cuenta', forgot: 'Enviar enlace de recuperación', reset: 'Guardar nueva contraseña' }[mode]} <ArrowRight size={18} aria-hidden="true" />
          </button>
        </form>

        {mode === 'login' && <button type="button" className="text-btn" onClick={() => go('forgot')}>¿Olvidaste tu contraseña?</button>}
        {mode !== 'reset' && (
          <button type="button" className="text-btn" onClick={() => go(mode === 'login' ? 'signup' : 'login')}>
            {mode === 'login' ? '¿No tienes cuenta? Crear cuenta' : mode === 'signup' ? '¿Ya tienes cuenta? Iniciar sesión' : 'Volver a iniciar sesión'}
          </button>
        )}
        {mode === 'reset' && <button type="button" className="text-btn" onClick={() => { window.history.replaceState({}, document.title, window.location.pathname); onRecoveryDone(); }}>Volver a iniciar sesión</button>}
        <div className="auth-footer">Sistema de reportes y soporte técnico <b>DACATECH</b></div>
        <LegalLinks onOpen={onOpenLegal} className="center" />
      </section>
    </div>
  );
}
