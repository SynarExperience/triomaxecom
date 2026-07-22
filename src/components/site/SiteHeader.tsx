import { listarMenu, type ItemMenu } from "@/lib/conteudo";
import { SiteHeaderClient } from "./SiteHeaderClient";

/*
 * O header tem estado (menu do celular, busca, sacola), então a marcação vive
 * num client component. Quem lê o banco é este invólucro de servidor — assim as
 * páginas seguem montando `<SiteHeader />` sem carregar menu cada uma.
 */
export async function SiteHeader({ itens }: { itens?: ItemMenu[] }) {
  /* Aceita os itens por prop (útil quando a página já os carregou) e, sem eles,
     busca por conta própria. */
  const menu = itens ?? (await listarMenu("principal"));

  return <SiteHeaderClient itens={menu} />;
}
