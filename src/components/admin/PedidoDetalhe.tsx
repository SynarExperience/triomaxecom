"use client";

/* Todo o JSX do Nimbus vive aqui, num client component.
   `Page.Header`, `Card.Body` etc. são propriedades de módulos client e não
   podem ser acessadas de um server component — separar assim evita ter que
   alternar a diretiva na página e mantém a rota livre para resolver `params`. */
import Link from "next/link";
import { Layout, Page } from "@nimbus-ds/patterns";
import { Box, Button, Card, Icon, Link as NimbusLink, Tag, Text, Thumbnail, Title } from "@nimbus-ds/components";
import {
  BoxPackedIcon,
  EditIcon,
  EllipsisIcon,
  MailIcon,
  PrinterIcon,
  WhatsappIcon,
} from "@nimbus-ds/icons";
import {
  COR_ENVIO,
  COR_PAGAMENTO,
  moeda,
  type Pedido,
  ROTULO_ENVIO,
  ROTULO_PAGAMENTO,
  subtotalPedido,
  totalPedido,
  unidades,
} from "@/data/admin-pedidos";

export default function PedidoDetalhe({ pedido }: { pedido: Pedido }) {
  return (
    <Page maxWidth="1200px">
      <Page.Header
        title={pedido.numero}
        buttonStack={
          <>
            <Button>
              <EllipsisIcon />
              Mais opções
            </Button>
            <Button>
              <EditIcon />
              Editar
            </Button>
            <Button appearance="primary">
              <PrinterIcon />
              Imprimir resumo
            </Button>
          </>
        }
      >
        <Box display="flex" gap="2">
          <Tag appearance={COR_PAGAMENTO[pedido.pagamento]}>{ROTULO_PAGAMENTO[pedido.pagamento]}</Tag>
          <Tag appearance={COR_ENVIO[pedido.envio]}>{ROTULO_ENVIO[pedido.envio]}</Tag>
        </Box>
      </Page.Header>

      <Page.Body>
        {/* 2 colunas assimétricas: principal ~2/3, lateral ~1/3 — igual ao real */}
        <Layout columns="2 - asymmetric">
          <Layout.Section>
            <Card>
              <Card.Header>
                <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
                  <Title as="h3">Detalhes do pedido</Title>
                  <Text fontSize="caption" color="neutral-textLow">
                    {pedido.data} · {pedido.hora} · {pedido.origem}
                  </Text>
                </Box>
              </Card.Header>
              <Card.Body>
                <Box display="flex" flexDirection="column" gap="4">
                  {pedido.itens.map((item) => (
                    <Box key={item.sku} display="flex" gap="3" alignItems="flex-start">
                      <Thumbnail width="64px" aspectRatio="1/1" alt={item.nome} />
                      <Box display="flex" flexDirection="column" flex="1" gap="1">
                        <NimbusLink appearance="primary">{item.nome}</NimbusLink>
                        <Text fontSize="caption" color="neutral-textLow">
                          {item.variacao}
                        </Text>
                        <Text fontSize="caption" color="neutral-textLow">
                          SKU: {item.sku}
                        </Text>
                        <Text fontSize="caption">
                          {item.quantidade} x {moeda(item.precoUnitario)}
                        </Text>
                      </Box>
                      <Text fontWeight="medium">{moeda(item.precoUnitario * item.quantidade)}</Text>
                    </Box>
                  ))}

                  <Box
                    borderTopWidth="1"
                    borderColor="neutral-surfaceHighlight"
                    borderStyle="solid"
                    paddingTop="4"
                    display="flex"
                    flexDirection="column"
                    gap="2"
                  >
                    <Text fontWeight="medium">{pedido.transportadora}</Text>
                    <Text fontSize="caption" color="neutral-textLow">
                      Prazo de envio: {pedido.prazo}
                    </Text>
                    <Text fontSize="caption" color="neutral-textLow">
                      Peso: {pedido.peso}
                    </Text>
                    <Box display="flex" gap="2" marginTop="2">
                      <Button>
                        <PrinterIcon />
                        Imprimir
                      </Button>
                      <Button appearance="primary">
                        <BoxPackedIcon />
                        Marcar como embalado
                      </Button>
                    </Box>
                  </Box>
                </Box>
              </Card.Body>
            </Card>

            <Card>
              <Card.Header>
                <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
                  <Title as="h3">Pagamento</Title>
                  <Tag appearance={COR_PAGAMENTO[pedido.pagamento]}>
                    {ROTULO_PAGAMENTO[pedido.pagamento]}
                  </Tag>
                </Box>
              </Card.Header>
              <Card.Body>
                <Box display="flex" flexDirection="column" gap="2">
                  <Linha rotulo={`Subtotal (${unidades(pedido)} unidade${unidades(pedido) > 1 ? "s" : ""})`} valor={moeda(subtotalPedido(pedido))} />
                  <Linha rotulo={`Frete (${pedido.transportadora})`} valor={moeda(pedido.frete)} />
                  <Box
                    borderTopWidth="1"
                    borderColor="neutral-surfaceHighlight"
                    borderStyle="solid"
                    paddingTop="2"
                  >
                    <Linha rotulo="Total" valor={moeda(totalPedido(pedido))} destaque />
                  </Box>
                  <Text fontSize="caption" color="neutral-textLow">
                    {pedido.meioPagamento}
                  </Text>
                  {pedido.pagamento !== "recebido" && (
                    <Box marginTop="2">
                      <Button appearance="primary">Marcar como recebido</Button>
                    </Box>
                  )}
                </Box>
              </Card.Body>
            </Card>

            <Card>
              <Card.Header title="Suas anotações" />
              <Card.Body>
                <Text color="neutral-textLow">Nenhuma anotação neste pedido.</Text>
              </Card.Body>
            </Card>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <Card.Header title="Dados do cliente" />
              <Card.Body>
                <Box display="flex" flexDirection="column" gap="2">
                  <NimbusLink appearance="primary">{pedido.cliente.nome}</NimbusLink>
                  <Box display="flex" gap="2" alignItems="center">
                    <Icon source={<MailIcon />} color="primary-interactive" />
                    <NimbusLink appearance="primary">{pedido.cliente.email}</NimbusLink>
                  </Box>
                  <Box display="flex" gap="2" alignItems="center">
                    <Icon source={<WhatsappIcon />} color="primary-interactive" />
                    <NimbusLink appearance="primary">{pedido.cliente.telefone}</NimbusLink>
                  </Box>
                  <Text fontSize="caption" color="neutral-textLow">
                    CPF
                  </Text>
                  <Text>{pedido.cliente.documento}</Text>
                </Box>
              </Card.Body>
            </Card>

            <Card>
              <Card.Header title="Endereço de entrega e cobrança" />
              <Card.Body>
                <Box display="flex" flexDirection="column" gap="1">
                  <Text>{pedido.cliente.nome}</Text>
                  <Text color="neutral-textLow">{pedido.entrega.endereco}</Text>
                  <Text color="neutral-textLow">Bairro: {pedido.entrega.bairro}</Text>
                  <Text color="neutral-textLow">CEP: {pedido.entrega.cep}</Text>
                  <Text color="neutral-textLow">
                    {pedido.entrega.cidade} — {pedido.entrega.estado}
                  </Text>
                  <Text color="neutral-textLow">{pedido.entrega.pais}</Text>
                </Box>
              </Card.Body>
            </Card>

            <Card>
              <Card.Header title="Histórico" />
              <Card.Body>
                <Box display="flex" flexDirection="column" gap="3">
                  {pedido.historico.map((e, i) => (
                    <Box key={i} display="flex" justifyContent="space-between" gap="2">
                      <Box display="flex" flexDirection="column">
                        <Text fontSize="caption">{e.descricao}</Text>
                        {e.autor && (
                          <Text fontSize="caption" color="neutral-textLow">
                            Por {e.autor}
                          </Text>
                        )}
                      </Box>
                      <Text fontSize="caption" color="neutral-textLow">
                        {e.data}
                      </Text>
                    </Box>
                  ))}
                </Box>
              </Card.Body>
            </Card>

            <Card>
              <Card.Header title="Página de acompanhamento" />
              <Card.Body>
                <Box display="flex" flexDirection="column" gap="2">
                  <Text color="neutral-textLow" fontSize="caption">
                    Compartilhe essa página para que seu cliente possa acompanhar a compra.
                  </Text>
                  <Box display="flex" gap="3">
                    <NimbusLink appearance="primary">Copiar link</NimbusLink>
                    <NimbusLink appearance="primary" as={Link} href="#">
                      Acessar
                    </NimbusLink>
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

function Linha({ rotulo, valor, destaque }: { rotulo: string; valor: string; destaque?: boolean }) {
  return (
    <Box display="flex" justifyContent="space-between">
      <Text fontWeight={destaque ? "medium" : "regular"}>{rotulo}</Text>
      <Text fontWeight={destaque ? "medium" : "regular"}>{valor}</Text>
    </Box>
  );
}
