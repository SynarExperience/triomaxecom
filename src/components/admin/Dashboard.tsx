"use client";

/* Início. O painel real tem seletor de período (Hoje / Ontem / Esta semana),
   cards de métrica e um bloco de recomendações. */

import { useState } from "react";
import Link from "next/link";
import { Layout, Page } from "@nimbus-ds/patterns";
import { Box, Button, Card, Link as NimbusLink, Text, Title } from "@nimbus-ds/components";
import { PEDIDOS, moeda, totalPedido } from "@/data/admin-pedidos";
import { CLIENTES } from "@/data/admin-clientes";
import { PRODUTOS } from "@/data/admin-produtos";

const PERIODOS = ["Hoje", "Ontem", "Esta semana"] as const;

/* Fatores só para o seletor de período mudar os números de forma plausível —
   com dados reais isso vira consulta por intervalo. */
const FATOR: Record<(typeof PERIODOS)[number], number> = {
  Hoje: 0.15,
  Ontem: 0.22,
  "Esta semana": 1,
};

const RECOMENDACOES = [
  { titulo: "Gerar confiança", texto: "Crie uma página com o passo a passo da compra e reduza dúvidas no checkout." },
  { titulo: "Aumentar tráfego", texto: "Conecte seus canais de venda e leve mais visitantes para a loja." },
  { titulo: "Melhorar conversão", texto: "Revise fotos e descrições dos produtos mais visitados." },
];

export default function Dashboard() {
  const [periodo, setPeriodo] = useState<(typeof PERIODOS)[number]>("Esta semana");
  const fator = FATOR[periodo];

  const faturamento = PEDIDOS.reduce((s, p) => s + totalPedido(p), 0) * fator;
  const vendas = Math.round(PEDIDOS.length * fator);
  const semEstoque = PRODUTOS.filter(
    (p) => p.variacoes.length > 0 && p.variacoes.every((v) => (v.estoque ?? 0) === 0),
  ).length;

  return (
    <Page maxWidth="1200px">
      <Page.Header title="Início" />
      <Page.Body>
        <Box display="flex" flexDirection="column" gap="4" width="100%">
          <Box display="flex" gap="2">
            {PERIODOS.map((p) => (
              <Button
                key={p}
                appearance={p === periodo ? "primary" : "neutral"}
                onClick={() => setPeriodo(p)}
              >
                {p}
              </Button>
            ))}
          </Box>

          <Layout columns="3">
            <Layout.Section>
              <Metrica rotulo="Faturamento" valor={moeda(faturamento)} />
            </Layout.Section>
            <Layout.Section>
              <Metrica rotulo="Vendas" valor={String(vendas)} />
            </Layout.Section>
            <Layout.Section>
              <Metrica rotulo="Clientes" valor={String(CLIENTES.length)} />
            </Layout.Section>
          </Layout>

          {semEstoque > 0 && (
            <Card>
              <Card.Header title="Atenção no estoque" />
              <Card.Body>
                <Box display="flex" justifyContent="space-between" alignItems="center" gap="2">
                  <Text>
                    {semEstoque} produto{semEstoque > 1 ? "s" : ""} com todas as variações zeradas.
                  </Text>
                  <NimbusLink as={Link} href="/admin/produtos" appearance="primary">
                    Ver produtos
                  </NimbusLink>
                </Box>
              </Card.Body>
            </Card>
          )}

          <Title as="h3">Recomendações</Title>
          <Layout columns="3">
            {RECOMENDACOES.map((r) => (
              <Layout.Section key={r.titulo}>
                <Card>
                  <Card.Header title={r.titulo} />
                  <Card.Body>
                    <Text color="neutral-textLow">{r.texto}</Text>
                  </Card.Body>
                </Card>
              </Layout.Section>
            ))}
          </Layout>
        </Box>
      </Page.Body>
    </Page>
  );
}

function Metrica({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <Card>
      <Card.Body>
        <Box display="flex" flexDirection="column" gap="1">
          <Text fontSize="caption" color="neutral-textLow">
            {rotulo}
          </Text>
          <Title as="h3">{valor}</Title>
        </Box>
      </Card.Body>
    </Card>
  );
}
