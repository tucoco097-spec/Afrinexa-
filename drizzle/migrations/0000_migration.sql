create type public.app_role as enum ('super_admin','admin','commercial','sourcing','logistique','support','finance','client');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text, email text, phone text, country text default 'Cameroun', city text, address text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.is_staff(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role in ('super_admin','admin','commercial','logistique','support','sourcing','finance'))
$$;

create policy "own roles read" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.is_staff(auth.uid()));
create policy "admins manage roles" on public.user_roles for all to authenticated
  using (public.has_role(auth.uid(),'super_admin') or public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'super_admin') or public.has_role(auth.uid(),'admin'));

create policy "profile read" on public.profiles for select to authenticated using (id = auth.uid() or public.is_staff(auth.uid()));
create policy "profile update own" on public.profiles for update to authenticated using (id = auth.uid() or public.is_staff(auth.uid()));
create policy "profile insert own" on public.profiles for insert to authenticated with check (id = auth.uid());

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, phone)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email, new.raw_user_meta_data->>'phone');
  if not exists (select 1 from public.user_roles where role = 'super_admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'super_admin');
  end if;
  insert into public.user_roles (user_id, role) values (new.id, 'client') on conflict do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Site settings (single row)
create table public.site_settings (
  id int primary key default 1 check (id = 1),
  company_name text not null default 'Afrinexa',
  slogan text default 'Commerce, sourcing et logistique Chine → Afrique',
  phone text, whatsapp text, email text,
  address_china text, address_cameroon text,
  tracking_prefix text not null default 'AFX',
  updated_at timestamptz not null default now()
);
insert into public.site_settings (id) values (1);
grant select on public.site_settings to anon, authenticated;
grant update on public.site_settings to authenticated;
grant all on public.site_settings to service_role;
alter table public.site_settings enable row level security;
create policy "settings public read" on public.site_settings for select to anon, authenticated using (true);
create policy "settings admin update" on public.site_settings for update to authenticated
  using (public.has_role(auth.uid(),'super_admin') or public.has_role(auth.uid(),'admin'));

-- Orders
create sequence public.order_seq;
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null default ('CMD-' || to_char(now(),'YYYY') || '-' || lpad(nextval('public.order_seq')::text, 5, '0')),
  client_id uuid not null references public.profiles(id),
  agent_id uuid,
  description text,
  total_amount numeric(14,2) default 0,
  currency text not null default 'XAF',
  status text not null default 'confirmée',
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;
create policy "orders read" on public.orders for select to authenticated using (client_id = auth.uid() or public.is_staff(auth.uid()));
create policy "orders staff write" on public.orders for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

-- Shipments
create sequence public.shipment_seq;
create table public.shipments (
  id uuid primary key default gen_random_uuid(),
  shipment_number text unique not null default ('SHP-' || to_char(now(),'YYYY') || '-' || lpad(nextval('public.shipment_seq')::text, 5, '0')),
  tracking_code text unique,
  order_id uuid not null references public.orders(id) on delete restrict,
  client_id uuid not null references public.profiles(id),
  mode text not null check (mode in ('air','sea')),
  origin text not null default 'Guangzhou, Chine',
  destination text not null default 'Douala, Cameroun',
  carrier text, awb text, bl text, booking text, container text, vessel text,
  weight_kg numeric(10,2), volume_cbm numeric(10,3), packages int,
  eta date,
  status text not null default 'Colis annoncé',
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.shipments to authenticated;
grant all on public.shipments to service_role;
alter table public.shipments enable row level security;
create policy "shipments read" on public.shipments for select to authenticated using (client_id = auth.uid() or public.is_staff(auth.uid()));
create policy "shipments staff write" on public.shipments for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

-- server-side unique tracking code
create or replace function public.assign_tracking_code()
returns trigger language plpgsql security definer set search_path = public as $$
declare prefix text; code text; chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; i int;
begin
  select tracking_prefix into prefix from public.site_settings where id = 1;
  select client_id into new.client_id from public.orders where id = new.order_id;
  loop
    code := coalesce(prefix,'AFX') || '-' || to_char(now(),'YYYY') || '-';
    for i in 1..6 loop code := code || substr(chars, 1 + floor(random()*length(chars))::int, 1); end loop;
    exit when not exists (select 1 from public.shipments where tracking_code = code);
  end loop;
  new.tracking_code := code;
  new.created_by := auth.uid();
  return new;
end $$;
create trigger shipments_tracking before insert on public.shipments for each row execute function public.assign_tracking_code();

create or replace function public.prevent_code_change()
returns trigger language plpgsql as $$
begin
  new.tracking_code := old.tracking_code;
  new.client_id := old.client_id;
  new.updated_at := now();
  return new;
end $$;
create trigger shipments_lock before update on public.shipments for each row execute function public.prevent_code_change();

-- Events
create table public.shipment_events (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  status text not null,
  location text,
  public_note text,
  internal_note text,
  source text not null default 'manuel',
  occurred_at timestamptz not null default now(),
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.shipment_events to authenticated;
grant all on public.shipment_events to service_role;
alter table public.shipment_events enable row level security;
create policy "events read" on public.shipment_events for select to authenticated using (
  public.is_staff(auth.uid()) or exists (select 1 from public.shipments s where s.id = shipment_id and s.client_id = auth.uid()));
create policy "events staff write" on public.shipment_events for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

create or replace function public.event_updates_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.shipments set status = new.status where id = new.shipment_id;
  return new;
end $$;
create trigger events_status after insert on public.shipment_events for each row execute function public.event_updates_status();

-- Public tracking lookup (no personal data)
create or replace function public.track_shipment(_q text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'tracking_code', s.tracking_code, 'mode', s.mode, 'origin', s.origin, 'destination', s.destination,
    'status', s.status, 'eta', s.eta, 'carrier', s.carrier, 'packages', s.packages, 'created_at', s.created_at,
    'events', coalesce((select jsonb_agg(jsonb_build_object('status', e.status, 'location', e.location, 'note', e.public_note, 'source', e.source, 'occurred_at', e.occurred_at) order by e.occurred_at desc)
       from public.shipment_events e where e.shipment_id = s.id), '[]'::jsonb))
  from public.shipments s
  left join public.orders o on o.id = s.order_id
  where upper(trim(_q)) in (upper(s.tracking_code), upper(coalesce(s.awb,'~')), upper(coalesce(s.bl,'~')), upper(coalesce(s.booking,'~')), upper(coalesce(s.container,'~')), upper(coalesce(o.order_number,'~')))
  order by s.created_at desc limit 1
$$;
grant execute on function public.track_shipment(text) to anon, authenticated;