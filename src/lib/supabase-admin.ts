import "server-only";
import { createClient } from "@supabase/supabase-js";

/*
 * Cliente com a service role, usado só para gravar o pedido no checkout e
 * atualizar o pagamento pelo webhook. Ele ignora as policies de RLS — por isso
 * o `server-only` no topo: se algum componente client importar este módulo por
 * engano, o build quebra em vez de vazar a chave para o navegador.
 *
 * A leitura pública do catálogo continua no cliente anônimo (`supabase.ts`).
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY precisam estar definidas.",
  );
}

export const supabaseAdmin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
