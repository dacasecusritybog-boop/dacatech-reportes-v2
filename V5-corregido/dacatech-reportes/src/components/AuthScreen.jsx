import React, { useState } from 'react';
import { Activity, AlertCircle, ArrowRight, Camera, ShieldCheck, Eye, EyeOff, UserRound, LockKeyhole, LogIn } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { EMPRESA } from '../config/empresa';
import { LegalLinks } from './Legal';

export default function AuthScreen({ recovery, onRecoveryDone, onOpenLegal }) {
  const [mode, setMode] = useState(recovery ? 'reset' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

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
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) throw err;
    } catch (err) {
      setError(err.message === 'Invalid login credentials' ? 'Correo o contraseña incorrectos.' : err.message);
    } finally { setBusy(false); }
  }

  const titles = { login: 'Inicia sesión', forgot: 'Restablecer contraseña', reset: 'Crear nueva contraseña' };
  const subs = {
    login: 'Ingresa para consultar y gestionar tus reportes de servicio.',
    forgot: 'Te enviaremos un enlace para crear una contraseña nueva.',
    reset: 'Escribe una contraseña nueva para tu cuenta. Debe tener al menos 8 caracteres.',
  };

  return (
    <div className="auth-layout">
      <div className="auth-glow" aria-hidden="true" /><div className="auth-tech-backdrop" aria-hidden="true"><div className="auth-camera camera-one" /><div className="auth-camera camera-two" /><div className="auth-brand-title"><strong>DACA<span>TECH</span></strong><i /><small>SOLUCIONES EN SEGURIDAD<br />Y TECNOLOGÍA</small></div></div>
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
        
        <div className="eyebrow">{mode === 'reset' ? 'SEGURIDAD DE LA CUENTA' : 'CENTRO DE SOPORTE'}</div>
        <h2 id="auth-title">{mode === 'login' ? 'Iniciar sesión' : titles[mode]}</h2>
        <p className="muted">{mode === 'login' ? 'Ingresa a tu cuenta para continuar' : subs[mode]}</p>
        {!isSupabaseConfigured && <div className="warning"><AlertCircle size={18} aria-hidden="true" /> Configura primero el archivo <code>.env</code> usando <code>.env.example</code>.</div>}
        {error && <div className="error-msg" role="alert">{error}</div>}
        {notice && <div className="success-msg" role="status">{notice}</div>}

        <form onSubmit={submit} className="form-stack">
          {mode !== 'reset' && (
            <label className="auth-field"><span>Correo electrónico</span><span className="auth-field-control"><UserRound size={21} aria-hidden="true" /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Correo electrónico o usuario" autoComplete="email" /></span></label>
          )}
          {mode !== 'forgot' && (
            <label className="auth-field"><span>{mode === 'reset' ? 'Nueva contraseña' : 'Contraseña'}</span><span className="auth-field-control"><LockKeyhole size={21} aria-hidden="true" /><input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} placeholder={mode === "login" ? "Contraseña" : "Mínimo 8 caracteres"} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />{mode !== "forgot" && <button type="button" className="auth-eye" aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} onClick={() => setShowPassword(v => !v)}>{showPassword ? <EyeOff size={21} /> : <Eye size={21} />}</button>}</span></label>
          )}
          {mode === "login" && <div className="auth-options"><label className="remember-option"><input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} /><span>Recordarme</span></label><button type="button" className="auth-forgot" onClick={() => go("forgot")}>¿Olvidaste tu contraseña?</button></div>}
          <button className="primary-btn auth-submit" disabled={!isSupabaseConfigured || busy}><LogIn size={21} aria-hidden="true" /> {busy ? 'Un momento…' : { login: 'Iniciar sesión', forgot: 'Enviar enlace de recuperación', reset: 'Guardar nueva contraseña' }[mode]}</button>
        </form>

        {mode === 'forgot' && <button type="button" className="text-btn" onClick={() => go('login')}>Volver a iniciar sesión</button>}
        {mode === 'reset' && <button type="button" className="text-btn" onClick={() => { window.history.replaceState({}, document.title, window.location.pathname); onRecoveryDone(); }}>Volver a iniciar sesión</button>}
        <div className="auth-footer">Sistema de reportes y soporte técnico <b>DACATECH</b></div>
        <LegalLinks onOpen={onOpenLegal} className="center" />
      </section>
    </div>
  );
}
