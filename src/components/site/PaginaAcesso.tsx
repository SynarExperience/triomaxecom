import styles from "./conta.module.css";

/*
 * Moldura das telas de acesso: só o logotipo no topo (que volta para a home) e
 * um cartão centralizado.
 *
 * Sem cabeçalho completo e sem rodapé, pelo mesmo motivo do checkout e do
 * rastreio: menu, busca e sacola ao redor de um formulário de login só oferecem
 * saídas para quem estava a um clique de terminar.
 */
export function PaginaAcesso({
  kicker,
  titulo,
  texto,
  children,
  rodape,
}: {
  kicker: string;
  titulo: string;
  texto?: string;
  children: React.ReactNode;
  rodape?: React.ReactNode;
}) {
  return (
    <div className={styles.acessoPagina}>
      <header className={styles.acessoCabecalho}>
        <a aria-label="Triomax — página inicial" className={styles.acessoLogo} href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="Triomax" className={styles.acessoLogoImg} src="/brand/triomax-black.svg" />
        </a>
      </header>

      <main className={styles.acessoConteudo}>
        <div>
          <section className={styles.acessoCard}>
            <p className={styles.acessoKicker}>{kicker}</p>
            <h1 className={styles.acessoTitulo}>{titulo}</h1>
            {texto && <p className={styles.acessoTexto}>{texto}</p>}
            {children}
            {rodape && <p className={styles.acessoRodape}>{rodape}</p>}
          </section>
          <a className={styles.voltarLoja} href="/">
            ← Voltar para a loja
          </a>
        </div>
      </main>
    </div>
  );
}
