import { useEffect, useState } from 'react';
import {
  FiAward, FiBriefcase, FiCheck, FiDollarSign, FiExternalLink, FiGrid, FiHash, FiHelpCircle, FiHome, FiImage,
  FiInbox, FiLogOut, FiMenu, FiSettings, FiStar, FiUsers, FiX,
} from 'react-icons/fi';
import { supabase } from '../lib/supabase';
import { Link, useRouter } from '../lib/router';
import { GearMark } from '../site/Gears';
import { defaultSettings } from '../lib/content';
import Crud, { FieldInput, clean } from './Crud';
import Dashboard from './Dashboard';
import { RESOURCES, SETTINGS_FIELDS } from './resources';
import '../styles/admin.css';

const MENU = [
  { group: 'Negocio', items: [
    { to: '/admin', label: 'Resumen', icon: FiHome },
    { to: '/admin/solicitudes', label: 'Solicitudes', icon: FiInbox },
    { to: '/admin/clientes', label: 'Clientes', icon: FiUsers },
    { to: '/admin/proyectos', label: 'Proyectos', icon: FiBriefcase },
    { to: '/admin/pagos', label: 'Pagos', icon: FiDollarSign },
  ] },
  { group: 'Sitio web', items: [
    { to: '/admin/servicios', label: 'Servicios', icon: FiGrid },
    { to: '/admin/portafolio', label: 'Portafolio', icon: FiImage },
    { to: '/admin/logos', label: 'Logos de clientes', icon: FiAward },
    { to: '/admin/cifras', label: 'Cifras', icon: FiHash },
    { to: '/admin/testimonios', label: 'Testimonios', icon: FiStar },
    { to: '/admin/preguntas', label: 'Preguntas', icon: FiHelpCircle },
    { to: '/admin/ajustes', label: 'Ajustes del sitio', icon: FiSettings },
  ] },
];

function Shell({ children }: any) {
  return (
    <div className="auth">
      <div className="auth__card">
        <div className="auth__logo"><GearMark size={40} /><span>Engranet Digital</span></div>
        {children}
        <Link className="auth__back" to="/">Volver al sitio</Link>
      </div>
    </div>
  );
}

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e: any) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) setError(/invalid/i.test(error.message) ? 'Correo o contraseña incorrectos.' : error.message);
  };
  return (
    <Shell>
      <h1>Panel administrativo</h1>
      <form onSubmit={submit} className="auth__form">
        <label htmlFor="email">Correo</label>
        <input id="email" className="input" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <label htmlFor="password">Contraseña</label>
        <input id="password" className="input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="alert" role="alert">{error}</p>}
        <button className="abtn abtn--primary abtn--block" disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}</button>
      </form>
    </Shell>
  );
}

function Settings() {
  const [form, setForm] = useState<any>(null);
  const [state, setState] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    supabase.from('site_settings').select('*').eq('id', 1).maybeSingle().then(({ data, error }: any) => {
      if (error) setError(error.message);
      setForm({ ...defaultSettings, ...(data || {}) });
    });
  }, []);
  const save = async (e: any) => {
    e.preventDefault();
    setState('saving');
    setError('');
    const { error } = await supabase.from('site_settings').upsert({ id: 1, ...clean(SETTINGS_FIELDS, form) });
    if (error) {
      setError('No se pudo guardar: ' + error.message);
      setState('');
    } else {
      setState('saved');
      setTimeout(() => setState(''), 2500);
    }
  };
  if (!form) return <div className="page"><p className="muted">Cargando…</p></div>;
  return (
    <div className="page">
      <header className="page__head"><div><h1>Ajustes del sitio</h1><p>Textos principales y datos de contacto de la web.</p></div></header>
      <form className="panel form-grid" onSubmit={save}>
        {SETTINGS_FIELDS.map((f: any) => (
          <div key={f.key} className={`fgroup ${f.full ? 'fgroup--full' : ''}`}>
            <label htmlFor={'f-' + f.key}>{f.label}</label>
            <FieldInput field={f} value={form[f.key]} lookups={{}} onChange={(v: any) => setForm((s: any) => ({ ...s, [f.key]: v }))} />
            {f.hint && <small>{f.hint}</small>}
          </div>
        ))}
        {error && <p className="alert fgroup--full" role="alert">{error}</p>}
        <div className="fgroup--full form-actions">
          <button className="abtn abtn--primary" disabled={state === 'saving'}><FiCheck /> {state === 'saving' ? 'Guardando…' : 'Guardar ajustes'}</button>
          {state === 'saved' && <span className="saved">Ajustes guardados</span>}
        </div>
      </form>
    </div>
  );
}

export default function Admin() {
  const { path } = useRouter();
  const [session, setSession] = useState<any>(undefined);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    document.title = 'Panel | Engranet Digital';
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }: any) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e: any, s: any) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = session?.user?.id;
  useEffect(() => {
    if (!userId) return setAllowed(null);
    supabase.rpc('is_admin').then(({ data, error }: any) => setAllowed(!error && data === true));
  }, [userId]);

  useEffect(() => setMenu(false), [path]);

  if (!supabase) {
    return (
      <Shell>
        <h1>Falta conectar Supabase</h1>
        <p className="muted">Agrega la variable <code>VITE_SUPABASE_ANON_KEY</code> al archivo <code>.env</code> del proyecto en Bolt y vuelve a publicar.</p>
      </Shell>
    );
  }
  if (session === undefined) return <div className="boot">Cargando panel…</div>;
  if (!session) return <Login />;
  if (allowed === null) return <div className="boot">Comprobando acceso…</div>;
  if (!allowed) {
    return (
      <Shell>
        <h1>Sin acceso al panel</h1>
        <p className="muted">La cuenta {session.user.email} no está registrada como administradora. Agrégala a la tabla <code>admins</code> en Supabase.</p>
        <button className="abtn abtn--soft abtn--block" onClick={() => supabase.auth.signOut()}>Cerrar sesión</button>
      </Shell>
    );
  }

  const slug = path.replace(/\/+$/, '').split('/')[2] || '';
  const resource = RESOURCES[slug];

  return (
    <div className={`admin ${menu ? 'is-menu' : ''}`}>
      <aside className="side">
        <Link to="/admin" className="side__logo"><GearMark size={30} /><span>Engranet</span></Link>
        <nav aria-label="Panel">
          {MENU.map((g) => (
            <div key={g.group} className="side__group">
              <p>{g.group}</p>
              {g.items.map((it) => {
                const on = it.to === '/admin' ? slug === '' : path.startsWith(it.to);
                return (
                  <Link key={it.to} to={it.to} className={on ? 'is-on' : ''} aria-current={on ? 'page' : undefined}>
                    <it.icon /> {it.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="side__foot">
          <a href="/" target="_blank" rel="noopener noreferrer"><FiExternalLink /> Ver el sitio</a>
          <button onClick={() => supabase.auth.signOut()}><FiLogOut /> Cerrar sesión</button>
          <small>{session.user.email}</small>
        </div>
      </aside>
      <button className="side__toggle" onClick={() => setMenu(!menu)} aria-label={menu ? 'Cerrar menú' : 'Abrir menú'}>{menu ? <FiX /> : <FiMenu />}</button>
      <main className="admin__main">
        {slug === '' ? <Dashboard /> : slug === 'ajustes' ? <Settings /> : resource ? <Crud resource={resource} key={slug} /> : (
          <div className="page"><h1>Página no encontrada</h1><p className="muted"><Link to="/admin">Volver al resumen</Link></p></div>
        )}
      </main>
    </div>
  );
}
