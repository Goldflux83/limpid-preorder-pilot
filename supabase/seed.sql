insert into stations(code, name, ordering_enabled, opening_hours) values
  ('AMF','Amersfoort',false,'{"mon":{"open":"06:30","close":"19:00"},"tue":{"open":"06:30","close":"19:00"},"wed":{"open":"06:30","close":"19:00"},"thu":{"open":"06:30","close":"19:00"},"fri":{"open":"06:30","close":"19:00"},"sat":{"open":"07:30","close":"21:00"},"sun":{"open":"07:30","close":"19:00"}}'),
  ('GD','Gouda',false,'{"mon":{"open":"06:30","close":"18:30"},"tue":{"open":"06:30","close":"18:30"},"wed":{"open":"06:30","close":"18:30"},"thu":{"open":"06:30","close":"18:30"},"fri":{"open":"06:30","close":"18:30"},"sat":{"open":"07:30","close":"21:00"},"sun":{"open":"07:30","close":"19:00"}}')
on conflict (code) do update set name=excluded.name, opening_hours=excluded.opening_hours;

insert into products(station_id, name, position) select s.id, p.name, p.position from stations s cross join (values ('Cappuccino',1),('Caffè latte',2),('Americano',3),('Espresso',4),('Thee',5),('Warme chocolademelk',6)) as p(name,position) on conflict (station_id,name) do update set position=excluded.position;
