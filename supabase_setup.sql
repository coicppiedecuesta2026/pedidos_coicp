-- ===============================================
-- SCRIPT PARA CREAR LAS TABLAS EN SUPABASE
-- Ejecutar en el SQL Editor de Supabase
-- ===============================================

-- 1. Tabla de empresas con convenio
CREATE TABLE IF NOT EXISTS empresas_convenio (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  logo_url TEXT,
  condiciones TEXT,
  forma_pago TEXT,
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabla de productos
CREATE TABLE IF NOT EXISTS productos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES empresas_convenio(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  imagen_url TEXT,
  valor_unitario NUMERIC NOT NULL DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabla de pedidos (cabecera)
CREATE TABLE IF NOT EXISTS pedidos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre_asociado TEXT NOT NULL,
  cedula TEXT NOT NULL,
  telefono TEXT,
  email TEXT,
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'confirmado', 'entregado', 'cancelado')),
  total NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Tabla de detalle de pedidos
CREATE TABLE IF NOT EXISTS detalle_pedidos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id UUID REFERENCES productos(id),
  empresa_nombre TEXT,
  producto_nombre TEXT,
  imagen_url TEXT,
  valor_unitario NUMERIC,
  cantidad INTEGER DEFAULT 1,
  valor_total NUMERIC,
  condiciones TEXT,
  forma_pago TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===============================================
-- POLÍTICAS RLS (Row Level Security)
-- ===============================================

-- Habilitar RLS
ALTER TABLE empresas_convenio ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalle_pedidos ENABLE ROW LEVEL SECURITY;

-- Políticas para empresas_convenio (lectura pública)
CREATE POLICY "Lectura pública de empresas"
  ON empresas_convenio FOR SELECT
  USING (true);

-- Políticas para productos (lectura pública)
CREATE POLICY "Lectura pública de productos"
  ON productos FOR SELECT
  USING (true);

-- Políticas para pedidos (insertar y leer el propio pedido)
CREATE POLICY "Cualquiera puede crear pedidos"
  ON pedidos FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Lectura pública de pedidos"
  ON pedidos FOR SELECT
  USING (true);

-- Políticas para detalle_pedidos
CREATE POLICY "Cualquiera puede crear detalle de pedidos"
  ON detalle_pedidos FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Lectura pública de detalle pedidos"
  ON detalle_pedidos FOR SELECT
  USING (true);

-- ===============================================
-- DATOS DE PRUEBA
-- ===============================================

-- Empresas de ejemplo
INSERT INTO empresas_convenio (nombre, logo_url, condiciones, forma_pago) VALUES
  ('Almacenes Éxito', 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Almacenes_exito_logo.svg/320px-Almacenes_exito_logo.svg.png', 'Descuento del 10% para asociados COICP. Entrega en 3-5 días hábiles. Aplica para productos seleccionados.', 'Descuento por nómina'),
  ('Colchones Spring', 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=200&h=200&fit=crop', 'Financiación hasta 12 cuotas sin interés. Garantía de 5 años. Entrega e instalación gratis en Piedecuesta.', 'Descuento por nómina / Efectivo'),
  ('Óptica Visión Total', 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=200&h=200&fit=crop', 'Descuento del 15% en monturas y lentes. Examen visual gratuito. No aplica con otras promociones.', 'Efectivo / Tarjeta débito');

-- Productos de ejemplo para Almacenes Éxito
INSERT INTO productos (empresa_id, nombre, descripcion, imagen_url, valor_unitario) VALUES
  ((SELECT id FROM empresas_convenio WHERE nombre = 'Almacenes Éxito'), 'Kit Escolar Completo', 'Incluye cuadernos, lápices, colores y morral', 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=400&h=400&fit=crop', 85000),
  ((SELECT id FROM empresas_convenio WHERE nombre = 'Almacenes Éxito'), 'Uniforme Escolar', 'Camisa, pantalón y medias talla estándar', 'https://images.unsplash.com/photo-1604671801908-6f0c6a092c05?w=400&h=400&fit=crop', 120000),
  ((SELECT id FROM empresas_convenio WHERE nombre = 'Almacenes Éxito'), 'Zapatos Escolares', 'Calzado escolar negro talla 28-42', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop', 95000);

-- Productos de ejemplo para Colchones Spring
INSERT INTO productos (empresa_id, nombre, descripcion, imagen_url, valor_unitario) VALUES
  ((SELECT id FROM empresas_convenio WHERE nombre = 'Colchones Spring'), 'Colchón Semidoble Ortopédico', 'Colchón 120x190 con sistema de resortes independientes', 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&h=400&fit=crop', 850000),
  ((SELECT id FROM empresas_convenio WHERE nombre = 'Colchones Spring'), 'Colchón Doble Premium', 'Colchón 140x190 con espuma viscoelástica', 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&h=400&fit=crop', 1200000),
  ((SELECT id FROM empresas_convenio WHERE nombre = 'Colchones Spring'), 'Base Cama Doble', 'Base cama doble con cajones de almacenamiento', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=400&fit=crop', 650000);

-- Productos de ejemplo para Óptica Visión Total
INSERT INTO productos (empresa_id, nombre, descripcion, imagen_url, valor_unitario) VALUES
  ((SELECT id FROM empresas_convenio WHERE nombre = 'Óptica Visión Total'), 'Montura Clásica', 'Montura metálica con protección UV', 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400&h=400&fit=crop', 180000),
  ((SELECT id FROM empresas_convenio WHERE nombre = 'Óptica Visión Total'), 'Lentes Progresivos', 'Lentes progresivos con antirreflejo y filtro de luz azul', 'https://images.unsplash.com/photo-1509695507497-903c140c43b0?w=400&h=400&fit=crop', 350000),
  ((SELECT id FROM empresas_convenio WHERE nombre = 'Óptica Visión Total'), 'Lentes de Contacto (Caja x6)', 'Lentes de contacto blandos mensuales', 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=400&fit=crop', 220000);
