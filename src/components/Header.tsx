'use client';

import Link from 'next/link';
import { useCart } from '@/context/CartContext';

export default function Header() {
  const { totalItems } = useCart();

  return (
    <header className="hero-gradient text-white relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between relative z-10">
        <Link href="/" className="flex items-center gap-3 no-underline text-white">
            <div style={{ 
              fontSize: '1.5rem', 
              fontWeight: 900, 
              letterSpacing: '-0.05em', 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8 
            }}>
              <span style={{ background: 'white', color: 'var(--primary)', padding: '4px 8px', borderRadius: 8, fontSize: '1rem' }}>COICP</span>
              <span style={{ color: 'white' }}>2026</span>
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
