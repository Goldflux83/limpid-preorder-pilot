create table participant_action_attempts (
  id uuid primary key default gen_random_uuid(),
  fingerprint_hash text not null,
  attempted_at timestamptz not null default now()
);
create index participant_action_attempts_lookup on participant_action_attempts(fingerprint_hash, attempted_at desc);
alter table participant_action_attempts enable row level security;

alter table events add constraint events_no_direct_personal_data
  check (not (data ?| array['email', 'first_name', 'firstName', 'name', 'pin', 'token', 'token_hash', 'tokenHash']));
