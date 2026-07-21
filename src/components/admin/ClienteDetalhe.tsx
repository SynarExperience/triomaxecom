"use client";

/* Detalhe do cliente. Segue o mesmo esqueleto do detalhe de pedido, que é o
   padrão do painel: header com título e ações, e grid 2-assimétrico com cards
   empilhados na principal e blocos de resumo na lateral. */

import Link from "next/link";
import { Layout, Page } from "@nimbus-ds/patterns";
import {
  Box,
  Button,
  Card,
  Icon,
  Link as NimbusLink,
  Table,
  Tag,
  Text,
  Title,
} from "@nimbus-ds/components";
import { EditIcon, EllipsisIcon, MailIcon, WhatsappIcon } from "@nimbus-ds/icons";
import { type Cliente, moeda } from "@/data/admin-clientes";
import {
  COR_ENVIO,
  COR_PAGAMENTO,
  PEDIDOS,
  ROTULO_ENVIO,
  ROTULO_PAGAMENTO,
  totalPedido,
} from "@/data/admin-pedidos";

export default function ClienteDetalhe({ cliente }: { cliente: Cliente }) {
  // histórico de compras: cruza os pedidos pelo nome do cliente
  const pedidos = PEDIDOS.filter((p) => p.cliente.nome === cliente.nome);

  return (
    <Page maxWidth="1200px">
      <Page.Header
        title={cliente.nome}
        buttonStack={
          <>
            <Button>
              <EllipsisIcon />
              Mais opções
            </Button>
            <Button appearance="primary">
              <EditIcon />
              Editar
            </Button>
          </>
        }
      />
      <Page.Body>
        <Layout columns="2 - asymmetric">
          <Layout.Section>
            <Card>
              <Card.Header title="Compras" />
              <Card.Body>
                {pedidos.length === 0 ? (
                  <Text color="neutral-textLow">
                    Este cliente ainda não fez nenhuma compra.
                  </Text>
                ) : (
                  <Table>
                    <Table.Head>
                      <Table.Row>
                        <Table.Cell as="th">Venda</Table.Cell>
                        <Table.Cell as="th">Data</Table.Cell>
                        <Table.Cell as="th">Total</Table.Cell>
                        <Table.Cell as="th">Pagamento</Table.Cell>
                        <Table.Cell as="th">Envio</Table.Cell>
                      </Table.Row>
                    </Table.Head>
                    <Table.Body>
                      {pedidos.map((p) => (
                        <Table.Row key={p.id}>
                          <Table.Cell>
                            <NimbusLink as={Link} href={`/admin/pedidos/${p.id}`} appearance="primary">
                              {p.numero}
                            </NimbusLink>
                          </Table.Cell>
                          <Table.Cell>{p.data}</Table.Cell>
                          <Table.Cell>{moeda(totalPedido(p))}</Table.Cell>
                          <Table.Cell>
                            <Tag appearance={COR_PAGAMENTO[p.pagamento]}>
                              {ROTULO_PAGAMENTO[p.pagamento]}
                            </Tag>
                          </Table.Cell>
                          <Table.Cell>
                            <Tag appearance={COR_ENVIO[p.envio]}>{ROTULO_ENVIO[p.envio]}</Tag>
                          </Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table>
                )}
              </Card.Body>
            </Card>

            <Card>
              <Card.Header title="Suas anotações" />
              <Card.Body>
                <Text color="neutral-textLow">Nenhuma anotação sobre este cliente.</Text>
              </Card.Body>
            </Card>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <Card.Header title="Dados do cliente" />
              <Card.Body>
                <Box display="flex" flexDirection="column" gap="2">
                  <Text fontWeight="medium">{cliente.nome}</Text>
                  <Box display="flex" gap="2" alignItems="center">
                    <Icon source={<MailIcon />} color="primary-interactive" />
                    <NimbusLink appearance="primary">{cliente.email}</NimbusLink>
                  </Box>
                  <Box display="flex" gap="2" alignItems="center">
                    <Icon source={<WhatsappIcon />} color="primary-interactive" />
                    <NimbusLink appearance="primary">{cliente.telefone}</NimbusLink>
                  </Box>
                  <Text fontSize="caption" color="neutral-textLow">
                    CPF
                  </Text>
                  <Text>{cliente.documento}</Text>
                </Box>
              </Card.Body>
            </Card>

            <Card>
              <Card.Header title="Resumo" />
              <Card.Body>
                <Box display="flex" flexDirection="column" gap="3">
                  <Box display="flex" justifyContent="space-between">
                    <Text color="neutral-textLow">Total consumido</Text>
                    <Text fontWeight="medium">{moeda(cliente.totalConsumido)}</Text>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Text color="neutral-textLow">Compras</Text>
                    <Text fontWeight="medium">{pedidos.length}</Text>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Text color="neutral-textLow">Última compra</Text>
                    <Text fontWeight="medium">{cliente.ultimaCompra?.data ?? "—"}</Text>
                  </Box>
                </Box>
              </Card.Body>
            </Card>
          </Layout.Section>
        </Layout>
      </Page.Body>
    </Page>
  );
}
