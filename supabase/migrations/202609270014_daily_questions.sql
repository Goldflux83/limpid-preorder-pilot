create or replace function pilot_local_day()
returns date language sql stable set search_path = public as $$
  select ((now() at time zone 'Europe/Amsterdam') - interval '4 hours')::date
$$;

create or replace function daily_question_answered_today(p_participant_id uuid)
returns boolean language sql security definer set search_path = public as $$
  select exists(
    select 1 from daily_questions
    where participant_id = p_participant_id and local_date = pilot_local_day()
  )
$$;

create or replace function record_daily_question(
  p_participant_id uuid,
  p_collected boolean,
  p_station_id uuid default null,
  p_add_on text default null,
  p_feeling smallint default null
) returns daily_questions language plpgsql security definer set search_path = public as $$
declare v_question daily_questions;
begin
  if not exists (select 1 from participants where id = p_participant_id and status = 'active' for update) then
    raise exception 'participant is not active';
  end if;
  if p_collected then
    if p_station_id is null or p_add_on not in ('nothing', 'food', 'other') or p_feeling not between 1 and 5 then
      raise exception 'daily question follow-up is invalid';
    end if;
    if not exists (select 1 from stations where id = p_station_id and active) then
      raise exception 'station is not active';
    end if;
  elsif p_station_id is not null or p_add_on is not null or p_feeling is not null then
    raise exception 'daily question follow-up is not allowed';
  end if;

  insert into daily_questions(participant_id, local_date, collected, station_id, add_on, feeling)
  values (p_participant_id, pilot_local_day(), p_collected, p_station_id, p_add_on, p_feeling)
  returning * into v_question;

  insert into events(type, participant_id, station_id, actor_type, data)
  values ('daily_question_answered', p_participant_id, p_station_id, 'participant', jsonb_build_object('collected', p_collected));
  return v_question;
exception when unique_violation then
  raise exception 'daily question already answered';
end $$;

revoke execute on function pilot_local_day() from public, anon, authenticated;
revoke execute on function daily_question_answered_today(uuid) from public, anon, authenticated;
revoke execute on function record_daily_question(uuid, boolean, uuid, text, smallint) from public, anon, authenticated;
grant execute on function daily_question_answered_today(uuid) to service_role;
grant execute on function record_daily_question(uuid, boolean, uuid, text, smallint) to service_role;
