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

function getLocalDateString(dateStr: string) {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface PedidoConDetalle extends Pedido {
  detalles: DetallePedido[];
}

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [mainTab, setMainTab] = useState<'pedidos' | 'gestion'>('pedidos');
  
  const [pedidos, setPedidos] = useState<PedidoConDetalle[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

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

  const deletePedido = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este pedido permanentemente?')) return;
    setLoading(true);
    // Primero borrar detalles por seguridad (si no hay cascade)
    await supabase.from('detalle_pedidos').delete().eq('pedido_id', id);
    const { error } = await supabase.from('pedidos').delete().eq('id', id);
    if (!error) {
      setPedidos(pedidos.filter(p => p.id !== id));
      setMensaje({ texto: 'Pedido eliminado', tipo: 'success' });
    }
    setLoading(false);
  };

  const toggleVistoBueno = async (pedidoId: string, campo: 'gestionado' | 'entregado', valorActual: boolean) => {
    const { error } = await supabase.from('pedidos').update({ [campo]: !valorActual }).eq('id', pedidoId);
    if (!error) setPedidos(pedidos.map(p => p.id === pedidoId ? { ...p, [campo]: !valorActual } : p));
  };

  const exportToCSV = () => {
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
    link.setAttribute("download", `reporte_pedidos.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredPedidos = pedidos.filter(p => {
    const pedDate = getLocalDateString(p.created_at);
    return (!startDate || pedDate >= startDate) && (!endDate || pedDate <= endDate);
  });

  // -- ACCIONES CATALOGO --
  const saveEmpresa = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await supabase.from('empresas_convenio').upsert([nuevaEmpresa]);
    setNuevaEmpresa({ nombre: '', logo_url: '', condiciones: '', forma_pago: '', activa: true });
    loadData();
    setMensaje({ texto: 'Empresa actualizada', tipo: 'success' });
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
    setMensaje({ texto: 'Producto actualizado', tipo: 'success' });
  };

  if (!isLoggedIn) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <form onSubmit={(e) => { e.preventDefault(); if (password === 'COICP2026') setIsLoggedIn(true); else alert('Clave incorrecta'); }} className="card-premium" style={{ padding: 40, textAlign: 'center' }}>
          <h2>Panel Administrativo</h2>
          <input type="password" className="input-premium" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} style={{ marginBottom: 20 }} />
          <button type="submit" className="btn-primary w-full">Ingresar</button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)' }}>
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div style={{ display: 'flex', gap: 12, marginBottom: 30, background: 'rgba(255,255,255,0.5)', padding: 8, borderRadius: 16, width: 'fit-content' }}>
          <button onClick={() => setMainTab('pedidos')} className={mainTab === 'pedidos' ? 'btn-primary' : 'btn-outline'} style={{ padding: '12px 28px' }}>📦 Módulo Pedidos</button>
          <button onClick={() => setMainTab('gestion')} className={mainTab === 'gestion' ? 'btn-primary' : 'btn-outline'} style={{ padding: '12px 28px' }}>⚙️ Módulo Catálogo</button>
        </div>

        {mensaje.texto && <div style={{ padding: 14, borderRadius: 12, background: '#d4edda', color: '#155724', marginBottom: 20, fontWeight: 700 }}>{mensaje.texto}</div>}

        {mainTab === 'pedidos' ? (
          <div className="animate-fade-in">
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <h1 style={{ fontSize: '1.8rem', fontWeight: 900, margin: '0 0 4px' }}>📊 Reporte de Pedidos</h1>
                  <button onClick={() => { const today = getLocalDateString(new Date().toISOString()); setStartDate(today); setEndDate(today); }} className="btn-outline" style={{ padding: '4px 12px', fontSize: '0.75rem' }}>📅 Ver Solo Hoy</button>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                   <input type="date" className="input-premium" style={{ width: 140, padding: 8 }} value={startDate} onChange={e => setStartDate(e.target.value)} />
                   <input type="date" className="input-premium" style={{ width: 140, padding: 8 }} value={endDate} onChange={e => setEndDate(e.target.value)} />
                   <button onClick={exportToCSV} className="btn-success">📊 Excel (.csv)</button>
                </div>
             </div>

             <div style={{ display: 'grid', gap: 14 }}>
               {filteredPedidos.map(p => (
                 <div key={p.id} className="card-premium" style={{ padding: '18px 24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                       <div>
                          <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>{p.nombre_asociado}</div>
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                            CC: {p.cedula} · 🏢 {p.empresa_trabaja} · {formatDate(p.created_at)}
                          </div>
                       </div>
                       <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                          <div style={{ display: 'flex', gap: 16 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', color: p.gestionado ? 'var(--success)' : '#bbb' }}>
                               <input type="checkbox" checked={p.gestionado} onChange={() => toggleVistoBueno(p.id, 'gestionado', p.gestionado)} style={{ width: 18, height: 18 }} /> GESTIONADO
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', color: p.entregado ? 'var(--info)' : '#bbb' }}>
                               <input type="checkbox" checked={p.entregado} onChange={() => toggleVistoBueno(p.id, 'entregado', p.entregado)} style={{ width: 18, height: 18 }} /> ENTREGADO
                            </label>
                          </div>
                          <div className="price-tag" style={{ fontSize: '1.1rem' }}>{formatPrice(p.total)}</div>
                          <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={() => deletePedido(p.id)} title="Eliminar pedido" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#e74c3c' }}>🗑️</button>
                            <button onClick={() => setExpandedId(expandedId === p.id ? null : p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>{expandedId === p.id ? '▲' : '▼'}</button>
                          </div>
                       </div>
                    </div>
                    {expandedId === p.id && (
                      <div style={{ marginTop: 20, borderTop: '2px solid var(--border)', paddingTop: 20 }}>
                         <table className="summary-table" style={{ fontSize: '0.9rem' }}>
                            <thead><tr><th>Empresa</th><th>Producto</th><th>Cant.</th><th>Subtotal</th></tr></thead>
                            <tbody>{p.detalles.map(d => <tr key={d.id}><td>{d.empresa_nombre}</td><td>{d.producto_nombre}</td><td>{d.cantidad}</td><td>{formatPrice(d.valor_total)}</td></tr>)}</tbody>
                         </table>
                         <div style={{ marginTop: 14 }}><Link href={`/pedido/${p.id}`} className="btn-outline" style={{ display: 'inline-block', fontSize: '0.8rem', textDecoration: 'none' }}>👁️ Ver Recibo</Link></div>
                      </div>
                    )}
                 </div>
               ))}
               {filteredPedidos.length === 0 && <p style={{ textAlign: 'center', padding: 40, opacity: 0.5 }}>No hay pedidos en este rango de fecha.</p>}
             </div>
          </div>
        ) : (
          <div className="animate-fade-in">
             <div style={{ display: 'flex', gap: 10, marginBottom: 30 }}>
                <button onClick={() => setGestionTab('empresas')} className={gestionTab === 'empresas' ? 'btn-primary' : 'btn-outline'}>🏢 Empresas</button>
                <button onClick={() => setGestionTab('productos')} className={gestionTab === 'productos' ? 'btn-primary' : 'btn-outline'}>📦 Productos</button>
             </div>
             {/* ... (resto del catálogo) ... */}
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 32 }}>
                {gestionTab === 'empresas' ? (
                  <>
                   <div className="card-premium" style={{ padding: 32 }}>
                      <h2 style={{ fontWeight: 900, marginBottom: 24 }}>🏢 Empresa / Convenio</h2>
                      <form onSubmit={saveEmpresa} style={{ display: 'grid', gap: 16 }}>
                         <div><label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: 6, display: 'block' }}>NOMBRE</label><input className="input-premium" value={nuevaEmpresa.nombre} onChange={e => setNuevaEmpresa({...nuevaEmpresa, nombre: e.target.value})} required /></div>
                         <div><label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: 6, display: 'block' }}>CONDICIONES</label><textarea className="input-premium" style={{ height: 100 }} value={nuevaEmpresa.condiciones || ''} onChange={e => setNuevaEmpresa({...nuevaEmpresa, condiciones: e.target.value})} /></div>
                         <div><label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: 6, display: 'block' }}>FORMA DE PAGO</label><input className="input-premium" value={nuevaEmpresa.forma_pago || ''} onChange={e => setNuevaEmpresa({...nuevaEmpresa, forma_pago: e.target.value})} /></div>
                         <button type="submit" className="btn-success">Guardar Empresa</button>
                      </form>
                   </div>
                   <div className="card-premium" style={{ padding: 32 }}>
                      {empresas.map(e => (
                        <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', padding: 14, borderBottom: '1px solid var(--border)' }}>
                          <strong>{e.nombre}</strong>
                          <div style={{ display: 'flex', gap: 8 }}><button onClick={() => setNuevaEmpresa(e)}>✏️</button></div>
                        </div>
                      ))}
                   </div>
                  </>
                ) : (
                  <>
                   <div className="card-premium" style={{ padding: 32 }}>
                      <h2 style={{ fontWeight: 900, marginBottom: 24 }}>📦 Producto</h2>
                      <form onSubmit={saveProducto} style={{ display: 'grid', gap: 16 }}>
                         <select className="input-premium" value={nuevoProducto.empresa_id} onChange={e => setNuevoProducto({...nuevoProducto, empresa_id: e.target.value})} required>
                           <option value="">Empresa...</option>
                           {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                         </select>
                         <input className="input-premium" placeholder="Nombre" value={nuevoProducto.nombre} onChange={e => setNuevoProducto({...nuevoProducto, nombre: e.target.value})} required />
                         <input type="number" className="input-premium" placeholder="Precio" value={nuevoProducto.valor_unitario} onChange={e => setNuevoProducto({...nuevoProducto, valor_unitario: Number(e.target.value)})} required />
                         <button type="submit" className="btn-success">Guardar Producto</button>
                      </form>
                   </div>
                   <div className="card-premium" style={{ padding: 32 }}>
                      {productos.map(p => (
                        <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: 14, borderBottom: '1px solid var(--border)' }}>
                          <span>{p.nombre}</span>
                          <div style={{ display: 'flex', gap: 8 }}><button onClick={() => setNuevoProducto(p)}>✏️</button></div>
                        </div>
                      ))}
                   </div>
                  </>
                )}
             </div>
          </div>
        )}
      </main>
    </div>
  );
}
