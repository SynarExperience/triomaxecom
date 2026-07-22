import type { Endereco, FormaPagamento, OpcaoFrete } from "@/types/checkout";

/** Só dígitos — usado por todas as máscaras e validações abaixo. */
export const digitos = (valor: string) => valor.replace(/\D/g, "");

/* ------------------------------------------------------------------ máscaras */

export function mascaraCep(valor: string) {
  const numeros = digitos(valor).slice(0, 8);
  return numeros.length > 5 ? `${numeros.slice(0, 5)}-${numeros.slice(5)}` : numeros;
}

export function mascaraTelefone(valor: string) {
  const numeros = digitos(valor).slice(0, 11);
  if (numeros.length <= 2) return numeros;
  /* Celular tem 9 dígitos após o DDD e fixo tem 8: o corte muda de lugar, senão
     números de 10 dígitos saem com o hífen no meio do prefixo. */
  const corte = numeros.length > 10 ? 7 : 6;
  if (numeros.length <= corte) return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
  return `(${numeros.slice(0, 2)}) ${numeros.slice(2, corte)}-${numeros.slice(corte)}`;
}

/** CPF até 11 dígitos, CNPJ a partir daí — o próprio comprimento decide. */
export function mascaraDocumento(valor: string) {
  const numeros = digitos(valor).slice(0, 14);
  if (numeros.length <= 11) {
    return numeros
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");
  }
  return numeros
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

/* ---------------------------------------------------------------- validações */

/* Frouxa de propósito, igual à da sacola: regra apertada demais rejeita e-mail
   válido e custa uma venda. */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const cepValido = (valor: string) => digitos(valor).length === 8;
export const emailValido = (valor: string) => EMAIL_REGEX.test(valor.trim());
export const telefoneValido = (valor: string) => digitos(valor).length >= 10;

/** Dígito verificador de CPF: soma ponderada decrescente, resto 10 vira 0. */
function cpfValido(numeros: string) {
  if (numeros.length !== 11) return false;
  // Sequências repetidas (000…, 111…) passam no cálculo mas não existem.
  if (/^(\d)\1{10}$/.test(numeros)) return false;

  const digitoEm = (ate: number) => {
    let soma = 0;
    for (let i = 0; i < ate; i += 1) soma += Number(numeros[i]) * (ate + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  return digitoEm(9) === Number(numeros[9]) && digitoEm(10) === Number(numeros[10]);
}

/** Dígito verificador de CNPJ: pesos ciclam de 2 a 9, da direita para a esquerda. */
function cnpjValido(numeros: string) {
  if (numeros.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(numeros)) return false;

  const digitoEm = (ate: number) => {
    let soma = 0;
    let peso = 2;
    for (let i = ate - 1; i >= 0; i -= 1) {
      soma += Number(numeros[i]) * peso;
      peso = peso === 9 ? 2 : peso + 1;
    }
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  return digitoEm(12) === Number(numeros[12]) && digitoEm(13) === Number(numeros[13]);
}

export function documentoValido(valor: string) {
  const numeros = digitos(valor);
  return numeros.length > 11 ? cnpjValido(numeros) : cpfValido(numeros);
}

/* ------------------------------------------------------------------- consulta */

/**
 * Resolve o CEP pelo ViaCEP. A vitrine é uma demonstração: se a consulta falhar
 * (offline, CEP inexistente, serviço fora do ar), devolvemos `null` e a UI abre
 * os campos de endereço para preenchimento manual, em vez de travar a compra.
 */
export async function consultarCep(cep: string): Promise<Endereco | null> {
  const numeros = digitos(cep);
  if (numeros.length !== 8) return null;

  try {
    const resposta = await fetch(`https://viacep.com.br/ws/${numeros}/json/`);
    if (!resposta.ok) return null;

    const dados: unknown = await resposta.json();
    if (typeof dados !== "object" || dados === null) return null;

    const registro = dados as Record<string, unknown>;
    if (registro.erro) return null;

    return {
      cep: mascaraCep(numeros),
      logradouro: String(registro.logradouro ?? ""),
      bairro: String(registro.bairro ?? ""),
      cidade: String(registro.localidade ?? ""),
      uf: String(registro.uf ?? ""),
    };
  } catch {
    return null;
  }
}

/* ---------------------------------------------------------------------- frete */

/** Acima deste valor o econômico sai de graça — mesma régua da sacola. */
export const FRETE_GRATIS_A_PARTIR_DE = 299;

/**
 * Cotação simulada, nas três faixas observadas no checkout de referência
 * (econômico, rápido, expresso). Não há transportadora integrada: o preço varia
 * um pouco com a região só para o fluxo não parecer estático.
 */
export function cotarFrete(cep: string, subtotal: number): OpcaoFrete[] {
  const regiao = Number(digitos(cep).slice(0, 1) || 0);
  // Região 0-1 é Grande SP/interior paulista, onde fica o CD; quanto mais longe
  // dali, mais caro e mais lento.
  const distancia = Math.abs(regiao - 1);
  const base = 13.8 + distancia * 2.4;

  const gratis = subtotal >= FRETE_GRATIS_A_PARTIR_DE;

  return [
    {
      id: "economico",
      transportadora: "Correios",
      servico: "PAC Econômico",
      preco: gratis ? 0 : Number(base.toFixed(2)),
      prazoDias: 3 + distancia,
    },
    {
      id: "rapido",
      transportadora: "Correios",
      servico: "SEDEX Rápido",
      preco: Number((base * 1.35).toFixed(2)),
      prazoDias: 2 + Math.floor(distancia / 2),
    },
    {
      id: "expresso",
      transportadora: "Triomax Express",
      servico: "Origem: Porto Alegre-RS",
      preco: Number((base * 1.6).toFixed(2)),
      prazoDias: 1 + Math.floor(distancia / 2),
    },
  ];
}

/** Data de entrega por extenso, como "segunda-feira, 27/07". */
export function previsaoEntrega(prazoDias: number, hoje = new Date()) {
  const data = new Date(hoje);
  let restantes = prazoDias;
  // Prazo é em dias úteis: sábado e domingo não contam.
  while (restantes > 0) {
    data.setDate(data.getDate() + 1);
    const diaSemana = data.getDay();
    if (diaSemana !== 0 && diaSemana !== 6) restantes -= 1;
  }

  const semana = data.toLocaleDateString("pt-BR", { weekday: "long" });
  const curta = data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  return `${semana}, ${curta}`;
}

/* ------------------------------------------------------------------ pagamento */

/** Desconto no Pix — o mesmo 10% que a vitrine já anuncia no catálogo. */
export const DESCONTO_PIX = 0.1;
/** Boleto tem desconto menor: compensa a taxa, não o risco de não pagamento. */
export const DESCONTO_BOLETO = 0.03;
export const PARCELAS_MAXIMAS = 12;

export function totalPorPagamento(total: number, forma: FormaPagamento) {
  if (forma === "pix") return total * (1 - DESCONTO_PIX);
  if (forma === "boleto") return total * (1 - DESCONTO_BOLETO);
  return total;
}

/** Número do pedido derivado do relógio: legível e único o bastante na demo. */
export function gerarNumeroPedido(agora = new Date()) {
  const ano = agora.getFullYear();
  const sequencial = String(agora.getTime()).slice(-6);
  return `TX${ano}-${sequencial}`;
}
