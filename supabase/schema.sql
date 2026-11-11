-- Engranet Digital: tablas, permisos y contenido inicial.
-- Se ejecuta una sola vez en el SQL Editor de Supabase. Es seguro volver a
-- ejecutarlo: no borra datos ni duplica el contenido inicial.

create extension if not exists pgcrypto;

-- 1) Administradores del panel --------------------------------------------
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- 2) Contenido del sitio ----------------------------------------------------
create table if not exists public.site_settings (
  id int primary key default 1 check (id = 1),
  brand_name text, hero_title text, hero_subtitle text, hero_words text, about text,
  whatsapp text, email text, instagram text, facebook text, location text
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  title text not null, summary text, icon text default 'zap', features text[] not null default '{}',
  sort int not null default 10, active boolean not null default true, created_at timestamptz not null default now()
);

create table if not exists public.portfolio (
  id uuid primary key default gen_random_uuid(),
  title text not null, client_name text, category text, summary text, url text, image_url text,
  tags text[] not null default '{}', sort int not null default 10, active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null, logo_url text, url text,
  sort int not null default 10, active boolean not null default true, created_at timestamptz not null default now()
);

create table if not exists public.stats (
  id uuid primary key default gen_random_uuid(),
  value numeric not null, suffix text, label text not null,
  sort int not null default 10, active boolean not null default true, created_at timestamptz not null default now()
);

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  author text not null, role text, company text, quote text not null,
  sort int not null default 10, active boolean not null default true, created_at timestamptz not null default now()
);

create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null, answer text not null,
  sort int not null default 10, active boolean not null default true, created_at timestamptz not null default now()
);

-- 3) Gestión del negocio ------------------------------------------------------
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null, company text, phone text, email text,
  services text[] not null default '{}', business_type text, budget text, timeline text, message text,
  status text not null default 'nuevo' check (status in ('nuevo', 'contactado', 'cotizado', 'ganado', 'perdido')),
  notes text, source text default 'web'
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null, company text, phone text, email text, tax_id text, address text,
  status text not null default 'activo' check (status in ('prospecto', 'activo', 'inactivo')),
  notes text, lead_id uuid references public.leads (id) on delete set null
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  client_id uuid not null references public.clients (id) on delete restrict,
  name text not null, service_type text,
  status text not null default 'propuesta' check (status in ('propuesta', 'en_curso', 'en_pausa', 'entregado', 'cancelado')),
  budget numeric, currency text not null default 'USD', start_date date, due_date date,
  progress int not null default 0 check (progress between 0 and 100),
  live_url text, description text
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  project_id uuid not null references public.projects (id) on delete restrict,
  concept text not null, amount numeric not null, currency text not null default 'USD',
  status text not null default 'pendiente' check (status in ('pendiente', 'pagado', 'vencido')),
  method text, due_date date, paid_at date, reference text, notes text
);

-- 4) Seguridad (RLS) ----------------------------------------------------------
-- Contenido: cualquiera lee lo visible; solo administradores escriben.
-- Negocio: solo administradores. Solicitudes: la web puede crear, nada más.
do $$
declare t text;
begin
  foreach t in array array['services', 'portfolio', 'brands', 'stats', 'testimonials', 'faqs'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "lectura publica" on public.%I', t);
    execute format('create policy "lectura publica" on public.%I for select using (active or public.is_admin())', t);
    execute format('drop policy if exists "admin escribe" on public.%I', t);
    execute format('create policy "admin escribe" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
    execute format('grant select on public.%I to anon, authenticated', t);
    execute format('grant insert, update, delete on public.%I to authenticated', t);
  end loop;

  foreach t in array array['clients', 'projects', 'payments'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "solo admin" on public.%I', t);
    execute format('create policy "solo admin" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end $$;

alter table public.site_settings enable row level security;
drop policy if exists "lectura publica" on public.site_settings;
create policy "lectura publica" on public.site_settings for select using (true);
drop policy if exists "admin escribe" on public.site_settings;
create policy "admin escribe" on public.site_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());
grant select on public.site_settings to anon, authenticated;
grant insert, update, delete on public.site_settings to authenticated;

alter table public.leads enable row level security;
drop policy if exists "la web crea solicitudes" on public.leads;
create policy "la web crea solicitudes" on public.leads for insert to anon, authenticated with check (status = 'nuevo' or public.is_admin());
drop policy if exists "admin gestiona solicitudes" on public.leads;
create policy "admin gestiona solicitudes" on public.leads for all to authenticated using (public.is_admin()) with check (public.is_admin());
grant insert on public.leads to anon;
grant select, insert, update, delete on public.leads to authenticated;

alter table public.admins enable row level security;
drop policy if exists "ver mi registro" on public.admins;
create policy "ver mi registro" on public.admins for select to authenticated using (user_id = auth.uid());
grant select on public.admins to authenticated;
grant execute on function public.is_admin() to anon, authenticated;

-- 5) Imágenes (logos y portadas) ---------------------------------------------
insert into storage.buckets (id, name, public) values ('media', 'media', true) on conflict (id) do nothing;
drop policy if exists "media lectura publica" on storage.objects;
create policy "media lectura publica" on storage.objects for select using (bucket_id = 'media');
drop policy if exists "media admin sube" on storage.objects;
create policy "media admin sube" on storage.objects for insert to authenticated with check (bucket_id = 'media' and public.is_admin());
drop policy if exists "media admin edita" on storage.objects;
create policy "media admin edita" on storage.objects for update to authenticated using (bucket_id = 'media' and public.is_admin());
drop policy if exists "media admin borra" on storage.objects;
create policy "media admin borra" on storage.objects for delete to authenticated using (bucket_id = 'media' and public.is_admin());

-- 6) Contenido inicial (solo si las tablas están vacías) ----------------------
insert into public.site_settings (id, brand_name, hero_title, hero_subtitle, hero_words, about, location)
values (1, 'Engranet Digital', 'Tu negocio, engranado con lo digital',
  'Programamos el sistema, diseñamos la web, manejamos la publicidad y automatizamos tu WhatsApp. Un solo equipo para que todas las piezas de tu negocio giren juntas.',
  'vende más, se organiza, responde solo, crece',
  'Somos un equipo de desarrollo y mercadeo digital. Construimos sistemas que hoy usan a diario decenas de sedes, y aplicamos esa misma ingeniería a negocios de cualquier tamaño.',
  'Barquisimeto, Venezuela')
on conflict (id) do nothing;

insert into public.services (title, summary, icon, features, sort)
select * from (values
  ('Software a medida', 'Programas hechos para tu forma de trabajar, no al revés.', 'cpu', array['Inventario, ventas y punto de venta', 'Comisiones, gastos y cierres de caja', 'Reportes en Excel y PDF con tu marca'], 10),
  ('Sistemas web', 'Plataformas internas para operar varias sedes desde cualquier lugar.', 'layers', array['Usuarios, roles y permisos', 'Tableros de indicadores en vivo', 'Varias sedes y empresas en un solo sistema'], 20),
  ('Páginas web y tiendas', 'Sitios rápidos y llamativos que llevan al cliente directo a comprar o escribirte.', 'monitor', array['Landing pages y sitios corporativos', 'Catálogos y tiendas en línea', 'Pedidos y delivery desde la web'], 30),
  ('Publicidad digital', 'Campañas en Facebook e Instagram medidas por resultados, no por likes.', 'trending', array['Estrategia y segmentación', 'Diseño de anuncios', 'Informes claros de cada campaña'], 40),
  ('Meta Business y API de Meta', 'Tu cuenta comercial ordenada, verificada y conectada a tus sistemas.', 'share', array['Configuración de Meta Business', 'Píxel, catálogos y conversiones', 'Integraciones con la API de Meta'], 50),
  ('Automatización de WhatsApp', 'Bots y flujos que atienden, registran y avisan mientras tú trabajas.', 'message', array['Respuestas y menús automáticos', 'WhatsApp conectado a tu sistema o CRM', 'Reportes que se cargan solos'], 60),
  ('Integraciones y datos', 'Unimos tu sistema administrativo con todo lo demás y convertimos los datos en decisiones.', 'database', array['Sincronización con tu ERP', 'Tableros y reportes automáticos', 'Portales para proveedores y clientes'], 70),
  ('Inteligencia artificial aplicada', 'IA puesta a trabajar en tareas concretas de tu operación.', 'zap', array['Asistentes de soporte que escalan a una persona', 'Lectura automática de fotos y documentos', 'Clasificación y resumen de información'], 80),
  ('Marca y diseño', 'Una identidad que se reconoce en la web, en redes y en cada documento.', 'pen', array['Logo e identidad visual', 'Piezas para redes y anuncios', 'Documentos y reportes con tu marca'], 90)
) as v(title, summary, icon, features, sort)
where not exists (select 1 from public.services);

insert into public.portfolio (title, client_name, category, summary, tags, sort)
select * from (values
  ('FSI Operaciones', 'Farmacias San Ignacio', 'Sistema web', 'Plataforma de operaciones para un grupo de farmacias con 85 sedes: indicadores, cierres de caja, comisiones, inventario e inspecciones.', array['Multi-sede', 'Tableros', 'IA'], 10),
  ('Portal de Proveedores', 'AMI Distribuidora', 'Portal', 'Cada proveedor entra con su cuenta y consulta ventas, inventario y reposición de sus productos por sede.', array['Integración', 'Reportes'], 20),
  ('Tienda y catálogo B2B', 'AMI Distribuidora', 'Tienda en línea', 'Catálogo en línea con pedidos de suministros y estadísticas de compra por cliente.', array['E-commerce', 'Pedidos'], 30),
  ('Web y sistema de gestión', 'La Cueva Club', 'Software a medida', 'Tienda de ropa y barbería con inventario por etiquetas QR, ventas diarias y control de gastos.', array['Inventario QR', 'Ventas'], 40),
  ('Landing y punto de venta', 'Sparty', 'Página web', 'Sitio que lleva las reservas a WhatsApp y un panel con inventario, punto de venta e indicadores.', array['Landing', 'POS'], 50),
  ('Sistema de recursos humanos', 'Farmacias San Ignacio', 'Sistema web', 'Personal, vacaciones, postulantes y asistencia con código QR en cada sede.', array['RRHH', 'Asistencia QR'], 60),
  ('Dashboard comercial', 'AMI Delivery', 'Tablero', 'Metas, visitas, cierres y comisiones del equipo de ventas en una sola pantalla.', array['Indicadores', 'Ventas'], 70),
  ('Reportes por WhatsApp', 'Farmacias San Ignacio', 'Automatización', 'Bots que recogen los reportes de WhatsApp de cada sede y los cargan solos en el sistema.', array['WhatsApp', 'Bots'], 80),
  ('Web inmobiliaria', 'Prico Prime', 'Página web', 'Sitio de una firma inmobiliaria boutique en Cáceres, España.', array['WordPress', 'Inmobiliaria'], 90)
) as v(title, client_name, category, summary, tags, sort)
where not exists (select 1 from public.portfolio);

insert into public.brands (name, sort)
select * from (values
  ('Farmacias San Ignacio', 10), ('AMI Distribuidora', 20), ('AMI Delivery', 30), ('La Cueva Club', 40), ('Sparty', 50),
  ('Arepera Carmencita', 60), ('Prico Prime', 70), ('iLevenn', 80), ('Atelier Urbano', 90), ('Freebuff', 100)
) as v(name, sort)
where not exists (select 1 from public.brands);

insert into public.stats (value, suffix, label, sort)
select * from (values
  (85, null, 'sedes trabajan a diario con nuestros sistemas', 10),
  (26, null, 'empresas de un mismo grupo conectadas', 20),
  (10, '+', 'proyectos desarrollados', 30),
  (2, null, 'países con clientes activos', 40)
) as v(value, suffix, label, sort)
where not exists (select 1 from public.stats);

insert into public.faqs (question, answer, sort)
select * from (values
  ('¿Cuánto cuesta un proyecto?', 'Depende del alcance. Cuéntanos qué necesitas en el formulario y te enviamos una propuesta con precio y tiempos, sin compromiso.', 10),
  ('¿Cuánto tarda una página web?', 'Una landing suele estar lista en una o dos semanas. Un sistema a medida se entrega por etapas, con una primera versión funcional lo antes posible.', 20),
  ('¿Puedo contratar un solo servicio?', 'Sí. Puedes empezar con una página web o una campaña y sumar el resto cuando lo necesites.', 30),
  ('¿Trabajan con el sistema que ya tengo?', 'Sí. Conectamos sistemas administrativos, hojas de cálculo y WhatsApp con lo que construimos, para que no cargues la misma información dos veces.', 40),
  ('¿Dan soporte después de entregar?', 'Sí. Acompañamos la puesta en marcha y ofrecemos planes de mantenimiento y mejoras continuas.', 50)
) as v(question, answer, sort)
where not exists (select 1 from public.faqs);

-- Resultado: cuántas filas quedó en cada tabla
select 'services' as tabla, count(*) as filas from public.services
union all select 'portfolio', count(*) from public.portfolio
union all select 'brands', count(*) from public.brands
union all select 'stats', count(*) from public.stats
union all select 'faqs', count(*) from public.faqs
union all select 'site_settings', count(*) from public.site_settings;
