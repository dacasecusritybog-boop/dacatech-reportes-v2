import { createClient } from '@supabase/supabase-js';

// Netlify injects VITE_* variables at build time. Accept a Project URL only;
// remove accidental REST endpoint suffixes pasted from Supabase API examples.
const rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const url = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
const key = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '').trim();

export const isSupabaseConfigured = Boolean(
  /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url) && key &&
  !key.includes('TU_CLAVE') && !key.includes('YOUR_')
);

export const supabase = isSupabaseConfigured ? createClient(url, key) : null;
