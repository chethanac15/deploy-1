import { createClient } from '@supabase/supabase-js';

// Standard static Vite client environment access
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  '';

export const isSupabaseUrlConfigured = Boolean(
  supabaseUrl &&
  supabaseUrl !== 'https://your-project-id.supabase.co' &&
  supabaseUrl.trim() !== ''
);

export const isSupabaseKeyConfigured = Boolean(
  supabaseKey &&
  supabaseKey !== 'your-anon-key-here' &&
  supabaseKey.trim() !== ''
);

export const isSupabaseConfigured = Boolean(
  isSupabaseUrlConfigured && isSupabaseKeyConfigured
);

export const getSupabaseConfigStatus = (): string => {
  if (!isSupabaseUrlConfigured && !isSupabaseKeyConfigured) {
    return 'URL and KEY missing';
  }
  if (!isSupabaseUrlConfigured) {
    return 'URL missing';
  }
  if (!isSupabaseKeyConfigured) {
    return 'KEY missing';
  }
  return 'configured';
};

// Safe diagnostic logging (boolean flags only - NO credentials, keys, or tokens leaked)
if (!isSupabaseConfigured) {
  console.info(
    '%c[Apni Estate Interiors]%c Supabase configuration diagnostic:',
    'color: #2554e0; font-weight: bold;',
    'color: #64748b;',
    {
      'Supabase URL configured': isSupabaseUrlConfigured,
      'Supabase public key configured': isSupabaseKeyConfigured
    }
  );
}

// Create Supabase client (with placeholder fallback to prevent runtime crashes when unconfigured)
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
