"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell, Menu, MenuButton } from "@nimbus-ds/patterns";
import { Box, Icon, IconButton, Tag, Text, Thumbnail } from "@nimbus-ds/components";
import {
  CashIcon,
  CogIcon,
  DiscountCircleIcon,
  ExternalLinkIcon,
  HomeIcon,
  InstagramIcon,
  MarketingIcon,
  OnlineStoreIcon,
  QuestionCircleIcon,
  SearchIcon,
  ShoppingCartIcon,
  StatsIcon,
  StoreIcon,
  TagIcon,
  TruckIcon,
  UserGroupIcon,
} from "@nimbus-ds/icons";
import { PEDIDOS } from "@/data/admin-pedidos";

/**
 * Estrutura espelhada do admin real (ver docs/nuvemshop-admin-mapa.md):
 * blocos soltos no topo, depois Gestão, Canais de venda e Configurações.
 */
const BLOCOS = [
  {
    secao: null,
    itens: [
      { label: "Início", href: "/admin", icone: HomeIcon },
      { label: "Estatísticas", href: "/admin/estatisticas", icone: StatsIcon },
    ],
  },
  {
    secao: "Gestão",
    itens: [
      // o badge conta as vendas ativas — deriva dos dados, não é fixo
      { label: "Vendas", href: "/admin/pedidos", icone: ShoppingCartIcon, badge: PEDIDOS.length },
      { label: "Produtos", href: "/admin/produtos", icone: TagIcon },
      { label: "Pagamentos", href: "/admin/pagamentos", icone: CashIcon },
      { label: "Envios", href: "/admin/envios", icone: TruckIcon },
      { label: "Clientes", href: "/admin/clientes", icone: UserGroupIcon },
      { label: "Descontos", href: "/admin/descontos", icone: DiscountCircleIcon },
      { label: "Marketing", href: "/admin/marketing", icone: MarketingIcon },
    ],
  },
  {
    secao: "Canais de venda",
    itens: [
      { label: "Loja online", href: "/admin/loja", icone: OnlineStoreIcon, externo: true },
      { label: "Ponto de Venda", href: "/admin/pdv", icone: StoreIcon, externo: true },
      { label: "Instagram e Facebook", href: "/admin/social", icone: InstagramIcon },
    ],
  },
] as const;

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  // "/admin" só casa exato; o resto casa por prefixo (cobre as rotas de detalhe)
  const ativo = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  /*
   * Header, Body e Footer são filhos do Menu — não props. E o Menu.Footer já é
   * o próprio botão, então recebe label/ícone direto em vez de children.
   */
  return (
    <AppShell
      menu={
        <Menu>
          <Menu.Header>
            <Box display="flex" alignItems="center" gap="2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/triomax-mark.svg" alt="" width={28} height={28} />
              <Text fontSize="highlight" fontWeight="medium">
                TRIOMAX
              </Text>
            </Box>
          </Menu.Header>

          <Menu.Body>
            {BLOCOS.map((bloco, i) => (
              <Menu.Section key={bloco.secao ?? `bloco-${i}`} title={bloco.secao ?? undefined}>
                {bloco.itens.map((item) => (
                  <MenuButton
                    key={item.href}
                    as={Link}
                    href={item.href}
                    label={item.label}
                    startIcon={item.icone}
                    active={ativo(item.href)}
                  >
                    {"badge" in item && item.badge ? (
                      <Tag appearance="primary">{String(item.badge)}</Tag>
                    ) : null}
                    {"externo" in item && item.externo ? (
                      <Icon source={<ExternalLinkIcon />} />
                    ) : null}
                  </MenuButton>
                ))}
              </Menu.Section>
            ))}
          </Menu.Body>

          {/* Menu.Footer não é polimórfico (não aceita `as`/`href`), então a
              navegação vai pelo router em vez de um <Link>. */}
          <Menu.Footer
            label="Configurações"
            startIcon={CogIcon}
            onClick={() => router.push("/admin/config")}
          />
        </Menu>
      }
    >
      <AppShell.Header
        rightSlot={
          <Box display="flex" gap="2" alignItems="center">
            <IconButton source={<SearchIcon />} size="2rem" aria-label="Buscar" />
            <IconButton source={<QuestionCircleIcon />} size="2rem" aria-label="Ajuda" />
            <Text fontSize="caption" color="neutral-textLow">
              TRIOMAX
            </Text>
          </Box>
        }
      />
      {children}
    </AppShell>
  );
}
