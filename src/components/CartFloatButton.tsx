'use client';

import Link from 'next/link';
import { useCart } from '@/context/CartContext';

export default function CartFloatButton() {
  const { totalItems } = useCart();

  if (totalItems === 0) return null;

  return (
    <Link href="/pedido" className="cart-float" title="Ir al carrito">
      🛒
      <span className="cart-count animate-cart-bounce">{totalItems}</span>
    </Link>
  );
}
