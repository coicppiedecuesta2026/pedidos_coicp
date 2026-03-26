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
    <div className="card-premium animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Image */}
      <div className="product-image-wrapper">
        {producto.imagen_url ? (
          <Image
            src={producto.imagen_url}
            alt={producto.nombre}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
              fontSize: '3rem',
              background: 'linear-gradient(135deg, #f7f9fc, #eef2f7)',
            }}
          >
            📦
          </div>
        )}
        {/* Company badge */}
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(8px)',
            borderRadius: 8,
            padding: '5px 12px',
            fontSize: '0.72rem',
            fontWeight: 700,
            color: 'var(--primary)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          {empresa.nombre}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '18px 20px 20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <h3
          style={{
            fontSize: '1.05rem',
            fontWeight: 700,
            marginBottom: 6,
            color: 'var(--text-primary)',
            lineHeight: 1.3,
            margin: 0,
          }}
        >
          {producto.nombre}
        </h3>

        {producto.descripcion && (
          <p
            style={{
              fontSize: '0.84rem',
              color: 'var(--text-secondary)',
              marginBottom: 12,
              lineHeight: 1.5,
              marginTop: 6,
            }}
          >
            {producto.descripcion}
          </p>
        )}

        {/* Conditions */}
        {empresa.condiciones && (
          <div
            style={{
              fontSize: '0.76rem',
              color: 'var(--text-secondary)',
              background: 'rgba(41, 128, 185, 0.06)',
              borderRadius: 8,
              padding: '8px 12px',
              marginBottom: 12,
              lineHeight: 1.5,
              borderLeft: '3px solid var(--primary-light)',
            }}
          >
            📋 {empresa.condiciones}
          </div>
        )}

        {/* Payment */}
        {empresa.forma_pago && (
          <div className="badge badge-info" style={{ marginBottom: 14, alignSelf: 'flex-start' }}>
            💳 {empresa.forma_pago}
          </div>
        )}

        <div style={{ marginTop: 'auto' }} />

        {/* Price + Add */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 8,
          }}
        >
          <div className="price-tag">{formatPrice(producto.valor_unitario)}</div>
          <button
            onClick={handleAdd}
            className={added ? 'btn-success' : 'btn-accent'}
            style={{
              padding: '10px 18px',
              fontSize: '0.85rem',
              borderRadius: 10,
            }}
          >
            {added ? '✓ Añadido' : itemInCart ? `+ Agregar (${itemInCart.cantidad})` : '🛒 Agregar'}
          </button>
        </div>
      </div>
    </div>
  );
}
