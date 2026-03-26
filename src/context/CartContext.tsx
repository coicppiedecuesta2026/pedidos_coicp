'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { ItemCarrito, Producto, Empresa } from '@/types';

interface CartContextType {
  items: ItemCarrito[];
  addItem: (producto: Producto, empresa: Empresa) => void;
  removeItem: (productoId: string) => void;
  updateQuantity: (productoId: string, cantidad: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ItemCarrito[]>([]);

  const addItem = useCallback((producto: Producto, empresa: Empresa) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.producto.id === producto.id);
      if (existing) {
        return prev.map((item) =>
          item.producto.id === producto.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        );
      }
      return [...prev, { producto, empresa, cantidad: 1 }];
    });
  }, []);

  const removeItem = useCallback((productoId: string) => {
    setItems((prev) => prev.filter((item) => item.producto.id !== productoId));
  }, []);

  const updateQuantity = useCallback((productoId: string, cantidad: number) => {
    if (cantidad <= 0) {
      setItems((prev) => prev.filter((item) => item.producto.id !== productoId));
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.producto.id === productoId ? { ...item, cantidad } : item
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalItems = items.reduce((sum, item) => sum + item.cantidad, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + item.producto.valor_unitario * item.cantidad,
    0
  );

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe usarse dentro de CartProvider');
  }
  return context;
}
