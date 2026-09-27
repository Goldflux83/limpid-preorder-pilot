create or replace function record_self_redemption(
  p_participant_id uuid,
  p_station_id uuid,
  p_add_on text default null
) returns redemptions
language plpgsql security definer set search_path = public as $$
declare
  v_redemption redemptions;
  v_count integer;
begin
  if not exists (
    select 1 from participants
    where id = p_participant_id and status = 'active'
  ) then
    raise exception 'participant is not active';
  end if;

  if not exists (select 1 from stations where id = p_station_id and active) then
    raise exception 'station is not active';
  end if;

  select count(*) into v_count
  from redemptions
  where participant_id = p_participant_id
    and (occurred_at at time zone 'Europe/Amsterdam')::date =
      (now() at time zone 'Europe/Amsterdam')::date;

  if v_count >= 3 then
    raise exception 'daily redemption limit reached';
  end if;

  insert into redemptions(participant_id, station_id, source, add_on)
  values (p_participant_id, p_station_id, 'self', p_add_on)
  returning * into v_redemption;

  insert into events(type, participant_id, station_id, actor_type, data)
  values ('redemption_recorded', p_participant_id, p_station_id, 'participant',
    jsonb_build_object('source', 'self', 'add_on', p_add_on));

  return v_redemption;
end $$;

revoke execute on function record_self_redemption(uuid, uuid, text) from public, anon, authenticated;
grant execute on function record_self_redemption(uuid, uuid, text) to service_role;
