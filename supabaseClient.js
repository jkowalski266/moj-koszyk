import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

const usesPlaceholder =
  supabaseUrl?.includes('your-project') ||
  supabasePublishableKey?.includes('your-publishable-key');

export const supabaseConfigured = Boolean(
  supabaseUrl && supabasePublishableKey && !usesPlaceholder,
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
