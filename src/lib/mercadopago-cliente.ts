"use client";

import { loadMercadoPago } from "@mercadopago/sdk-js";

/*
 * Carrega o SDK do Mercado Pago no navegador e devolve a instância pronta. É a
 * Public Key que trafega aqui (pode ficar exposta); o Access Token nunca sai do
 * servidor.
 */

const PUBLIC_KEY = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;

/** Subset do SDK que usamos — o pacote não traz tipos, então declaramos só o
    que chamamos. */
export type MercadoPagoInstance = {
  createCardToken: (dados: {
    cardNumber: string;
    cardholderName: string;
    cardExpirationMonth: string;
    cardExpirationYear: string;
    securityCode: string;
    identificationType: string;
    identificationNumber: string;
  }) => Promise<{ id: string }>;
  getPaymentMethods: (dados: { bin: string }) => Promise<{
    results: { id: string; payment_type_id: string; issuer?: { id: number } }[];
  }>;
  getInstallments: (dados: { amount: string; bin: string; paymentTypeId: string }) => Promise<
    {
      payer_costs: {
        installments: number;
        installment_amount: number;
        total_amount: number;
        recommended_message: string;
        installment_rate: number;
      }[];
      issuer?: { id: string };
    }[]
  >;
};

let instancia: Promise<MercadoPagoInstance> | null = null;

/** Uma instância só por sessão: recarregar o script a cada foco de campo é
    desperdício e às vezes duplica os iframes internos do SDK. */
export function obterMercadoPago(): Promise<MercadoPagoInstance> {
  if (!PUBLIC_KEY) {
    return Promise.reject(new Error("NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY não definida."));
  }
  if (!instancia) {
    instancia = loadMercadoPago().then(() => {
      const construtor = (window as unknown as { MercadoPago: new (chave: string, opcoes?: object) => MercadoPagoInstance }).MercadoPago;
      return new construtor(PUBLIC_KEY, { locale: "pt-BR" });
    });
  }
  return instancia;
}
