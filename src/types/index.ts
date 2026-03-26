export interface Empresa {
  id: string;
  nombre: string;
  logo_url: string | null;
  condiciones: string | null;
  forma_pago: string | null;
  activa: boolean;
}

export interface Producto {
  id: string;
  empresa_id: string;
  nombre: string;
  descripcion: string | null;
  imagen_url: string | null;
  valor_unitario: number;
  activo: boolean;
  empresa?: Empresa;
}

export interface ItemCarrito {
  producto: Producto;
  empresa: Empresa;
  cantidad: number;
}

export interface Pedido {
  id: string;
  nombre_asociado: string;
  cedula: string;
  telefono: string | null;
  email: string | null;
  estado: string;
  total: number;
  created_at: string;
}

export interface DetallePedido {
  id: string;
  pedido_id: string;
  producto_id: string;
  empresa_nombre: string;
  producto_nombre: string;
  imagen_url: string | null;
  valor_unitario: number;
  cantidad: number;
  valor_total: number;
  condiciones: string | null;
  forma_pago: string | null;
}
