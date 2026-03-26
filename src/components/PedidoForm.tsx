import { supabase } from '../services/supabaseClient';
import { useState } from 'react';

export default function PedidoForm() {
  const [form, setForm] = useState({
    nombre: '',
    empresa: '',
    producto: '',
    imagen: '',
    valor_unitario: '',
    cantidad: '',
    condiciones: '',
    forma_pago: '',
  });
  const [mensaje, setMensaje] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const valor_total = Number(form.valor_unitario) * Number(form.cantidad);
    const { error } = await supabase.from('pedidos').insert([
      { ...form, valor_total },
    ]);
    if (error) setMensaje('Error al guardar el pedido');
    else setMensaje('¡Pedido enviado correctamente!');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto mt-8 p-4 border rounded">
      <input name="nombre" placeholder="Nombre completo" value={form.nombre} onChange={handleChange} className="w-full border p-2" required />
      <input name="empresa" placeholder="Empresa convenio" value={form.empresa} onChange={handleChange} className="w-full border p-2" required />
      <input name="producto" placeholder="Producto" value={form.producto} onChange={handleChange} className="w-full border p-2" required />
      <input name="imagen" placeholder="URL de imagen" value={form.imagen} onChange={handleChange} className="w-full border p-2" />
      <input name="valor_unitario" type="number" placeholder="Valor unitario" value={form.valor_unitario} onChange={handleChange} className="w-full border p-2" required />
      <input name="cantidad" type="number" placeholder="Cantidad" value={form.cantidad} onChange={handleChange} className="w-full border p-2" required />
      <textarea name="condiciones" placeholder="Condiciones" value={form.condiciones} onChange={handleChange} className="w-full border p-2" />
      <select name="forma_pago" value={form.forma_pago} onChange={handleChange} className="w-full border p-2" required>
        <option value="">Forma de pago</option>
        <option value="Efectivo">Efectivo</option>
        <option value="Transferencia">Transferencia</option>
        <option value="Tarjeta">Tarjeta</option>
      </select>
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Enviar pedido</button>
      {mensaje && <div className="mt-2 text-center">{mensaje}</div>}
    </form>
  );
}
