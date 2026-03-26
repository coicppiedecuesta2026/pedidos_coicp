import PedidoForm from '../components/PedidoForm';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold mb-4">Tienda de Pedidos Convenio</h1>
      <PedidoForm />
    </main>
  );
}

