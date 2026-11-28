-- ENA COLLECTION (project PRIORITY): Supabase schema
-- How to run: Supabase dashboard > SQL Editor > New query > paste all > Run.
-- Safe to run once on a fresh project. Do NOT put real bank details in this file.

------------------------------------------------------------
-- 1. TABLES
------------------------------------------------------------
create sequence if not exists order_ref_seq start 10001;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'customer' check (role in ('customer','admin')),
  created_at timestamptz not null default now()
);

create table public.delivery_areas (
  id uuid primary key default gen_random_uuid(),
  state text not null,
  name text not null,
  fee numeric(12,2) not null default 0 check (fee >= 0),
  is_active boolean not null default true,
  unique (state, name)
);

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text,
  recipient_name text not null,
  phone text not null,
  area_id uuid not null references public.delivery_areas(id),
  street text not null,
  landmark text,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  is_active boolean not null default true,      -- false = not shoppable yet
  coming_soon boolean not null default false,   -- true = show the COMING SOON label
  sort_order int not null default 0
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id),
  name text not null,
  slug text not null unique,
  description text,
  price numeric(12,2) not null check (price >= 0),
  sale_price numeric(12,2) check (sale_price >= 0),   -- discounted price (optional)
  stock_quantity int not null default 0 check (stock_quantity >= 0),
  low_stock_threshold int not null default 5,
  tags text[] not null default '{}',
  is_active boolean not null default true,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Optional variations (size, colour...). If a product has variants, their stock is used.
create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  label text not null,
  price_override numeric(12,2) check (price_override >= 0),
  stock_quantity int not null default 0 check (stock_quantity >= 0)
);

create table public.product_media (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  type text not null check (type in ('image','video')),
  storage_path text not null,                   -- path inside the product-media bucket
  sort_order int not null default 0
);

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete cascade,
  quantity int not null check (quantity > 0),
  created_at timestamptz not null default now()
);
create unique index cart_items_unique
  on public.cart_items (user_id, product_id, coalesce(variant_id, '00000000-0000-0000-0000-000000000000'::uuid));

create table public.riders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  is_active boolean not null default true
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default ('ENA-' || nextval('order_ref_seq')::text),
  user_id uuid not null references auth.users(id),
  status text not null default 'awaiting_payment' check (status in (
    'awaiting_payment','payment_under_review','payment_confirmed','processing',
    'ready_for_dispatch','rider_assigned','out_for_delivery','delivered',
    'payment_rejected','cancelled','expired')),
  subtotal numeric(12,2) not null default 0,
  delivery_fee numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  recipient_name text not null,
  recipient_phone text not null,
  state text not null,
  area_name text not null,
  street text not null,
  landmark text,
  note text,
  rider_id uuid references public.riders(id),
  expires_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  product_name text not null,
  variant_label text,
  unit_price numeric(12,2) not null,
  quantity int not null check (quantity > 0),
  line_total numeric(12,2) not null
);

create table public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status text not null,
  note text,
  created_by uuid,
  created_at timestamptz not null default now()
);

-- One row per receipt a customer uploads. "method" lets us add Paystack later.
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  method text not null default 'bank_transfer',
  amount numeric(12,2) not null,
  receipt_path text,                            -- path inside the private receipts bucket
  status text not null default 'pending' check (status in ('pending','confirmed','rejected')),
  reject_reason text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.site_settings (
  key text primary key,
  value text not null default '',
  visibility text not null default 'admin' check (visibility in ('public','authenticated','admin'))
);

------------------------------------------------------------
-- 2. HELPER FUNCTIONS AND TRIGGERS
------------------------------------------------------------
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'phone');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Nobody can make themselves admin (the SQL editor, with no logged-in user, still can).
create or replace function public.guard_profile_role() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null and not public.is_admin() then
    raise exception 'You cannot change roles';
  end if;
  return new;
end $$;
create trigger guard_profile_role before update on public.profiles
  for each row execute function public.guard_profile_role();

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();

------------------------------------------------------------
-- 3. ORDER LOGIC (runs on the server side, customers cannot bypass it)
------------------------------------------------------------
-- Put stock back for every item of an order (internal use only).
create or replace function public.restore_order_stock(p_order_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare r record;
begin
  for r in select product_id, variant_id, quantity from order_items where order_id = p_order_id loop
    if r.variant_id is not null then
      update product_variants set stock_quantity = stock_quantity + r.quantity where id = r.variant_id;
    elsif r.product_id is not null then
      update products set stock_quantity = stock_quantity + r.quantity where id = r.product_id;
    end if;
  end loop;
end $$;

-- Turn the signed-in customer's cart into an order. Prices, delivery fee and stock
-- are all read here from the database, never trusted from the browser.
create or replace function public.place_order(p_address_id uuid, p_note text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_addr addresses%rowtype;
  v_state text; v_area text; v_fee numeric(12,2);
  v_order uuid; v_hold int := 24; v_subtotal numeric(12,2) := 0;
  r record; v_name text; v_unit numeric(12,2); v_label text; v_stock int;
begin
  if v_uid is null then raise exception 'Please sign in first'; end if;
  select * into v_addr from addresses where id = p_address_id and user_id = v_uid;
  if not found then raise exception 'Delivery address not found'; end if;
  select state, name, fee into v_state, v_area, v_fee
    from delivery_areas where id = v_addr.area_id and is_active;
  if not found then raise exception 'We do not deliver to this area yet'; end if;
  if not exists (select 1 from cart_items where user_id = v_uid) then
    raise exception 'Your cart is empty';
  end if;
  select coalesce(nullif(value, '')::int, 24) into v_hold from site_settings where key = 'order_hold_hours';
  v_hold := coalesce(v_hold, 24);

  insert into orders (user_id, subtotal, delivery_fee, total, recipient_name, recipient_phone,
                      state, area_name, street, landmark, note, expires_at)
  values (v_uid, 0, v_fee, v_fee, v_addr.recipient_name, v_addr.phone,
          v_state, v_area, v_addr.street, v_addr.landmark, p_note,
          now() + make_interval(hours => v_hold))
  returning id into v_order;

  for r in select product_id, variant_id, quantity from cart_items where user_id = v_uid loop
    select p.name, coalesce(p.sale_price, p.price), p.stock_quantity into v_name, v_unit, v_stock
      from products p join categories c on c.id = p.category_id
      where p.id = r.product_id and p.is_active and c.is_active
      for update of p;
    if not found then raise exception 'An item in your cart is no longer available'; end if;
    v_label := null;
    if r.variant_id is not null then
      select label, coalesce(price_override, v_unit), stock_quantity into v_label, v_unit, v_stock
        from product_variants where id = r.variant_id and product_id = r.product_id for update;
      if not found then raise exception 'An item option is no longer available'; end if;
      if v_stock < r.quantity then raise exception 'Not enough stock for %', v_name; end if;
      update product_variants set stock_quantity = stock_quantity - r.quantity where id = r.variant_id;
    else
      if v_stock < r.quantity then raise exception 'Not enough stock for %', v_name; end if;
      update products set stock_quantity = stock_quantity - r.quantity where id = r.product_id;
    end if;
    insert into order_items (order_id, product_id, variant_id, product_name, variant_label,
                             unit_price, quantity, line_total)
    values (v_order, r.product_id, r.variant_id, v_name, v_label, v_unit, r.quantity, v_unit * r.quantity);
    v_subtotal := v_subtotal + v_unit * r.quantity;
  end loop;

  update orders set subtotal = v_subtotal, total = v_subtotal + v_fee where id = v_order;
  delete from cart_items where user_id = v_uid;
  insert into order_events (order_id, status, note, created_by)
    values (v_order, 'awaiting_payment', 'Order placed', v_uid);
  return v_order;
end $$;

-- Customer finished uploading a receipt to the receipts bucket.
create or replace function public.submit_receipt(p_order_id uuid, p_path text) returns void
language plpgsql security definer set search_path = public as $$
declare v_o orders%rowtype;
begin
  select * into v_o from orders where id = p_order_id and user_id = auth.uid() for update;
  if not found then raise exception 'Order not found'; end if;
  if v_o.status not in ('awaiting_payment','payment_rejected') then
    raise exception 'This order is not waiting for payment';
  end if;
  if v_o.expires_at < now() then raise exception 'This order has expired'; end if;
  if split_part(p_path, '/', 1) <> auth.uid()::text then raise exception 'Invalid receipt path'; end if;
  insert into payments (order_id, amount, receipt_path) values (p_order_id, v_o.total, p_path);
  update orders set status = 'payment_under_review' where id = p_order_id;
  insert into order_events (order_id, status, note, created_by)
    values (p_order_id, 'payment_under_review', 'Receipt uploaded', auth.uid());
end $$;

-- Owner confirms or rejects a receipt.
create or replace function public.review_payment(p_payment_id uuid, p_approve boolean, p_reason text default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_p payments%rowtype; v_hold int := 24;
begin
  if not public.is_admin() then raise exception 'Not allowed'; end if;
  select * into v_p from payments where id = p_payment_id for update;
  if not found or v_p.status <> 'pending' then raise exception 'Payment not found or already reviewed'; end if;
  if not exists (select 1 from orders where id = v_p.order_id and status = 'payment_under_review') then
    raise exception 'This order is no longer waiting for review';
  end if;
  if p_approve then
    update payments set status = 'confirmed', reviewed_by = auth.uid(), reviewed_at = now() where id = p_payment_id;
    update orders set status = 'payment_confirmed' where id = v_p.order_id;
    insert into order_events (order_id, status, note, created_by)
      values (v_p.order_id, 'payment_confirmed', 'Payment confirmed', auth.uid());
  else
    select coalesce(nullif(value, '')::int, 24) into v_hold from site_settings where key = 'order_hold_hours';
    update payments set status = 'rejected', reject_reason = p_reason, reviewed_by = auth.uid(), reviewed_at = now()
      where id = p_payment_id;
    update orders set status = 'payment_rejected', expires_at = now() + make_interval(hours => coalesce(v_hold, 24))
      where id = v_p.order_id;
    insert into order_events (order_id, status, note, created_by)
      values (v_p.order_id, 'payment_rejected', coalesce(p_reason, 'Receipt could not be confirmed'), auth.uid());
  end if;
end $$;

-- Owner moves a paid order forward.
create or replace function public.set_order_status(p_order_id uuid, p_status text, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_o orders%rowtype;
begin
  if not public.is_admin() then raise exception 'Not allowed'; end if;
  if p_status not in ('processing','ready_for_dispatch','out_for_delivery','delivered') then
    raise exception 'Invalid status';
  end if;
  select * into v_o from orders where id = p_order_id for update;
  if not found then raise exception 'Order not found'; end if;
  if v_o.status not in ('payment_confirmed','processing','ready_for_dispatch','rider_assigned','out_for_delivery') then
    raise exception 'This order cannot be moved to that stage yet';
  end if;
  update orders set status = p_status,
    delivered_at = case when p_status = 'delivered' then now() else delivered_at end
    where id = p_order_id;
  insert into order_events (order_id, status, note, created_by)
    values (p_order_id, p_status, p_note, auth.uid());
end $$;

create or replace function public.assign_rider(p_order_id uuid, p_rider_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_o orders%rowtype;
begin
  if not public.is_admin() then raise exception 'Not allowed'; end if;
  select * into v_o from orders where id = p_order_id for update;
  if not found then raise exception 'Order not found'; end if;
  if v_o.status not in ('payment_confirmed','processing','ready_for_dispatch','rider_assigned') then
    raise exception 'Confirm payment before assigning a rider';
  end if;
  if not exists (select 1 from riders where id = p_rider_id and is_active) then
    raise exception 'Rider not found';
  end if;
  update orders set rider_id = p_rider_id, status = 'rider_assigned' where id = p_order_id;
  insert into order_events (order_id, status, note, created_by)
    values (p_order_id, 'rider_assigned', 'Rider assigned', auth.uid());
end $$;

-- Customers can cancel their own unpaid orders; the owner can cancel any open order.
create or replace function public.cancel_order(p_order_id uuid, p_reason text default null) returns void
language plpgsql security definer set search_path = public as $$
declare v_o orders%rowtype; v_admin boolean := public.is_admin();
begin
  select * into v_o from orders where id = p_order_id for update;
  if not found then raise exception 'Order not found'; end if;
  if not v_admin then
    if v_o.user_id <> auth.uid() or v_o.status not in ('awaiting_payment','payment_rejected') then
      raise exception 'This order cannot be cancelled';
    end if;
  elsif v_o.status in ('delivered','cancelled','expired') then
    raise exception 'This order is already closed';
  end if;
  perform public.restore_order_stock(p_order_id);
  update orders set status = 'cancelled' where id = p_order_id;
  insert into order_events (order_id, status, note, created_by)
    values (p_order_id, 'cancelled', p_reason, auth.uid());
end $$;

-- Releases stock for orders not paid within the holding time. Run it every hour (see section 7).
create or replace function public.expire_unpaid_orders() returns integer
language plpgsql security definer set search_path = public as $$
declare r record; n integer := 0;
begin
  for r in select id from orders
           where status in ('awaiting_payment','payment_rejected') and expires_at < now() for update loop
    perform public.restore_order_stock(r.id);
    update orders set status = 'expired' where id = r.id;
    insert into order_events (order_id, status, note) values (r.id, 'expired', 'Not paid within the holding time');
    n := n + 1;
  end loop;
  return n;
end $$;

-- Who may call what
revoke all on function public.restore_order_stock(uuid) from public, anon, authenticated;
revoke all on function public.expire_unpaid_orders() from public, anon, authenticated;
revoke all on function public.place_order(uuid, text) from public, anon;
revoke all on function public.submit_receipt(uuid, text) from public, anon;
revoke all on function public.review_payment(uuid, boolean, text) from public, anon;
revoke all on function public.set_order_status(uuid, text, text) from public, anon;
revoke all on function public.assign_rider(uuid, uuid) from public, anon;
revoke all on function public.cancel_order(uuid, text) from public, anon;
grant execute on function public.place_order(uuid, text) to authenticated;
grant execute on function public.submit_receipt(uuid, text) to authenticated;
grant execute on function public.review_payment(uuid, boolean, text) to authenticated;
grant execute on function public.set_order_status(uuid, text, text) to authenticated;
grant execute on function public.assign_rider(uuid, uuid) to authenticated;
grant execute on function public.cancel_order(uuid, text) to authenticated;

------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (this is what makes the dashboard owner-only)
------------------------------------------------------------
alter table public.profiles         enable row level security;
alter table public.delivery_areas   enable row level security;
alter table public.addresses        enable row level security;
alter table public.categories       enable row level security;
alter table public.products         enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_media    enable row level security;
alter table public.cart_items       enable row level security;
alter table public.riders           enable row level security;
alter table public.orders           enable row level security;
alter table public.order_items      enable row level security;
alter table public.order_events     enable row level security;
alter table public.payments         enable row level security;
alter table public.site_settings    enable row level security;

-- Owner (admin) can do everything on every table
do $$
declare t text;
begin
  foreach t in array array['profiles','delivery_areas','addresses','categories','products','product_variants',
    'product_media','cart_items','riders','orders','order_items','order_events','payments','site_settings']
  loop
    execute format('create policy "admin full access" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- Customers
create policy "own profile read"   on public.profiles for select to authenticated using (id = auth.uid());
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "areas are public"   on public.delivery_areas for select using (is_active);
create policy "own addresses"      on public.addresses for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "categories are public" on public.categories for select using (true);

create policy "active products are public" on public.products for select
  using (is_active and exists (select 1 from public.categories c where c.id = category_id and c.is_active));
create policy "variants of active products" on public.product_variants for select
  using (exists (select 1 from public.products p where p.id = product_id and p.is_active));
create policy "media of active products" on public.product_media for select
  using (exists (select 1 from public.products p where p.id = product_id and p.is_active));

create policy "own cart" on public.cart_items for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "rider of my order" on public.riders for select to authenticated
  using (exists (select 1 from public.orders o where o.rider_id = riders.id and o.user_id = auth.uid()));
create policy "own orders"       on public.orders for select to authenticated using (user_id = auth.uid());
create policy "own order items"  on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy "own order events" on public.order_events for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy "own payments"     on public.payments for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
-- (customers cannot insert or edit orders and payments directly: only the functions above can)

create policy "public settings"        on public.site_settings for select using (visibility = 'public');
create policy "signed-in settings"     on public.site_settings for select to authenticated using (visibility in ('public','authenticated'));

------------------------------------------------------------
-- 5. STORAGE (product media = public, receipts = private)
------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('product-media', 'product-media', true,  52428800,
     array['image/jpeg','image/png','image/webp','video/mp4','video/webm']),
  ('receipts',      'receipts',      false, 5242880,
     array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do nothing;

create policy "product media is public" on storage.objects for select
  using (bucket_id = 'product-media');
create policy "admin manages product media" on storage.objects for all to authenticated
  using (bucket_id = 'product-media' and public.is_admin())
  with check (bucket_id = 'product-media' and public.is_admin());

-- Receipt files must live in a folder named after the customer's user id: <user_id>/<file>
create policy "customers upload own receipts" on storage.objects for insert to authenticated
  with check (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "read own receipts or admin" on storage.objects for select to authenticated
  using (bucket_id = 'receipts' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

------------------------------------------------------------
-- 6. STARTING DATA (placeholders for testing, the owner edits these in the dashboard)
------------------------------------------------------------
insert into public.categories (name, slug, description, is_active, coming_soon, sort_order) values
  ('Adult Pleasure Collection', 'adult-pleasure-collection', null, true,  false, 1),
  ('Clothing',                  'clothing',                  null, false, true,  2);

insert into public.delivery_areas (state, name, fee) values
  ('Edo',   'Benin City', 2000), ('Edo',   'Ekpoma', 3500), ('Edo',   'Auchi', 4000),
  ('Delta', 'Warri',      3000), ('Delta', 'Asaba',  3500), ('Delta', 'Oghara', 2500), ('Delta', 'Sapele', 3000);

insert into public.site_settings (key, value, visibility) values
  ('whatsapp_number',     '+2348052036507',            'public'),
  ('contact_email',       'imadeprecious670@gmail.com', 'public'),
  ('order_hold_hours',    '24',                        'public'),
  ('order_email',         'imadeprecious670@gmail.com', 'admin'),
  ('bank_name',           '[BANK NAME]',               'authenticated'),
  ('bank_account_number', '[ACCOUNT NUMBER]',          'authenticated'),
  ('bank_account_name',   '[ACCOUNT NAME]',            'authenticated');

------------------------------------------------------------
-- 7. AFTER RUNNING THIS FILE (run these separately, once)
------------------------------------------------------------
-- a) Make the owner an admin: first sign up on the site (or Authentication > Users > Add user)
--    with the owner email, then run:
--
--    update public.profiles set role = 'admin'
--    where id = (select id from auth.users where email = 'imadeprecious670@gmail.com');
--
-- b) Release stock of unpaid orders every hour. Enable the pg_cron extension
--    (Database > Extensions), then run:
--
--    select cron.schedule('expire-unpaid-orders', '0 * * * *', 'select public.expire_unpaid_orders()');
