create or replace function rotate_participant_code(
  p_participant_id uuid,
  p_code text,
  p_admin_id uuid
) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if p_code !~ '^[A-HJ-NP-Z2-9]{2}-[A-HJ-NP-Z2-9]{4}$' then
    raise exception 'invalid participant code';
  end if;

  perform 1 from participants where id = p_participant_id for update;
  if not found then
    raise exception 'participant not found';
  end if;

  update participant_codes
  set status = 'retired', retired_at = now(), retired_reason = 'admin_rotation'
  where participant_id = p_participant_id and status = 'active';

  insert into participant_codes(participant_id, code, issued_by_admin_id)
  values (p_participant_id, p_code, p_admin_id);

  insert into events(type, participant_id, actor_type, actor_id)
  values ('participant_code_rotated', p_participant_id, 'admin', p_admin_id);

  return true;
end $$;

revoke execute on function rotate_participant_code(uuid, text, uuid) from public, anon, authenticated;
grant execute on function rotate_participant_code(uuid, text, uuid) to service_role;
