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
  const [logoFile, setLogoFile] = useState<File | null>(null);

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

    if (pData) setPedidos(pData.map(p => ({ ...p, detalles: (dData || []).filter(d => d.pedido_id === p.id) })));
    if (empData) setEmpresas(empData);
    if (prodData) setProductos(prodData);
    setLoading(false);
  }

  const deletePedido = async (id: string) => {
    if (!confirm('¿Estás SEGURO de eliminar este pedido permanentemente?')) return;
    setLoading(true);
    try {
      await supabase.from('detalle_pedidos').delete().eq('pedido_id', id);
      const { error } = await supabase.from('pedidos').delete().eq('id', id);
      if (error) throw error;
      setPedidos(pedidos.filter(p => p.id !== id));
      setMensaje({ texto: 'Pedido eliminado ✅', tipo: 'success' });
    } catch (err: any) { alert("Error al borrar: " + err.message); }
    finally { setLoading(false); setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000); }
  };

  const toggleVistoBueno = async (pedidoId: string, campo: 'gestionado' | 'entregado', valorActual: boolean) => {
    await supabase.from('pedidos').update({ [campo]: !valorActual }).eq('id', pedidoId);
    setPedidos(pedidos.map(p => p.id === pedidoId ? { ...p, [campo]: !valorActual } : p));
  };

  const exportToCSV = () => {
    let csv = "Fecha;Nombre Completo;Cedula;Item Solicitado;Cantidad;Subtotal;Gestionado;Entregado\n";
    filteredPedidos.forEach(p => {
      p.detalles.forEach(d => {
        csv += `${new Date(p.created_at).toLocaleDateString()};${p.nombre_asociado};${p.cedula};${d.producto_nombre};${d.cantidad};${d.valor_total};${p.gestionado ? 'SI' : 'NO'};${p.entregado ? 'SI' : 'NO'}\n`;
      });
    });
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `reporte_coicp.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredPedidos = pedidos.filter(p => {
    const pedDate = getLocalDateString(p.created_at);
    return (!startDate || pedDate >= startDate) && (!endDate || pedDate <= endDate);
  });

  const saveEmpresa = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    let finalLogoUrl = nuevaEmpresa.logo_url;

    if (logoFile) {
      const ext = logoFile.name.split('.').pop();
      const path = `logos/${Math.random()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('logo').upload(path, logoFile);
      if (!uploadError) {
        const { data } = supabase.storage.from('logo').getPublicUrl(path);
        finalLogoUrl = data.publicUrl;
      }
    }

    await supabase.from('empresas_convenio').upsert([{ ...nuevaEmpresa, logo_url: finalLogoUrl }]);
    setMensaje({ texto: 'Empresa guardada con éxito', tipo: 'success' });
    setNuevaEmpresa({ nombre: '', logo_url: '', condiciones: '', forma_pago: '', activa: true });
    setLogoFile(null);
    loadData();
    setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
    setLoading(false);
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
    setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
    setLoading(false);
  };

  if (!isLoggedIn) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <form onSubmit={(e) => { e.preventDefault(); if (password === 'COICP2026') setIsLoggedIn(true); else alert('Incorrecto'); }} className="card-premium" style={{ padding: 40, textAlign: 'center' }}>
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
          <button onClick={() => setMainTab('pedidos')} className={mainTab === 'pedidos' ? 'btn-primary shadow' : 'btn-outline'}>📦 Módulo Pedidos</button>
          <button onClick={() => setMainTab('gestion')} className={mainTab === 'gestion' ? 'btn-primary shadow' : 'btn-outline'}>⚙️ Módulo Catálogo</button>
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
                       <div><div style={{ fontWeight: 800 }}>{p.nombre_asociado}</div><div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>CC: {p.cedula} · {formatDate(p.created_at)}</div></div>
                       <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                          <label style={{ fontSize: '0.75rem', color: p.gestionado ? 'var(--success)' : '#bbb' }}><input type="checkbox" checked={p.gestionado} onChange={() => toggleVistoBueno(p.id, 'gestionado', p.gestionado)} /> GESTIONADO</label>
                          <label style={{ fontSize: '0.75rem', color: p.entregado ? 'var(--info)' : '#bbb' }}><input type="checkbox" checked={p.entregado} onChange={() => toggleVistoBueno(p.id, 'entregado', p.entregado)} /> ENTREGADO</label>
                          <button onClick={() => deletePedido(p.id)} style={{ color: '#e74c3c' }}>🗑️</button>
                          <button onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}>{expandedId === p.id ? '▲' : '▼'}</button>
                       </div>
                    </div>
                    {expandedId === p.id && (
                      <div style={{ marginTop: 20, borderTop: '2px solid var(--border)', paddingTop: 20 }}>
                         <table className="summary-table">
                            <thead><tr><th>Empresa</th><th>Producto</th><th>Subtotal</th></tr></thead>
                            <tbody>{p.detalles.map((d, i) => <tr key={i}><td>{d.empresa_nombre}</td><td>{d.producto_nombre} ({d.cantidad})</td><td>{formatPrice(d.valor_total)}</td></tr>)}</tbody>
                         </table>
                         <div style={{ marginTop: 14 }}><Link href={`/pedido/${p.id}`} className="btn-outline">👁️ Ver Recibo</Link></div>
                      </div>
                    )}
                 </div>
               ))}
             </div>
          </div>
        ) : (
          <div className="animate-fade-in">
             <div style={{ display: 'flex', gap: 10, marginBottom: 30 }}>
                <button onClick={() => setGestionTab('empresas')} className={gestionTab === 'empresas' ? 'btn-primary' : 'btn-outline'}>🏢 Empresas</button>
                <button onClick={() => setGestionTab('productos')} className={gestionTab === 'productos' ? 'btn-primary' : 'btn-outline'}>📦 Productos</button>
             </div>

             {gestionTab === 'empresas' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 32 }}>
                   <div className="card-premium" style={{ padding: 32 }}>
                      <h2 style={{ fontWeight: 900, marginBottom: 24 }}>🏢 {nuevaEmpresa.id ? 'Editar' : 'Nueva'} Empresa</h2>
                      <form onSubmit={saveEmpresa} style={{ display: 'grid', gap: 16 }}>
                         <div><label style={{ fontSize: '0.8rem', fontWeight: 700 }}>NOMBRE DE EMPRESA</label><input className="input-premium" value={nuevaEmpresa.nombre} onChange={e => setNuevaEmpresa({...nuevaEmpresa, nombre: e.target.value})} required /></div>
                         
                         <div style={{ padding: 18, border: '2px dashed var(--border)', borderRadius: 12, textAlign: 'center' }}>
                            {nuevaEmpresa.logo_url && (
                               <div style={{ marginBottom: 16 }}>
                                  <img src={nuevaEmpresa.logo_url} style={{ width: 80, height: 80, objectFit: 'contain', display: 'block', margin: '0 auto 10px' }} />
                                  <button type="button" onClick={() => setNuevaEmpresa({...nuevaEmpresa, logo_url: ''})} style={{ fontSize: '0.75rem', color: '#e74c3c', textDecoration: 'underline' }}>🗑️ Quitar este logo</button>
                               </div>
                            )}
                            <label style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 12, display: 'block' }}>🖼️ Subir Nuevo Logo</label>
                            <input type="file" accept="image/*" onChange={e => setLogoFile(e.target.files ? e.target.files[0] : null)} />
                         </div>

                         <div><label style={{ fontSize: '0.8rem', fontWeight: 700 }}>CONDICIONES</label><textarea className="input-premium" style={{ height: 100 }} value={nuevaEmpresa.condiciones || ''} onChange={e => setNuevaEmpresa({...nuevaEmpresa, condiciones: e.target.value})} /></div>
                         <div><label style={{ fontSize: '0.8rem', fontWeight: 700 }}>FORMA DE PAGO</label><input className="input-premium" value={nuevaEmpresa.forma_pago || ''} onChange={e => setNuevaEmpresa({...nuevaEmpresa, forma_pago: e.target.value})} /></div>
                         
                         <div style={{ display: 'flex', gap: 10 }}>
                            <button type="submit" className="btn-success w-full">Guardar Empresa</button>
                            <button type="button" onClick={() => {setNuevaEmpresa({nombre:'',logo_url:'',condiciones:'',forma_pago:'',activa:true}); setLogoFile(null);}} className="btn-outline w-full" style={{ color: '#bbb' }}>Cancelar / Nuevo</button>
                         </div>
                      </form>
                   </div>
                   <div className="card-premium" style={{ padding: 32 }}>
                      <h2 style={{ fontWeight: 900, marginBottom: 20 }}>Listado</h2>
                      {empresas.map(e => (
                        <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {e.logo_url && <img src={e.logo_url} style={{ width: 34, height: 34, objectFit: 'contain' }} />}
                            <strong style={{ fontSize: '0.9rem' }}>{e.nombre}</strong>
                          </div>
                          <button onClick={() => setNuevaEmpresa(e)} style={{ fontSize: '1.1rem' }}>✏️</button>
                        </div>
                      ))}
                   </div>
                </div>
             ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 32 }}>
                   <div className="card-premium" style={{ padding: 32 }}>
                      <h2 style={{ fontWeight: 900, marginBottom: 24 }}>📦 {nuevoProducto.id ? 'Editar' : 'Nuevo'} Producto</h2>
                      <form onSubmit={saveProducto} style={{ display: 'grid', gap: 16 }}>
                         <select className="input-premium" value={nuevoProducto.empresa_id} onChange={e => setNuevoProducto({...nuevoProducto, empresa_id: e.target.value})} required>
                           <option value="">Empresa...</option>
                           {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                         </select>
                         <input className="input-premium" placeholder="Nombre" value={nuevoProducto.nombre} onChange={e => setNuevoProducto({...nuevoProducto, nombre: e.target.value})} required />
                         <div style={{ padding: 18, border: '2px dashed var(--border)', borderRadius: 12, textAlign: 'center' }}>
                            <input type="file" onChange={e => setImageFile(e.target.files ? e.target.files[0] : null)} />
                         </div>
                         <input className="input-premium" type="number" placeholder="Precio" value={nuevoProducto.valor_unitario} onChange={e => setNuevoProducto({...nuevoProducto, valor_unitario: Number(e.target.value)})} required />
                         <div style={{ display: 'flex', gap: 10 }}>
                            <button type="submit" className="btn-success w-full">Guardar Producto</button>
                            <button type="button" onClick={() => setNuevoProducto({empresa_id:'',nombre:'',descripcion:'',imagen_url:'',valor_unitario:0,activo:true})} className="btn-outline w-full" style={{ color: '#bbb' }}>Cancelar / Nuevo</button>
                         </div>
                      </form>
                   </div>
                   <div className="card-premium" style={{ padding: 32 }}>
                      {productos.map(p => (
                        <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: 14, borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.9rem' }}>{p.nombre}</span>
                          <button onClick={() => setNuevoProducto(p)}>✏️</button>
                        </div>
                      ))}
                   </div>
                </div>
             )}
          </div>
        )}
      </main>
    </div>
  );
}
