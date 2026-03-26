'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabaseClient';
import type { Empresa, Producto } from '@/types';
import Header from '@/components/Header';

export default function AdminGestionPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [tab, setTab] = useState<'empresas' | 'productos'>('empresas');

  // Estado para Empresas
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [nuevaEmpresa, setNuevaEmpresa] = useState<Partial<Empresa>>({
    nombre: '',
    logo_url: '',
    condiciones: '',
    forma_pago: '',
    activa: true,
  });

  // Estado para Productos
  const [productos, setProductos] = useState<Producto[]>([]);
  const [nuevoProducto, setNuevoProducto] = useState<Partial<Producto>>({
    empresa_id: '',
    nombre: '',
    descripcion: '',
    imagen_url: '',
    valor_unitario: 0,
    activo: true,
  });

  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

  // --- Seguridad Simple ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'COICP2026') { // Contraseña por defecto
      setIsLoggedIn(true);
      loadData();
    } else {
      alert('Contraseña incorrecta');
    }
  };

  const loadData = async () => {
    setLoading(true);
    const { data: empData } = await supabase.from('empresas_convenio').select('*').order('nombre');
    const { data: prodData } = await supabase.from('productos').select('*').order('nombre');
    if (empData) setEmpresas(empData);
    if (prodData) setProductos(prodData);
    setLoading(false);
  };

  // --- Acciones de Empresa ---
  const saveEmpresa = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('empresas_convenio').upsert([nuevaEmpresa]);
    if (error) {
      setMensaje({ texto: 'Error: ' + error.message, tipo: 'error' });
    } else {
      setMensaje({ texto: 'Empresa guardada con éxito', tipo: 'success' });
      setNuevaEmpresa({ nombre: '', logo_url: '', condiciones: '', forma_pago: '', activa: true });
      loadData();
    }
    setLoading(false);
  };

  const deleteEmpresa = async (id: string) => {
    if (!confirm('¿Seguro que quieres eliminar esta empresa y sus productos?')) return;
    setLoading(true);
    await supabase.from('empresas_convenio').delete().eq('id', id);
    loadData();
    setLoading(false);
  };

  // --- Acciones de Producto ---
  const saveProducto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoProducto.empresa_id) return alert('Selecciona una empresa');
    setLoading(true);
    const { error } = await supabase.from('productos').upsert([nuevoProducto]);
    if (error) {
      setMensaje({ texto: 'Error: ' + error.message, tipo: 'error' });
    } else {
      setMensaje({ texto: 'Producto guardado con éxito', tipo: 'success' });
      setNuevoProducto({ empresa_id: '', nombre: '', descripcion: '', imagen_url: '', valor_unitario: 0, activo: true });
      loadData();
    }
    setLoading(false);
  };

  const deleteProducto = async (id: string) => {
    if (!confirm('¿Seguro que quieres eliminar este producto?')) return;
    setLoading(true);
    await supabase.from('productos').delete().eq('id', id);
    loadData();
    setLoading(false);
  };

  if (!isLoggedIn) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card-premium" style={{ padding: 40, maxWidth: 400, width: '90%', textAlign: 'center' }}>
          <h1 style={{ fontWeight: 800, marginBottom: 20 }}>Acceso Panel Admin</h1>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              className="input-premium"
              placeholder="Contraseña del sistema"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ marginBottom: 20 }}
            />
            <button type="submit" className="btn-primary w-full" style={{ width: '100%' }}>Entrar</button>
          </form>
          <p style={{ marginTop: 20, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Usa la contraseña enviada por el desarrollador.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)' }}>
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-10">
        <div className="animate-fade-in-up" style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>⚙️ Gestión de Catálogo</h1>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Añade o edita empresas y productos del convenio.</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setTab('empresas')} className={tab === 'empresas' ? 'btn-primary' : 'btn-outline'}>🏢 Empresas</button>
            <button onClick={() => setTab('productos')} className={tab === 'productos' ? 'btn-primary' : 'btn-outline'}>📦 Productos</button>
          </div>
        </div>

        {mensaje.texto && (
          <div style={{ 
            padding: '12px 20px', 
            borderRadius: 10, 
            background: mensaje.tipo === 'success' ? '#d4edda' : '#f8d7da', 
            color: mensaje.tipo === 'success' ? '#155724' : '#721c24',
            marginBottom: 20,
            fontWeight: 600
          }}>
            {mensaje.texto}
          </div>
        )}

        {tab === 'empresas' && (
          <div className="grid lg:grid-cols-2 gap-8" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 30 }}>
            {/* Formulario Empresa */}
            <div className="card-premium animate-fade-in-up" style={{ padding: 28 }}>
              <h2 style={{ fontWeight: 800, marginBottom: 20 }}>Añadir / Editar Empresa</h2>
              <form onSubmit={saveEmpresa} style={{ display: 'grid', gap: 14 }}>
                <input className="input-premium" placeholder="Nombre de la empresa" value={nuevaEmpresa.nombre} onChange={e => setNuevaEmpresa({...nuevaEmpresa, nombre: e.target.value})} required />
                <input className="input-premium" placeholder="URL Logo (opcional)" value={nuevaEmpresa.logo_url || ''} onChange={e => setNuevaEmpresa({...nuevaEmpresa, logo_url: e.target.value})} />
                <textarea className="input-premium" placeholder="Condiciones del convenio" style={{ height: 100 }} value={nuevaEmpresa.condiciones || ''} onChange={e => setNuevaEmpresa({...nuevaEmpresa, condiciones: e.target.value})} />
                <input className="input-premium" placeholder="Forma de pago (ej: Nómina)" value={nuevaEmpresa.forma_pago || ''} onChange={e => setNuevaEmpresa({...nuevaEmpresa, forma_pago: e.target.value})} />
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.9rem', fontWeight: 600 }}>
                  <input type="checkbox" checked={nuevaEmpresa.activa} onChange={e => setNuevaEmpresa({...nuevaEmpresa, activa: e.target.checked})} />
                  Empresa Activa
                </label>
                <button type="submit" disabled={loading} className="btn-success">Guardar Empresa</button>
              </form>
            </div>

            {/* Lista Empresas */}
            <div className="card-premium animate-fade-in-up" style={{ padding: 28 }}>
              <h2 style={{ fontWeight: 800, marginBottom: 20 }}>Empresas Registradas</h2>
              <div style={{ display: 'grid', gap: 12 }}>
                {empresas.map(emp => (
                  <div key={emp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, border: '1px solid var(--border)', borderRadius: 10 }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{emp.nombre}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{emp.forma_pago || 'Sin forma pago'}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => setNuevaEmpresa(emp)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✏️</button>
                      <button onClick={() => deleteEmpresa(emp.id)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'productos' && (
          <div className="grid lg:grid-cols-2 gap-8" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 30 }}>
            {/* Formulario Producto */}
            <div className="card-premium animate-fade-in-up" style={{ padding: 28 }}>
              <h2 style={{ fontWeight: 800, marginBottom: 20 }}>Añadir / Editar Producto</h2>
              <form onSubmit={saveProducto} style={{ display: 'grid', gap: 14 }}>
                <select className="input-premium" value={nuevoProducto.empresa_id} onChange={e => setNuevoProducto({...nuevoProducto, empresa_id: e.target.value})} required>
                  <option value="">Selecciona una Empresa</option>
                  {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </select>
                <input className="input-premium" placeholder="Nombre del producto" value={nuevoProducto.nombre} onChange={e => setNuevoProducto({...nuevoProducto, nombre: e.target.value})} required />
                <textarea className="input-premium" placeholder="Descripción corta" value={nuevoProducto.descripcion || ''} onChange={e => setNuevoProducto({...nuevoProducto, descripcion: e.target.value})} />
                <input className="input-premium" placeholder="URL Imagen" value={nuevoProducto.imagen_url || ''} onChange={e => setNuevoProducto({...nuevoProducto, imagen_url: e.target.value})} />
                <input className="input-premium" type="number" placeholder="Valor Unitario" value={nuevoProducto.valor_unitario} onChange={e => setNuevoProducto({...nuevoProducto, valor_unitario: Number(e.target.value)})} required />
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.9rem', fontWeight: 600 }}>
                  <input type="checkbox" checked={nuevoProducto.activo} onChange={e => setNuevoProducto({...nuevoProducto, activo: e.target.checked})} />
                  Producto Activo
                </label>
                <button type="submit" disabled={loading} className="btn-success">Guardar Producto</button>
              </form>
            </div>

            {/* Lista Productos */}
            <div className="card-premium animate-fade-in-up" style={{ padding: 28 }}>
              <h2 style={{ fontWeight: 800, marginBottom: 20 }}>Productos Registrados</h2>
              <div style={{ display: 'grid', gap: 12, maxHeight: 600, overflowY: 'auto', paddingRight: 10 }}>
                {productos.map(prod => (
                  <div key={prod.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, border: '1px solid var(--border)', borderRadius: 10 }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      {prod.imagen_url && <div style={{ width: 40, height: 40, borderRadius: 6, background: '#eee', flexShrink: 0, overflow: 'hidden' }}>
                        <img src={prod.imagen_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>}
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{prod.nombre}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>
                          ${prod.valor_unitario.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => setNuevoProducto(prod)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✏️</button>
                      <button onClick={() => deleteProducto(prod.id)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
