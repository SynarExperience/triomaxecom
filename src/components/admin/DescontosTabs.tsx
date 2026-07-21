"use client";

/* Descontos. No painel real são três rotas separadas (/coupons, /promotions,
   /free-shipping); aqui viram abas de uma tela só, porque a sidebar tem um
   único item "Descontos" e as três tabelas são irmãs. */

import { useState } from "react";
import { Page } from "@nimbus-ds/patterns";
import { Box, Button, Card, IconButton, Tabs, Table, Tag, Text } from "@nimbus-ds/components";
import { EllipsisIcon, PlusCircleIcon } from "@nimbus-ds/icons";
import {
  COR_STATUS,
  CUPONS,
  FRETES,
  moeda,
  PROMOCOES,
  ROTULO_STATUS,
} from "@/data/admin-descontos";

const ABAS = ["Cupons", "Promoções", "Frete grátis"] as const;

const ACAO_POR_ABA: Record<(typeof ABAS)[number], string> = {
  Cupons: "Criar cupom",
  Promoções: "Criar promoção",
  "Frete grátis": "Criar frete grátis",
};

export default function DescontosTabs() {
  const [aba, setAba] = useState<(typeof ABAS)[number]>("Cupons");

  return (
    <Page maxWidth="1200px">
      <Page.Header
        title="Descontos"
        buttonStack={
          <Button appearance="primary">
            <PlusCircleIcon />
            {ACAO_POR_ABA[aba]}
          </Button>
        }
      />
      <Page.Body>
        <Box display="flex" flexDirection="column" gap="4" width="100%">
          <Tabs preSelectedTab={0}>
            {ABAS.map((nome) => (
              <Tabs.Item key={nome} label={nome} onSelect={() => setAba(nome)}>
                <Box paddingTop="4">
                  {nome === "Cupons" && <TabelaCupons />}
                  {nome === "Promoções" && <TabelaPromocoes />}
                  {nome === "Frete grátis" && <TabelaFretes />}
                </Box>
              </Tabs.Item>
            ))}
          </Tabs>
        </Box>
      </Page.Body>
    </Page>
  );
}

function Acoes({ rotulo }: { rotulo: string }) {
  return <IconButton source={<EllipsisIcon />} size="2rem" aria-label={`Ações de ${rotulo}`} />;
}

function StatusTag({ status }: { status: "ativo" | "inativo" }) {
  return <Tag appearance={COR_STATUS[status]}>{ROTULO_STATUS[status]}</Tag>;
}

function TabelaCupons() {
  return (
    <Card padding="none">
      <Table>
        <Table.Head>
          <Table.Row>
            {["Código", "Desconto", "Frete", "Vigência", "Usos", "Limites", "Status", "Ações"].map((c) => (
              <Table.Cell as="th" key={c}>
                {c}
              </Table.Cell>
            ))}
          </Table.Row>
        </Table.Head>
        <Table.Body>
          {CUPONS.map((c) => (
            <Table.Row key={c.id}>
              <Table.Cell>
                <Text fontWeight="medium">{c.codigo}</Text>
              </Table.Cell>
              <Table.Cell>{c.desconto}</Table.Cell>
              <Table.Cell>
                {c.freteGratis ? <Tag appearance="primary">Grátis</Tag> : <Text color="neutral-textLow">—</Text>}
              </Table.Cell>
              <Table.Cell>{c.vigencia}</Table.Cell>
              <Table.Cell>{c.usos}</Table.Cell>
              <Table.Cell>{c.limite}</Table.Cell>
              <Table.Cell>
                <StatusTag status={c.status} />
              </Table.Cell>
              <Table.Cell>
                <Acoes rotulo={c.codigo} />
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </Card>
  );
}

function TabelaPromocoes() {
  return (
    <Card padding="none">
      <Table>
        <Table.Head>
          <Table.Row>
            {["Nome", "Tipo de desconto", "Aplicar a", "Vigência", "Status", "Ações"].map((c) => (
              <Table.Cell as="th" key={c}>
                {c}
              </Table.Cell>
            ))}
          </Table.Row>
        </Table.Head>
        <Table.Body>
          {PROMOCOES.map((p) => (
            <Table.Row key={p.id}>
              <Table.Cell>
                <Text fontWeight="medium">{p.nome}</Text>
              </Table.Cell>
              <Table.Cell>{p.tipo}</Table.Cell>
              <Table.Cell>{p.aplicarA}</Table.Cell>
              <Table.Cell>{p.vigencia}</Table.Cell>
              <Table.Cell>
                <StatusTag status={p.status} />
              </Table.Cell>
              <Table.Cell>
                <Acoes rotulo={p.nome} />
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </Card>
  );
}

function TabelaFretes() {
  return (
    <Card padding="none">
      <Table>
        <Table.Head>
          <Table.Row>
            {["Meio de envio", "Preço mínimo", "Categorias", "Zonas de entrega", "Status", "Ações"].map((c) => (
              <Table.Cell as="th" key={c}>
                {c}
              </Table.Cell>
            ))}
          </Table.Row>
        </Table.Head>
        <Table.Body>
          {FRETES.map((f) => (
            <Table.Row key={f.id}>
              <Table.Cell>
                <Text fontWeight="medium">{f.meioEnvio}</Text>
              </Table.Cell>
              <Table.Cell>
                {f.precoMinimo === null ? (
                  <Text color="neutral-textLow">Sem mínimo</Text>
                ) : (
                  moeda(f.precoMinimo)
                )}
              </Table.Cell>
              <Table.Cell>{f.categorias}</Table.Cell>
              <Table.Cell>{f.zonas}</Table.Cell>
              <Table.Cell>
                <StatusTag status={f.status} />
              </Table.Cell>
              <Table.Cell>
                <Acoes rotulo={f.meioEnvio} />
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </Card>
  );
}
