'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/services/supabaseClient';
import type { Pedido, DetallePedido } from '@/types';
import Header from '@/components/Header';

function formatPrice(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ConfirmacionPage() {
  const params = useParams();
  const pedidoId = params?.id as string;
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [detalles, setDetalles] = useState<DetallePedido[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPedido() {
      if (!pedidoId) return;
      setLoading(true);

      const [pedRes, detRes] = await Promise.all([
        supabase.from('pedidos').select('*').eq('id', pedidoId).single(),
        supabase.from('detalle_pedidos').select('*').eq('pedido_id', pedidoId),
      ]);

      if (pedRes.data) setPedido(pedRes.data);
      if (detRes.data) setDetalles(detRes.data);
      setLoading(false);
    }
    loadPedido();
  }, [pedidoId]);

  // Build WhatsApp share message
  const buildWhatsappText = () => {
    if (!pedido || detalles.length === 0) return '';
    let msg = `🛒 *CONFIRMACIÓN DE PEDIDO COICP*\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `👤 *${pedido.nombre_asociado}*\n`;
    msg += `🆔 CC: ${pedido.cedula}\n`;
    msg += `📅 ${formatDate(pedido.created_at)}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n\n`;

    // Group details by company
    const byCompany = detalles.reduce((acc, det) => {
      if (!acc[det.empresa_nombre]) acc[det.empresa_nombre] = [];
      acc[det.empresa_nombre].push(det);
      return acc;
    }, {} as Record<string, DetallePedido[]>);

    Object.entries(byCompany).forEach(([empresa, items]) => {
      msg += `🏢 *${empresa}*\n`;
      items.forEach((item) => {
        msg += `  📦 ${item.producto_nombre}\n`;
        msg += `     ${item.cantidad} x ${formatPrice(item.valor_unitario)} = *${formatPrice(item.valor_total)}*\n`;
      });
      if (items[0].condiciones) {
        msg += `  📋 ${items[0].condiciones}\n`;
      }
      if (items[0].forma_pago) {
        msg += `  💳 ${items[0].forma_pago}\n`;
      }
      msg += `\n`;
    });

    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `💰 *TOTAL: ${formatPrice(pedido.total)}*\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `\n🔗 Ver pedido: ${window.location.href}`;

    return msg;
  };

  const shareWhatsapp = () => {
    const text = encodeURIComponent(buildWhatsappText());
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-main)' }}>
        <Header />
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <div
            style={{
              width: 48,
              height: 48,
              border: '4px solid var(--border)',
              borderTop: '4px solid var(--primary)',
              borderRadius: '50%',
              margin: '0 auto 16px',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <p style={{ color: 'var(--text-secondary)' }}>Cargando pedido...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      </div>
    );
  }

  if (!pedido) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-main)' }}>
        <Header />
        <div className="empty-state" style={{ paddingTop: 100 }}>
          <div style={{ fontSize: '5rem', marginBottom: 20 }}>❌</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 12, color: 'var(--text-primary)' }}>
            Pedido no encontrado
          </h2>
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {/* Success banner */}
        <div
          className="card-premium animate-fade-in-up"
          style={{
            background: 'linear-gradient(135deg, #27ae60, #2ecc71)',
            color: 'white',
            padding: '36px 32px',
            textAlign: 'center',
            marginBottom: 32,
          }}
        >
          <div style={{ fontSize: '3.5rem', marginBottom: 12 }}>✅</div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: 8, letterSpacing: '-0.02em' }}>
            ¡Pedido Enviado!
          </h1>
          <p style={{ opacity: 0.9, fontSize: '1.05rem', margin: 0 }}>
            Tu pedido ha sido registrado exitosamente. Guarda esta página como comprobante.
          </p>
        </div>

        {/* Order info */}
        <div className="card-premium animate-fade-in-up" style={{ padding: '28px 28px', marginBottom: 24 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            <div>
              <h2 style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: 12, margin: '0 0 12px' }}>
                👤 Datos del Asociado
              </h2>
              <div style={{ display: 'grid', gap: 6, fontSize: '0.95rem' }}>
                <p style={{ margin: 0 }}>
                  <strong>Nombre:</strong> {pedido.nombre_asociado}
                </p>
                <p style={{ margin: 0 }}>
                  <strong>Cédula:</strong> {pedido.cedula}
                </p>
                {pedido.telefono && (
                  <p style={{ margin: 0 }}>
                    <strong>Teléfono:</strong> {pedido.telefono}
                  </p>
                )}
                {pedido.email && (
                  <p style={{ margin: 0 }}>
                    <strong>Email:</strong> {pedido.email}
                  </p>
                )}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="badge badge-success" style={{ marginBottom: 8 }}>
                Estado: {pedido.estado}
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                📅 {formatDate(pedido.created_at)}
              </p>
              <p
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--text-light)',
                  margin: '4px 0 0',
                  fontFamily: 'monospace',
                }}
              >
                ID: {pedido.id.slice(0, 8)}...
              </p>
            </div>
          </div>
        </div>

        {/* Order details table */}
        <div className="card-premium animate-fade-in-up" style={{ overflow: 'hidden', marginBottom: 24 }}>
          <div style={{ padding: '20px 28px 0' }}>
            <h3 style={{ fontWeight: 800, fontSize: '1.1rem', margin: '0 0 16px' }}>📦 Detalle del Pedido</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="summary-table">
              <thead>
                <tr>
                  <th style={{ width: 60 }}>Imagen</th>
                  <th>Empresa</th>
                  <th>Producto</th>
                  <th>Valor Unit.</th>
                  <th>Cant.</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {detalles.map((det) => (
                  <tr key={det.id}>
                    <td>
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 8,
                          overflow: 'hidden',
                          position: 'relative',
                          background: '#f0f4f8',
                        }}
                      >
                        {det.imagen_url ? (
                          <Image
                            src={det.imagen_url}
                            alt={det.producto_nombre}
                            fill
                            sizes="48px"
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
                              fontSize: '1.3rem',
                            }}
                          >
                            📦
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--primary)', fontSize: '0.88rem' }}>
                      {det.empresa_nombre}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, marginBottom: 2 }}>{det.producto_nombre}</div>
                      {det.forma_pago && (
                        <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                          💳 {det.forma_pago}
                        </span>
                      )}
                    </td>
                    <td>{formatPrice(det.valor_unitario)}</td>
                    <td style={{ fontWeight: 700 }}>{det.cantidad}</td>
                    <td className="price-tag" style={{ fontSize: '1rem' }}>
                      {formatPrice(det.valor_total)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={5} style={{ textAlign: 'right', paddingRight: 24 }}>
                    TOTAL
                  </td>
                  <td className="price-tag" style={{ fontSize: '1.3rem' }}>
                    {formatPrice(pedido.total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Conditions per company */}
        <div className="card-premium animate-fade-in-up" style={{ padding: '24px 28px', marginBottom: 32 }}>
          <h3 style={{ fontWeight: 700, margin: '0 0 16px', fontSize: '1.1rem' }}>
            📋 Condiciones del Pedido
          </h3>
          {Array.from(new Set(detalles.map((d) => d.empresa_nombre))).map((empresa) => {
            const det = detalles.find((d) => d.empresa_nombre === empresa)!;
            return (
              <div
                key={empresa}
                style={{
                  borderLeft: '3px solid var(--primary-light)',
                  paddingLeft: 16,
                  marginBottom: 14,
                }}
              >
                <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: 4 }}>{empresa}</div>
                {det.condiciones && (
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: '0 0 4px', lineHeight: 1.5 }}>
                    {det.condiciones}
                  </p>
                )}
                {det.forma_pago && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                    💳 <strong>{det.forma_pago}</strong>
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Action buttons */}
        <div
          className="animate-fade-in-up"
          style={{
            display: 'flex',
            gap: 14,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <button
            onClick={shareWhatsapp}
            className="btn-whatsapp"
            style={{ fontSize: '1.05rem' }}
          >
            📱 Compartir por WhatsApp
          </button>
          <button
            onClick={() => window.print()}
            className="btn-primary"
            style={{ fontSize: '1.05rem' }}
          >
            🖨️ Imprimir / Guardar PDF
          </button>
          <Link
            href="/"
            className="btn-outline"
            style={{ textDecoration: 'none', padding: '14px 28px', fontSize: '1.05rem' }}
          >
            🏪 Hacer otro pedido
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          background: 'var(--bg-dark)',
          color: 'rgba(255,255,255,0.7)',
          textAlign: 'center',
          padding: '32px 24px',
          fontSize: '0.85rem',
          marginTop: 40,
        }}
      >
        <p style={{ margin: 0 }}>
          © 2026 COICP Piedecuesta — Cooperativa de Impresores y Papeleros
        </p>
        <p style={{ margin: '6px 0 0', opacity: 0.6, fontSize: '0.78rem' }}>
          convenios.coicp.com.co
        </p>
      </footer>
    </div>
  );
}
