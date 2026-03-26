'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabaseClient';
import type { Pedido, DetallePedido } from '@/types';
import Header from '@/components/Header';
import Link from 'next/link';

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
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface PedidoConDetalle extends Pedido {
  detalles: DetallePedido[];
}

export default function AdminPage() {
  const [pedidos, setPedidos] = useState<PedidoConDetalle[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');

  useEffect(() => {
    loadPedidos();
  }, []);

  async function loadPedidos() {
    setLoading(true);
    const { data: pedidosData } = await supabase
      .from('pedidos')
      .select('*')
      .order('created_at', { ascending: false });

    if (!pedidosData) {
      setLoading(false);
      return;
    }

    // Load detalles for all pedidos
    const { data: detallesData } = await supabase
      .from('detalle_pedidos')
      .select('*');

    const pedidosConDetalle: PedidoConDetalle[] = pedidosData.map((p) => ({
      ...p,
      detalles: (detallesData || []).filter((d) => d.pedido_id === p.id),
    }));

    setPedidos(pedidosConDetalle);
    setLoading(false);
  }

  const filteredPedidos =
    filtroEstado === 'todos'
      ? pedidos
      : pedidos.filter((p) => p.estado === filtroEstado);

  // Consolidated summary grouped by company + product
  const consolidado = filteredPedidos.reduce((acc, pedido) => {
    pedido.detalles.forEach((det) => {
      const key = `${det.empresa_nombre}|${det.producto_nombre}`;
      if (!acc[key]) {
        acc[key] = {
          empresa: det.empresa_nombre,
          producto: det.producto_nombre,
          valor_unitario: det.valor_unitario,
          totalCantidad: 0,
          totalValor: 0,
        };
      }
      acc[key].totalCantidad += det.cantidad;
      acc[key].totalValor += det.valor_total;
    });
    return acc;
  }, {} as Record<string, { empresa: string; producto: string; valor_unitario: number; totalCantidad: number; totalValor: number }>);

  const totalGeneral = filteredPedidos.reduce((sum, p) => sum + p.total, 0);

  const statusColors: Record<string, string> = {
    pendiente: 'badge-warning',
    confirmado: 'badge-info',
    entregado: 'badge-success',
    cancelado: '',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)' }}>
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="animate-fade-in-up" style={{ marginBottom: 32 }}>
          <h1
            style={{
              fontSize: '2rem',
              fontWeight: 900,
              letterSpacing: '-0.03em',
              marginBottom: 8,
              color: 'var(--text-primary)',
            }}
          >
            📊 Panel de Administración
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            Consolidación y gestión de pedidos de convenios
          </p>
        </div>

        {/* Stats cards */}
        <div
          className="animate-fade-in-up"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
            marginBottom: 32,
          }}
        >
          <div className="card-premium" style={{ padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary)' }}>
              {pedidos.length}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Total Pedidos
            </div>
          </div>
          <div className="card-premium" style={{ padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--accent)' }}>
              {pedidos.filter((p) => p.estado === 'pendiente').length}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Pendientes
            </div>
          </div>
          <div className="card-premium" style={{ padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--success)' }}>
              {formatPrice(totalGeneral)}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Total Ventas
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="animate-fade-in-up" style={{ marginBottom: 24, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {['todos', 'pendiente', 'confirmado', 'entregado', 'cancelado'].map((estado) => (
            <button
              key={estado}
              onClick={() => setFiltroEstado(estado)}
              className={filtroEstado === estado ? 'btn-primary' : 'btn-outline'}
              style={{ padding: '8px 18px', fontSize: '0.85rem', textTransform: 'capitalize' }}
            >
              {estado}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <p style={{ color: 'var(--text-secondary)' }}>Cargando pedidos...</p>
          </div>
        ) : (
          <>
            {/* Consolidated summary */}
            {Object.keys(consolidado).length > 0 && (
              <div className="card-premium animate-fade-in-up" style={{ overflow: 'hidden', marginBottom: 32 }}>
                <div style={{ padding: '20px 28px 0' }}>
                  <h3 style={{ fontWeight: 800, fontSize: '1.1rem', margin: '0 0 16px' }}>
                    📋 Resumen Consolidado por Producto
                  </h3>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table className="summary-table">
                    <thead>
                      <tr>
                        <th>Empresa</th>
                        <th>Producto</th>
                        <th>Valor Unit.</th>
                        <th>Total Uds.</th>
                        <th>Total $</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.values(consolidado).map((item, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{item.empresa}</td>
                          <td>{item.producto}</td>
                          <td>{formatPrice(item.valor_unitario)}</td>
                          <td style={{ fontWeight: 700 }}>{item.totalCantidad}</td>
                          <td className="price-tag" style={{ fontSize: '1rem' }}>
                            {formatPrice(item.totalValor)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'right', paddingRight: 24 }}>
                          TOTAL
                        </td>
                        <td className="price-tag" style={{ fontSize: '1.2rem' }}>
                          {formatPrice(Object.values(consolidado).reduce((s, i) => s + i.totalValor, 0))}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* Individual orders */}
            <h3
              className="animate-fade-in-up"
              style={{ fontWeight: 800, fontSize: '1.15rem', marginBottom: 16 }}
            >
              📑 Pedidos Individuales ({filteredPedidos.length})
            </h3>
            <div style={{ display: 'grid', gap: 16 }}>
              {filteredPedidos.map((pedido) => (
                <div key={pedido.id} className="card-premium animate-fade-in-up">
                  <div
                    onClick={() => setExpandedId(expandedId === pedido.id ? null : pedido.id)}
                    style={{
                      padding: '18px 24px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 12,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 10,
                          background: 'var(--gradient-primary)',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '0.9rem',
                        }}
                      >
                        👤
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1rem' }}>{pedido.nombre_asociado}</div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          CC: {pedido.cedula} · {formatDate(pedido.created_at)}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <span className={`badge ${statusColors[pedido.estado] || ''}`}>
                        {pedido.estado}
                      </span>
                      <span className="price-tag" style={{ fontSize: '1.1rem' }}>
                        {formatPrice(pedido.total)}
                      </span>
                      <span style={{ fontSize: '1.2rem', transition: 'transform 0.3s' }}>
                        {expandedId === pedido.id ? '▲' : '▼'}
                      </span>
                    </div>
                  </div>

                  {expandedId === pedido.id && (
                    <div style={{ borderTop: '1px solid var(--border)', padding: '16px 24px' }}>
                      <div style={{ overflowX: 'auto' }}>
                        <table className="summary-table" style={{ fontSize: '0.9rem' }}>
                          <thead>
                            <tr>
                              <th>Empresa</th>
                              <th>Producto</th>
                              <th>Valor Unit.</th>
                              <th>Cant.</th>
                              <th>Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pedido.detalles.map((det) => (
                              <tr key={det.id}>
                                <td style={{ fontWeight: 600, color: 'var(--primary)' }}>
                                  {det.empresa_nombre}
                                </td>
                                <td>{det.producto_nombre}</td>
                                <td>{formatPrice(det.valor_unitario)}</td>
                                <td style={{ fontWeight: 700 }}>{det.cantidad}</td>
                                <td style={{ fontWeight: 700 }}>{formatPrice(det.valor_total)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
                        <Link
                          href={`/pedido/${pedido.id}`}
                          className="btn-outline"
                          style={{ fontSize: '0.85rem', padding: '8px 16px', textDecoration: 'none' }}
                        >
                          👁️ Ver detalle completo
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {filteredPedidos.length === 0 && (
              <div className="empty-state">
                <div style={{ fontSize: '4rem', marginBottom: 16 }}>📭</div>
                <h3 style={{ fontWeight: 700 }}>No hay pedidos</h3>
                <p>Aún no se han realizado pedidos con este filtro.</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
