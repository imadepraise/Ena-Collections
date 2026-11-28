-- Run ONCE in the Supabase SQL Editor.
-- Adds every Nigerian state and Abuja (FCT) as a delivery option, so customers can order from anywhere.
-- The fees below are placeholders: change them in the Dashboard under Delivery fees.

insert into public.delivery_areas (state, name, fee) values
  ('Edo',   'Other areas', 3500),
  ('Delta', 'Other areas', 3500)
on conflict (state, name) do nothing;

insert into public.delivery_areas (state, name, fee)
select s, 'All areas', 5000
from unnest(array[
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River','Ebonyi','Ekiti',
  'Enugu','Abuja (FCT)','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos',
  'Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara'
]) as s
on conflict (state, name) do nothing;
