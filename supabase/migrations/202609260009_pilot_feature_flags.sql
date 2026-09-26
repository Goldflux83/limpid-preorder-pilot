create table pilot_feature_flags (
  key text primary key check (key in ('ordering', 'store_screen', 'digital_stamps', 'card_photos', 'email_delivery')),
  enabled boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table pilot_feature_flags enable row level security;

insert into pilot_feature_flags(key, enabled) values
  ('ordering', false), ('store_screen', true), ('digital_stamps', false), ('card_photos', false), ('email_delivery', false)
on conflict (key) do nothing;
