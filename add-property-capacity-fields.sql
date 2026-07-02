ALTER TABLE public.propiedad
ADD COLUMN IF NOT EXISTS capacidad INTEGER,
ADD COLUMN IF NOT EXISTS numero_habitaciones INTEGER,
ADD COLUMN IF NOT EXISTS numero_banos INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_propiedad_capacidad'
      AND conrelid = 'public.propiedad'::regclass
  ) THEN
    ALTER TABLE public.propiedad
    ADD CONSTRAINT chk_propiedad_capacidad
    CHECK (capacidad IS NULL OR capacidad > 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_propiedad_habitaciones'
      AND conrelid = 'public.propiedad'::regclass
  ) THEN
    ALTER TABLE public.propiedad
    ADD CONSTRAINT chk_propiedad_habitaciones
    CHECK (numero_habitaciones IS NULL OR numero_habitaciones >= 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_propiedad_banos'
      AND conrelid = 'public.propiedad'::regclass
  ) THEN
    ALTER TABLE public.propiedad
    ADD CONSTRAINT chk_propiedad_banos
    CHECK (numero_banos IS NULL OR numero_banos >= 0);
  END IF;
END $$;
