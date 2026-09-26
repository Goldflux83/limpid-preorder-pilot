alter table store_sessions
  add column revoked_by_admin_id uuid references admin_profiles(user_id),
  add column revoked_reason text;
