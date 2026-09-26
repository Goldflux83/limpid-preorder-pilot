create extension if not exists pgcrypto;

create type participant_status as enum ('active', 'paused', 'blocked');
create type code_status as enum ('active', 'retired', 'blocked');
create type order_status as enum ('received', 'collected', 'not_collected', 'cancelled', 'unknown');
create type actor_type as enum ('participant', 'store', 'admin', 'system', 'anonymous');

create table stations (
  id uuid primary key default gen_random_uuid(), code text not null unique check (code ~ '^[A-Z]{2,8}$'), name text not null,
  active boolean not null default true, ordering_enabled boolean not null default false, opening_hours jsonb not null default '{}'::jsonb,
  pin_hash text, slot_minutes integer not null default 5 check (slot_minutes between 5 and 60), max_per_slot integer not null default 3 check (max_per_slot > 0),
  order_min_minutes integer not null default 15, order_max_minutes integer not null default 120, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table products (
  id uuid primary key default gen_random_uuid(), station_id uuid not null references stations(id), name text not null, options jsonb not null default '[]'::jsonb,
  active boolean not null default true, position integer not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(station_id, name)
);
create table participants (
  id uuid primary key default gen_random_uuid(), first_name text not null check (length(first_name) <= 80), cohort text not null, variant text not null,
  station_id uuid references stations(id), origin text, channel text, status participant_status not null default 'active', can_preorder boolean not null default false,
  blocked_reason text, waitlist_entry_id uuid, notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table participant_codes (
  id uuid primary key default gen_random_uuid(), participant_id uuid not null references participants(id), code text not null unique check (code ~ '^[A-HJ-NP-Z2-9]{2}-[A-HJ-NP-Z2-9]{4}$'),
  status code_status not null default 'active', issued_at timestamptz not null default now(), retired_at timestamptz, retired_reason text, issued_by_admin_id uuid,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index one_active_code_per_participant on participant_codes(participant_id) where status = 'active';
create table orders (
  id uuid primary key default gen_random_uuid(), number text not null unique, participant_id uuid not null references participants(id), station_id uuid not null references stations(id), product_id uuid not null references products(id),
  options jsonb not null default '{}'::jsonb, slot_start timestamptz not null, status order_status not null default 'received', received_at timestamptz not null default now(), displayed_at timestamptz, closed_at timestamptz,
  smiley smallint check (smiley between 1 and 5), open_answer text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index one_open_order_per_participant on orders(participant_id) where status = 'received';
create table slot_closures (
  id uuid primary key default gen_random_uuid(), station_id uuid not null references stations(id), starts_at timestamptz not null, ends_at timestamptz not null,
  opened_at timestamptz, actor actor_type not null, reason text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check (ends_at > starts_at)
);
create table redemptions (
  id uuid primary key default gen_random_uuid(), participant_id uuid not null references participants(id), station_id uuid references stations(id), occurred_at timestamptz not null default now(), source text not null check (source in ('self','cash_register','photo')),
  add_on text check (add_on in ('nothing','food','other')), note text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table daily_questions (
  id uuid primary key default gen_random_uuid(), participant_id uuid not null references participants(id), local_date date not null, collected boolean not null, station_id uuid references stations(id),
  add_on text, feeling smallint check (feeling between 1 and 5), answered_at timestamptz not null default now(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(participant_id, local_date)
);
create table waitlist_entries (
  id uuid primary key default gen_random_uuid(), email text not null unique, station_id uuid references stations(id), poster text, travel_frequency text, answers jsonb not null default '{}'::jsonb,
  wants_to_join boolean not null, consent_at timestamptz not null, reward_code text unique, reward_valid_until date, reward_redeemed_at timestamptz, converted_participant_id uuid references participants(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table vouchers (
  id uuid primary key default gen_random_uuid(), code text not null unique, participant_id uuid references participants(id), waitlist_entry_id uuid references waitlist_entries(id),
  station_id uuid references stations(id), kind text not null, valid_until date, redeemed_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check (num_nonnulls(participant_id, waitlist_entry_id) = 1)
);
create table events (
  id uuid primary key default gen_random_uuid(), occurred_at timestamptz not null default now(), recorded_at timestamptz not null default now(), type text not null,
  participant_id uuid references participants(id), station_id uuid references stations(id), order_id uuid references orders(id), voucher_id uuid references vouchers(id),
  actor_type actor_type not null, actor_id uuid, request_id uuid, schema_version integer not null default 1, data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table export_tokens (id uuid primary key default gen_random_uuid(), table_name text not null, token_hash text not null unique, active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now());

create or replace function create_order_with_capacity(p_participant uuid, p_station uuid, p_product uuid, p_options jsonb, p_slot timestamptz, p_number text)
returns orders language plpgsql security definer as $$
declare v_max integer; v_count integer; v_order orders;
begin
  select max_per_slot into v_max from stations where id = p_station and active and ordering_enabled for update;
  if v_max is null then raise exception 'station is not accepting orders'; end if;
  if exists (select 1 from slot_closures where station_id=p_station and p_slot >= starts_at and p_slot < ends_at and opened_at is null) then raise exception 'slot is closed'; end if;
  if exists (select 1 from participants where id=p_participant and (status <> 'active' or not can_preorder)) then raise exception 'participant cannot preorder'; end if;
  perform pg_advisory_xact_lock(hashtext(p_station::text || p_slot::text));
  select count(*) into v_count from orders where station_id=p_station and slot_start=p_slot and status='received';
  if v_count >= v_max then raise exception 'slot is full'; end if;
  insert into orders(number, participant_id, station_id, product_id, options, slot_start) values(p_number,p_participant,p_station,p_product,coalesce(p_options,'{}'),p_slot) returning * into v_order;
  insert into events(type, participant_id, station_id, order_id, actor_type, data) values('order_created',p_participant,p_station,v_order.id,'participant',jsonb_build_object('slot_start',p_slot));
  return v_order;
end $$;

alter table stations enable row level security; alter table products enable row level security; alter table participants enable row level security; alter table participant_codes enable row level security; alter table orders enable row level security; alter table slot_closures enable row level security; alter table redemptions enable row level security; alter table daily_questions enable row level security; alter table waitlist_entries enable row level security; alter table vouchers enable row level security; alter table events enable row level security; alter table export_tokens enable row level security;
-- Browser clients receive no table policies. Server routes use the service role after explicit participant, store, or admin authorization.
