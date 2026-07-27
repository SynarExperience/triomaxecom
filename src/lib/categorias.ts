import { supabase } from "@/lib/supabase";

/*
 * Categorias do catálogo.
 *
 * No banco elas formam uma árvore (`pai_id`), montada no painel. Aqui a árvore
 * chega inteira e vira lista na ordem de exibição — são dezenas, não milhares,
 * então uma consulta recursiva custaria mais em complexidade do que economiza.
 *
 * O RLS já esconde categoria inativa da chave anônima, então tudo que chega
 * aqui pode aparecer na loja.
 */

export interface Categoria {
  slug: string;
  nome: string;
  /** "Filamentos/PLA" — usado onde a hierarquia precisa ficar explícita. */
  caminho: string;
  /** 0 = raiz. A listagem indenta as subcategorias por este número. */
  nivel: number;
  /**
   * Nome-base do par de arquivos em `/banners/category-strip`, sem extensão
   * nem largura — o `srcSet` monta. Vazio quando a categoria não tem arte, e
   * nesse caso ela não aparece na tira da home (só no menu e nos filtros).
   */
  imagem: string;
  /** Título/descrição para o <head> da listagem filtrada (definidos no
      painel). Vazios, a página cai no nome da categoria. */
  seoTitulo: string;
  seoDescricao: string;
}

type LinhaCategoria = {
  id: string;
  nome: string;
  slug: string;
  pai_id: string | null;
  posicao: number;
  imagem: string | null;
  seo_titulo: string | null;
  seo_descricao: string | null;
};

/**
 * Erros que o PostgREST devolve quando `categorias` ainda não existe (migração
 * 0008 não aplicada). Só eles justificam devolver lista vazia; qualquer outra
 * falha continua estourando, em vez de a loja fingir que não há categoria.
 */
const ERROS_SEM_CATEGORIAS = ["PGRST200", "PGRST205", "42P01"];

export async function listarCategorias(): Promise<Categoria[]> {
  const { data, error } = await supabase
    .from("categorias")
    .select("id, nome, slug, pai_id, posicao, imagem, seo_titulo, seo_descricao");

  if (error) {
    if (ERROS_SEM_CATEGORIAS.includes(error.code)) return [];
    throw new Error(`Falha ao carregar categorias: ${error.message}`);
  }

  const linhas = (data ?? []) as LinhaCategoria[];

  const filhasDe = new Map<string | null, LinhaCategoria[]>();
  for (const c of linhas) {
    const irmas = filhasDe.get(c.pai_id) ?? [];
    irmas.push(c);
    filhasDe.set(c.pai_id, irmas);
  }

  for (const irmas of filhasDe.values()) {
    irmas.sort((a, b) => a.posicao - b.posicao || a.nome.localeCompare(b.nome, "pt-BR"));
  }

  const lista: Categoria[] = [];

  /* `vistos` corta ciclo: um `pai_id` torto (A mãe de B, B mãe de A) travaria
     a loja inteira em vez de só esconder a categoria com problema. */
  const percorrer = (paiId: string | null, nivel: number, prefixo: string, vistos: Set<string>) => {
    for (const c of filhasDe.get(paiId) ?? []) {
      if (vistos.has(c.id)) continue;
      const caminho = prefixo ? `${prefixo}/${c.nome}` : c.nome;
      lista.push({
        slug: c.slug,
        nome: c.nome,
        caminho,
        nivel,
        imagem: c.imagem ?? "",
        seoTitulo: c.seo_titulo ?? "",
        seoDescricao: c.seo_descricao ?? "",
      });
      percorrer(c.id, nivel + 1, caminho, new Set(vistos).add(c.id));
    }
  };

  percorrer(null, 0, "", new Set());
  return lista;
}
