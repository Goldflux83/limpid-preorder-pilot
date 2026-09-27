-- Ordering rules live in Postgres so a stale browser can never claim a slot.
create sequence if not exists order_number_sequence;

alter table participants alter column first_name drop not null;
alter table waitlist_entries alter column email drop not null;

create table pilot_retention_settings (
  singleton boolean primary key default true check (singleton),
  personal_data_retention_until date not null default date '2027-03-31',
  updated_at timestamptz not null default now()
);
insert into pilot_retention_settings(singleton) values (true) on conflict (singleton) do nothing;
alter table pilot_retention_settings enable row level security;

create or replace function prevent_event_mutation()
returns trigger language plpgsql as $$
begin
  raise exception 'events are append-only';
end $$;
create trigger events_append_only before update or delete on events
for each row execute function prevent_event_mutation();

drop function if exists create_order_with_capacity(uuid, uuid, uuid, jsonb, timestamptz, text);
create or replace function create_order_with_capacity(
  p_participant_id uuid,
  p_station_id uuid,
  p_product_id uuid,
  p_options jsonb,
  p_slot_start timestamptz
) returns orders language plpgsql security definer set search_path = public as $$
declare
  v_station stations;
  v_product products;
  v_order orders;
  v_count integer;
  v_opening jsonb;
  v_local_slot timestamp;
  v_local_now timestamp;
  v_day text;
begin
  select * into v_station from stations where id = p_station_id and active for update;
  if v_station.id is null or not v_station.ordering_enabled then raise exception 'station is not accepting orders'; end if;
  if not exists (select 1 from pilot_feature_flags where key = 'ordering' and enabled) then raise exception 'ordering is disabled'; end if;
  if exists (select 1 from participants where id = p_participant_id and (status <> 'active' or not can_preorder)) then raise exception 'participant cannot preorder'; end if;
  if not exists (select 1 from participants where id = p_participant_id) then raise exception 'participant not found'; end if;
  select * into v_product from products where id = p_product_id and station_id = p_station_id and active;
  if v_product.id is null then raise exception 'product is unavailable'; end if;
  if jsonb_typeof(coalesce(p_options, '{}'::jsonb)) <> 'object' then raise exception 'invalid options'; end if;
  if exists (select 1 from jsonb_each_text(coalesce(p_options, '{}'::jsonb)) as choice where not (v_product.options ? choice.value)) then raise exception 'invalid options'; end if;

  v_local_now := now() at time zone 'Europe/Amsterdam';
  v_local_slot := p_slot_start at time zone 'Europe/Amsterdam';
  if p_slot_start < now() + make_interval(mins => v_station.order_min_minutes)
    or p_slot_start > now() + make_interval(mins => v_station.order_max_minutes) then
    raise exception 'slot is outside ordering window';
  end if;
  if mod(extract(epoch from p_slot_start)::integer, v_station.slot_minutes * 60) <> 0 then raise exception 'slot is not aligned'; end if;
  v_day := lower(trim(to_char(v_local_slot, 'day')));
  v_opening := v_station.opening_hours -> v_day;
  if v_opening is null or not (v_opening ? 'open' and v_opening ? 'close')
    or v_local_slot::time < (v_opening ->> 'open')::time
    or v_local_slot::time >= (v_opening ->> 'close')::time then
    raise exception 'slot is outside opening hours';
  end if;
  if exists (select 1 from slot_closures where station_id = p_station_id and p_slot_start >= starts_at and p_slot_start < ends_at and opened_at is null) then raise exception 'slot is closed'; end if;
  if exists (select 1 from orders where participant_id = p_participant_id and status = 'received') then raise exception 'participant already has an open order'; end if;
  select count(*) into v_count from orders
    where participant_id = p_participant_id and (received_at at time zone 'Europe/Amsterdam')::date = v_local_now::date;
  if v_count >= 3 then raise exception 'daily order limit reached'; end if;

  perform pg_advisory_xact_lock(hashtext(p_station_id::text || p_slot_start::text));
  select count(*) into v_count from orders where station_id = p_station_id and slot_start = p_slot_start and status = 'received';
  if v_count >= v_station.max_per_slot then raise exception 'slot is full'; end if;
  insert into orders(number, participant_id, station_id, product_id, options, slot_start)
  values (left(v_station.code, 1) || '-' || nextval('order_number_sequence'), p_participant_id, p_station_id, p_product_id, coalesce(p_options, '{}'::jsonb), p_slot_start)
  returning * into v_order;
  insert into events(type, participant_id, station_id, order_id, actor_type, data)
  values ('order_created', p_participant_id, p_station_id, v_order.id, 'participant', jsonb_build_object('slot_start', p_slot_start));
  return v_order;
end $$;

create or replace function cancel_participant_order(p_participant_id uuid, p_order_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_order orders;
begin
  select * into v_order from orders where id = p_order_id and participant_id = p_participant_id for update;
  if v_order.id is null or v_order.status <> 'received' or v_order.slot_start < now() + interval '10 minutes' then return false; end if;
  update orders set status = 'cancelled', closed_at = now(), updated_at = now() where id = v_order.id;
  insert into events(type, participant_id, station_id, order_id, actor_type)
  values ('order_cancelled', p_participant_id, v_order.station_id, v_order.id, 'participant');
  return true;
end $$;

create or replace function anonymize_pilot_personal_data(p_admin_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_participants integer; v_waitlist integer; v_codes integer;
begin
  if current_date < (select personal_data_retention_until from pilot_retention_settings where singleton) then
    raise exception 'retention period has not ended';
  end if;
  update participant_codes set status = 'retired', retired_at = now(), retired_reason = 'personal_data_anonymized', updated_at = now()
    where status = 'active';
  get diagnostics v_codes = row_count;
  update participants set first_name = null, notes = null, blocked_reason = null, updated_at = now()
    where first_name is not null or notes is not null or blocked_reason is not null;
  get diagnostics v_participants = row_count;
  update waitlist_entries set email = null,
    answers = answers - 'desired_time' - 'price_other', updated_at = now()
    where email is not null or answers ? 'desired_time' or answers ? 'price_other';
  get diagnostics v_waitlist = row_count;
  update orders set open_answer = null, updated_at = now() where open_answer is not null;
  update vouchers set valid_until = current_date - 1, updated_at = now() where redeemed_at is null;
  insert into events(type, actor_type, actor_id, data)
  values ('personal_data_anonymized', 'admin', p_admin_id,
    jsonb_build_object('participants', v_participants, 'waitlist_entries', v_waitlist, 'codes_retired', v_codes));
  return jsonb_build_object('participants', v_participants, 'waitlist_entries', v_waitlist, 'codes_retired', v_codes);
end $$;

revoke execute on function create_order_with_capacity(uuid, uuid, uuid, jsonb, timestamptz) from public, anon, authenticated;
revoke execute on function cancel_participant_order(uuid, uuid) from public, anon, authenticated;
revoke execute on function anonymize_pilot_personal_data(uuid) from public, anon, authenticated;
grant execute on function create_order_with_capacity(uuid, uuid, uuid, jsonb, timestamptz) to service_role;
grant execute on function cancel_participant_order(uuid, uuid) to service_role;
grant execute on function anonymize_pilot_personal_data(uuid) to service_role;
