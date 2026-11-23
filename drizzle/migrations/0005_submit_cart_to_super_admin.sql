-- Submit an owned cart to its existing conversation with the super_admin.
-- Cart rows remain unchanged; the submitted state prevents further client edits.
create or replace function public.submit_cart(_cart_id uuid)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  _user_id uuid := auth.uid();
  _cart_user_id uuid;
  _cart_status text;
  _conversation_id uuid;
  _super_admin_id uuid;
  _items jsonb;
begin
  if _user_id is null then
    raise exception 'Connexion requise';
  end if;

  select user_id, status
    into _cart_user_id, _cart_status
    from public.carts
    where id = _cart_id
    for update;
  if not found then
    raise exception 'Panier introuvable';
  end if;
  if _cart_user_id is distinct from _user_id then
    raise exception 'Vous ne pouvez pas valider ce panier';
  end if;

  select user_id into _super_admin_id
    from public.user_roles
    where role = 'super_admin'
    order by user_id
    limit 1;
  if _super_admin_id is null then
    raise exception 'Aucun super administrateur n’est configuré';
  end if;

  select id into _conversation_id
    from public.conversations
    where cart_id = _cart_id and client_id = _user_id
    for update;

  if _cart_status = 'submitted' then
    if _conversation_id is null then
      raise exception 'Discussion du panier introuvable';
    end if;
    update public.conversations
      set assigned_to = _super_admin_id
      where id = _conversation_id;
    return _conversation_id;
  end if;
  if _cart_status <> 'open' then
    raise exception 'Ce panier ne peut plus être validé';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'product_id', product_id,
        'name', name,
        'reference', reference,
        'image', image,
        'unit_price', unit_price,
        'currency', currency,
        'quantity', quantity,
        'supplier', supplier
      ) order by created_at
    ),
    '[]'::jsonb
  )
    into _items
    from public.cart_items
    where cart_id = _cart_id;
  if jsonb_array_length(_items) = 0 then
    raise exception 'Votre panier est vide';
  end if;

  if _conversation_id is null then
    insert into public.conversations (client_id, cart_id, subject, assigned_to)
      values (_user_id, _cart_id, 'Sélection boutique', _super_admin_id)
      returning id into _conversation_id;
  else
    update public.conversations
      set assigned_to = _super_admin_id
      where id = _conversation_id;
  end if;

  update public.carts
    set status = 'submitted', updated_at = now()
    where id = _cart_id;

  insert into public.messages (conversation_id, sender_id, kind, body, payload)
    values (
      _conversation_id,
      _user_id,
      'cart',
      'Commande validée par le client',
      jsonb_build_object('cart_id', _cart_id, 'submitted', true, 'items', _items)
    );
  update public.conversations set last_message_at = now() where id = _conversation_id;
  return _conversation_id;
end
$function$;

revoke all on function public.submit_cart(uuid) from public, anon;
grant execute on function public.submit_cart(uuid) to authenticated;
