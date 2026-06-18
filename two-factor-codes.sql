create table if not exists public.two_factor_codes (
  id uuid primary key default gen_random_uuid(),
  correo varchar not null,
  rol varchar not null,
  code_hash text not null,
  expires_at timestamp not null,
  used boolean default false,
  attempts integer default 0,
  created_at timestamp default now()
);

create index if not exists two_factor_codes_lookup_idx
  on public.two_factor_codes (correo, rol, used, expires_at);

create index if not exists two_factor_codes_code_hash_idx
  on public.two_factor_codes (code_hash);
