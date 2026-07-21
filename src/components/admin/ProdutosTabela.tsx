"use client";

/* Tela de Produtos. Preço e promocional são editáveis direto na linha — é o
   comportamento do painel real, e o que obriga esta tela a ser client. */

import { useState } from "react";
import { Page } from "@nimbus-ds/patterns";
import {
  Box,
  Button,
  Card,
  Checkbox,
  IconButton,
  Input,
  Link as NimbusLink,
  Select,
  Table,
  Tag,
  Text,
  Thumbnail,
} from "@nimbus-ds/components";
import {
  EllipsisIcon,
  GenerativeStarsIcon,
  PlusCircleIcon,
  RepeatIcon,
  UploadIcon,
} from "@nimbus-ds/icons";
import {
  CATEGORIAS,
  ORDENACOES,
  type Produto,
  PRODUTOS,
  rotuloEstoque,
  rotuloVariacoes,
} from "@/data/admin-produtos";

const moeda = (v: number) => v.toFixed(2).replace(".", ",");

export default function ProdutosTabela() {
  // preços ficam em estado porque a linha é editável
  const [precos, setPrecos] = useState<Record<string, { preco: string; promocional: string }>>(() =>
    Object.fromEntries(
      PRODUTOS.map((p) => [
        p.id,
        { preco: moeda(p.preco), promocional: p.promocional ? moeda(p.promocional) : "" },
      ]),
    ),
  );
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("Todos");

  const editar = (id: string, campo: "preco" | "promocional", valor: string) =>
    setPrecos((atual) => ({ ...atual, [id]: { ...atual[id], [campo]: valor } }));

  // a busca do painel real cobre nome, SKU e tags
  const visiveis = PRODUTOS.filter((p) => {
    const alvo = `${p.nome} ${p.sku} ${p.tags.join(" ")}`.toLowerCase();
    return alvo.includes(busca.trim().toLowerCase());
  });

  return (
    <Page maxWidth="1200px">
      <Page.Header
        title="Produtos"
        buttonStack={
          <>
            <Button>
              <RepeatIcon />
              Organizar
            </Button>
            <Button>
              <UploadIcon />
              Exportar e Importar
            </Button>
            <Button>
              <GenerativeStarsIcon />
              Adicionar com IA
            </Button>
            <Button appearance="primary">
              <PlusCircleIcon />
              Adicionar produto
            </Button>
          </>
        }
      />
      <Page.Body>
        <Box display="flex" flexDirection="column" gap="4" width="100%">
          <Box display="flex" gap="2" flexWrap="wrap" alignItems="center">
            <Box flex="1" minWidth="280px">
              <Input.Search
                placeholder="Buscar produtos por nome, SKU ou tags"
                value={busca}
                onChange={(e) => setBusca(e.currentTarget.value)}
              />
            </Box>
            <Select
              id="categoria"
              name="categoria"
              value={categoria}
              onChange={(e) => setCategoria(e.currentTarget.value)}
            >
              {CATEGORIAS.map((c) => (
                <Select.Option key={c} label={c} value={c} />
              ))}
            </Select>
            <Select id="ordenacao" name="ordenacao" defaultValue={ORDENACOES[0]}>
              {ORDENACOES.map((o) => (
                <Select.Option key={o} label={o} value={o} />
              ))}
            </Select>
          </Box>

          <Card padding="none">
            <Table>
              <Table.Head>
                <Table.Row>
                  <Table.Cell as="th" width="40px">
                    <Checkbox name="todos-produtos" label="" />
                  </Table.Cell>
                  <Table.Cell as="th">Produto</Table.Cell>
                  <Table.Cell as="th">Estoque</Table.Cell>
                  <Table.Cell as="th">Preço</Table.Cell>
                  <Table.Cell as="th">Promocional</Table.Cell>
                  <Table.Cell as="th">Variações</Table.Cell>
                  <Table.Cell as="th">Ações</Table.Cell>
                </Table.Row>
              </Table.Head>
              <Table.Body>
                {visiveis.map((p) => (
                  <Linha
                    key={p.id}
                    produto={p}
                    valores={precos[p.id]}
                    onEditar={(campo, valor) => editar(p.id, campo, valor)}
                  />
                ))}
              </Table.Body>
            </Table>
          </Card>

          <Text fontSize="caption" color="neutral-textLow">
            Mostrando {visiveis.length} de {PRODUTOS.length} produtos
          </Text>
        </Box>
      </Page.Body>
    </Page>
  );
}

function Linha({
  produto,
  valores,
  onEditar,
}: {
  produto: Produto;
  valores: { preco: string; promocional: string };
  onEditar: (campo: "preco" | "promocional", valor: string) => void;
}) {
  const estoque = rotuloEstoque(produto);
  const semEstoque = estoque === "Sem estoque";

  return (
    <Table.Row>
      <Table.Cell>
        <Checkbox name={`produto-${produto.id}`} label="" />
      </Table.Cell>

      <Table.Cell>
        <Box display="flex" gap="2" alignItems="center">
          <Thumbnail width="40px" aspectRatio="1/1" alt={produto.nome} />
          <Box display="flex" flexDirection="column">
            <NimbusLink appearance="primary">{produto.nome}</NimbusLink>
            <Text fontSize="caption" color="neutral-textLow">
              SKU: {produto.sku}
            </Text>
          </Box>
        </Box>
      </Table.Cell>

      <Table.Cell>
        {semEstoque ? (
          <Tag appearance="warning">Sem estoque</Tag>
        ) : (
          <Text>{estoque}</Text>
        )}
      </Table.Cell>

      <Table.Cell>
        <Box width="110px">
          <Input
            name={`preco-${produto.id}`}
            value={valores?.preco ?? ""}
            onChange={(e) => onEditar("preco", e.currentTarget.value)}
            append={<Text color="neutral-textLow">R$</Text>}
            appendPosition="start"
          />
        </Box>
      </Table.Cell>

      <Table.Cell>
        <Box width="110px">
          <Input
            name={`promocional-${produto.id}`}
            value={valores?.promocional ?? ""}
            placeholder="—"
            onChange={(e) => onEditar("promocional", e.currentTarget.value)}
            append={<Text color="neutral-textLow">R$</Text>}
            appendPosition="start"
          />
        </Box>
      </Table.Cell>

      <Table.Cell>
        <Text color="neutral-textLow">{rotuloVariacoes(produto)}</Text>
      </Table.Cell>

      <Table.Cell>
        <IconButton source={<EllipsisIcon />} size="2rem" aria-label={`Ações de ${produto.nome}`} />
      </Table.Cell>
    </Table.Row>
  );
}
