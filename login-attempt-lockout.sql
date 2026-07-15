-- Ejecutar manualmente en Supabase SQL Editor antes de desplegar el backend.
-- NoWayHome usa tres tablas de identidad independientes.

ALTER TABLE public.administrador
  ADD COLUMN IF NOT EXISTS intentos_fallidos integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bloqueado_hasta timestamp NULL;

ALTER TABLE public.inquilino
  ADD COLUMN IF NOT EXISTS intentos_fallidos integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bloqueado_hasta timestamp NULL;

ALTER TABLE public.arrendatario
  ADD COLUMN IF NOT EXISTS intentos_fallidos integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bloqueado_hasta timestamp NULL;

CREATE OR REPLACE FUNCTION public.registrar_intento_login_fallido(
  p_tabla text,
  p_correo text
)
RETURNS TABLE(intentos_fallidos integer, bloqueado_hasta timestamp)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_tabla = 'administrador' THEN
    RETURN QUERY
    UPDATE public.administrador
    SET
      intentos_fallidos = CASE
        WHEN administrador.bloqueado_hasta IS NOT NULL
          AND administrador.bloqueado_hasta <= NOW() THEN 1
        ELSE administrador.intentos_fallidos + 1
      END,
      bloqueado_hasta = CASE
        WHEN (CASE
          WHEN administrador.bloqueado_hasta IS NOT NULL
            AND administrador.bloqueado_hasta <= NOW() THEN 1
          ELSE administrador.intentos_fallidos + 1
        END) >= 4 THEN NOW() + INTERVAL '15 minutes'
        ELSE NULL
      END
    WHERE administrador.correo = p_correo
    RETURNING administrador.intentos_fallidos, administrador.bloqueado_hasta;
  ELSIF p_tabla = 'inquilino' THEN
    RETURN QUERY
    UPDATE public.inquilino
    SET
      intentos_fallidos = CASE
        WHEN inquilino.bloqueado_hasta IS NOT NULL
          AND inquilino.bloqueado_hasta <= NOW() THEN 1
        ELSE inquilino.intentos_fallidos + 1
      END,
      bloqueado_hasta = CASE
        WHEN (CASE
          WHEN inquilino.bloqueado_hasta IS NOT NULL
            AND inquilino.bloqueado_hasta <= NOW() THEN 1
          ELSE inquilino.intentos_fallidos + 1
        END) >= 4 THEN NOW() + INTERVAL '15 minutes'
        ELSE NULL
      END
    WHERE inquilino.correo = p_correo
    RETURNING inquilino.intentos_fallidos, inquilino.bloqueado_hasta;
  ELSIF p_tabla = 'arrendatario' THEN
    RETURN QUERY
    UPDATE public.arrendatario
    SET
      intentos_fallidos = CASE
        WHEN arrendatario.bloqueado_hasta IS NOT NULL
          AND arrendatario.bloqueado_hasta <= NOW() THEN 1
        ELSE arrendatario.intentos_fallidos + 1
      END,
      bloqueado_hasta = CASE
        WHEN (CASE
          WHEN arrendatario.bloqueado_hasta IS NOT NULL
            AND arrendatario.bloqueado_hasta <= NOW() THEN 1
          ELSE arrendatario.intentos_fallidos + 1
        END) >= 4 THEN NOW() + INTERVAL '15 minutes'
        ELSE NULL
      END
    WHERE arrendatario.correo = p_correo
    RETURNING arrendatario.intentos_fallidos, arrendatario.bloqueado_hasta;
  ELSE
    RAISE EXCEPTION 'Tabla de identidad no permitida';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.registrar_intento_login_fallido(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.registrar_intento_login_fallido(text, text) TO service_role;
