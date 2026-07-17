alter table public.orders
  add column if not exists claim_token_hash text,
  add column if not exists claim_token_expires_at timestamptz,
  add column if not exists claim_token_used_at timestamptz;

create index if not exists orders_claim_token_hash_idx
  on public.orders (claim_token_hash)
  where claim_token_hash is not null;
