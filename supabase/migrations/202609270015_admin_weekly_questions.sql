drop function if exists mark_weekly_question_complete(uuid, integer);

create or replace function mark_weekly_question_complete(
  p_participant_id uuid,
  p_week_number integer,
  p_admin_id uuid
) returns boolean language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from participants where id = p_participant_id) then return false; end if;
  if not exists (select 1 from admin_profiles where user_id = p_admin_id and active) then return false; end if;
  insert into weekly_question_statuses(participant_id, week_number, completed_at, completed_by_admin_id)
  values (p_participant_id, p_week_number, now(), p_admin_id)
  on conflict (participant_id, week_number) do update
    set completed_at = excluded.completed_at,
        completed_by_admin_id = excluded.completed_by_admin_id,
        updated_at = now();
  insert into events(type, participant_id, actor_type, actor_id, data)
  values ('weekly_question_completed', p_participant_id, 'admin', p_admin_id, jsonb_build_object('week_number', p_week_number));
  return true;
end $$;

revoke execute on function mark_weekly_question_complete(uuid, integer, uuid) from public, anon, authenticated;
grant execute on function mark_weekly_question_complete(uuid, integer, uuid) to service_role;
