import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/*
 * Sessão do cliente da loja.
 *
 * Duas funções: renovar o token de acesso (que vale 1 hora) em qualquer página,
 * para o cabeçalho não voltar a dizer "Entrar" no meio da navegação de quem
 * está logado; e barrar as rotas que exigem conta.
 *
 * A renovação precisa acontecer aqui porque Server Component não escreve
 * cookie. Sem middleware, a sessão expiraria e não se renovaria sozinha.
 */

/** Rotas que só existem para quem tem conta. Prefixo basta: `/conta/pedidos`
    entra por `/conta`. */
const PROTEGIDAS = ["/conta", "/checkout"];

function paraLogin(req: NextRequest) {
  const url = req.nextUrl.clone();
  url.pathname = "/entrar";
  /* Leva o destino junto para devolver a pessoa exatamente onde ela estava —
     principalmente no checkout, onde perder a página é perder a venda. */
  url.search = `?destino=${encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search)}`;
  return NextResponse.redirect(url);
}

export async function middleware(req: NextRequest) {
  const protegida = PROTEGIDAS.some(
    (rota) => req.nextUrl.pathname === rota || req.nextUrl.pathname.startsWith(`${rota}/`),
  );

  /* Visitante sem cookie de sessão não tem o que renovar, e a maioria absoluta
     das visitas é essa. Sair antes evita uma chamada ao Supabase em cada página
     da loja — o que seria latência paga por todo mundo para servir a poucos. */
  const temSessao = req.cookies.getAll().some((cookie) => cookie.name.startsWith("sb-"));
  if (!temSessao) return protegida ? paraLogin(req) : NextResponse.next();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return protegida ? paraLogin(req) : NextResponse.next();

  let resposta = NextResponse.next({ request: req });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
        resposta = NextResponse.next({ request: req });
        cookiesToSet.forEach(({ name, value, options }) =>
          resposta.cookies.set(name, value, options),
        );
      },
    },
  });

  /* getUser() valida o token no servidor do Supabase e, de quebra, renova a
     sessão gravando os cookies novos pelo setAll acima. getSession() apenas lê
     o cookie e aceitaria um forjado — não serve como guarda. */
  let usuario = null;
  try {
    const { data } = await supabase.auth.getUser();
    usuario = data.user;
  } catch {
    usuario = null;
  }

  if (!usuario && protegida) return paraLogin(req);

  return resposta;
}

export const config = {
  /* Roda em tudo que é página, menos internos do Next e arquivos estáticos —
     renovar sessão no request de uma imagem é gasto sem retorno. */
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|mp4|webm|ico|txt|xml|woff|woff2)$).*)",
  ],
};
