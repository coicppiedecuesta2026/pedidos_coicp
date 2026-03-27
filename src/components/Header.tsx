'use client';

import Link from 'next/link';
import { useCart } from '@/context/CartContext';

export default function Header() {
  const { totalItems } = useCart();

  return (
    <header className="hero-gradient text-white relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between relative z-10">
        <Link href="/" className="flex items-center gap-3 no-underline text-white">
          <div
            style={{
              position: 'relative',
              width: 140, // Ancho suficiente para que se lea COICP
              height: 50,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <img 
              src="/logo_coicp.png" 
              alt="COICP Logo" 
              style={{ height: '100%', width: 'auto', objectFit: 'contain' }}
            />
          </div>
        </Link>

        <Link
          href="/pedido"
          className="relative flex items-center gap-2 no-underline text-white"
          style={{
            background: 'rgba(255,255,255,0.12)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 12,
            padding: '10px 18px',
            fontWeight: 600,
            fontSize: '0.9rem',
            transition: 'all 0.3s ease',
          }}
        >
          🛒 Mi Pedido
          {totalItems > 0 && (
            <span
              className="animate-cart-bounce"
              style={{
                background: '#e74c3c',
                width: 24,
                height: 24,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 800,
                marginLeft: 2,
              }}
            >
              {totalItems}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
