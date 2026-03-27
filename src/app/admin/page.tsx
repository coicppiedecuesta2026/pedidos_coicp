'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabaseClient';
import type { Pedido, DetallePedido, Empresa, Producto } from '@/types';
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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [mainTab, setMainTab] = useState<'pedidos' | 'gestion'>('pedidos');
  
  // Estado Pedidos
  const [pedidos, setPedidos] = useState<PedidoConDetalle[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Estado Gestión Catálogo
  const [gestionTab, setGestionTab] = useState<'empresas' | 'productos'>('empresas');
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [nuevaEmpresa, setNuevaEmpresa] = useState<Partial<Empresa>>({
    nombre: '', logo_url: '', condiciones: '', forma_pago: '', activa: true
  });
  const [productos, setProductos] = useState<Producto[]>([]);
  const [nuevoProducto, setNuevoProducto] = useState<Partial<Producto>>({
    empresa_id: '', nombre: '', descripcion: '', imagen_url: '', valor_unitario: 0, activo: true
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

  useEffect(() => {
    if (isLoggedIn) {
      loadData();
    }
  }, [isLoggedIn]);

  async function loadData() {
    setLoading(true);
    // Cargar Pedidos
    const { data: pData } = await supabase.from('pedidos').select('*').order('created_at', { ascending: false });
    const { data: dData } = await supabase.from('detalle_pedidos').select('*');
    
    // Cargar Catálogo
    const { data: empData } = await supabase.from('empresas_convenio').select('*').order('nombre');
    const { data: prodData } = await supabase.from('productos').select('*').order('nombre');

    if (pData) {
      const pedidosConDetalle: PedidoConDetalle[] = pData.map((p) => ({
        ...p,
        detalles: (dData || []).filter((d) => d.pedido_id === p.id),
      }));
      setPedidos(pedidosConDetalle);
    }
    
    if (empData) setEmpresas(empData);
    if (prodData) setProductos(prodData);
    setLoading(false);
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'COICP2026') {
      setIsLoggedIn(true);
    } else {
      alert('Contraseña incorrecta');
    }
  };

  const toggleVistoBueno = async (pedidoId: string, campo: 'gestionado' | 'entregado', valorActual: boolean) => {
    const { error } = await supabase
      .from('pedidos')
      .update({ [campo]: !valorActual })
      .eq('id', pedidoId);
    
    if (!error) {
      setPedidos(pedidos.map(p => p.id === pedidoId ? { ...p, [campo]: !valorActual } : p));
    }
  };

  const filteredPedidos = pedidos.filter((p) => {
    const pedDate = new Date(p.created_at).toISOString().split('T')[0];
    const passStart = !startDate || pedDate >= startDate;
    const passEnd = !endDate || pedDate <= endDate;
    return passStart && passEnd;
  });

  const exportToCSV = () => {
    let csv = "Fecha,Nombre Completo,Cedula,Empresa-Pagaduria,Item Solicitado,Cantidad,Subtotal,Gestionado,Entregado\n";
    filteredPedidos.forEach(p => {
      p.detalles.forEach(d => {
        csv += `${new Date(p.created_at).toLocaleDateString()},"${p.nombre_asociado}",${p.cedula},"${p.empresa_trabaja || ''}","${d.producto_nombre}",${d.cantidad},${d.valor_total},${p.gestionado ? 'SI' : 'NO'},${p.entregado ? 'SI' : 'NO'}\n`;
      });
    });
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `pedidos_coicp.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Lógica de Catálogo (Idéntica a la anterior pero integrada) ---
  const saveEmpresa = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await supabase.from('empresas_convenio').upsert([nuevaEmpresa]);
    setMensaje({ texto: 'Empresa guardada', tipo: 'success' });
    setNuevaEmpresa({ nombre: '', logo_url: '', condiciones: '', forma_pago: '', activa: true });
    loadData();
  };

  const saveProducto = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    let finalUrl = nuevoProducto.imagen_url;
    if (imageFile) {
      const ext = imageFile.name.split('.').pop();
      const path = `productos/${Math.random()}.${ext}`;
      await supabase.storage.from('imagenes').upload(path, imageFile);
      const { data } = supabase.storage.from('imagenes').getPublicUrl(path);
      finalUrl = data.publicUrl;
    }
    await supabase.from('productos').upsert([{ ...nuevoProducto, imagen_url: finalUrl }]);
    setMensaje({ texto: 'Producto guardado', tipo: 'success' });
    setNuevoProducto({ empresa_id: '', nombre: '', descripcion: '', imagen_url: '', valor_unitario: 0, activo: true });
    setImageFile(null);
    loadData();
  };

  if (!isLoggedIn) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card-premium" style={{ padding: 40, maxWidth: 400, width: '90%', textAlign: 'center' }}>
          <h1 style={{ fontWeight: 800, marginBottom: 20 }}>Acceso Panel Admin</h1>
          <form onSubmit={handleLogin}>
            <input type="password" className="input-premium" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} style={{ marginBottom: 20 }} />
            <button type="submit" className="btn-primary w-full" style={{ width: '100%' }}>Entrar al Sistema</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)' }}>
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Navegación de Módulos */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 30, background: 'rgba(255,255,255,0.5)', padding: 8, borderRadius: 16, width: 'fit-content' }}>
          <button onClick={() => setMainTab('pedidos')} className={mainTab === 'pedidos' ? 'btn-primary' : 'btn-outline'} style={{ padding: '10px 24px' }}>📦 Módulo Pedidos</button>
          <button onClick={() => setMainTab('gestion')} className={mainTab === 'gestion' ? 'btn-primary' : 'btn-outline'} style={{ padding: '10px 14px' }}>⚙️ Módulo Catálogo</button>
        </div>

        {mainTab === 'pedidos' ? (
          <div className="animate-fade-in">
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 900, margin: 0 }}>📊 Reporte de Pedidos</h1>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <input type="date" className="input-premium" style={{ width: 140, padding: 8 }} value={startDate} onChange={e => setStartDate(e.target.value)} />
                  <input type="date" className="input-premium" style={{ width: 140, padding: 8 }} value={endDate} onChange={e => setEndDate(e.target.value)} />
                  <button onClick={exportToCSV} className="btn-success">📊 Excel</button>
                </div>
             </div>

             <div style={{ display: 'grid', gap: 12 }}>
                {filteredPedidos.map(pedido => (
                  <div key={pedido.id} className="card-premium" style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ fontWeight: 700 }}>{pedido.nombre_asociado}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>CC: {pedido.cedula} · {formatDate(pedido.created_at)}</div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                        {/* Vistos Buenos */}
                        <div style={{ display: 'flex', gap: 16 }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', color: pedido.gestionado ? 'var(--success)' : 'var(--text-light)' }}>
                            <input type="checkbox" checked={pedido.gestionado} onChange={() => toggleVistoBueno(pedido.id, 'gestionado', pedido.gestionado)} />
                            GESTIONADO
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', color: pedido.entregado ? 'var(--info)' : 'var(--text-light)' }}>
                            <input type="checkbox" checked={pedido.entregado} onChange={() => toggleVistoBueno(pedido.id, 'entregado', pedido.entregado)} />
                            ENTREGADO
                          </label>
                        </div>
                        <div className="price-tag">{formatPrice(pedido.total)}</div>
                        <button onClick={() => setExpandedId(expandedId === pedido.id ? null : pedido.id)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>{expandedId === pedido.id ? '▲' : '▼'}</button>
                      </div>
                    </div>

                    {expandedId === pedido.id && (
                      <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                        <table className="summary-table" style={{ fontSize: '0.85rem' }}>
                          <thead>
                            <tr><th>Empresa</th><th>Producto</th><th>Cant.</th><th>Subtotal</th></tr>
                          </thead>
                          <tbody>
                            {pedido.detalles.map(d => (
                              <tr key={d.id}><td>{d.empresa_nombre}</td><td>{d.producto_nombre}</td><td>{d.cantidad}</td><td>{formatPrice(d.valor_total)}</td></tr>
                            ))}
                          </tbody>
                        </table>
                        <div style={{ marginTop: 12 }}>
                          <Link href={`/pedido/${pedido.id}`} className="btn-outline" style={{ fontSize: '0.75rem', padding: '6px 12px', textDecoration: 'none' }}>👁️ Ver Recibo</Link>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
             </div>
          </div>
        ) : (
          <div className="animate-fade-in">
            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              <button onClick={() => setGestionTab('empresas')} className={gestionTab === 'empresas' ? 'btn-primary' : 'btn-outline'}>🏢 Empresas</button>
              <button onClick={() => setGestionTab('productos')} className={gestionTab === 'productos' ? 'btn-primary' : 'btn-outline'}>📦 Productos</button>
            </div>
            
            {gestionTab === 'empresas' ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
                <div className="card-premium" style={{ padding: 24 }}>
                  <h3>Nueva Empresa</h3>
                  <form onSubmit={saveEmpresa} style={{ display: 'grid', gap: 12 }}>
                    <input className="input-premium" placeholder="Nombre" value={nuevaEmpresa.nombre} onChange={e => setNuevaEmpresa({...nuevaEmpresa, nombre: e.target.value})} required />
                    <textarea className="input-premium" placeholder="Condiciones" value={nuevaEmpresa.condiciones || ''} onChange={e => setNuevaEmpresa({...nuevaEmpresa, condiciones: e.target.value})} />
                    <input className="input-premium" placeholder="Forma de pago" value={nuevaEmpresa.forma_pago || ''} onChange={e => setNuevaEmpresa({...nuevaEmpresa, forma_pago: e.target.value})} />
                    <button type="submit" className="btn-success">Guardar</button>
                  </form>
                </div>
                <div className="card-premium" style={{ padding: 24 }}>
                  <h3>Listado</h3>
                  {empresas.map(e => <div key={e.id} style={{ padding: 8, borderBottom: '1px solid #eee' }}>{e.nombre}</div>)}
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
                <div className="card-premium" style={{ padding: 24 }}>
                  <h3>Nuevo Producto</h3>
                  <form onSubmit={saveProducto} style={{ display: 'grid', gap: 12 }}>
                    <select className="input-premium" value={nuevoProducto.empresa_id} onChange={e => setNuevoProducto({...nuevoProducto, empresa_id: e.target.value})} required>
                      <option value="">Empresa...</option>
                      {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                    </select>
                    <input className="input-premium" placeholder="Nombre" value={nuevoProducto.nombre} onChange={e => setNuevoProducto({...nuevoProducto, nombre: e.target.value})} required />
                    <input type="file" onChange={e => setImageFile(e.target.files ? e.target.files[0] : null)} />
                    <input type="number" className="input-premium" placeholder="Precio" value={nuevoProducto.valor_unitario} onChange={e => setNuevoProducto({...nuevoProducto, valor_unitario: Number(e.target.value)})} required />
                    <button type="submit" className="btn-success">Guardar</button>
                  </form>
                </div>
                <div className="card-premium" style={{ padding: 24 }}>
                   <h3>Listado</h3>
                   {productos.map(p => <div key={p.id} style={{ padding: 8, borderBottom: '1px solid #eee' }}>{p.nombre} - {formatPrice(p.valor_unitario)}</div>)}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
