import { createClient } from "@supabase/supabase-js";

/*
 * Cliente público da vitrine. Usa a chave anônima, que só enxerga o que as
 * policies de RLS liberam — na prática, catálogo e estoque. Clientes e pedidos
 * são invisíveis por aqui, então é seguro rodar no browser.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY precisam estar definidas.",
  );
}

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: false },
});
