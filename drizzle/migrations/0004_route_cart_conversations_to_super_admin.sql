-- Route every cart-created conversation to the current super_admin.
-- No table/schema changes: assigned_to already exists.
create or replace function public.cart_sync()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  cid uuid;
  uid uuid;
  conv uuid;
  staff_uid uuid;
  r record;
begin
  r := coalesce(new, old);
  cid := r.cart_id;
  select user_id into uid from public.carts where id = cid;
  update public.carts set updated_at = now() where id = cid;
  insert into public.cart_history (cart_id, action, product_name, quantity)
    values (cid, lower(tg_op), r.name, case when tg_op = 'DELETE' then old.quantity else new.quantity end);
  select id into conv from public.conversations where cart_id = cid;
  if conv is null and tg_op = 'INSERT' then
    select user_id into staff_uid
      from public.user_roles
      where role = 'super_admin'
      order by user_id
      limit 1;
    insert into public.conversations (client_id, cart_id, subject, assigned_to)
      values (uid, cid, 'Sélection boutique', staff_uid)
      returning id into conv;
    insert into public.messages (conversation_id, sender_id, kind, body) values (conv, uid, 'text',
      'Bonjour, voici les articles que je souhaite commander. Merci de vérifier ma sélection et de me communiquer les disponibilités, les frais supplémentaires et les possibilités d''expédition.');
    insert into public.messages (conversation_id, sender_id, kind, payload) values (conv, uid, 'cart', jsonb_build_object('cart_id', cid));
  elsif conv is not null then
    insert into public.messages (conversation_id, kind, body) values (conv, 'system',
      case tg_op when 'INSERT' then 'Article ajouté : ' || r.name
                 when 'DELETE' then 'Article retiré : ' || r.name
                 else 'Quantité modifiée : ' || r.name || ' × ' || new.quantity end);
  end if;
  update public.conversations set last_message_at = now() where id = conv;
  return null;
end $function$;

-- The only currently unassigned conversation is cart-backed; assign that existing thread too.
update public.conversations
set assigned_to = (
  select user_id from public.user_roles where role = 'super_admin' order by user_id limit 1
)
where assigned_to is null
  and cart_id is not null
  and exists (select 1 from public.user_roles where role = 'super_admin');
