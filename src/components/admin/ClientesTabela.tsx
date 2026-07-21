"use client";

/* Tela de Clientes. Duas diferenças propositais em relação a Vendas/Produtos,
   copiadas do painel real: não há coluna de checkbox, e o contato é uma dupla
   de botões redondos (e-mail e WhatsApp) em vez de texto. */

import { useState } from "react";
import Link from "next/link";
import { Page } from "@nimbus-ds/patterns";
import {
  Box,
  Button,
  Card,
  IconButton,
  Input,
  Link as NimbusLink,
  Table,
  Text,
} from "@nimbus-ds/components";
import {
  EllipsisIcon,
  ExternalLinkIcon,
  MailIcon,
  PlusCircleIcon,
  QuestionCircleIcon,
  SlidersIcon,
  WhatsappIcon,
} from "@nimbus-ds/icons";
import { CLIENTES, filtrarClientes, moeda } from "@/data/admin-clientes";

export default function ClientesTabela() {
  const [busca, setBusca] = useState("");
  const visiveis = filtrarClientes(busca);

  return (
    <Page maxWidth="1200px">
      <Page.Header
        title="Clientes"
        buttonStack={
          <>
            <Button>
              <EllipsisIcon />
              Mais opções
            </Button>
            <Button appearance="primary">
              <PlusCircleIcon />
              Adicionar novo cliente
            </Button>
          </>
        }
      />
      <Page.Body>
        <Box display="flex" flexDirection="column" gap="4" width="100%">
          <Box display="flex" gap="2" alignItems="center">
            <Box flex="1">
              <Input.Search
                placeholder="Buscar por nome, e-mail ou CPF"
                value={busca}
                onChange={(e) => setBusca(e.currentTarget.value)}
              />
            </Box>
            <IconButton source={<SlidersIcon />} size="2.5rem" aria-label="Filtrar" />
          </Box>

          <Card padding="none">
            <Table>
              <Table.Head>
                <Table.Row>
                  <Table.Cell as="th">Nome</Table.Cell>
                  <Table.Cell as="th">Última compra</Table.Cell>
                  <Table.Cell as="th">Total consumido</Table.Cell>
                  <Table.Cell as="th">Contato</Table.Cell>
                </Table.Row>
              </Table.Head>
              <Table.Body>
                {visiveis.map((c) => (
                  <Table.Row key={c.id}>
                    <Table.Cell>
                      <NimbusLink as={Link} href={`/admin/clientes/${c.id}`} appearance="primary">
                        {c.nome}
                      </NimbusLink>
                    </Table.Cell>

                    <Table.Cell>
                      {c.ultimaCompra ? (
                        <Box display="flex" gap="1" alignItems="center">
                          <NimbusLink
                            as={Link}
                            href={`/admin/pedidos/${c.ultimaCompra.pedido.replace("#", "")}`}
                            appearance="primary"
                          >
                            {c.ultimaCompra.pedido}
                          </NimbusLink>
                          <Text>{c.ultimaCompra.data}</Text>
                        </Box>
                      ) : (
                        // cliente sem compras: célula vazia, como no painel
                        <Text color="neutral-textLow">—</Text>
                      )}
                    </Table.Cell>

                    <Table.Cell>{moeda(c.totalConsumido)}</Table.Cell>

                    <Table.Cell>
                      <Box display="flex" gap="2">
                        <IconButton
                          source={<MailIcon />}
                          size="2rem"
                          aria-label={`Enviar e-mail para ${c.nome}`}
                          onClick={() => window.open(`mailto:${c.email}`)}
                        />
                        <IconButton
                          source={<WhatsappIcon />}
                          size="2rem"
                          aria-label={`Abrir WhatsApp de ${c.nome}`}
                          onClick={() =>
                            window.open(`https://wa.me/${c.telefone.replace(/\D/g, "")}`)
                          }
                        />
                      </Box>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </Card>

          <Text fontSize="caption" color="neutral-textLow">
            Mostrando 1-{visiveis.length} clientes de {CLIENTES.length}
          </Text>

          <Box display="flex" justifyContent="center" gap="2" alignItems="center" paddingTop="2">
            <QuestionCircleIcon />
            <NimbusLink appearance="primary">
              Mais sobre a lista de clientes
              <ExternalLinkIcon />
            </NimbusLink>
          </Box>
        </Box>
      </Page.Body>
    </Page>
  );
}
