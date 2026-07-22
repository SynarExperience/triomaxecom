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
import { pixPrice, type Product } from "@/data/catalog";

const STORAGE_KEY = "triomax:sacola";
const MAX_QUANTITY = 9;

/** Só o slug e a quantidade são persistidos: preço e imagem vêm sempre do
    catálogo, então uma sacola velha no localStorage nunca mostra preço antigo. */
type StoredItem = { slug: string; quantity: number };

export type CartLine = { product: Product; quantity: number; total: number };

/** Último item adicionado, para a notificação flutuante. O `id` cresce a cada
    adição para que somar o mesmo produto duas vezes reative o aviso. */
export type UltimaAdicao = { id: number; product: Product };

type CartContextValue = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  pixTotal: number;
  isOpen: boolean;
  ultimaAdicao: UltimaAdicao | null;
  addItem: (product: Product, quantity?: number) => void;
  setQuantity: (slug: string, quantity: number) => void;
  removeItem: (slug: string) => void;
  openCart: () => void;
  closeCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const clamp = (quantity: number) =>
  Math.min(MAX_QUANTITY, Math.max(1, Math.trunc(quantity)));

function readStorage(existe: (slug: string) => boolean): StoredItem[] {
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
      .filter((item) => existe(item.slug))
      .map((item) => ({ slug: item.slug, quantity: clamp(item.quantity) }));
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
    setItems(readStorage((slug) => porSlug.has(slug)));
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

  const addItem = useCallback((product: Product, quantity = 1) => {
    setItems((current) => {
      const existing = current.find((item) => item.slug === product.slug);
      if (!existing) return [...current, { slug: product.slug, quantity: clamp(quantity) }];

      return current.map((item) =>
        item.slug === product.slug
          ? { ...item, quantity: clamp(item.quantity + quantity) }
          : item,
      );
    });
    /* Adicionar não abre a sacola: interromper a navegação com um painel de tela
       cheia atrapalha quem está montando um pedido de várias cores. O aviso é a
       notificação flutuante, como na loja de referência. */
    setUltimaAdicao((atual) => ({ id: (atual?.id ?? 0) + 1, product }));
  }, []);

  const setQuantity = useCallback((slug: string, quantity: number) => {
    setItems((current) =>
      quantity < 1
        ? current.filter((item) => item.slug !== slug)
        : current.map((item) =>
            item.slug === slug ? { ...item, quantity: clamp(quantity) } : item,
          ),
    );
  }, []);

  const removeItem = useCallback((slug: string) => {
    setItems((current) => current.filter((item) => item.slug !== slug));
  }, []);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const value = useMemo<CartContextValue>(() => {
    const lines = items.flatMap<CartLine>((item) => {
      const product = porSlug.get(item.slug);
      if (!product) return [];
      return [{ product, quantity: item.quantity, total: product.price * item.quantity }];
    });

    const subtotal = lines.reduce((sum, line) => sum + line.total, 0);

    return {
      lines,
      count: lines.reduce((sum, line) => sum + line.quantity, 0),
      subtotal,
      pixTotal: pixPrice(subtotal),
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
