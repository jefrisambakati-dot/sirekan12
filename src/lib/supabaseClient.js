import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '❌ Supabase credentials missing!\n' +
    'VITE_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ NOT SET', '\n' +
    'VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ NOT SET', '\n' +
    'Make sure these are set in Vercel Environment Variables AND redeploy.'
  );
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient('https://placeholder.supabase.co', 'placeholder-key');

export const isConfigured = !!(supabaseUrl && supabaseAnonKey);
