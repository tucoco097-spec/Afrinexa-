alter table public.site_settings add column rate_usd_xaf numeric, add column rate_eur_xaf numeric, add column rates_updated_at timestamptz;

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null, slug text unique not null, parent_id uuid references public.categories(id) on delete set null,
  sort int not null default 0, created_at timestamptz not null default now()
);
grant select on public.categories to anon, authenticated;
grant insert, update, delete on public.categories to authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;
create policy "cat read" on public.categories for select to anon, authenticated using (true);
create policy "cat staff" on public.categories for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null, slug text unique not null, reference text unique not null,
  description text, images text[] not null default '{}', video_url text,
  price numeric(14,2) not null, currency text not null default 'XAF' check (currency in ('XAF','USD','EUR')),
  min_qty int not null default 1, stock int, weight_kg numeric(10,3), dimensions text,
  origin text default 'Chine', supplier text, lead_time text,
  category_id uuid references public.categories(id) on delete set null,
  popularity int not null default 0, published boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;
create policy "prod read" on public.products for select to anon, authenticated using (published or public.is_staff(auth.uid()));
create policy "prod staff" on public.products for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

create table public.favorites (
  user_id uuid not null, product_id uuid not null references public.products(id) on delete cascade,
  primary key (user_id, product_id)
);
grant select, insert, delete on public.favorites to authenticated;
grant all on public.favorites to service_role;
alter table public.favorites enable row level security;
create policy "fav own" on public.favorites for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create table public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'open' check (status in ('open','submitted','quoted','confirmed','closed')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index carts_one_open on public.carts(user_id) where status = 'open';
grant select, insert, update on public.carts to authenticated;
grant all on public.carts to service_role;
alter table public.carts enable row level security;
create policy "cart read" on public.carts for select to authenticated using (user_id = auth.uid() or public.is_staff(auth.uid()));
create policy "cart insert own" on public.carts for insert to authenticated with check (user_id = auth.uid() and status = 'open');
create policy "cart staff update" on public.carts for update to authenticated using (public.is_staff(auth.uid()));

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  product_id uuid not null references public.products(id),
  name text not null, reference text not null, image text, unit_price numeric(14,2) not null, currency text not null,
  supplier text, quantity int not null check (quantity > 0),
  created_at timestamptz not null default now(),
  unique (cart_id, product_id)
);
grant select, insert, update, delete on public.cart_items to authenticated;
grant all on public.cart_items to service_role;
alter table public.cart_items enable row level security;
create or replace function public.owns_open_cart(_cart uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.carts where id = _cart and user_id = auth.uid() and status = 'open')
$$;
create policy "items read" on public.cart_items for select to authenticated using (
  exists (select 1 from public.carts c where c.id = cart_id and (c.user_id = auth.uid() or public.is_staff(auth.uid()))));
create policy "items write open" on public.cart_items for all to authenticated using (public.owns_open_cart(cart_id)) with check (public.owns_open_cart(cart_id));

-- snapshot product data server-side so the client cannot forge prices
create or replace function public.cart_item_snapshot() returns trigger language plpgsql security definer set search_path = public as $$
declare p record;
begin
  select * into p from public.products where id = new.product_id and published;
  if not found then raise exception 'Produit indisponible'; end if;
  if new.quantity < p.min_qty then new.quantity := p.min_qty; end if;
  new.name := p.name; new.reference := p.reference; new.image := p.images[1];
  new.unit_price := p.price; new.currency := p.currency; new.supplier := p.supplier;
  return new;
end $$;
create trigger cart_items_snapshot before insert on public.cart_items for each row execute function public.cart_item_snapshot();
create or replace function public.cart_item_keep() returns trigger language plpgsql as $$
begin
  new.product_id := old.product_id; new.name := old.name; new.reference := old.reference; new.image := old.image;
  new.unit_price := old.unit_price; new.currency := old.currency; new.supplier := old.supplier; new.cart_id := old.cart_id;
  return new;
end $$;
create trigger cart_items_keep before update on public.cart_items for each row execute function public.cart_item_keep();

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  cart_id uuid unique references public.carts(id) on delete set null,
  department text not null default 'commercial' check (department in ('commercial','sourcing','logistique','douane','finance','support')),
  assigned_to uuid, subject text,
  last_message_at timestamptz not null default now(), created_at timestamptz not null default now()
);
grant select, insert, update on public.conversations to authenticated;
grant all on public.conversations to service_role;
alter table public.conversations enable row level security;
create policy "conv read" on public.conversations for select to authenticated using (client_id = auth.uid() or public.is_staff(auth.uid()));
create policy "conv staff update" on public.conversations for update to authenticated using (public.is_staff(auth.uid()));

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid, kind text not null default 'text' check (kind in ('text','cart','system')),
  body text, payload jsonb, reply_to uuid references public.messages(id) on delete set null,
  read_at timestamptz, created_at timestamptz not null default now()
);
grant select, insert on public.messages to authenticated;
grant update (read_at) on public.messages to authenticated;
grant all on public.messages to service_role;
alter table public.messages enable row level security;
create or replace function public.can_access_conv(_c uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.conversations where id = _c and (client_id = auth.uid() or public.is_staff(auth.uid())))
$$;
create policy "msg read" on public.messages for select to authenticated using (public.can_access_conv(conversation_id));
create policy "msg send" on public.messages for insert to authenticated with check (public.can_access_conv(conversation_id) and sender_id = auth.uid() and kind = 'text');
create policy "msg mark read" on public.messages for update to authenticated
  using (public.can_access_conv(conversation_id) and sender_id is distinct from auth.uid())
  with check (public.can_access_conv(conversation_id) and sender_id is distinct from auth.uid());

create table public.cart_history (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  action text not null, product_name text, quantity int, actor uuid default auth.uid(),
  created_at timestamptz not null default now()
);
grant select on public.cart_history to authenticated;
grant all on public.cart_history to service_role;
alter table public.cart_history enable row level security;
create policy "hist read" on public.cart_history for select to authenticated using (
  exists (select 1 from public.carts c where c.id = cart_id and (c.user_id = auth.uid() or public.is_staff(auth.uid()))));

-- cart → conversation sync
create or replace function public.cart_sync() returns trigger language plpgsql security definer set search_path = public as $$
declare cid uuid; uid uuid; conv uuid; r record;
begin
  r := coalesce(new, old);
  cid := r.cart_id;
  select user_id into uid from public.carts where id = cid;
  update public.carts set updated_at = now() where id = cid;
  insert into public.cart_history (cart_id, action, product_name, quantity)
    values (cid, lower(tg_op), r.name, case when tg_op = 'DELETE' then old.quantity else new.quantity end);
  select id into conv from public.conversations where cart_id = cid;
  if conv is null and tg_op = 'INSERT' then
    insert into public.conversations (client_id, cart_id, subject) values (uid, cid, 'Sélection boutique') returning id into conv;
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
end $$;
create trigger cart_items_sync after insert or update of quantity or delete on public.cart_items for each row execute function public.cart_sync();

create or replace function public.msg_touch() returns trigger language plpgsql security definer set search_path = public as $$
begin update public.conversations set last_message_at = now() where id = new.conversation_id; return new; end $$;
create trigger messages_touch after insert on public.messages for each row execute function public.msg_touch();

alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.cart_items;
