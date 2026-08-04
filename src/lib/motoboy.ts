import "server-only";
import { digitos } from "@/lib/checkout";
import type { OpcaoFrete } from "@/types/checkout";

/*
 * Entrega por motoboy, pela plataforma Entregas Expressas (praça Sr Express).
 * Doc: https://developer.entregasexpressas.com.br/docs
 *
 * É a entrega no mesmo dia, só para as UFs de MOTOBOY_UFS (SC hoje) e dentro do
 * raio de MOTOBOY_MAX_KM. Fora disso o cliente segue vendo só Correios/Jadlog.
 *
 * Diferente do Melhor Envio, aqui NADA lança: motoboy é uma opção a mais, e um
 * erro dele (token vencido, praça fora do ar, CEP sem cobertura) não pode
 * derrubar a cotação do resto. Todo caminho de falha devolve `null` e o
 * checkout segue com as outras transportadoras.
 *
 * O ciclo é: cotar no checkout -> gravar a escolha no pedido -> despachar
 * quando o pagamento confirma (`despacharMotoboy`, chamada de `pedidos.ts`).
 */

const BASE = process.env.MOTOBOY_BASE_URL ?? "https://entregasexpressas.com.br/api/v1";
const token = process.env.MOTOBOY_TOKEN ?? "";

/** Lojista dono do pedido dentro da praça. O token é da transportadora e
    enxerga vários lojistas, então sem este id o pedido nasceria no cliente
    errado. */
const clienteId = Number(process.env.MOTOBOY_CLIENTE_ID ?? 0);

/* Moto (tipo 1) carregando "Produtos" (categoria 9): os ids são da praça, não
   globais — conferir em GET /tipos-veiculos e /tipos-veiculos/{id}/categorias
   se um dia a Sr Express remontar o catálogo dela. */
const tipoVeiculoId = Number(process.env.MOTOBOY_TIPO_VEICULO_ID ?? 1);
const categoriaId = Number(process.env.MOTOBOY_CATEGORIA_ID ?? 9);

const ufsAtendidas = (process.env.MOTOBOY_UFS ?? "SC")
  .split(",")
  .map((uf) => uf.trim().toUpperCase())
  .filter(Boolean);

/* Teto de distância. A praça cota até o outro lado do estado — Joinville a
   98 km sai por R$ 219 —, e um preço desses numa lista de frete é ruído, não
   opção. Acima do teto a linha some. */
const maxKm = Number(process.env.MOTOBOY_MAX_KM ?? 30);

/** Limite da moto (o tipo 1 declara 30 kg em `peso_maximo`). Acima disso a
    entrega não cabe e a opção não aparece. */
const maxPesoKg = Number(process.env.MOTOBOY_PESO_MAXIMO_KG ?? 30);

/* Faturado: a conta da loja opera sem saldo em carteira e a praça cobra depois.
   Trocar para "carteira" só faz sentido com saldo pré-pago lá. */
const metodoPagamento = process.env.MOTOBOY_METODO_PAGAMENTO ?? "faturado";

/* Como o pedido nasce no painel da praça. "pending" chama motoboy na hora do
   pagamento — é a operação da loja, que trabalha com peça pronta em estoque.
   "preparing" é o contrário: o pedido fica parado no painel até alguém liberar,
   para quando a peça ainda precisa ser impressa ou embalada. */
const statusInicial = process.env.MOTOBOY_STATUS_INICIAL ?? "pending";

/** Chave geral. Falta de token/cliente já desliga sozinho; esta é a que você
    vira em uma emergência sem apagar as credenciais. */
const ligado = process.env.MOTOBOY_ATIVO !== "false" && Boolean(token) && clienteId > 0;

const coleta = {
  cep: digitos(process.env.MOTOBOY_COLETA_CEP ?? process.env.MELHORENVIO_FROM_CEP ?? ""),
  endereco: process.env.MOTOBOY_COLETA_ENDERECO ?? "",
  nome: process.env.MOTOBOY_COLETA_NOME ?? "Triomax",
  telefone: process.env.MOTOBOY_COLETA_TELEFONE ?? "",
  lat: Number(process.env.MOTOBOY_COLETA_LAT ?? 0),
  lng: Number(process.env.MOTOBOY_COLETA_LNG ?? 0),
};

/** Id da opção no checkout. O pedido guarda a escolha por este id, então ele
    precisa ser estável — não derive de nada que mude entre cotação e compra. */
export const ID_FRETE_MOTOBOY = "motoboy";

/* `pedidos.transportadora` guarda "<transportadora> <serviço>" ("Correios PAC",
   "Retirada na loja Camboriú/SC"). É por este prefixo que o despacho reconhece,
   depois, que o pedido é de motoboy — as duas pontas usam a constante para o
   reconhecimento não depender de um texto digitado duas vezes. */
export const TRANSPORTADORA_MOTOBOY = "Motoboy";

/** Prefixo do código de rastreio dos pedidos despachados por aqui: é ele que
    distingue um pedido de motoboy de um do Melhor Envio na hora de rastrear. */
const PREFIXO_RASTREIO = "EE";

export const motoboyAtivo = () => ligado;

/* ------------------------------------------------------- endereço e coordenada */

/** O que o CEP resolve. Sem coordenada: ela só é necessária no despacho. */
type EnderecoCep = {
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
};

/**
 * Endereço do CEP, pelo ViaCEP — a mesma fonte que o checkout já usa.
 *
 * Não devolve coordenada, e é de propósito: a cotação não precisa de nenhuma (o
 * `/orders/calcular` geocodifica o endereço em texto por conta própria), e é a
 * cotação que roda a cada CEP digitado. Serviço de coordenada por CEP costuma
 * ter cota por IP, e num serverless o IP é compartilhado: a AwesomeAPI, que
 * respondia da máquina local, devolvia 429 na Vercel e derrubava a opção de
 * motoboy do site inteiro. Coordenada só entra no despacho, em `coordenadasDe`.
 */
async function resolverCep(cep: string): Promise<EnderecoCep | null> {
  const numeros = digitos(cep);
  if (numeros.length !== 8) return null;

  try {
    const resposta = await fetch(`https://viacep.com.br/ws/${numeros}/json/`, {
      // Endereço de CEP não muda; cachear tira a maior parte das chamadas.
      next: { revalidate: 60 * 60 * 24 * 30 },
    });
    if (!resposta.ok) return null;

    const dados = (await resposta.json()) as Record<string, unknown>;
    if (dados.erro) return null;

    const uf = String(dados.uf ?? "").toUpperCase();
    if (!uf) return null;

    return {
      logradouro: String(dados.logradouro ?? ""),
      bairro: String(dados.bairro ?? ""),
      cidade: String(dados.localidade ?? ""),
      uf,
    };
  } catch {
    return null;
  }
}

/**
 * Coordenadas de um endereço, para o despacho — o `POST /orders` exige
 * latitude/longitude, diferente do `/calcular`.
 *
 * Roda uma vez por pedido pago, não a cada cotação, então o volume é baixo o
 * bastante para geocoder público. Tenta na ordem e para no primeiro que
 * responder: se um estiver fora do ar ou com cota estourada, o seguinte cobre.
 */
async function coordenadasDe(enderecoTexto: string, cep: string): Promise<{ lat: number; lng: number } | null> {
  const numeros = digitos(cep);

  const fontes: { nome: string; url: string; extrair: (d: unknown) => { lat: number; lng: number } | null }[] = [
    {
      nome: "nominatim",
      url: `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=${encodeURIComponent(enderecoTexto)}`,
      extrair: (d) => {
        const primeiro = Array.isArray(d) ? (d[0] as Record<string, unknown> | undefined) : undefined;
        if (!primeiro) return null;
        return { lat: Number(primeiro.lat), lng: Number(primeiro.lon) };
      },
    },
    {
      nome: "photon",
      url: `https://photon.komoot.io/api/?limit=1&q=${encodeURIComponent(enderecoTexto)}`,
      extrair: (d) => {
        const dados = d as { features?: { geometry?: { coordinates?: number[] } }[] };
        const par = dados.features?.[0]?.geometry?.coordinates;
        if (!par || par.length < 2) return null;
        // GeoJSON vem [longitude, latitude] — invertido em relação ao resto.
        return { lat: Number(par[1]), lng: Number(par[0]) };
      },
    },
    {
      nome: "awesomeapi",
      url: `https://cep.awesomeapi.com.br/json/${numeros}`,
      extrair: (d) => {
        const dados = d as Record<string, unknown>;
        return { lat: Number(dados.lat), lng: Number(dados.lng) };
      },
    },
  ];

  for (const fonte of fontes) {
    try {
      const resposta = await fetch(fonte.url, {
        // O Nominatim exige identificação de quem chama; os outros ignoram.
        headers: { "User-Agent": `Triomax (${process.env.MELHORENVIO_USER_AGENT_EMAIL ?? "contato@triomax.com.br"})` },
        next: { revalidate: 60 * 60 * 24 * 30 },
      });
      if (!resposta.ok) {
        console.warn(`[motoboy] geocoder ${fonte.nome} respondeu ${resposta.status}.`);
        continue;
      }

      const ponto = fonte.extrair(await resposta.json());
      if (!ponto || !Number.isFinite(ponto.lat) || !Number.isFinite(ponto.lng)) continue;
      if (ponto.lat === 0 && ponto.lng === 0) continue;
      return ponto;
    } catch (erro) {
      console.warn(`[motoboy] geocoder ${fonte.nome} falhou:`, erro);
    }
  }

  return null;
}

/**
 * Endereço de coleta com coordenada. O endereço da loja não muda, então o
 * caminho normal é ler tudo do .env sem chamada nenhuma — é o que mantém a
 * cotação com uma requisição externa só. O geocoder abaixo é a rede de segurança
 * para quando alguém preencher o CEP e esquecer LAT/LNG.
 */
async function pontoDeColeta(): Promise<{ endereco: string; latitude: number; longitude: number } | null> {
  if (coleta.lat && coleta.lng && coleta.endereco) {
    return { endereco: coleta.endereco, latitude: coleta.lat, longitude: coleta.lng };
  }

  const endereco = coleta.endereco || (await montarEnderecoDoCep(coleta.cep));
  if (!endereco) return null;

  if (coleta.lat && coleta.lng) {
    return { endereco, latitude: coleta.lat, longitude: coleta.lng };
  }

  const ponto = await coordenadasDe(endereco, coleta.cep);
  if (!ponto) return null;

  return { endereco, latitude: ponto.lat, longitude: ponto.lng };
}

/** "Rua Guamirim - Tabuleiro, Camboriú - SC, 88348-065" a partir do CEP. */
async function montarEnderecoDoCep(cep: string): Promise<string | null> {
  const dados = await resolverCep(cep);
  if (!dados) return null;
  return linhaEndereco(dados.logradouro, "", dados.bairro, dados.cidade, dados.uf, cep);
}

/** Endereço no formato que a praça usa: "Rua X, 123 - Bairro, Cidade - UF, CEP". */
function linhaEndereco(
  logradouro: string,
  numero: string,
  bairro: string,
  cidade: string,
  uf: string,
  cep: string,
): string {
  const rua = [logradouro, numero].filter(Boolean).join(", ");
  const local = [bairro, `${cidade} - ${uf}`].filter(Boolean).join(", ");
  const numeros = digitos(cep);
  const cepFormatado = numeros.length === 8 ? `${numeros.slice(0, 5)}-${numeros.slice(5)}` : cep;
  return `${rua} - ${local}, ${cepFormatado}`;
}

/* -------------------------------------------------------------------- cotação */

type RespostaCotacao = { preco?: number; distancia?: number; mensagem?: string; error?: string };

async function chamar(caminho: string, corpo: unknown): Promise<unknown | null> {
  try {
    const resposta = await fetch(`${BASE}${caminho}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(corpo),
      cache: "no-store",
    });

    const dados: unknown = await resposta.json().catch(() => null);
    if (!resposta.ok) {
      /* 422/400 aqui é rotina, não incidente: quer dizer "esse endereço está
         fora da tabela de preços". Fica em log de aviso para não poluir. */
      console.warn(`[motoboy] ${caminho} respondeu ${resposta.status}:`, JSON.stringify(dados)?.slice(0, 300));
      return null;
    }
    return dados;
  } catch (erro) {
    console.error(`[motoboy] falha de rede em ${caminho}:`, erro);
    return null;
  }
}

/**
 * Cota a entrega por motoboy para um CEP. Devolve `null` — e a opção
 * simplesmente não aparece — quando: a integração está desligada, o CEP é de UF
 * não atendida, o peso não cabe na moto, o endereço está fora da tabela de
 * preços da praça, ou a distância passa do teto.
 */
export async function cotarMotoboy(cep: string, pesoKg: number): Promise<OpcaoFrete | null> {
  if (!ligado) return null;
  if (pesoKg > maxPesoKg) return null;

  const destino = await resolverCep(cep);
  if (!destino) return null;
  if (!ufsAtendidas.includes(destino.uf)) return null;

  const origem = await pontoDeColeta();
  if (!origem) {
    console.error("[motoboy] endereço de coleta não configurado (MOTOBOY_COLETA_*).");
    return null;
  }

  const dados = (await chamar("/orders/calcular", {
    tipo_veiculo_id: tipoVeiculoId,
    categoria_id: categoriaId,
    cliente_id: clienteId,
    retorno_necessario: false,
    prova_entrega_necessaria: false,
    endereco_coleta: origem,
    enderecos_entrega: [
      {
        /* Sem lat/lng aqui de propósito: a cotação manda o endereço em texto e
           deixa a praça geocodificar. Na cotação o número ainda não foi
           digitado, então o endereço vai no nível da rua — que é a precisão da
           tabela de preços. O número e a coordenada entram no despacho. */
        endereco: linhaEndereco(destino.logradouro, "", destino.bairro, destino.cidade, destino.uf, cep),
      },
    ],
  })) as RespostaCotacao | null;

  const preco = Number(dados?.preco);
  if (!dados || !Number.isFinite(preco) || preco <= 0) return null;

  const distancia = Number(dados.distancia);
  if (Number.isFinite(distancia) && distancia > maxKm) return null;

  return {
    id: ID_FRETE_MOTOBOY,
    transportadora: TRANSPORTADORA_MOTOBOY,
    servico: "Entrega hoje",
    // Centavo quebrado vem da tabela por km (R$ 219,2926); o cliente vê o valor
    // fechado, e é esse que o pedido cobra.
    preco: Math.round(preco * 100) / 100,
    prazoDias: 0,
    motoboy: true,
  };
}

/* ------------------------------------------------------------------- despacho */

export type PedidoMotoboy = {
  /** Número do pedido na loja, para o entregador e o painel casarem as pontas. */
  numeroPedido: number | string;
  /* Rua/número/complemento numa linha só — exatamente o que `pedidos.ts` já
     grava em `entrega_endereco` ("Rua Guamirim, 316 - Sala 6"). Recebemos
     pronto, e não os campos separados, porque o despacho do Pix roda a partir
     do pedido no banco, onde só existe essa linha; remontar os campos exigiria
     adivinhar onde termina o número e começa o complemento. */
  enderecoLinha: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
  /** Quem recebe, e o telefone que o entregador liga ao chegar. */
  destinatario: string;
  telefone: string;
  /** Valor das mercadorias, para a praça saber o que está sendo carregado. */
  valorMercadoria: number;
  observacao?: string;
};

export type DespachoMotoboy = {
  /** Id do pedido na praça. */
  id: number;
  /** Código gravado em `pedidos.codigo_rastreio` — "EE" + id. */
  codigo: string;
  /** Página pública de acompanhamento, para mandar ao cliente. */
  trackingUrl: string | null;
};

/**
 * Cria o pedido de entrega na praça. Chamada só depois do pagamento confirmado
 * e só quando o cliente escolheu motoboy — é uma ação que gera custo real e
 * coloca um entregador na rua.
 *
 * Nasce em MOTOBOY_STATUS_INICIAL ("preparing" por padrão): entra no painel da
 * Sr Express, mas o entregador só é acionado quando a loja libera. Devolve
 * `null` em qualquer falha; quem chama grava o que deu e segue.
 */
export async function despacharMotoboy(pedido: PedidoMotoboy): Promise<DespachoMotoboy | null> {
  if (!ligado) return null;

  const origem = await pontoDeColeta();
  if (!origem) {
    console.error("[motoboy] endereço de coleta não configurado (MOTOBOY_COLETA_*).");
    return null;
  }

  /* Aqui a coordenada é obrigatória — o `POST /orders` recusa sem ela. Monta o
     endereço completo primeiro (com número), para o geocoder ter o que casar. */
  const enderecoCompleto = linhaEndereco(
    pedido.enderecoLinha,
    "",
    pedido.bairro,
    pedido.cidade,
    pedido.uf,
    pedido.cep,
  );

  const destino = await coordenadasDe(enderecoCompleto, pedido.cep);
  if (!destino) {
    console.error(`[motoboy] nenhum geocoder resolveu "${enderecoCompleto}"; chamar a entrega na mão.`);
    return null;
  }

  const dados = (await chamar("/orders", {
    tipo_veiculo_id: tipoVeiculoId,
    categoria_id: categoriaId,
    cliente_id: clienteId,
    retorno_necessario: false,
    prova_entrega_necessaria: false,
    metodo_pagamento: metodoPagamento,
    status_inicial: statusInicial,
    external_id: String(pedido.numeroPedido),
    valor_pedidos: Number(pedido.valorMercadoria.toFixed(2)),
    observacao: pedido.observacao ?? `Pedido ${pedido.numeroPedido} — Triomax`,
    endereco_coleta: {
      ...origem,
      nome: coleta.nome,
      telefone: digitos(coleta.telefone),
    },
    enderecos_entrega: [
      {
        endereco: enderecoCompleto,
        latitude: destino.lat,
        longitude: destino.lng,
        nome: pedido.destinatario,
        telefone: digitos(pedido.telefone),
        external_id: String(pedido.numeroPedido),
      },
    ],
  })) as Record<string, unknown> | null;

  const id = Number(dados?.id);
  if (!dados || !Number.isFinite(id) || id <= 0) return null;

  const tracking = dados.tracking_url;
  return {
    id,
    codigo: `${PREFIXO_RASTREIO}${id}`,
    trackingUrl: typeof tracking === "string" && tracking ? tracking : null,
  };
}

/**
 * Cancela a entrega na praça. A API só aceita cancelamento antes de o entregador
 * pegar o pacote (`pending`, `waiting`, `scheduled`, `preparing`) — depois disso
 * a moto já saiu, o cancelamento é recusado e o acerto é por fora, com a
 * Sr Express. Devolve `true` só quando a praça confirmou.
 */
export async function cancelarMotoboy(id: number): Promise<boolean> {
  if (!ligado) return false;

  try {
    const resposta = await fetch(`${BASE}/orders/${id}`, {
      method: "DELETE",
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (resposta.ok) return true;

    console.warn(`[motoboy] não deu para cancelar o pedido ${id} (HTTP ${resposta.status}).`);
    return false;
  } catch (erro) {
    console.error(`[motoboy] falha ao cancelar o pedido ${id}:`, erro);
    return false;
  }
}

/* ------------------------------------------------------------------- rastreio */

/** Um código é de motoboy quando tem o prefixo "EE" e o resto é o id na praça. */
export function idDoCodigo(codigo: string): number | null {
  const casa = /^EE(\d+)$/i.exec((codigo ?? "").trim());
  if (!casa) return null;
  const id = Number(casa[1]);
  return Number.isFinite(id) && id > 0 ? id : null;
}

export type RastreioMotoboy = {
  status: string;
  entregue: boolean;
  cancelado: boolean;
  trackingUrl: string | null;
  criadoEm: string | null;
  aceitoEm: string | null;
  coletadoEm: string | null;
  entregueEm: string | null;
};

/* Como a praça nomeia o ciclo de vida, em ordem. `completed` é o fecho
   administrativo depois de `delivered`. */
const ENTREGUES = new Set(["delivered", "completed"]);

/** Estado atual de uma entrega na praça, ou `null` se o id não existe. */
export async function rastrearMotoboy(id: number): Promise<RastreioMotoboy | null> {
  if (!ligado) return null;

  try {
    const resposta = await fetch(`${BASE}/orders/${id}`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!resposta.ok) return null;

    const d = (await resposta.json()) as Record<string, unknown>;
    const str = (v: unknown) => (typeof v === "string" && v ? v : null);
    const situacao = String(d.order_status ?? "");

    return {
      status: str(d.status) ?? situacao,
      entregue: ENTREGUES.has(situacao),
      cancelado: situacao === "cancelled",
      trackingUrl: str(d.tracking_url),
      criadoEm: str(d.created_at),
      aceitoEm: str(d.accepted_at),
      coletadoEm: str(d.picked_up_at),
      entregueEm: str(d.finished_at),
    };
  } catch (erro) {
    console.error(`[motoboy] falha ao rastrear o pedido ${id}:`, erro);
    return null;
  }
}
