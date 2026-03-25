-- Script SQL para crear la tabla administrador en Supabase
-- Ejecutar en el SQL Editor de Supabase

CREATE TABLE IF NOT EXISTS public.administrador (
    id_admin INTEGER GENERATED ALWAYS AS IDENTITY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(100) NOT NULL UNIQUE,
    contrasena VARCHAR(100) NOT NULL,
    PRIMARY KEY (id_admin)
);

-- Insertar un administrador de prueba
INSERT INTO public.administrador (nombre, correo, contrasena)
VALUES ('Administrador Principal', 'admin@nowayhome.com', 'admin123')
ON CONFLICT (correo) DO NOTHING;

-- Verificar que se creó correctamente
SELECT * FROM public.administrador;