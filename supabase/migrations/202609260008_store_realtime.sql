create policy store_realtime_orders_read on orders for select to authenticated
using (
  (auth.jwt() ->> 'store_station_id') = station_id::text
  and status = 'received'
);

alter publication supabase_realtime add table orders;
