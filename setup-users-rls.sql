-- Configuracion RLS para tablas de usuarios y relacionadas
-- Uso recomendado: entorno de desarrollo

-- 1) Habilitar RLS (si no estaba)
ALTER TABLE public.inquilino ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arrendatario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.propiedad ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reserva ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contrato ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensaje ENABLE ROW LEVEL SECURITY;

-- 2) Limpiar politicas previas (evita conflictos de nombres)
DROP POLICY IF EXISTS "inquilino_select_anon" ON public.inquilino;
DROP POLICY IF EXISTS "inquilino_update_anon" ON public.inquilino;
DROP POLICY IF EXISTS "inquilino_delete_anon" ON public.inquilino;

DROP POLICY IF EXISTS "arrendatario_select_anon" ON public.arrendatario;
DROP POLICY IF EXISTS "arrendatario_update_anon" ON public.arrendatario;
DROP POLICY IF EXISTS "arrendatario_delete_anon" ON public.arrendatario;

DROP POLICY IF EXISTS "propiedad_select_anon" ON public.propiedad;
DROP POLICY IF EXISTS "propiedad_delete_anon" ON public.propiedad;
DROP POLICY IF EXISTS "reserva_select_anon" ON public.reserva;
DROP POLICY IF EXISTS "reserva_delete_anon" ON public.reserva;
DROP POLICY IF EXISTS "contrato_select_anon" ON public.contrato;
DROP POLICY IF EXISTS "contrato_delete_anon" ON public.contrato;
DROP POLICY IF EXISTS "mensaje_select_anon" ON public.mensaje;
DROP POLICY IF EXISTS "mensaje_delete_anon" ON public.mensaje;

-- 3) Politicas para inquilino
CREATE POLICY "inquilino_select_anon" ON public.inquilino
FOR SELECT TO anon
USING (true);

CREATE POLICY "inquilino_update_anon" ON public.inquilino
FOR UPDATE TO anon
USING (true)
WITH CHECK (true);

CREATE POLICY "inquilino_delete_anon" ON public.inquilino
FOR DELETE TO anon
USING (true);

-- 4) Politicas para arrendatario
CREATE POLICY "arrendatario_select_anon" ON public.arrendatario
FOR SELECT TO anon
USING (true);

CREATE POLICY "arrendatario_update_anon" ON public.arrendatario
FOR UPDATE TO anon
USING (true)
WITH CHECK (true);

CREATE POLICY "arrendatario_delete_anon" ON public.arrendatario
FOR DELETE TO anon
USING (true);

-- 5) Politicas de lectura para cruces usados por el admin
CREATE POLICY "propiedad_select_anon" ON public.propiedad
FOR SELECT TO anon
USING (true);

CREATE POLICY "propiedad_delete_anon" ON public.propiedad
FOR DELETE TO anon
USING (true);

CREATE POLICY "reserva_select_anon" ON public.reserva
FOR SELECT TO anon
USING (true);

CREATE POLICY "reserva_delete_anon" ON public.reserva
FOR DELETE TO anon
USING (true);

CREATE POLICY "contrato_select_anon" ON public.contrato
FOR SELECT TO anon
USING (true);

CREATE POLICY "contrato_delete_anon" ON public.contrato
FOR DELETE TO anon
USING (true);

CREATE POLICY "mensaje_select_anon" ON public.mensaje
FOR SELECT TO anon
USING (true);

CREATE POLICY "mensaje_delete_anon" ON public.mensaje
FOR DELETE TO anon
USING (true);

-- 7) Verificacion de politicas creadas
SELECT schemaname, tablename, policyname, roles, cmd
FROM pg_policies
WHERE tablename IN ('inquilino', 'arrendatario', 'propiedad', 'reserva', 'contrato', 'mensaje')
ORDER BY tablename, policyname;
