import { createClient } from '@supabase/supabase-js';

const env = (import.meta as any).env || {};
const url = env.VITE_SUPABASE_URL || 'https://nmquazbtonhnpilitwrz.supabase.co';
const key = env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

// Si falta la clave, el sitio público funciona con el contenido de respaldo
// y el panel muestra cómo configurarla.
export const supabase: any = key ? createClient(url, key) : null;
export const MEDIA_BUCKET = 'media';
