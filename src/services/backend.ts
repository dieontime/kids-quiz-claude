import { mockBackend } from './mockBackend.ts';
import { supabaseBackend } from './supabaseBackend.ts';

const HAS_SUPABASE_CONFIG = Boolean(
  import.meta.env.VITE_SUPABASE_URL &&
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);

export const backend = HAS_SUPABASE_CONFIG ? supabaseBackend : mockBackend;
export const backendKind: 'supabase' | 'mock' = HAS_SUPABASE_CONFIG ? 'supabase' : 'mock';
