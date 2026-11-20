create schema if not exists app_private;
revoke all on schema app_private from public;
grant usage on schema app_private to anon, authenticated;

alter function public.has_role(uuid, public.app_role) set schema app_private;
alter function public.is_staff(uuid) set schema app_private;
alter function public.can_access_conv(uuid) set schema app_private;
alter function public.owns_open_cart(uuid) set schema app_private;

create or replace function app_private.can_access_conv(_c uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.conversations
    where id = _c and (client_id = auth.uid() or app_private.is_staff(auth.uid()))
  )
$$;

revoke all on function app_private.has_role(uuid, public.app_role) from public, anon, authenticated;
grant execute on function app_private.has_role(uuid, public.app_role) to authenticated;
revoke all on function app_private.is_staff(uuid) from public, anon, authenticated;
grant execute on function app_private.is_staff(uuid) to anon, authenticated;
revoke all on function app_private.can_access_conv(uuid) from public, anon, authenticated;
grant execute on function app_private.can_access_conv(uuid) to authenticated;
revoke all on function app_private.owns_open_cart(uuid) from public, anon, authenticated;
grant execute on function app_private.owns_open_cart(uuid) to authenticated;

revoke all on function public.assign_tracking_code() from public, anon, authenticated;
revoke all on function public.prevent_code_change() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.event_updates_status() from public, anon, authenticated;
revoke all on function public.cart_item_snapshot() from public, anon, authenticated;
revoke all on function public.cart_item_keep() from public, anon, authenticated;
revoke all on function public.cart_sync() from public, anon, authenticated;
revoke all on function public.msg_touch() from public, anon, authenticated;
alter function public.prevent_code_change() set search_path = public;
alter function public.cart_item_keep() set search_path = public;

alter policy "own roles read" on public.user_roles
  using (user_id = (select auth.uid()) or app_private.is_staff((select auth.uid())));
alter policy "profile read" on public.profiles
  using (id = (select auth.uid()) or app_private.is_staff((select auth.uid())));
alter policy "profile update own" on public.profiles
  using (id = (select auth.uid()) or app_private.is_staff((select auth.uid())))
  with check (id = (select auth.uid()) or app_private.is_staff((select auth.uid())));
alter policy "profile insert own" on public.profiles
  with check (id = (select auth.uid()));
alter policy "settings admin update" on public.site_settings
  using (app_private.has_role((select auth.uid()), 'super_admin') or app_private.has_role((select auth.uid()), 'admin'))
  with check (app_private.has_role((select auth.uid()), 'super_admin') or app_private.has_role((select auth.uid()), 'admin'));

alter policy "orders read" on public.orders
  using (client_id = (select auth.uid()) or app_private.is_staff((select auth.uid())));
drop policy "orders staff write" on public.orders;
create policy "orders staff insert" on public.orders for insert to authenticated
  with check (app_private.is_staff((select auth.uid())));
create policy "orders staff update" on public.orders for update to authenticated
  using (app_private.is_staff((select auth.uid()))) with check (app_private.is_staff((select auth.uid())));
create policy "orders staff delete" on public.orders for delete to authenticated
  using (app_private.is_staff((select auth.uid())));

alter policy "shipments read" on public.shipments
  using (client_id = (select auth.uid()) or app_private.is_staff((select auth.uid())));
drop policy "shipments staff write" on public.shipments;
create policy "shipments staff insert" on public.shipments for insert to authenticated
  with check (app_private.is_staff((select auth.uid())));
create policy "shipments staff update" on public.shipments for update to authenticated
  using (app_private.is_staff((select auth.uid()))) with check (app_private.is_staff((select auth.uid())));
create policy "shipments staff delete" on public.shipments for delete to authenticated
  using (app_private.is_staff((select auth.uid())));

alter policy "events read" on public.shipment_events
  using (app_private.is_staff((select auth.uid())) or exists (
    select 1 from public.shipments s where s.id = shipment_id and s.client_id = (select auth.uid())
  ));
drop policy "events staff write" on public.shipment_events;
create policy "events staff insert" on public.shipment_events for insert to authenticated
  with check (app_private.is_staff((select auth.uid())));
create policy "events staff update" on public.shipment_events for update to authenticated
  using (app_private.is_staff((select auth.uid()))) with check (app_private.is_staff((select auth.uid())));
create policy "events staff delete" on public.shipment_events for delete to authenticated
  using (app_private.is_staff((select auth.uid())));

alter policy "cat read" on public.categories using (true);
drop policy "cat staff" on public.categories;
create policy "cat staff insert" on public.categories for insert to authenticated
  with check (app_private.is_staff((select auth.uid())));
create policy "cat staff update" on public.categories for update to authenticated
  using (app_private.is_staff((select auth.uid()))) with check (app_private.is_staff((select auth.uid())));
create policy "cat staff delete" on public.categories for delete to authenticated
  using (app_private.is_staff((select auth.uid())));

alter policy "prod read" on public.products
  using (published or app_private.is_staff((select auth.uid())));
drop policy "prod staff" on public.products;
create policy "prod staff insert" on public.products for insert to authenticated
  with check (app_private.is_staff((select auth.uid())));
create policy "prod staff update" on public.products for update to authenticated
  using (app_private.is_staff((select auth.uid()))) with check (app_private.is_staff((select auth.uid())));
create policy "prod staff delete" on public.products for delete to authenticated
  using (app_private.is_staff((select auth.uid())));

alter policy "fav own" on public.favorites
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
alter policy "cart read" on public.carts
  using (user_id = (select auth.uid()) or app_private.is_staff((select auth.uid())));
alter policy "cart insert own" on public.carts
  with check (user_id = (select auth.uid()) and status = 'open');
alter policy "cart staff update" on public.carts
  using (app_private.is_staff((select auth.uid()))) with check (app_private.is_staff((select auth.uid())));

alter policy "items read" on public.cart_items using (
  exists (select 1 from public.carts c where c.id = cart_id and (c.user_id = (select auth.uid()) or app_private.is_staff((select auth.uid()))))
);
drop policy "items write open" on public.cart_items;
create policy "items insert open" on public.cart_items for insert to authenticated
  with check (app_private.owns_open_cart(cart_id));
create policy "items update open" on public.cart_items for update to authenticated
  using (app_private.owns_open_cart(cart_id)) with check (app_private.owns_open_cart(cart_id));
create policy "items delete open" on public.cart_items for delete to authenticated
  using (app_private.owns_open_cart(cart_id));

alter policy "conv read" on public.conversations
  using (client_id = (select auth.uid()) or app_private.is_staff((select auth.uid())));
alter policy "conv staff update" on public.conversations
  using (app_private.is_staff((select auth.uid()))) with check (app_private.is_staff((select auth.uid())));
alter policy "msg read" on public.messages
  using (app_private.can_access_conv(conversation_id));
alter policy "msg send" on public.messages
  with check (app_private.can_access_conv(conversation_id) and sender_id = (select auth.uid()) and kind = 'text');
alter policy "msg mark read" on public.messages
  using (app_private.can_access_conv(conversation_id) and sender_id is distinct from (select auth.uid()))
  with check (app_private.can_access_conv(conversation_id) and sender_id is distinct from (select auth.uid()));
alter policy "hist read" on public.cart_history using (
  exists (select 1 from public.carts c where c.id = cart_id and (c.user_id = (select auth.uid()) or app_private.is_staff((select auth.uid()))))
);

alter policy "product images staff write" on storage.objects
  with check (bucket_id = 'products' and app_private.is_staff((select auth.uid())));
alter policy "product images staff delete" on storage.objects
  using (bucket_id = 'products' and app_private.is_staff((select auth.uid())));

create index if not exists cart_history_cart_id_idx on public.cart_history(cart_id);
create index if not exists cart_items_product_id_idx on public.cart_items(product_id);
create index if not exists categories_parent_id_idx on public.categories(parent_id);
create index if not exists conversations_client_id_idx on public.conversations(client_id);
create index if not exists favorites_product_id_idx on public.favorites(product_id);
create index if not exists messages_conversation_id_idx on public.messages(conversation_id);
create index if not exists messages_reply_to_idx on public.messages(reply_to);
create index if not exists orders_client_id_idx on public.orders(client_id);
create index if not exists products_category_id_idx on public.products(category_id);
create index if not exists shipment_events_shipment_id_idx on public.shipment_events(shipment_id);
create index if not exists shipments_client_id_idx on public.shipments(client_id);
create index if not exists shipments_order_id_idx on public.shipments(order_id);
