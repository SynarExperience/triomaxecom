import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase-admin";

/*
 * Caminho de volta do sincronismo: o que a vitrine vendeu (ou estornou) desce
 * também no gerenciador de estoque, que é a fonte da verdade.
 *
 * Sem isto o sincronismo seria só de ida, e a primeira mudança que viesse de lá
 * apagaria a venda do site — o saldo voltaria a subir e o produto seria vendido
 * de novo sem existir.
 *
 * O que é empurrado são as linhas de `movimentos_estoque` ainda sem
 * `integrado_em` (migração 0016). Isso dá idempotência de graça: o webhook do
 * Mercado Pago repete avisos, e o movimento já levado não vai de novo.
 */

const url = process.env.GERENCIADOR_SUPABASE_URL;
const chave = process.env.GERENCIADOR_SERVICE_ROLE_KEY;

/* Diferente de `supabase-admin`, este módulo NÃO derruba o processo quando não
   está configurado. Ele é chamado de dentro do checkout, e um pedido pago não
   pode falhar porque a integração de estoque não foi configurada — o pior caso
   aceitável é o saldo de lá ficar para acerto manual. */
const gerenciador = url && chave ? createClient(url, chave, { auth: { persistSession: false } }) : null;

/** `TMX-0092` -> 92. Nulo se o código não estiver no formato esperado. */
function idDoGerenciador(codigo: string): number | null {
  const achado = /^TMX-?(\d+)$/i.exec(codigo.trim());
  if (!achado) return null;
  return Number(achado[1]);
}

type MovimentoPendente = { movimento_id: string; codigo: string; delta: number };

/**
 * Leva ao gerenciador os movimentos de estoque que este pedido gerou.
 *
 * Nunca lança: é chamada depois de o pagamento já ter acontecido, e derrubar o
 * checkout por causa do sistema vizinho seria trocar um problema pequeno
 * (estoque desencontrado, com o movimento pendente registrado) por um grande
 * (cliente pagou e não recebeu confirmação).
 */
export async function empurrarMovimentosDoPedido(pedidoId: string): Promise<void> {
  if (!gerenciador) {
    console.warn("[integracao] GERENCIADOR_SUPABASE_URL/KEY ausentes; estoque do gerenciador não foi atualizado.");
    return;
  }

  try {
    const { data, error } = await supabaseAdmin.rpc("movimentos_a_integrar", { p_pedido: pedidoId });
    if (error) {
      console.error(`[integracao] falha ao listar movimentos do pedido ${pedidoId}:`, error.message);
      return;
    }

    for (const movimento of (data ?? []) as MovimentoPendente[]) {
      const id = idDoGerenciador(movimento.codigo);
      if (id === null) {
        console.error(`[integracao] código fora do formato TMX-0000: "${movimento.codigo}"`);
        continue;
      }

      const { data: novoSaldo, error: erroDelta } = await gerenciador.rpc("aplicar_delta_estoque", {
        p_id: id,
        p_delta: movimento.delta,
      });

      if (erroDelta) {
        console.error(`[integracao] falha ao aplicar delta em ${movimento.codigo}:`, erroDelta.message);
        continue; // segue pendente: uma nova tentativa pega de onde parou
      }

      /* Nulo = o id não existe mais no gerenciador. Marcar como integrado seria
         mentir, mas deixar pendente faria a vitrine tentar para sempre — o log
         é o que resta, e o vínculo precisa de conserto no painel. */
      if (novoSaldo === null) {
        console.error(`[integracao] ${movimento.codigo} não existe no gerenciador; vínculo precisa de revisão.`);
        continue;
      }

      const { error: erroMarca } = await supabaseAdmin
        .from("movimentos_estoque")
        .update({ integrado_em: new Date().toISOString() })
        .eq("id", movimento.movimento_id);

      /* Se a marcação falhar, o delta já foi aplicado lá. Repetir depois
         descontaria duas vezes, então isto precisa aparecer no log como erro
         de verdade, e não como aviso. */
      if (erroMarca) {
        console.error(
          `[integracao] delta de ${movimento.codigo} aplicado, mas o movimento ${movimento.movimento_id} não foi marcado:`,
          erroMarca.message,
        );
      }
    }
  } catch (erro) {
    console.error(`[integracao] erro inesperado ao sincronizar o pedido ${pedidoId}:`, erro);
  }
}
