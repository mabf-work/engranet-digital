import { ICONS } from '../lib/fx';

const opt = (pairs: [string, string][]) => pairs.map(([value, label]) => ({ value, label }));

export const LEAD_STATUS = opt([['nuevo', 'Nueva'], ['contactado', 'Contactada'], ['cotizado', 'Cotizada'], ['ganado', 'Ganada'], ['perdido', 'Perdida']]);
export const CLIENT_STATUS = opt([['prospecto', 'Prospecto'], ['activo', 'Activo'], ['inactivo', 'Inactivo']]);
export const PROJECT_STATUS = opt([['propuesta', 'Propuesta'], ['en_curso', 'En curso'], ['en_pausa', 'En pausa'], ['entregado', 'Entregado'], ['cancelado', 'Cancelado']]);
export const PAYMENT_STATUS = opt([['pendiente', 'Pendiente'], ['pagado', 'Pagado'], ['vencido', 'Vencido']]);
const CURRENCY = opt([['USD', 'USD'], ['EUR', 'EUR'], ['VES', 'Bs']]);
const METHODS = opt([['transferencia', 'Transferencia'], ['pago_movil', 'Pago móvil'], ['efectivo', 'Efectivo'], ['zelle', 'Zelle'], ['binance', 'Binance'], ['paypal', 'PayPal'], ['otro', 'Otro']]);

export const TONES: Record<string, string> = {
  nuevo: 'violet', contactado: 'blue', cotizado: 'amber', ganado: 'green', perdido: 'gray',
  prospecto: 'amber', activo: 'green', inactivo: 'gray',
  propuesta: 'amber', en_curso: 'violet', en_pausa: 'gray', entregado: 'green', cancelado: 'red',
  pendiente: 'amber', pagado: 'green', vencido: 'red',
};

const today = () => new Date().toISOString().slice(0, 10);
const sortField = { key: 'sort', label: 'Orden', type: 'number', hint: 'Los números más bajos salen primero.' };
const activeField = { key: 'active', label: 'Visible en la web', type: 'bool' };

export type Resource = {
  table: string; title: string; singular: string; newLabel: string; description?: string;
  order: [string, boolean]; statusKey?: string; statusOptions?: any[]; defaults?: any;
  columns: any[]; fields: any[]; beforeSave?: (row: any) => any; convert?: boolean;
};

export const RESOURCES: Record<string, Resource> = {
  solicitudes: {
    table: 'leads', title: 'Solicitudes', singular: 'solicitud', newLabel: 'Nueva solicitud',
    description: 'Lo que llega desde el cotizador de la web. Cuando cierres una, conviértela en cliente.',
    order: ['created_at', false], statusKey: 'status', statusOptions: LEAD_STATUS, defaults: { status: 'nuevo', source: 'manual' }, convert: true,
    columns: [
      { key: 'created_at', label: 'Recibida', type: 'date' },
      { key: 'name', label: 'Nombre', type: 'strong', sub: 'company' },
      { key: 'phone', label: 'Contacto', sub: 'email' },
      { key: 'services', label: 'Servicios', type: 'list' },
      { key: 'budget', label: 'Presupuesto' },
      { key: 'status', label: 'Estado', type: 'badge', options: LEAD_STATUS },
    ],
    fields: [
      { key: 'name', label: 'Nombre', required: true },
      { key: 'company', label: 'Empresa' },
      { key: 'phone', label: 'WhatsApp' },
      { key: 'email', label: 'Correo' },
      { key: 'services', label: 'Servicios que pidió', type: 'list', full: true },
      { key: 'business_type', label: 'Tipo de negocio' },
      { key: 'budget', label: 'Presupuesto' },
      { key: 'timeline', label: 'Plazo' },
      { key: 'status', label: 'Estado', type: 'select', options: LEAD_STATUS },
      { key: 'message', label: 'Mensaje del cliente', type: 'textarea', full: true },
      { key: 'notes', label: 'Notas internas', type: 'textarea', full: true },
    ],
  },
  clientes: {
    table: 'clients', title: 'Clientes', singular: 'cliente', newLabel: 'Nuevo cliente',
    order: ['created_at', false], statusKey: 'status', statusOptions: CLIENT_STATUS, defaults: { status: 'activo' },
    columns: [
      { key: 'name', label: 'Cliente', type: 'strong', sub: 'company' },
      { key: 'phone', label: 'Contacto', sub: 'email' },
      { key: 'tax_id', label: 'RIF / ID' },
      { key: 'status', label: 'Estado', type: 'badge', options: CLIENT_STATUS },
    ],
    fields: [
      { key: 'name', label: 'Nombre de contacto', required: true },
      { key: 'company', label: 'Empresa' },
      { key: 'phone', label: 'WhatsApp' },
      { key: 'email', label: 'Correo' },
      { key: 'tax_id', label: 'RIF / identificación fiscal' },
      { key: 'status', label: 'Estado', type: 'select', options: CLIENT_STATUS },
      { key: 'address', label: 'Dirección', full: true },
      { key: 'notes', label: 'Notas', type: 'textarea', full: true },
    ],
  },
  proyectos: {
    table: 'projects', title: 'Proyectos', singular: 'proyecto', newLabel: 'Nuevo proyecto',
    order: ['created_at', false], statusKey: 'status', statusOptions: PROJECT_STATUS, defaults: { status: 'propuesta', currency: 'USD', progress: 0 },
    columns: [
      { key: 'name', label: 'Proyecto', type: 'strong', sub: 'service_type' },
      { key: 'client_id', label: 'Cliente', type: 'relation', table: 'clients' },
      { key: 'budget', label: 'Presupuesto', type: 'money' },
      { key: 'due_date', label: 'Entrega', type: 'date' },
      { key: 'progress', label: 'Avance', type: 'progress' },
      { key: 'status', label: 'Estado', type: 'badge', options: PROJECT_STATUS },
    ],
    fields: [
      { key: 'name', label: 'Nombre del proyecto', required: true },
      { key: 'client_id', label: 'Cliente', type: 'relation', table: 'clients', required: true },
      { key: 'service_type', label: 'Tipo de servicio', hint: 'Ej.: Sistema web, Publicidad, Bot de WhatsApp' },
      { key: 'status', label: 'Estado', type: 'select', options: PROJECT_STATUS },
      { key: 'budget', label: 'Presupuesto', type: 'number' },
      { key: 'currency', label: 'Moneda', type: 'select', options: CURRENCY },
      { key: 'start_date', label: 'Inicio', type: 'date' },
      { key: 'due_date', label: 'Fecha de entrega', type: 'date' },
      { key: 'progress', label: 'Avance (%)', type: 'number', min: 0, max: 100 },
      { key: 'live_url', label: 'Enlace del proyecto' },
      { key: 'description', label: 'Alcance y notas', type: 'textarea', full: true },
    ],
  },
  pagos: {
    table: 'payments', title: 'Pagos', singular: 'pago', newLabel: 'Registrar pago',
    description: 'Cobros de cada proyecto: los ya recibidos y los que están por cobrar.',
    order: ['due_date', false], statusKey: 'status', statusOptions: PAYMENT_STATUS, defaults: { status: 'pendiente', currency: 'USD', due_date: today() },
    beforeSave: (row) => (row.status === 'pagado' && !row.paid_at ? { ...row, paid_at: today() } : row),
    columns: [
      { key: 'concept', label: 'Concepto', type: 'strong' },
      { key: 'project_id', label: 'Proyecto', type: 'relation', table: 'projects' },
      { key: 'amount', label: 'Monto', type: 'money' },
      { key: 'due_date', label: 'Vence', type: 'date' },
      { key: 'paid_at', label: 'Pagado', type: 'date' },
      { key: 'status', label: 'Estado', type: 'badge', options: PAYMENT_STATUS },
    ],
    fields: [
      { key: 'concept', label: 'Concepto', required: true, hint: 'Ej.: Anticipo 50 %, Mensualidad de marzo' },
      { key: 'project_id', label: 'Proyecto', type: 'relation', table: 'projects', required: true },
      { key: 'amount', label: 'Monto', type: 'number', required: true },
      { key: 'currency', label: 'Moneda', type: 'select', options: CURRENCY },
      { key: 'status', label: 'Estado', type: 'select', options: PAYMENT_STATUS },
      { key: 'method', label: 'Forma de pago', type: 'select', options: METHODS, empty: 'Sin definir' },
      { key: 'due_date', label: 'Fecha de vencimiento', type: 'date' },
      { key: 'paid_at', label: 'Fecha de pago', type: 'date' },
      { key: 'reference', label: 'Referencia' },
      { key: 'notes', label: 'Notas', type: 'textarea', full: true },
    ],
  },
  servicios: {
    table: 'services', title: 'Servicios', singular: 'servicio', newLabel: 'Nuevo servicio',
    description: 'Las tarjetas de servicios de la web y las opciones del cotizador.',
    order: ['sort', true], defaults: { active: true, sort: 10, icon: 'zap' },
    columns: [
      { key: 'sort', label: 'Orden' },
      { key: 'title', label: 'Servicio', type: 'strong', sub: 'summary' },
      { key: 'active', label: 'Visible', type: 'bool' },
    ],
    fields: [
      { key: 'title', label: 'Nombre', required: true },
      { key: 'icon', label: 'Icono', type: 'select', options: Object.keys(ICONS).map((k) => ({ value: k, label: k })) },
      { key: 'summary', label: 'Descripción corta', type: 'textarea', full: true },
      { key: 'features', label: 'Qué incluye', type: 'list', full: true },
      sortField, activeField,
    ],
  },
  portafolio: {
    table: 'portfolio', title: 'Portafolio', singular: 'proyecto del portafolio', newLabel: 'Nuevo proyecto',
    description: 'Los proyectos que se muestran en la web.',
    order: ['sort', true], defaults: { active: true, sort: 10 },
    columns: [
      { key: 'sort', label: 'Orden' },
      { key: 'image_url', label: 'Imagen', type: 'image' },
      { key: 'title', label: 'Proyecto', type: 'strong', sub: 'client_name' },
      { key: 'category', label: 'Categoría' },
      { key: 'active', label: 'Visible', type: 'bool' },
    ],
    fields: [
      { key: 'title', label: 'Título', required: true },
      { key: 'client_name', label: 'Cliente' },
      { key: 'category', label: 'Categoría', hint: 'Sirve de filtro en la web. Ej.: Sistema web' },
      { key: 'url', label: 'Enlace público' },
      { key: 'summary', label: 'Descripción', type: 'textarea', full: true },
      { key: 'tags', label: 'Etiquetas', type: 'list', full: true },
      { key: 'image_url', label: 'Imagen de portada', type: 'image', full: true },
      sortField, activeField,
    ],
  },
  logos: {
    table: 'brands', title: 'Logos de clientes', singular: 'logo', newLabel: 'Nuevo cliente',
    description: 'La cinta de empresas con las que han trabajado. Sin logo se muestra el nombre.',
    order: ['sort', true], defaults: { active: true, sort: 10 },
    columns: [
      { key: 'sort', label: 'Orden' },
      { key: 'logo_url', label: 'Logo', type: 'image' },
      { key: 'name', label: 'Empresa', type: 'strong' },
      { key: 'active', label: 'Visible', type: 'bool' },
    ],
    fields: [
      { key: 'name', label: 'Nombre de la empresa', required: true },
      { key: 'url', label: 'Sitio web' },
      { key: 'logo_url', label: 'Logo', type: 'image', full: true, hint: 'PNG o SVG con fondo transparente.' },
      sortField, activeField,
    ],
  },
  cifras: {
    table: 'stats', title: 'Cifras', singular: 'cifra', newLabel: 'Nueva cifra',
    description: 'Los números grandes de la sección de experiencia.',
    order: ['sort', true], defaults: { active: true, sort: 10 },
    columns: [
      { key: 'sort', label: 'Orden' },
      { key: 'value', label: 'Número', type: 'strong', sub: 'suffix' },
      { key: 'label', label: 'Texto' },
      { key: 'active', label: 'Visible', type: 'bool' },
    ],
    fields: [
      { key: 'value', label: 'Número', type: 'number', required: true },
      { key: 'suffix', label: 'Sufijo', hint: 'Ej.: + o %' },
      { key: 'label', label: 'Texto', full: true, required: true },
      sortField, activeField,
    ],
  },
  testimonios: {
    table: 'testimonials', title: 'Testimonios', singular: 'testimonio', newLabel: 'Nuevo testimonio',
    description: 'Opiniones reales de clientes. La sección aparece en la web cuando haya al menos una.',
    order: ['sort', true], defaults: { active: true, sort: 10 },
    columns: [
      { key: 'author', label: 'Autor', type: 'strong', sub: 'company' },
      { key: 'quote', label: 'Testimonio', type: 'clip' },
      { key: 'active', label: 'Visible', type: 'bool' },
    ],
    fields: [
      { key: 'author', label: 'Nombre', required: true },
      { key: 'role', label: 'Cargo' },
      { key: 'company', label: 'Empresa' },
      { key: 'quote', label: 'Testimonio', type: 'textarea', full: true, required: true },
      sortField, activeField,
    ],
  },
  preguntas: {
    table: 'faqs', title: 'Preguntas frecuentes', singular: 'pregunta', newLabel: 'Nueva pregunta',
    order: ['sort', true], defaults: { active: true, sort: 10 },
    columns: [
      { key: 'sort', label: 'Orden' },
      { key: 'question', label: 'Pregunta', type: 'strong' },
      { key: 'active', label: 'Visible', type: 'bool' },
    ],
    fields: [
      { key: 'question', label: 'Pregunta', full: true, required: true },
      { key: 'answer', label: 'Respuesta', type: 'textarea', full: true, required: true },
      sortField, activeField,
    ],
  },
};

export const SETTINGS_FIELDS = [
  { key: 'brand_name', label: 'Nombre de la marca' },
  { key: 'location', label: 'Ubicación' },
  { key: 'hero_title', label: 'Título principal', full: true },
  { key: 'hero_words', label: 'Palabras que rotan', full: true, hint: 'Separadas por coma. Completan la frase «Para un negocio que…»' },
  { key: 'hero_subtitle', label: 'Texto bajo el título', type: 'textarea', full: true },
  { key: 'about', label: 'Texto de la sección de experiencia', type: 'textarea', full: true },
  { key: 'whatsapp', label: 'WhatsApp', hint: 'Con código de país, solo números. Ej.: 584121234567' },
  { key: 'email', label: 'Correo de contacto' },
  { key: 'instagram', label: 'Enlace de Instagram' },
  { key: 'facebook', label: 'Enlace de Facebook' },
];
