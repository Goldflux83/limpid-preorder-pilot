alter table stations add column waitlist_voucher_valid_days integer not null default 30 check (waitlist_voucher_valid_days between 1 and 365);

create table waitlist_attempts (
  id uuid primary key default gen_random_uuid(),
  fingerprint_hash text not null,
  attempted_at timestamptz not null default now()
);
create index waitlist_attempts_lookup on waitlist_attempts(fingerprint_hash, attempted_at desc);
alter table waitlist_attempts enable row level security;

create unique index waitlist_entries_email_normalized_unique on waitlist_entries (lower(trim(email)));

create or replace function create_waitlist_signup(
  p_email text, p_station_code text, p_poster text, p_travel_frequency text,
  p_answers jsonb, p_wants_to_join boolean
) returns table(result text, voucher_code text)
language plpgsql security definer set search_path = public as $$
declare
  v_station_id uuid; v_valid_days integer; v_waitlist_id uuid; v_code text;
begin
  select id, waitlist_voucher_valid_days into v_station_id, v_valid_days
  from stations where code = upper(p_station_code) and active;
  if v_station_id is null then raise exception 'invalid station'; end if;
  if exists (select 1 from waitlist_entries where lower(trim(email)) = lower(trim(p_email))) then
    return query select 'duplicate'::text, null::text; return;
  end if;
  loop
    select 'W-' || string_agg(substr('ABCDEFGHJKMNPQRSTUVWXYZ23456789', 1 + floor(random() * 31)::integer, 1), '') into v_code from generate_series(1, 4);
    exit when not exists (select 1 from vouchers where code = v_code);
  end loop;
  insert into waitlist_entries(email, station_id, poster, travel_frequency, answers, wants_to_join, consent_at, reward_code, reward_valid_until)
  values(lower(trim(p_email)), v_station_id, nullif(trim(p_poster), ''), nullif(trim(p_travel_frequency), ''), coalesce(p_answers, '{}'::jsonb), p_wants_to_join, now(), v_code, current_date + v_valid_days)
  returning id into v_waitlist_id;
  insert into vouchers(code, waitlist_entry_id, station_id, kind, valid_until)
  values(v_code, v_waitlist_id, v_station_id, 'waitlist_reward', current_date + v_valid_days);
  insert into events(type, station_id, voucher_id, actor_type, data)
  select 'waitlist_signed_up', v_station_id, id, 'anonymous', '{}'::jsonb from vouchers where code = v_code;
  insert into events(type, station_id, voucher_id, actor_type, data)
  select 'voucher_issued', v_station_id, id, 'system', jsonb_build_object('kind', 'waitlist_reward') from vouchers where code = v_code;
  return query select 'created'::text, v_code;
exception when unique_violation then
  return query select 'duplicate'::text, null::text;
end $$;

revoke execute on function create_waitlist_signup(text, text, text, text, jsonb, boolean) from public, anon, authenticated;
grant execute on function create_waitlist_signup(text, text, text, text, jsonb, boolean) to service_role;
