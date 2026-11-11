import { useEffect, useState } from 'react';
import { supabase } from './supabase';

// Contenido de respaldo: es lo que se muestra si Supabase aún no está
// configurado o una tabla está vacía. Lo que se cargue en el panel lo reemplaza.

export const defaultSettings = {
  brand_name: 'Engranet Digital',
  hero_title: 'Tu negocio, engranado con lo digital',
  hero_subtitle:
    'Programamos el sistema, diseñamos la web, manejamos la publicidad y automatizamos tu WhatsApp. Un solo equipo para que todas las piezas de tu negocio giren juntas.',
  hero_words: 'vende más, se organiza, responde solo, crece',
  about:
    'Somos un equipo de desarrollo y mercadeo digital. Construimos sistemas que hoy usan a diario decenas de sedes, y aplicamos esa misma ingeniería a negocios de cualquier tamaño.',
  whatsapp: '',
  email: '',
  instagram: '',
  facebook: '',
  location: 'Barquisimeto, Venezuela',
};

export const defaultServices = [
  {
    id: 'software', slug: 'software', icon: 'cpu', title: 'Software a medida',
    summary: 'Programas hechos para tu forma de trabajar, no al revés.',
    features: ['Inventario, ventas y punto de venta', 'Comisiones, gastos y cierres de caja', 'Reportes en Excel y PDF con tu marca'],
  },
  {
    id: 'sistemas-web', slug: 'sistemas-web', icon: 'layers', title: 'Sistemas web',
    summary: 'Plataformas internas para operar varias sedes desde cualquier lugar.',
    features: ['Usuarios, roles y permisos', 'Tableros de indicadores en vivo', 'Varias sedes y empresas en un solo sistema'],
  },
  {
    id: 'paginas-web', slug: 'paginas-web', icon: 'monitor', title: 'Páginas web y tiendas',
    summary: 'Sitios rápidos y llamativos que llevan al cliente directo a comprar o escribirte.',
    features: ['Landing pages y sitios corporativos', 'Catálogos y tiendas en línea', 'Pedidos y delivery desde la web'],
  },
  {
    id: 'publicidad', slug: 'publicidad', icon: 'trending', title: 'Publicidad digital',
    summary: 'Campañas en Facebook e Instagram medidas por resultados, no por likes.',
    features: ['Estrategia y segmentación', 'Diseño de anuncios', 'Informes claros de cada campaña'],
  },
  {
    id: 'meta', slug: 'meta', icon: 'share', title: 'Meta Business y API de Meta',
    summary: 'Tu cuenta comercial ordenada, verificada y conectada a tus sistemas.',
    features: ['Configuración de Meta Business', 'Píxel, catálogos y conversiones', 'Integraciones con la API de Meta'],
  },
  {
    id: 'whatsapp', slug: 'whatsapp', icon: 'message', title: 'Automatización de WhatsApp',
    summary: 'Bots y flujos que atienden, registran y avisan mientras tú trabajas.',
    features: ['Respuestas y menús automáticos', 'WhatsApp conectado a tu sistema o CRM', 'Reportes que se cargan solos'],
  },
  {
    id: 'integraciones', slug: 'integraciones', icon: 'database', title: 'Integraciones y datos',
    summary: 'Unimos tu sistema administrativo con todo lo demás y convertimos los datos en decisiones.',
    features: ['Sincronización con tu ERP', 'Tableros y reportes automáticos', 'Portales para proveedores y clientes'],
  },
  {
    id: 'ia', slug: 'ia', icon: 'zap', title: 'Inteligencia artificial aplicada',
    summary: 'IA puesta a trabajar en tareas concretas de tu operación.',
    features: ['Asistentes de soporte que escalan a una persona', 'Lectura automática de fotos y documentos', 'Clasificación y resumen de información'],
  },
  {
    id: 'marca', slug: 'marca', icon: 'pen', title: 'Marca y diseño',
    summary: 'Una identidad que se reconoce en la web, en redes y en cada documento.',
    features: ['Logo e identidad visual', 'Piezas para redes y anuncios', 'Documentos y reportes con tu marca'],
  },
];

export const defaultPortfolio = [
  { id: 'p1', title: 'FSI Operaciones', client_name: 'Farmacias San Ignacio', category: 'Sistema web', summary: 'Plataforma de operaciones para un grupo de farmacias con 85 sedes: indicadores, cierres de caja, comisiones, inventario e inspecciones.', tags: ['Multi-sede', 'Tableros', 'IA'], url: '', image_url: '' },
  { id: 'p2', title: 'Portal de Proveedores', client_name: 'AMI Distribuidora', category: 'Portal', summary: 'Cada proveedor entra con su cuenta y consulta ventas, inventario y reposición de sus productos por sede.', tags: ['Integración', 'Reportes'], url: '', image_url: '' },
  { id: 'p3', title: 'Tienda y catálogo B2B', client_name: 'AMI Distribuidora', category: 'Tienda en línea', summary: 'Catálogo en línea con pedidos de suministros y estadísticas de compra por cliente.', tags: ['E-commerce', 'Pedidos'], url: '', image_url: '' },
  { id: 'p4', title: 'Web y sistema de gestión', client_name: 'La Cueva Club', category: 'Software a medida', summary: 'Tienda de ropa y barbería con inventario por etiquetas QR, ventas diarias y control de gastos.', tags: ['Inventario QR', 'Ventas'], url: '', image_url: '' },
  { id: 'p5', title: 'Landing y punto de venta', client_name: 'Sparty', category: 'Página web', summary: 'Sitio que lleva las reservas a WhatsApp y un panel con inventario, punto de venta e indicadores.', tags: ['Landing', 'POS'], url: '', image_url: '' },
  { id: 'p6', title: 'Sistema de recursos humanos', client_name: 'Farmacias San Ignacio', category: 'Sistema web', summary: 'Personal, vacaciones, postulantes y asistencia con código QR en cada sede.', tags: ['RRHH', 'Asistencia QR'], url: '', image_url: '' },
  { id: 'p7', title: 'Dashboard comercial', client_name: 'AMI Delivery', category: 'Tablero', summary: 'Metas, visitas, cierres y comisiones del equipo de ventas en una sola pantalla.', tags: ['Indicadores', 'Ventas'], url: '', image_url: '' },
  { id: 'p8', title: 'Reportes por WhatsApp', client_name: 'Farmacias San Ignacio', category: 'Automatización', summary: 'Bots que recogen los reportes de WhatsApp de cada sede y los cargan solos en el sistema.', tags: ['WhatsApp', 'Bots'], url: '', image_url: '' },
  { id: 'p9', title: 'Web inmobiliaria', client_name: 'Prico Prime', category: 'Página web', summary: 'Sitio de una firma inmobiliaria boutique en Cáceres, España.', tags: ['WordPress', 'Inmobiliaria'], url: '', image_url: '' },
];

export const defaultBrands = [
  'Farmacias San Ignacio', 'AMI Distribuidora', 'AMI Delivery', 'La Cueva Club', 'Sparty',
  'Arepera Carmencita', 'Prico Prime', 'iLevenn', 'Atelier Urbano', 'Freebuff',
].map((name, i) => ({ id: 'b' + i, name, logo_url: '', url: '' }));

export const defaultStats = [
  { id: 's1', value: 85, suffix: '', label: 'sedes trabajan a diario con nuestros sistemas' },
  { id: 's2', value: 26, suffix: '', label: 'empresas de un mismo grupo conectadas' },
  { id: 's3', value: 10, suffix: '+', label: 'proyectos desarrollados' },
  { id: 's4', value: 2, suffix: '', label: 'países con clientes activos' },
];

export const defaultFaqs = [
  { id: 'f1', question: '¿Cuánto cuesta un proyecto?', answer: 'Depende del alcance. Cuéntanos qué necesitas en el formulario y te enviamos una propuesta con precio y tiempos, sin compromiso.' },
  { id: 'f2', question: '¿Cuánto tarda una página web?', answer: 'Una landing suele estar lista en una o dos semanas. Un sistema a medida se entrega por etapas, con una primera versión funcional lo antes posible.' },
  { id: 'f3', question: '¿Puedo contratar un solo servicio?', answer: 'Sí. Puedes empezar con una página web o una campaña y sumar el resto cuando lo necesites.' },
  { id: 'f4', question: '¿Trabajan con el sistema que ya tengo?', answer: 'Sí. Conectamos sistemas administrativos, hojas de cálculo y WhatsApp con lo que construimos, para que no cargues la misma información dos veces.' },
  { id: 'f5', question: '¿Dan soporte después de entregar?', answer: 'Sí. Acompañamos la puesta en marcha y ofrecemos planes de mantenimiento y mejoras continuas.' },
];

export type SiteContent = {
  settings: typeof defaultSettings;
  services: any[];
  portfolio: any[];
  brands: any[];
  stats: any[];
  faqs: any[];
  testimonials: any[];
};

export const defaultContent: SiteContent = {
  settings: defaultSettings,
  services: defaultServices,
  portfolio: defaultPortfolio,
  brands: defaultBrands,
  stats: defaultStats,
  faqs: defaultFaqs,
  testimonials: [],
};

async function list(table: string) {
  const { data, error } = await supabase.from(table).select('*').eq('active', true).order('sort', { ascending: true });
  if (error) throw error;
  return data as any[];
}

export function useSiteContent(): SiteContent {
  const [content, setContent] = useState<SiteContent>(defaultContent);

  useEffect(() => {
    if (!supabase) return;
    let alive = true;
    (async () => {
      try {
        const [settings, services, portfolio, brands, stats, faqs, testimonials] = await Promise.all([
          supabase.from('site_settings').select('*').eq('id', 1).maybeSingle(),
          list('services'), list('portfolio'), list('brands'), list('stats'), list('faqs'), list('testimonials'),
        ]);
        if (!alive) return;
        const clean: any = {};
        Object.entries(settings.data || {}).forEach(([k, v]) => {
          if (v !== null && v !== '') clean[k] = v;
        });
        setContent({
          settings: { ...defaultSettings, ...clean },
          services: services.length ? services : defaultServices,
          portfolio: portfolio.length ? portfolio : defaultPortfolio,
          brands: brands.length ? brands : defaultBrands,
          stats: stats.length ? stats : defaultStats,
          faqs: faqs.length ? faqs : defaultFaqs,
          testimonials,
        });
      } catch (e) {
        console.warn('No se pudo cargar el contenido desde Supabase; se usa el de respaldo.', e);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return content;
}

export async function sendLead(lead: any) {
  if (!supabase) throw new Error('sin-conexion');
  const { error } = await supabase.from('leads').insert(lead);
  if (error) throw error;
}

export function whatsappLink(number: string, text: string) {
  const digits = (number || '').replace(/\D/g, '');
  return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}` : '';
}
