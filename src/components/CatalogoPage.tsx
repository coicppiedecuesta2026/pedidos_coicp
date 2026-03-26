'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabaseClient';
import type { Empresa, Producto } from '@/types';
import Header from '@/components/Header';
import EmpresaSelector from '@/components/EmpresaSelector';
import ProductCard from '@/components/ProductCard';
import CartFloatButton from '@/components/CartFloatButton';

export default function CatalogoPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [selectedEmpresa, setSelectedEmpresa] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [empRes, prodRes] = await Promise.all([
        supabase.from('empresas_convenio').select('*').eq('activa', true).order('nombre'),
        supabase.from('productos').select('*').eq('activo', true).order('nombre'),
      ]);

      if (empRes.data) setEmpresas(empRes.data);
      if (prodRes.data) setProductos(prodRes.data);
      setLoading(false);
    }
    loadData();
  }, []);

  const filteredProducts = selectedEmpresa
    ? productos.filter((p) => p.empresa_id === selectedEmpresa)
    : productos;

  const getEmpresa = (empresaId: string) =>
    empresas.find((e) => e.id === empresaId) || {
      id: empresaId,
      nombre: 'Sin empresa',
      logo_url: null,
      condiciones: null,
      forma_pago: null,
      activa: true,
    };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)' }}>
      <Header />

      {/* Hero Banner */}
      <section
        className="hero-gradient"
        style={{
          padding: '48px 24px 56px',
          textAlign: 'center',
          color: 'white',
        }}
      >
        <div className="relative z-10 max-w-3xl mx-auto animate-fade-in-up">
          <h1
            style={{
              fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
              fontWeight: 900,
              marginBottom: 14,
              letterSpacing: '-0.03em',
              lineHeight: 1.15,
            }}
          >
            Productos por Convenio
          </h1>
          <p
            style={{
              fontSize: '1.08rem',
              opacity: 0.85,
              maxWidth: 520,
              margin: '0 auto 24px',
              lineHeight: 1.6,
            }}
          >
            Selecciona los productos que necesitas de nuestras empresas aliadas.
            Tu pedido será procesado por la cooperativa.
          </p>
          <div
            style={{
              display: 'inline-flex',
              gap: 12,
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <span className="badge" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', padding: '8px 16px' }}>
              ✅ {empresas.length} Empresas aliadas
            </span>
            <span className="badge" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', padding: '8px 16px' }}>
              📦 {productos.length} Productos disponibles
            </span>
          </div>
        </div>
      </section>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
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
            <p style={{ color: 'var(--text-secondary)' }}>Cargando catálogo...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        ) : (
          <>
            {/* Empresa filter */}
            <div style={{ marginBottom: 36 }}>
              <EmpresaSelector
                empresas={empresas}
                selectedId={selectedEmpresa}
                onSelect={setSelectedEmpresa}
              />
            </div>

            {/* Selected company info */}
            {selectedEmpresa && (() => {
              const emp = getEmpresa(selectedEmpresa);
              return (
                <div
                  className="card-premium animate-fade-in-up"
                  style={{
                    padding: '24px 28px',
                    marginBottom: 32,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 20,
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 250 }}>
                    <h3
                      style={{
                        fontSize: '1.2rem',
                        fontWeight: 800,
                        marginBottom: 10,
                        color: 'var(--primary)',
                        margin: '0 0 10px',
                      }}
                    >
                      {emp.nombre}
                    </h3>
                    {emp.condiciones && (
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 8px' }}>
                        📋 <strong>Condiciones:</strong> {emp.condiciones}
                      </p>
                    )}
                    {emp.forma_pago && (
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>
                        💳 <strong>Forma de pago:</strong> {emp.forma_pago}
                      </p>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Products grid */}
            {filteredProducts.length === 0 ? (
              <div className="empty-state">
                <div style={{ fontSize: '4rem', marginBottom: 16 }}>📦</div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 8 }}>
                  No hay productos disponibles
                </h3>
                <p style={{ fontSize: '0.95rem' }}>
                  Pronto agregaremos productos. ¡Vuelve pronto!
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: 24,
                }}
              >
                {filteredProducts.map((producto, idx) => (
                  <div key={producto.id} style={{ animationDelay: `${idx * 0.08}s` }}>
                    <ProductCard
                      producto={producto}
                      empresa={getEmpresa(producto.empresa_id)}
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
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
          convenio.coicp.com.co
        </p>
      </footer>

      <CartFloatButton />
    </div>
  );
}
