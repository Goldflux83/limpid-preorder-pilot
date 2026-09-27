create or replace function record_order_feedback(
  p_participant_id uuid,
  p_order_id uuid,
  p_smiley smallint,
  p_open_answer text default null
) returns boolean language plpgsql security definer set search_path = public as $$
begin
  if p_smiley not between 1 and 5 or length(coalesce(p_open_answer, '')) > 1000 then return false; end if;
  update orders
    set smiley = p_smiley,
        open_answer = nullif(trim(p_open_answer), ''),
        updated_at = now()
    where id = p_order_id
      and participant_id = p_participant_id
      and status = 'collected'
      and smiley is null;
  if not found then return false; end if;
  insert into events(type, participant_id, order_id, actor_type, data)
  values ('order_feedback_recorded', p_participant_id, p_order_id, 'participant', jsonb_build_object('smiley', p_smiley));
  return true;
end $$;

revoke execute on function record_order_feedback(uuid, uuid, smallint, text) from public, anon, authenticated;
grant execute on function record_order_feedback(uuid, uuid, smallint, text) to service_role;
