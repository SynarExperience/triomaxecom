import { NextResponse } from "next/server";
import { criarClienteDeSessao } from "@/lib/supabase-sessao";

export const runtime = "nodejs";

/*
 * Volta do e-mail de recuperação de senha. O link traz um `code` de uso único;
 * trocá-lo por sessão precisa acontecer num Route Handler, que é onde dá para
 * gravar cookie.
 *
 * Sem código válido a pessoa vai para o login em vez de para o formulário de
 * nova senha — que, sem sessão, só mostraria "o link expirou".
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  /* Só caminho interno: `proximo` vem da URL e um `//site.com` viraria
     redirecionamento aberto para fora da loja. */
  const bruto = url.searchParams.get("proximo") ?? "/conta";
  const proximo = bruto.startsWith("/") && !bruto.startsWith("//") ? bruto : "/conta";

  /* Atrás do proxy da Vercel, `request.url` traz o host interno; o cabeçalho é
     que sabe o endereço que o cliente digitou. */
  const host = request.headers.get("x-forwarded-host") ?? url.host;
  const protocolo = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  const base = `${protocolo}://${host}`;

  if (!code) return NextResponse.redirect(`${base}/entrar`);

  const supabase = await criarClienteDeSessao();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth] link de recuperação inválido:", error.message);
    return NextResponse.redirect(`${base}/recuperar-senha?expirado=1`);
  }

  return NextResponse.redirect(`${base}${proximo}`);
}
