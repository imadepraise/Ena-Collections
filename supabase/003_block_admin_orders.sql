-- Run ONCE in the Supabase SQL Editor.
-- Stops owner (admin) accounts from placing orders. Customers are not affected.

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
  if public.is_admin() then
    raise exception 'Owner accounts cannot place orders. Please use a customer account.';
  end if;
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

revoke all on function public.place_order(uuid, text) from public, anon;
grant execute on function public.place_order(uuid, text) to authenticated;
