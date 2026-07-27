"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { variantPrice, type Product, type ProductVariant } from "@/data/catalog";

const STORAGE_KEY = "triomax:sacola";
const MAX_QUANTITY = 9;

/** Só slug, variação e quantidade são persistidos: preço e imagem vêm sempre
    do catálogo, então uma sacola velha no localStorage nunca mostra preço
    antigo. `variacao` é o id em `variacoes`; ausente = produto simples. */
type StoredItem = { slug: string; quantity: number; variacao?: string };

/** Identidade de uma linha: produto + variação. É a chave das operações da
    sacola — o mesmo produto em duas variações são duas linhas. */
const lineIdDe = (slug: string, variacao?: string) => `${slug}::${variacao ?? ""}`;

export type CartLine = {
  lineId: string;
  product: Product;
  /** Nulo em produto simples. */
  variant: ProductVariant | null;
  quantity: number;
  unitPrice: number;
  total: number;
};

/** Último item adicionado, para a notificação flutuante. O `id` cresce a cada
    adição para que somar o mesmo produto duas vezes reative o aviso. */
export type UltimaAdicao = { id: number; product: Product };

type CartContextValue = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  isOpen: boolean;
  ultimaAdicao: UltimaAdicao | null;
  addItem: (product: Product, quantity?: number, variant?: ProductVariant) => void;
  setQuantity: (lineId: string, quantity: number) => void;
  removeItem: (lineId: string) => void;
  openCart: () => void;
  closeCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const clamp = (quantity: number) =>
  Math.min(MAX_QUANTITY, Math.max(1, Math.trunc(quantity)));

/**
 * Valida um item salvo contra o catálogo atual. Produto que ganhou variações
 * depois de a sacola ser gravada derruba o item antigo (sem variação não há
 * como saber qual cobrar); variação que deixou de existir idem.
 */
function validarItem(
  item: StoredItem,
  porSlug: Map<string, Product>,
): StoredItem | null {
  const product = porSlug.get(item.slug);
  if (!product) return null;

  if (product.variants.length === 0) {
    /* Produto simples: variação salva (de um catálogo antigo) é descartada. */
    return { slug: item.slug, quantity: clamp(item.quantity) };
  }

  const variante = product.variants.find((v) => v.id === item.variacao);
  if (!variante) return null;
  return { slug: item.slug, quantity: clamp(item.quantity), variacao: variante.id };
}

function readStorage(porSlug: Map<string, Product>): StoredItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (item): item is StoredItem =>
          typeof item === "object" &&
          item !== null &&
          typeof (item as StoredItem).slug === "string" &&
          Number.isFinite((item as StoredItem).quantity),
      )
      .map((item) => validarItem(item, porSlug))
      .filter((item): item is StoredItem => item !== null);
  } catch {
    return [];
  }
}

export function CartProvider({
  catalogo,
  children,
}: {
  /** Catálogo vindo do servidor. Substitui o antigo array estático: o preço
      exibido na sacola é sempre o do banco, nunca o que estava no localStorage. */
  catalogo: Product[];
  children: ReactNode;
}) {
  const [items, setItems] = useState<StoredItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [ultimaAdicao, setUltimaAdicao] = useState<UltimaAdicao | null>(null);
  /* O primeiro render precisa bater com o HTML do servidor (sacola vazia).
     Só depois de hidratar é que o conteúdo salvo entra — e é a partir daí
     que vale gravar de volta, senão o estado inicial vazio apaga a sacola. */
  const [hydrated, setHydrated] = useState(false);

  const porSlug = useMemo(
    () => new Map(catalogo.map((produto) => [produto.slug, produto])),
    [catalogo],
  );

  useEffect(() => {
    setItems(readStorage(porSlug));
    setHydrated(true);
  }, [porSlug]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* Modo privado ou cota cheia: a sacola segue válida só nesta sessão. */
    }
  }, [hydrated, items]);

  const addItem = useCallback(
    (product: Product, quantity = 1, variant?: ProductVariant) => {
      /* Produto com variações exige a escolha — a PDP sempre manda uma. O
         atalho do card não chega aqui para esses produtos (vira link). */
      if (product.variants.length > 0 && !variant) return;

      const variacao = variant?.id;
      setItems((current) => {
        const existing = current.find(
          (item) => item.slug === product.slug && item.variacao === variacao,
        );
        if (!existing) {
          return [...current, { slug: product.slug, quantity: clamp(quantity), ...(variacao ? { variacao } : {}) }];
        }

        return current.map((item) =>
          item.slug === product.slug && item.variacao === variacao
            ? { ...item, quantity: clamp(item.quantity + quantity) }
            : item,
        );
      });
      /* Adicionar não abre a sacola: interromper a navegação com um painel de tela
         cheia atrapalha quem está montando um pedido de várias cores. O aviso é a
         notificação flutuante, como na loja de referência. */
      setUltimaAdicao((atual) => ({ id: (atual?.id ?? 0) + 1, product }));
    },
    [],
  );

  const setQuantity = useCallback((lineId: string, quantity: number) => {
    setItems((current) =>
      quantity < 1
        ? current.filter((item) => lineIdDe(item.slug, item.variacao) !== lineId)
        : current.map((item) =>
            lineIdDe(item.slug, item.variacao) === lineId
              ? { ...item, quantity: clamp(quantity) }
              : item,
          ),
    );
  }, []);

  const removeItem = useCallback((lineId: string) => {
    setItems((current) => current.filter((item) => lineIdDe(item.slug, item.variacao) !== lineId));
  }, []);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const value = useMemo<CartContextValue>(() => {
    const lines = items.flatMap<CartLine>((item) => {
      const product = porSlug.get(item.slug);
      if (!product) return [];

      const variant = item.variacao
        ? product.variants.find((v) => v.id === item.variacao) ?? null
        : null;
      /* Item de variação que sumiu do catálogo não vira linha fantasma. */
      if (item.variacao && !variant) return [];

      const unitPrice = variant ? variantPrice(product, variant) : product.price;
      return [
        {
          lineId: lineIdDe(item.slug, item.variacao),
          product,
          variant,
          quantity: item.quantity,
          unitPrice,
          total: unitPrice * item.quantity,
        },
      ];
    });

    const subtotal = lines.reduce((sum, line) => sum + line.total, 0);

    return {
      lines,
      count: lines.reduce((sum, line) => sum + line.quantity, 0),
      subtotal,
      isOpen,
      ultimaAdicao,
      addItem,
      setQuantity,
      removeItem,
      openCart,
      closeCart,
    };
  }, [addItem, closeCart, isOpen, items, openCart, porSlug, removeItem, setQuantity, ultimaAdicao]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart precisa estar dentro de <CartProvider>.");
  return context;
}
