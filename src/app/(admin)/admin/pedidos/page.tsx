"use client";

/* O Nimbus expõe Page.Header, Card.Body etc. como propriedades de módulos
   client — um server component não consegue acessar essas chaves. Como o admin
   não tem requisito de SEO nem de HTML no primeiro byte, a página inteira vira
   client em vez de espalhar wrappers por cada subcomponente. */
import Link from "next/link";
import { Page } from "@nimbus-ds/patterns";
import { Box, Button, Card, Checkbox, Input, Link as NimbusLink, Table, Tag, Text } from "@nimbus-ds/components";
import { DownloadIcon, PlusCircleIcon, SearchIcon } from "@nimbus-ds/icons";
import {
  CONTADORES,
  COR_ENVIO,
  COR_PAGAMENTO,
  moeda,
  PEDIDOS,
  ROTULO_ENVIO,
  ROTULO_PAGAMENTO,
  totalPedido,
  unidades,
} from "@/data/admin-pedidos";

/* Colunas e chips vieram da tela real:
   Venda | Data | Cliente | Total | Produtos | Pagamento | Envio */
export default function PedidosPage() {
  return (
    <Page maxWidth="1200px">
      <Page.Header
        title="Vendas"
        subtitle={`${PEDIDOS.length} ativas`}
        buttonStack={
          <>
            <Button>
              <DownloadIcon />
              Exportar lista
            </Button>
            <Button appearance="primary" as={Link} href="/admin/pedidos/novo">
              <PlusCircleIcon />
              Criar um pedido
            </Button>
          </>
        }
      />
      <Page.Body>
        <Box display="flex" flexDirection="column" gap="4" width="100%">
          <Box display="flex" gap="2" flexWrap="wrap" alignItems="center">
            <Box flex="1" minWidth="240px">
              <Input.Search placeholder="Buscar" />
            </Box>
            {CONTADORES.map((c) => (
              <Button key={c.chave}>
                {c.rotulo}
                <Tag appearance={c.total > 0 ? "primary" : "neutral"}>{String(c.total)}</Tag>
              </Button>
            ))}
          </Box>

          <Card padding="none">
            <Table>
              <Table.Head>
                <Table.Row>
                  <Table.Cell as="th" width="40px">
                    <Checkbox name="todos" label="" />
                  </Table.Cell>
                  <Table.Cell as="th">Venda</Table.Cell>
                  <Table.Cell as="th">Data</Table.Cell>
                  <Table.Cell as="th">Cliente</Table.Cell>
                  <Table.Cell as="th">Total</Table.Cell>
                  <Table.Cell as="th">Produtos</Table.Cell>
                  <Table.Cell as="th">Pagamento</Table.Cell>
                  <Table.Cell as="th">Envio</Table.Cell>
                </Table.Row>
              </Table.Head>
              <Table.Body>
                {PEDIDOS.map((p) => (
                  <Table.Row key={p.id}>
                    <Table.Cell>
                      <Checkbox name={`pedido-${p.id}`} label="" />
                    </Table.Cell>
                    <Table.Cell>
                      <NimbusLink as={Link} href={`/admin/pedidos/${p.id}`} appearance="primary">
                        {p.numero}
                      </NimbusLink>
                    </Table.Cell>
                    <Table.Cell>
                      <Box display="flex" flexDirection="column">
                        <Text>{p.data}</Text>
                        <Text fontSize="caption" color="neutral-textLow">
                          {p.hora}
                        </Text>
                      </Box>
                    </Table.Cell>
                    <Table.Cell>
                      <NimbusLink as={Link} href={`/admin/pedidos/${p.id}`} appearance="primary">
                        {p.cliente.nome}
                      </NimbusLink>
                    </Table.Cell>
                    <Table.Cell>{moeda(totalPedido(p))}</Table.Cell>
                    <Table.Cell>{unidades(p)} unid.</Table.Cell>
                    <Table.Cell>
                      {/* status + meio embaixo, como no painel real */}
                      <Box display="flex" flexDirection="column" gap="1" alignItems="flex-start">
                        <Tag appearance={COR_PAGAMENTO[p.pagamento]}>{ROTULO_PAGAMENTO[p.pagamento]}</Tag>
                        <Text fontSize="caption" color="neutral-textLow">
                          {p.meioPagamento}
                        </Text>
                      </Box>
                    </Table.Cell>
                    <Table.Cell>
                      <Box display="flex" flexDirection="column" gap="1" alignItems="flex-start">
                        <Tag appearance={COR_ENVIO[p.envio]}>{ROTULO_ENVIO[p.envio]}</Tag>
                        <Text fontSize="caption" color="neutral-textLow">
                          {p.transportadora}
                        </Text>
                      </Box>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </Card>

          <Text fontSize="caption" color="neutral-textLow">
            Mostrando 1-{PEDIDOS.length} vendas de {PEDIDOS.length}
          </Text>
        </Box>
      </Page.Body>
    </Page>
  );
}
