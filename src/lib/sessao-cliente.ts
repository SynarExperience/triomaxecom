/**
 * Estado de login no navegador, compartilhado entre as peças do cabeçalho.
 *
 * O cache é de módulo, e não de componente, porque o menu do desktop e a gaveta
 * do celular perguntam a mesma coisa: sem ele, abrir os dois na mesma visita
 * renderia duas consultas para a mesma resposta.
 *
 * Guarda a PROMESSA, não o resultado: se dois componentes montarem no mesmo
 * tick, o segundo pega a chamada em andamento em vez de disparar outra.
 */

export type SessaoConta = { logado: boolean; nome?: string };

let pendente: Promise<SessaoConta> | null = null;

export function carregarSessao(): Promise<SessaoConta> {
  if (!pendente) {
    pendente = fetch("/api/conta/sessao")
      .then((resposta) => (resposta.ok ? resposta.json() : { logado: false }))
      /* Falha de rede vira "deslogado": o menu ainda oferece entrar, que é o
         caminho certo mesmo para quem já tem sessão. Melhor que um erro. */
      .catch(() => ({ logado: false }) as SessaoConta);
  }
  return pendente;
}

/** Esquece o que sabia — usado ao sair, para o menu não seguir dizendo "Olá,
    Maria" enquanto a navegação acontece. */
export function esquecerSessao() {
  pendente = null;
}
