import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_KEY as string | undefined;
if (!url || !key) {
  throw new Error('Configure VITE_SUPABASE_URL e VITE_SUPABASE_KEY no arquivo .env');
}

// Links de convite / recuperação de senha chegam com "#access_token=...&type=invite".
// Lemos isso ANTES de criar o cliente, que limpa o endereço depois de processar o link.
const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
export const emailLink = {
  type: params.get('type'),
  erro: params.get('error_description'),
};

export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});
