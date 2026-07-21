import { NextRequest, NextResponse } from "next/server";

/*
 * Basic Auth apenas nas rotas do painel (/admin). A vitrine fica pública.
 *
 * Credenciais vêm de ADMIN_AUTH ("usuario:senha"), definida nas envs da Vercel.
 * Fail-closed: se a env não estiver configurada, o admin é BLOQUEADO — nunca
 * exposto por engano. A vitrine nunca passa por aqui (ver `matcher`).
 */
export function middleware(req: NextRequest) {
  const expected = process.env.ADMIN_AUTH; // formato "usuario:senha"

  const header = req.headers.get("authorization") || "";
  if (expected && header.startsWith("Basic ")) {
    const decoded = atob(header.slice(6));
    if (decoded === expected) return NextResponse.next();
  }

  return new NextResponse("Autenticação necessária.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Admin Triomax"' },
  });
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
