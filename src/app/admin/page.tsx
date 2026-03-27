'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabaseClient';
import type { Pedido, DetallePedido, Empresa, Producto } from '@/types';
import Header from '@/components/Header';
import Link from 'next/link';

function formatPrice(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-CO', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

interface PedidoConDetalle extends Pedido {
  detalles: DetallePedido[];
}

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [mainTab, setMainTab] = useState<'pedidos' | 'gestion'>('pedidos');
  
  // Pedidos
  const [pedidos, setPedidos] = useState<PedidoConDetalle[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Catálogo
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
    if (isLoggedIn) loadData();
  }, [isLoggedIn]);

  async function loadData() {
    setLoading(true);
    const { data: pData } = await supabase.from('pedidos').select('*').order('created_at', { ascending: false });
    const { data: dData } = await supabase.from('detalle_pedidos').select('*');
    const { data: empData } = await supabase.from('empresas_convenio').select('*').order('nombre');
    const { data: prodData } = await supabase.from('productos').select('*').order('nombre');

    if (pData) {
      setPedidos(pData.map(p => ({ ...p, detalles: (dData || []).filter(d => d.pedido_id === p.id) })));
    }
    if (empData) setEmpresas(empData);
    if (prodData) setProductos(prodData);
    setLoading(false);
  }

  const setTodayFilter = () => {
    const today = new Date().toISOString().split('T')[0];
    setStartDate(today);
    setEndDate(today);
  };

  const toggleVistoBueno = async (pedidoId: string, campo: 'gestionado' | 'entregado', valorActual: boolean) => {
    const { error } = await supabase.from('pedidos').update({ [campo]: !valorActual }).eq('id', pedidoId);
    if (!error) setPedidos(pedidos.map(p => p.id === pedidoId ? { ...p, [campo]: !valorActual } : p));
  };

  const filteredPedidos = pedidos.filter(p => {
    const pedDate = new Date(p.created_at).toISOString().split('T')[0];
    return (!startDate || pedDate >= startDate) && (!endDate || pedDate <= endDate);
  });

  const exportToCSV = () => {
    // Uso de punto y coma (;) para compatibilidad con Excel en español
    let csv = "Fecha;Nombre Completo;Cedula;Empresa-Pagaduria;Item Solicitado;Cantidad;Subtotal;Gestionado;Entregado\n";
    filteredPedidos.forEach(p => {
      p.detalles.forEach(d => {
        csv += `${new Date(p.created_at).toLocaleDateString()};${p.nombre_asociado};${p.cedula};${p.empresa_trabaja || ''};${d.producto_nombre};${d.cantidad};${d.valor_total};${p.gestionado ? 'SI' : 'NO'};${p.entregado ? 'SI' : 'NO'}\n`;
      });
    });
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `reporte_coicp_${startDate || 'historico'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Acciones ---
  const saveEmpresa = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await supabase.from('empresas_convenio').upsert([nuevaEmpresa]);
    setNuevaEmpresa({ nombre: '', logo_url: '', condiciones: '', forma_pago: '', activa: true });
    loadData();
    setMensaje({ texto: 'Empresa guardada', tipo: 'success' });
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
    setNuevoProducto({ empresa_id: '', nombre: '', descripcion: '', imagen_url: '', valor_unitario: 0, activo: true });
    setImageFile(null);
    loadData();
    setMensaje({ texto: 'Producto guardado', tipo: 'success' });
  };

  const deleteEmpresa = async (id: string) => { if (confirm('¿Eliminar empresa?')) { await supabase.from('empresas_convenio').delete().eq('id', id); loadData(); } };
  const deleteProducto = async (id: string) => { if (confirm('¿Eliminar producto?')) { await supabase.from('productos').delete().eq('id', id); loadData(); } };

  if (!isLoggedIn) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <form onSubmit={(e) => { e.preventDefault(); if (password === 'COICP2026') setIsLoggedIn(true); else alert('Error'); }} className="card-premium" style={{ padding: 40, textAlign: 'center' }}>
          <h1 style={{ marginBottom: 20 }}>Panel Admin</h1>
          <input type="password" className="input-premium" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} style={{ marginBottom: 20 }} />
          <button type="submit" className="btn-primary" style={{ width: '100%' }}>Entrar</button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)' }}>
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div style={{ display: 'flex', gap: 12, marginBottom: 30, background: 'rgba(255,255,255,0.5)', padding: 8, borderRadius: 16, width: 'fit-content' }}>
          <button onClick={() => setMainTab('pedidos')} className={mainTab === 'pedidos' ? 'btn-primary' : 'btn-outline'}>📦 Pedidos</button>
          <button onClick={() => setMainTab('gestion')} className={mainTab === 'gestion' ? 'btn-primary' : 'btn-outline'}>⚙️ Catálogo</button>
        </div>

        {mensaje.texto && <div style={{ background: '#d4edda', color: '#155724', padding: 12, borderRadius: 10, marginBottom: 20 }}>{mensaje.texto}</div>}

        {mainTab === 'pedidos' ? (
          <div className="animate-fade-in">
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <h1 style={{ fontSize: '1.8rem', fontWeight: 900, margin: '0 0 8px' }}>Reporte de Pedidos</h1>
                  <button onClick={setTodayFilter} className="btn-outline" style={{ padding: '4px 12px', fontSize: '0.75rem' }}>📅 Ver Solo Hoy</button>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <input type="date" className="input-premium" style={{ width: 140, padding: 8 }} value={startDate} onChange={e => setStartDate(e.target.value)} />
                  <input type="date" className="input-premium" style={{ width: 140, padding: 8 }} value={endDate} onChange={e => setEndDate(e.target.value)} />
                  <button onClick={exportToCSV} className="btn-success">📊 Bajar Excel (.csv)</button>
                </div>
             </div>

             <div style={{ display: 'grid', gap: 12 }}>
                {filteredPedidos.map(pedido => (
                  <div key={pedido.id} className="card-premium" style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{pedido.nombre_asociado}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                           CC: {pedido.cedula} · 🏢 {pedido.empresa_trabaja} · {formatDate(pedido.created_at)}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', color: pedido.gestionado ? 'var(--success)' : '#999' }}>
                          <input type="checkbox" checked={pedido.gestionado} onChange={() => toggleVistoBueno(pedido.id, 'gestionado', pedido.gestionado)} />
                          GESTIONADO
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', color: pedido.entregado ? 'var(--info)' : '#999' }}>
                          <input type="checkbox" checked={pedido.entregado} onChange={() => toggleVistoBueno(pedido.id, 'entregado', pedido.entregado)} />
                          ENTREGADO
                        </label>
                        <div className="price-tag">{formatPrice(pedido.total)}</div>
                        <button onClick={() => setExpandedId(expandedId === pedido.id ? null : pedido.id)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>{expandedId === pedido.id ? '▲' : '▼'}</button>
                      </div>
                    </div>
                    {expandedId === pedido.id && (
                      <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                         <table className="summary-table" style={{ fontSize: '0.85rem' }}>
                            <thead><tr><th>Empresa</th><th>Producto</th><th>Cant.</th><th>Subtotal</th></tr></thead>
                            <tbody>{pedido.detalles.map(d => <tr key={d.id}><td>{d.empresa_nombre}</td><td>{d.producto_nombre}</td><td>{d.cantidad}</td><td>{formatPrice(d.valor_total)}</td></tr>)}</tbody>
                         </table>
                         <div style={{ marginTop: 10 }}><Link href={`/pedido/${pedido.id}`} style={{ fontSize: '0.8rem', fontWeight: 600 }}>👁️ Ver Recibo</Link></div>
                      </div>
                    )}
                  </div>
                ))}
             </div>
          </div>
        ) : (
          <div className="animate-fade-in">
            <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
              <button onClick={() => setGestionTab('empresas')} className={gestionTab === 'empresas' ? 'btn-primary' : 'btn-outline'}>🏢 Empresas</button>
              <button onClick={() => setGestionTab('productos')} className={gestionTab === 'productos' ? 'btn-primary' : 'btn-outline'}>📦 Productos</button>
            </div>
            
            {gestionTab === 'empresas' ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 30 }}>
                <div className="card-premium" style={{ padding: 28 }}>
                  <h2 style={{ fontWeight: 800, marginBottom: 16 }}>Empresa</h2>
                  <form onSubmit={saveEmpresa} style={{ display: 'grid', gap: 12 }}>
                    <input className="input-premium" placeholder="Nombre" value={nuevaEmpresa.nombre} onChange={e => setNuevaEmpresa({...nuevaEmpresa, nombre: e.target.value})} required />
                    <input className="input-premium" placeholder="URL Logo" value={nuevaEmpresa.logo_url || ''} onChange={e => setNuevaEmpresa({...nuevaEmpresa, logo_url: e.target.value})} />
                    <textarea className="input-premium" placeholder="Condiciones" style={{ height: 100 }} value={nuevaEmpresa.condiciones || ''} onChange={e => setNuevaEmpresa({...nuevaEmpresa, condiciones: e.target.value})} />
                    <input className="input-premium" placeholder="Forma de Pago" value={nuevaEmpresa.forma_pago || ''} onChange={e => setNuevaEmpresa({...nuevaEmpresa, forma_pago: e.target.value})} />
                    <button type="submit" className="btn-success">Guardar Empresa</button>
                  </form>
                </div>
                <div className="card-premium" style={{ padding: 28 }}>
                  <h2 style={{ fontWeight: 800, marginBottom: 16 }}>Lista de Empresas</h2>
                  {empresas.map(e => (
                    <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #eee' }}>
                      <div style={{ fontWeight: 600 }}>{e.nombre}</div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => setNuevaEmpresa(e)} className="btn-outline" style={{ padding: '2px 8px' }}>✏️</button>
                        <button onClick={() => deleteEmpresa(e.id)} className="btn-outline" style={{ padding: '2px 8px' }}>🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 30 }}>
                <div className="card-premium" style={{ padding: 28 }}>
                  <h2 style={{ fontWeight: 800, marginBottom: 16 }}>Producto</h2>
                  <form onSubmit={saveProducto} style={{ display: 'grid', gap: 12 }}>
                    <select className="input-premium" value={nuevoProducto.empresa_id} onChange={e => setNuevoProducto({...nuevoProducto, empresa_id: e.target.value})} required>
                      <option value="">Seleccionar Empresa...</option>
                      {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                    </select>
                    <input className="input-premium" placeholder="Nombre Producto" value={nuevoProducto.nombre} onChange={e => setNuevoProducto({...nuevoProducto, nombre: e.target.value})} required />
                    <textarea className="input-premium" placeholder="Descripción" value={nuevoProducto.descripcion || ''} onChange={e => setNuevoProducto({...nuevoProducto, descripcion: e.target.value})} />
                    <div style={{ padding: 10, border: '2px dashed #ddd', borderRadius: 10, textAlign: 'center' }}>
                      <input type="file" onChange={e => setImageFile(e.target.files ? e.target.files[0] : null)} />
                    </div>
                    <input className="input-premium" type="number" placeholder="Precio" value={nuevoProducto.valor_unitario} onChange={e => setNuevoProducto({...nuevoProducto, valor_unitario: Number(e.target.value)})} required />
                    <button type="submit" className="btn-success">Guardar Producto</button>
                  </form>
                </div>
                <div className="card-premium" style={{ padding: 28 }}>
                   <h2 style={{ fontWeight: 800, marginBottom: 16 }}>Lista de Productos</h2>
                   <div style={{ maxHeight: 600, overflowY: 'auto' }}>
                     {productos.map(p => (
                        <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #eee' }}>
                          <div>{p.nombre} - <strong>{formatPrice(p.valor_unitario)}</strong></div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => setNuevoProducto(p)} className="btn-outline" style={{ padding: '2px 8px' }}>✏️</button>
                            <button onClick={() => deleteProducto(p.id)} className="btn-outline" style={{ padding: '2px 8px' }}>🗑️</button>
                          </div>
                        </div>
                     ))}
                   </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
