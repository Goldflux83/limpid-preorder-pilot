insert into stations(code, name) values
  ('AMF', 'Amersfoort'),
  ('GD', 'Gouda')
on conflict (code) do update set name = excluded.name;
