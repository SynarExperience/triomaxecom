import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/*
 * Cliente de autenticação no servidor: lê (e, quando pode, renova) a sessão do
 * cliente da loja a partir dos cookies da requisição.
 *
 * Ele serve para saber QUEM está logado, e só. Os dados da conta — pedidos,
 * endereços, favoritos — continuam sendo lidos pela service role em
 * `@/lib/supabase-admin`, sempre filtrados pelo usuário que esta função
 * devolveu. Assim a regra de "quem vê o quê" mora em código, num lugar só, em
 * vez de espalhada em policies.
 *
 * Usa a chave anônima de propósito: a sessão do visitante não pode ser validada
 * por uma chave que ignora RLS.
 */
export async function criarClienteDeSessao() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            /* Server Component não escreve cookie — só Server Action e Route
               Handler. Quem renova a sessão nesse caso é o middleware, então
               aqui dá para ignorar em vez de estourar a página inteira. */
          }
        },
      },
    },
  );
}
