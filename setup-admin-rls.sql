-- Configurar políticas RLS para la tabla administrador en Supabase
-- Ejecutar DESPUÉS de crear la tabla

-- Habilitar RLS en la tabla administrador (si no está habilitado)
ALTER TABLE public.administrador ENABLE ROW LEVEL SECURITY;

-- Crear política para permitir SELECT (lectura) para usuarios anónimos
-- Esto permite que la aplicación pueda consultar la tabla para autenticación
CREATE POLICY "Permitir consulta de administradores" ON public.administrador
    FOR SELECT
    TO anon
    USING (true);

-- Crear política para permitir INSERT (si fuera necesario en el futuro)
CREATE POLICY "Permitir inserción de administradores" ON public.administrador
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- Crear política para permitir UPDATE (si fuera necesario en el futuro)
CREATE POLICY "Permitir actualización de administradores" ON public.administrador
    FOR UPDATE
    TO anon
    USING (true);

-- Verificar que las políticas se crearon
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'administrador';