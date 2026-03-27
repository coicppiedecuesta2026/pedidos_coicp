'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { supabase } from '@/services/supabaseClient';
import Header from '@/components/Header';

function formatPrice(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function PedidoPage() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, clearCart, totalPrice } = useCart();
  const [form, setForm] = useState({
    nombre: '',
    cedula: '',
    telefono: '',
  });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setEnviando(true);

    try {
      // 1. Insert pedido (header)
      const { data: pedidoData, error: pedidoErr } = await supabase
        .from('pedidos')
        .insert([
          {
            nombre_asociado: form.nombre,
            cedula: form.cedula,
            telefono: form.telefono || null,
            empresa_trabaja: 'No especificada', // Valor por defecto para evitar errores
            estado: 'pendiente',
            total: totalPrice,
          },
        ])
        .select()
        .single();

      if (pedidoErr || !pedidoData) {
        throw new Error(pedidoErr?.message || 'Error al crear pedido');
      }

      // 2. Insert detalle
      const detalles = items.map((item) => ({
        pedido_id: pedidoData.id,
        producto_id: item.producto.id,
        empresa_nombre: item.empresa.nombre,
        producto_nombre: item.producto.nombre,
        imagen_url: item.producto.imagen_url,
        valor_unitario: item.producto.valor_unitario,
        cantidad: item.cantidad,
        valor_total: item.producto.valor_unitario * item.cantidad,
        condiciones: item.empresa.condiciones,
        forma_pago: item.empresa.forma_pago,
      }));

      const { error: detalleErr } = await supabase
        .from('detalle_pedidos')
        .insert(detalles);

      if (detalleErr) {
        throw new Error(detalleErr.message);
      }

      // 3. Clear cart and go to confirmation
      clearCart();
      router.push(`/pedido/${pedidoData.id}`);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Error inesperado al enviar el pedido');
    } finally {
      setEnviando(false);
    }
  };

  if (items.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-main)' }}>
        <Header />
        <div className="empty-state" style={{ paddingTop: 100 }}>
          <div style={{ fontSize: '5rem', marginBottom: 20 }}>🛒</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 12, color: 'var(--text-primary)' }}>
            Tu carrito está vacío
          </h2>
          <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: 28 }}>
            Agrega productos del catálogo para realizar tu pedido
          </p>
          <Link href="/" className="btn-primary" style={{ textDecoration: 'none' }}>
            ← Ir al catálogo
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)' }}>
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="animate-fade-in-up">
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              color: 'var(--primary)',
              fontWeight: 600,
              marginBottom: 24,
              textDecoration: 'none',
              fontSize: '0.95rem',
            }}
          >
            ← Seguir comprando
          </Link>

          <h1
            style={{
              fontSize: '2rem',
              fontWeight: 900,
              letterSpacing: '-0.03em',
              marginBottom: 32,
              color: 'var(--text-primary)',
            }}
          >
            🛒 Tu Pedido
          </h1>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: 32,
          }}
        >
          {/* Cart Items */}
          <div className="card-premium animate-fade-in-up" style={{ overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="summary-table">
                <thead>
                  <tr>
                    <th style={{ width: 70 }}>Imagen</th>
                    <th>Empresa</th>
                    <th>Producto</th>
                    <th>Valor Unit.</th>
                    <th>Cantidad</th>
                    <th>Subtotal</th>
                    <th style={{ width: 50 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.producto.id}>
                      <td>
                        <div
                          style={{
                            width: 56,
                            height: 56,
                            borderRadius: 10,
                            overflow: 'hidden',
                            position: 'relative',
                            background: '#f0f4f8',
                          }}
                        >
                          {item.producto.imagen_url ? (
                            <Image
                              src={item.producto.imagen_url}
                              alt={item.producto.nombre}
                              fill
                              sizes="56px"
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
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--primary)', fontSize: '0.88rem' }}>
                        {item.empresa.nombre}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, marginBottom: 2 }}>{item.producto.nombre}</div>
                        {item.empresa.forma_pago && (
                          <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                            {item.empresa.forma_pago}
                          </span>
                        )}
                      </td>
                      <td style={{ fontWeight: 600 }}>{formatPrice(item.producto.valor_unitario)}</td>
                      <td>
                        <div className="qty-stepper">
                          <button onClick={() => updateQuantity(item.producto.id, item.cantidad - 1)}>
                            −
                          </button>
                          <span>{item.cantidad}</span>
                          <button onClick={() => updateQuantity(item.producto.id, item.cantidad + 1)}>
                            +
                          </button>
                        </div>
                      </td>
                      <td className="price-tag" style={{ fontSize: '1.05rem' }}>
                        {formatPrice(item.producto.valor_unitario * item.cantidad)}
                      </td>
                      <td>
                        <button
                          onClick={() => removeItem(item.producto.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '1.2rem',
                            opacity: 0.5,
                            transition: 'opacity 0.2s',
                          }}
                          title="Eliminar"
                          onMouseOver={(e) => ((e.target as HTMLElement).style.opacity = '1')}
                          onMouseOut={(e) => ((e.target as HTMLElement).style.opacity = '0.5')}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'right', paddingRight: 24 }}>
                      TOTAL
                    </td>
                    <td colSpan={2} className="price-tag" style={{ fontSize: '1.3rem' }}>
                      {formatPrice(totalPrice)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Conditions summary */}
          <div className="card-premium animate-fade-in-up" style={{ padding: '24px 28px' }}>
            <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: '1.1rem', margin: '0 0 16px' }}>
              📋 Condiciones por Empresa
            </h3>
            {Array.from(new Set(items.map((i) => i.empresa.id))).map((empId) => {
              const emp = items.find((i) => i.empresa.id === empId)!.empresa;
              return (
                <div
                  key={empId}
                  style={{
                    borderLeft: '3px solid var(--primary-light)',
                    paddingLeft: 16,
                    marginBottom: 16,
                  }}
                >
                  <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: 4, fontSize: '0.95rem' }}>
                    {emp.nombre}
                  </div>
                  {emp.condiciones && (
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: '0 0 4px', lineHeight: 1.5 }}>
                      {emp.condiciones}
                    </p>
                  )}
                  {emp.forma_pago && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                      💳 Forma de pago: <strong>{emp.forma_pago}</strong>
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Checkout form */}
          <div className="card-premium animate-fade-in-up" style={{ padding: '32px 28px' }}>
            <h3 style={{ fontWeight: 800, fontSize: '1.2rem', margin: '0 0 24px' }}>
              👤 Datos del Asociado
            </h3>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
                <div>
                  <label style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                    Nombre completo *
                  </label>
                  <input
                    name="nombre"
                    className="input-premium"
                    placeholder="Ej: Juan Pérez García"
                    value={form.nombre}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                    Cédula *
                  </label>
                  <input
                    name="cedula"
                    className="input-premium"
                    placeholder="Ej: 1098765432"
                    value={form.cedula}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                    Teléfono / WhatsApp
                  </label>
                  <input
                    name="telefono"
                    className="input-premium"
                    placeholder="Ej: 3001234567"
                    value={form.telefono}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {error && (
                <div
                  style={{
                    marginTop: 16,
                    padding: '12px 16px',
                    background: 'rgba(231, 76, 60, 0.1)',
                    borderRadius: 10,
                    color: 'var(--danger)',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                  }}
                >
                  ⚠️ {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap' }}>
                <button
                  type="submit"
                  disabled={enviando}
                  className="btn-success"
                  style={{
                    padding: '14px 36px',
                    fontSize: '1.05rem',
                    opacity: enviando ? 0.6 : 1,
                  }}
                >
                  {enviando ? '⏳ Enviando...' : '✅ Confirmar Pedido'}
                </button>
                <Link href="/" className="btn-outline" style={{ textDecoration: 'none', padding: '14px 28px' }}>
                  ← Seguir comprando
                </Link>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
