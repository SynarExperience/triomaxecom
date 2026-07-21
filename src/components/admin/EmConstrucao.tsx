"use client";

/* Estado vazio para as seções ainda não construídas.
   No painel real várias dessas rotas também são telas de apresentação, então
   o formato (título + explicação + ação) é coerente com o original. */

import Link from "next/link";
import { Page } from "@nimbus-ds/patterns";
import { Box, Button, Card, Text, Title } from "@nimbus-ds/components";

export default function EmConstrucao({
  titulo,
  descricao,
  rotasReais,
}: {
  titulo: string;
  descricao: string;
  /** Rotas equivalentes no painel da Nuvemshop, como referência de escopo. */
  rotasReais?: string[];
}) {
  return (
    <Page maxWidth="1200px">
      <Page.Header title={titulo} />
      <Page.Body>
        <Card>
          <Card.Body>
            <Box display="flex" flexDirection="column" gap="3" padding="4" alignItems="flex-start">
              <Title as="h3">Ainda não construímos esta seção</Title>
              <Text color="neutral-textLow">{descricao}</Text>

              {rotasReais && rotasReais.length > 0 && (
                <Box display="flex" flexDirection="column" gap="1" paddingTop="2">
                  <Text fontSize="caption" color="neutral-textLow">
                    No painel da Nuvemshop corresponde a:
                  </Text>
                  {rotasReais.map((r) => (
                    <Text key={r} fontSize="caption" color="neutral-textLow">
                      {r}
                    </Text>
                  ))}
                </Box>
              )}

              <Box paddingTop="2">
                <Button appearance="primary" as={Link} href="/admin/pedidos">
                  Ir para Vendas
                </Button>
              </Box>
            </Box>
          </Card.Body>
        </Card>
      </Page.Body>
    </Page>
  );
}
