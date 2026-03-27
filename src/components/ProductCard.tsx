'use client';

import Image from 'next/image';
import type { Producto, Empresa } from '@/types';
import { useCart } from '@/context/CartContext';
import { useState } from 'react';

interface Props {
  producto: Producto;
  empresa: Empresa;
}

function formatPrice(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function ProductCard({ producto, empresa }: Props) {
  const { addItem, items } = useCart();
  const [added, setAdded] = useState(false);

  const itemInCart = items.find((i) => i.producto.id === producto.id);

  const handleAdd = () => {
    addItem(producto, empresa);
    setAdded(true);
    setTimeout(() => setAdded(false), 800);
  };

  return (
    <div className="card-premium animate-fade-in-up" style={{ 
      display: 'flex', 
      flexDirection: 'row', 
      gap: 14,
      padding: 12,
      alignItems: 'flex-start', // Cambio clave para texto largo
      minHeight: '120px'
    }}>
      {/* Image Container - Square and compact */}
      <div style={{
        position: 'relative',
        width: '100px', 
        height: '100px',
        flexShrink: 0,
        borderRadius: '12px',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #f7f9fc, #eef2f7)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
      }}>
        {producto.imagen_url ? (
          <Image
            src={producto.imagen_url}
            alt={producto.nombre}
            fill
            sizes="100px"
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
            }}
          >
            📦
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
        <h3
          style={{
            fontSize: '1rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            lineHeight: 1.2,
            margin: 0,
          }}
        >
          {producto.nombre}
        </h3>

        {producto.descripcion && (
          <p
            style={{
              fontSize: '0.82rem',
              color: 'var(--text-secondary)',
              lineHeight: '1.4',
              margin: '2px 0 4px',
            }}
          >
            {producto.descripcion}
          </p>
        )}

        {/* Company Name */}
        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--primary)', opacity: 0.8 }}>
          🏢 {empresa.nombre}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
          <div className="price-tag" style={{ fontSize: '1rem', padding: '4px 10px' }}>
            {formatPrice(producto.valor_unitario)}
          </div>
          <button
            onClick={handleAdd}
            className={added ? 'btn-success' : 'btn-accent'}
            style={{
              padding: '6px 14px',
              fontSize: '0.8rem',
              borderRadius: 8,
              boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
            }}
          >
            {added ? '✓' : itemInCart ? `+(${itemInCart.cantidad})` : 'Añadir'}
          </button>
        </div>
      </div>
    </div>
  );
}
