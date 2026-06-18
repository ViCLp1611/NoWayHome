create table if not exists public.password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  correo varchar not null,
  rol varchar not null,
  token_hash text not null,
  expires_at timestamp not null,
  used boolean default false,
  created_at timestamp default now()
);

create index if not exists password_reset_tokens_token_hash_idx
  on public.password_reset_tokens (token_hash);

create index if not exists password_reset_tokens_correo_rol_idx
  on public.password_reset_tokens (correo, rol);
