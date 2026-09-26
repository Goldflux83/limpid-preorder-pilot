revoke execute on function open_store_session(text, text, text) from public, anon, authenticated;
grant execute on function open_store_session(text, text, text) to service_role;

create table store_pin_attempts (
  id uuid primary key default gen_random_uuid(), station_code text not null, fingerprint_hash text not null, attempted_at timestamptz not null default now()
);
create index store_pin_attempts_lookup on store_pin_attempts(station_code, fingerprint_hash, attempted_at desc);
alter table store_pin_attempts enable row level security;

create or replace function set_station_pin(p_station_id uuid, p_pin text)
returns void language plpgsql security definer set search_path = public as $$
begin
  update stations set pin_hash = crypt(p_pin, gen_salt('bf')), updated_at = now() where id = p_station_id;
end $$;
revoke execute on function set_station_pin(uuid, text) from public, anon, authenticated;
grant execute on function set_station_pin(uuid, text) to service_role;
