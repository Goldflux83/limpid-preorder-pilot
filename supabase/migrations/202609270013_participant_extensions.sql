alter table redemptions drop constraint if exists redemptions_source_check;
alter table redemptions add constraint redemptions_source_check check (source in ('self', 'cash_register', 'photo', 'digital_stamp'));

create table weekly_question_statuses (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references participants(id),
  week_number integer not null check (week_number between 1 and 53),
  completed_at timestamptz,
  completed_by_admin_id uuid references admin_profiles(user_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(participant_id, week_number)
);

create table card_photos (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references participants(id),
  object_path text not null unique,
  uploaded_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('card-photos', 'card-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create table pilot_integrations (
  singleton boolean primary key default true check (singleton),
  weekly_question_url text,
  updated_at timestamptz not null default now()
);
insert into pilot_integrations(singleton) values (true) on conflict (singleton) do nothing;

alter table weekly_question_statuses enable row level security;
alter table card_photos enable row level security;
alter table pilot_integrations enable row level security;

create or replace function mark_weekly_question_complete(p_participant_id uuid, p_week_number integer)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from participants where id = p_participant_id and status = 'active') then return false; end if;
  insert into weekly_question_statuses(participant_id, week_number, completed_at)
  values (p_participant_id, p_week_number, now())
  on conflict (participant_id, week_number) do update set completed_at = excluded.completed_at, updated_at = now();
  insert into events(type, participant_id, actor_type, data)
  values ('weekly_question_completed', p_participant_id, 'participant', jsonb_build_object('week_number', p_week_number));
  return true;
end $$;

create or replace function record_digital_stamp(p_participant_id uuid, p_station_id uuid)
returns table(stamp_count integer, voucher_code text) language plpgsql security definer set search_path = public as $$
declare v_total integer; v_today integer; v_code text;
begin
  if not exists (select 1 from participants where id = p_participant_id and status = 'active' for update) then raise exception 'participant cannot stamp'; end if;
  if not exists (select 1 from stations where id = p_station_id and active) then raise exception 'station is unavailable'; end if;
  select count(*) into v_today from redemptions where participant_id = p_participant_id and source = 'digital_stamp'
    and (occurred_at at time zone 'Europe/Amsterdam')::date = (now() at time zone 'Europe/Amsterdam')::date;
  if v_today >= 3 then raise exception 'daily stamp limit reached'; end if;
  insert into redemptions(participant_id, station_id, source) values (p_participant_id, p_station_id, 'digital_stamp');
  select count(*) into v_total from redemptions where participant_id = p_participant_id and source = 'digital_stamp';
  if mod(2 + v_total, 12) = 0 then
    loop
      select 'S-' || string_agg(substr('ABCDEFGHJKMNPQRSTUVWXYZ23456789', 1 + floor(random() * 31)::integer, 1), '') into v_code from generate_series(1, 4);
      begin
        insert into vouchers(code, participant_id, station_id, kind, valid_until) values (v_code, p_participant_id, p_station_id, 'digital_stamp_reward', current_date + 90);
        exit;
      exception when unique_violation then end;
    end loop;
    insert into events(type, participant_id, station_id, actor_type, data) values ('voucher_issued', p_participant_id, p_station_id, 'system', jsonb_build_object('kind', 'digital_stamp_reward'));
  end if;
  insert into events(type, participant_id, station_id, actor_type) values ('digital_stamp_recorded', p_participant_id, p_station_id, 'participant');
  return query select v_total, v_code;
end $$;

create or replace function convert_waitlist_entry(
  p_waitlist_id uuid, p_first_name text, p_cohort text, p_variant text, p_can_preorder boolean, p_code text, p_admin_id uuid
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_entry waitlist_entries; v_participant_id uuid;
begin
  select * into v_entry from waitlist_entries where id = p_waitlist_id and converted_participant_id is null for update;
  if v_entry.id is null then raise exception 'waitlist entry is unavailable'; end if;
  insert into participants(first_name, cohort, variant, station_id, origin, status, can_preorder, waitlist_entry_id)
  values (nullif(trim(p_first_name), ''), nullif(trim(p_cohort), ''), nullif(trim(p_variant), ''), v_entry.station_id, 'waitlist', 'active', p_can_preorder, v_entry.id)
  returning id into v_participant_id;
  insert into participant_codes(participant_id, code, issued_by_admin_id) values (v_participant_id, p_code, p_admin_id);
  update waitlist_entries set converted_participant_id = v_participant_id, updated_at = now() where id = v_entry.id;
  insert into events(type, participant_id, station_id, actor_type, actor_id, data)
  values ('waitlist_converted', v_participant_id, v_entry.station_id, 'admin', p_admin_id, jsonb_build_object('waitlist_entry_id', v_entry.id));
  return v_participant_id;
end $$;

revoke execute on function mark_weekly_question_complete(uuid, integer) from public, anon, authenticated;
revoke execute on function record_digital_stamp(uuid, uuid) from public, anon, authenticated;
revoke execute on function convert_waitlist_entry(uuid, text, text, text, boolean, text, uuid) from public, anon, authenticated;
grant execute on function mark_weekly_question_complete(uuid, integer) to service_role;
grant execute on function record_digital_stamp(uuid, uuid) to service_role;
grant execute on function convert_waitlist_entry(uuid, text, text, text, boolean, text, uuid) to service_role;
