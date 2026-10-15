import React from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/dm-sans';
import '@fontsource-variable/space-grotesk';
import App from './App.jsx';
import './styles.css';
import './extra.css';

// Guarda el evento de instalación (Android/Chrome) antes de que React cargue.
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); window.__dtInstallPrompt = e; });

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch((e) => console.warn('SW', e)));
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
