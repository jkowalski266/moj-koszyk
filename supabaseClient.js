import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

function poprawnyAdresSupabase(wartosc) {
  if (!wartosc || wartosc.includes('your-project')) {
    return false;
  }

  try {
    const adres = new URL(wartosc);
    return (
      adres.protocol === 'https:' &&
      adres.username === '' &&
      adres.password === '' &&
      adres.port === '' &&
      adres.hostname.endsWith('.supabase.co')
    );
  } catch {
    return false;
  }
}

function poprawnyKluczPubliczny(wartosc) {
  return Boolean(
    wartosc &&
      !wartosc.includes('your-publishable-key') &&
      /^sb_publishable_[A-Za-z0-9_-]{20,}$/.test(wartosc),
  );
}

export const supabaseConfigured = Boolean(
  poprawnyAdresSupabase(supabaseUrl) &&
    poprawnyKluczPubliczny(supabasePublishableKey),
);

export const supabase = supabaseConfigured
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })
  : null;
