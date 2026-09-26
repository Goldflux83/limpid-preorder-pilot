create table admin_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role text not null default 'admin' check (role = 'admin'),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table store_sessions (
  id uuid primary key default gen_random_uuid(),
  station_id uuid not null references stations(id),
  token_hash text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create or replace function open_store_session(p_station_code text, p_pin text, p_token_hash text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_station_id uuid;
begin
  select id into v_station_id from stations where code = upper(p_station_code) and active and pin_hash is not null and pin_hash = crypt(p_pin, pin_hash);
  if v_station_id is null then raise exception 'invalid station pin'; end if;
  insert into store_sessions(station_id, token_hash, expires_at) values (v_station_id, p_token_hash, now() + interval '30 days');
  return v_station_id;
end $$;

alter table admin_profiles enable row level security;
alter table store_sessions enable row level security;
