'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/services/supabaseClient';
import { useCart } from '@/context/CartContext';

export default function Header() {
  const { totalItems } = useCart();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    // Intentamos con '+' para el espacio, que es como Supabase suele manejar las URLs públicas
    const { data } = supabase.storage.from('logo').getPublicUrl('Logo+fondo.jpg');
    if (data?.publicUrl) {
      setLogoUrl(data.publicUrl);
    }
  }, []);

  return (
    <header className="hero-gradient text-white relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between relative z-10">
        <Link href="/" className="flex items-center gap-3 no-underline text-white">
          <div style={{ height: 60, display: 'flex', alignItems: 'center' }}>
            <img 
              src={logoUrl || ''} 
              alt="COICP Logo" 
              onError={(e) => {
                // Si la imagen falla (sale rota), ocultamos la imagen y mostramos el texto automático
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  const fallback = document.getElementById('logo-fallback');
                  if (fallback) fallback.style.display = 'flex';
                }
              }}
              onLoad={(e) => {
                // Cuando la imagen cargue bien, nos aseguramos de que se vea
                e.currentTarget.style.display = 'block';
                const fallback = document.getElementById('logo-fallback');
                if (fallback) fallback.style.display = 'none';
              }}
              style={{ height: '100%', width: 'auto', objectFit: 'contain', borderRadius: 12, display: 'none' }} 
            />
            {/* Logo de texto que solo aparece si la imagen falla */}
            <div id="logo-fallback" style={{ 
              fontSize: '1.5rem', 
              fontWeight: 900, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8 
            }}>
              <span style={{ background: 'white', color: 'var(--primary)', padding: '4px 8px', borderRadius: 8, fontSize: '1rem' }}>COICP</span>
              <span style={{ color: 'white' }}>2026</span>
            </div>
          </div>
        </Link>

        <Link
          href="/pedido"
          className="relative flex items-center gap-2 no-underline text-white"
          style={{
            background: 'rgba(255,255,255,0.12)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 12,
            padding: '10px 18px',
            fontWeight: 700,
            fontSize: '0.9rem',
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
                fontSize: '0.8rem',
                fontWeight: 900,
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
