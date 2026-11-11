import { useEffect, useState } from 'react';
import {
  FiArrowRight, FiArrowUpRight, FiCheck, FiChevronDown, FiFacebook, FiInstagram, FiMail, FiMapPin,
  FiMenu, FiMessageCircle, FiPlus, FiX,
} from 'react-icons/fi';
import { useSiteContent, whatsappLink } from '../lib/content';
import { Counter, CursorGlow, Icon, Magnetic, NetCanvas, Reveal, Tilt, useScrollProgress, reducedMotion } from '../lib/fx';
import { Link } from '../lib/router';
import Gears, { GearMark, gearPath } from './Gears';
import Configurator from './Configurator';

const NAV = [
  ['Servicios', '#servicios'],
  ['Cómo trabajamos', '#proceso'],
  ['Proyectos', '#proyectos'],
  ['Preguntas', '#preguntas'],
];

const PROCESS = [
  { title: 'Nos cuentas qué necesitas', text: 'Una conversación corta para entender tu negocio, lo que hoy te quita tiempo y a dónde quieres llegar.' },
  { title: 'Diseñamos la solución', text: 'Te presentamos qué vamos a construir, cuánto cuesta y en cuánto tiempo, con pantallas que puedes ver antes de empezar.' },
  { title: 'Construimos por etapas', text: 'Entregamos partes funcionando desde las primeras semanas, para que opines y ajustemos sobre la marcha.' },
  { title: 'Lanzamos y te acompañamos', text: 'Ponemos todo en marcha, capacitamos a tu equipo y seguimos mejorando contigo.' },
];

function Nav({ brand }: { brand: string }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const [first, ...rest] = brand.split(' ');
  return (
    <header className={`nav ${scrolled ? 'is-scrolled' : ''} ${open ? 'is-open' : ''}`}>
      <div className="nav__bar">
        <a className="logo" href="#inicio" aria-label={brand}>
          <GearMark />
          <span>{first}<em>{rest.length ? ' ' + rest.join(' ') : ''}</em></span>
        </a>
        <nav className="nav__links" aria-label="Principal">
          {NAV.map(([label, href]) => (
            <a key={href} href={href} onClick={() => setOpen(false)}>{label}</a>
          ))}
        </nav>
        <a className="btn btn--primary btn--sm nav__cta" href="#cotizar" onClick={() => setOpen(false)}>Cotizar proyecto</a>
        <button className="nav__toggle" aria-label={open ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? <FiX /> : <FiMenu />}
        </button>
      </div>
    </header>
  );
}

function RotatingWords({ words }: { words: string[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (words.length < 2 || reducedMotion()) return;
    const t = setInterval(() => setI((n) => (n + 1) % words.length), 2400);
    return () => clearInterval(t);
  }, [words.length]);
  return (
    <span className="rotator">
      <span className="rotator__word" key={i}>{words[i % words.length]}</span>
    </span>
  );
}

function Hero({ settings }: any) {
  const words = String(settings.hero_words || '').split(',').map((w: string) => w.trim()).filter(Boolean);
  const title = String(settings.hero_title).split(' ');
  return (
    <section className="hero" id="inicio">
      <NetCanvas />
      <div className="hero__blob hero__blob--a" aria-hidden="true" />
      <div className="hero__blob hero__blob--b" aria-hidden="true" />
      <div className="wrap hero__grid">
        <div className="hero__copy">
          <h1 className="hero__title">
            {title.map((w: string, i: number) => (
              <span className="hero__word" key={i} style={{ animationDelay: `${120 + i * 70}ms` }}>{w} </span>
            ))}
          </h1>
          {words.length > 0 && (
            <p className="hero__rot">
              Para un negocio que <RotatingWords words={words} />
            </p>
          )}
          <p className="hero__sub">{settings.hero_subtitle}</p>
          <div className="hero__cta">
            <Magnetic className="btn btn--primary btn--lg" href="#cotizar">Armar mi proyecto <FiArrowRight /></Magnetic>
            <a className="btn btn--red btn--lg" href="#proyectos">Ver proyectos</a>
          </div>
        </div>
        <div className="hero__visual">
          <Gears />
          <span className="float-tag float-tag--a"><Icon name="monitor" /> Páginas web</span>
          <span className="float-tag float-tag--b"><Icon name="message" /> WhatsApp</span>
          <span className="float-tag float-tag--c"><Icon name="trending" /> Publicidad</span>
          <span className="float-tag float-tag--d"><Icon name="cpu" /> Software</span>
        </div>
      </div>
      <a className="hero__scroll" href="#clientes" aria-label="Bajar"><FiChevronDown /></a>
    </section>
  );
}

function Brands({ brands }: any) {
  const row = [...brands, ...brands];
  return (
    <section className="brands" id="clientes" aria-label="Empresas con las que hemos trabajado">
      <p className="brands__label">Empresas que ya giran con nosotros</p>
      <div className="marquee">
        <div className="marquee__track">
          {row.map((b: any, i: number) => (
            <span className="brand" key={i} aria-hidden={i >= brands.length}>
              {b.logo_url ? <img src={b.logo_url} alt={b.name} loading="lazy" /> : b.name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function Services({ services, selected, setSelected }: any) {
  const toggle = (id: string) => setSelected((s: string[]) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  return (
    <section className="section" id="servicios">
      <div className="wrap">
        <Reveal className="section__head">
          <h2 className="h2">Todo lo digital de tu negocio, en un mismo equipo</h2>
          <p className="lead">Cada servicio funciona por separado. Juntos, hacen que vender, atender y administrar sea una sola máquina.</p>
        </Reveal>
        <div className="services">
          {services.map((s: any, i: number) => {
            const on = selected.includes(s.id);
            return (
              <Reveal key={s.id} delay={(i % 3) * 90}>
                <Tilt className={`service ${on ? 'is-on' : ''}`}>
                  <span className="service__glare" aria-hidden="true" />
                  <span className="service__icon"><Icon name={s.icon} /></span>
                  <h3 className="h3">{s.title}</h3>
                  <p>{s.summary}</p>
                  <ul>
                    {(s.features || []).map((f: string) => (
                      <li key={f}><FiCheck /> {f}</li>
                    ))}
                  </ul>
                  <button className={`service__add ${on ? 'is-on' : ''}`} aria-pressed={on} onClick={() => toggle(s.id)}>
                    {on ? <><FiCheck /> Añadido a tu proyecto</> : <><FiPlus /> Añadir a mi proyecto</>}
                  </button>
                </Tilt>
              </Reveal>
            );
          })}
        </div>
        {selected.length > 0 && (
          <a className="tray" href="#cotizar">
            <span>{selected.length} {selected.length === 1 ? 'servicio' : 'servicios'} en tu proyecto</span>
            <strong>Continuar <FiArrowRight /></strong>
          </a>
        )}
      </div>
    </section>
  );
}

function Process() {
  const { d, ro } = gearPath(26, 22, 0.42);
  const s = ro * 2 + 4;
  return (
    <section className="section process" id="proceso">
      <svg className="process__gear" viewBox={`${-s / 2} ${-s / 2} ${s} ${s}`} aria-hidden="true">
        <path d={d} fillRule="evenodd" />
      </svg>
      <div className="wrap">
        <Reveal className="section__head">
          <h2 className="h2">De la idea a funcionando, en cuatro pasos</h2>
        </Reveal>
        <ol className="steps">
          {PROCESS.map((p, i) => (
            <Reveal as="li" className="step" key={p.title} delay={i * 110}>
              <span className="step__n">{i + 1}</span>
              <h3 className="h3">{p.title}</h3>
              <p>{p.text}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Cover({ item, index }: any) {
  if (item.image_url) return <img className="work__img" src={item.image_url} alt="" loading="lazy" />;
  const hue = [246, 188, 262, 36, 322, 204, 168, 280, 20][index % 9];
  return (
    <div className="mock" style={{ ['--h' as any]: hue }} aria-hidden="true">
      <div className="mock__bar"><i /><i /><i /></div>
      <div className="mock__body">
        <div className="mock__side"><b /><b /><b /><b /></div>
        <div className="mock__main">
          <div className="mock__kpis"><span /><span /><span /></div>
          <div className="mock__chart">
            {[38, 62, 45, 80, 58, 92, 70].map((h, i) => (
              <em key={i} style={{ height: `${h}%`, animationDelay: `${i * 80}ms` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Work({ portfolio }: any) {
  const cats = ['Todos', ...Array.from(new Set(portfolio.map((p: any) => p.category).filter(Boolean)))] as string[];
  const [cat, setCat] = useState('Todos');
  const items = portfolio.filter((p: any) => cat === 'Todos' || p.category === cat);
  return (
    <section className="section work" id="proyectos">
      <div className="wrap">
        <Reveal className="section__head section__head--row">
          <div>
            <h2 className="h2">Proyectos que hoy están trabajando</h2>
            <p className="lead">Sistemas, tiendas y automatizaciones que nuestros clientes usan todos los días.</p>
          </div>
          <div className="filters" role="group" aria-label="Filtrar proyectos">
            {cats.map((c) => (
              <button key={c} className={`chip ${cat === c ? 'is-on' : ''}`} aria-pressed={cat === c} onClick={() => setCat(c)}>{c}</button>
            ))}
          </div>
        </Reveal>
        <div className="works">
          {items.map((p: any, i: number) => (
            <Reveal key={p.id} delay={(i % 3) * 90}>
              <Tilt className="work-card" max={7}>
                <div className="work-card__cover">
                  <Cover item={p} index={portfolio.indexOf(p)} />
                  {p.category && <span className="work-card__cat">{p.category}</span>}
                </div>
                <div className="work-card__body">
                  <p className="work-card__client">{p.client_name}</p>
                  <h3 className="h3">{p.title}</h3>
                  <p>{p.summary}</p>
                  <div className="tags">
                    {(p.tags || []).map((t: string) => <span key={t}>{t}</span>)}
                  </div>
                  {p.url && (
                    <a className="work-card__link" href={p.url} target="_blank" rel="noopener noreferrer">Visitar sitio <FiArrowUpRight /></a>
                  )}
                </div>
              </Tilt>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Stats({ stats, about }: any) {
  return (
    <section className="section stats">
      <div className="wrap stats__grid">
        <Reveal className="stats__about">
          <h2 className="h2">Ingeniería probada en operaciones grandes</h2>
          <p className="lead">{about}</p>
        </Reveal>
        <div className="stats__nums">
          {stats.map((s: any, i: number) => (
            <Reveal className="stat" key={s.id} delay={i * 90}>
              <strong><Counter value={Number(s.value) || 0} suffix={s.suffix || ''} /></strong>
              <span>{s.label}</span>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials({ items }: any) {
  if (!items.length) return null;
  return (
    <section className="section">
      <div className="wrap">
        <Reveal className="section__head"><h2 className="h2">Lo que dicen nuestros clientes</h2></Reveal>
        <div className="quotes">
          {items.map((t: any, i: number) => (
            <Reveal as="figure" className="quote" key={t.id} delay={i * 90}>
              <blockquote>{t.quote}</blockquote>
              <figcaption><strong>{t.author}</strong>{[t.role, t.company].filter(Boolean).join(', ')}</figcaption>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Faq({ faqs }: any) {
  const [open, setOpen] = useState<string | null>(faqs[0]?.id ?? null);
  return (
    <section className="section faq" id="preguntas">
      <div className="wrap faq__grid">
        <Reveal><h2 className="h2">Preguntas que nos hacen seguido</h2></Reveal>
        <div className="faq__list">
          {faqs.map((f: any) => {
            const on = open === f.id;
            return (
              <div className={`faq__item ${on ? 'is-open' : ''}`} key={f.id}>
                <button aria-expanded={on} onClick={() => setOpen(on ? null : f.id)}>
                  {f.question}
                  <span className="faq__plus" aria-hidden="true"><FiPlus /></span>
                </button>
                <div className="faq__answer" role="region"><div><p>{f.answer}</p></div></div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Footer({ settings }: any) {
  const wa = whatsappLink(settings.whatsapp, 'Hola, quiero información sobre sus servicios.');
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer__cta">
          <h2 className="h2">¿Ponemos tu negocio a girar?</h2>
          <div className="hero__cta">
            <Magnetic className="btn btn--light btn--lg" href="#cotizar">Armar mi proyecto <FiArrowRight /></Magnetic>
            {wa && <a className="btn btn--outline-light btn--lg" href={wa} target="_blank" rel="noopener noreferrer"><FiMessageCircle /> Escribir por WhatsApp</a>}
          </div>
        </div>
        <div className="footer__row">
          <div className="logo logo--light"><GearMark /><span>{settings.brand_name}</span></div>
          <ul className="footer__contact">
            {settings.location && <li><FiMapPin /> {settings.location}</li>}
            {settings.email && <li><a href={`mailto:${settings.email}`}><FiMail /> {settings.email}</a></li>}
            {settings.instagram && <li><a href={settings.instagram} target="_blank" rel="noopener noreferrer"><FiInstagram /> Instagram</a></li>}
            {settings.facebook && <li><a href={settings.facebook} target="_blank" rel="noopener noreferrer"><FiFacebook /> Facebook</a></li>}
          </ul>
        </div>
        <div className="footer__legal">
          <span>© {year} {settings.brand_name}</span>
          <Link to="/admin">Acceso administrativo</Link>
        </div>
      </div>
    </footer>
  );
}

export default function Site() {
  const content = useSiteContent();
  const [selected, setSelected] = useState<string[]>([]);
  useScrollProgress();
  const { settings } = content;
  const wa = whatsappLink(settings.whatsapp, 'Hola, quiero información sobre sus servicios.');

  return (
    <div className="site">
      <a className="skip" href="#servicios">Saltar al contenido</a>
      <div className="progress" aria-hidden="true" />
      <CursorGlow />
      <Nav brand={settings.brand_name} />
      <main>
        <Hero settings={settings} />
        <Brands brands={content.brands} />
        <Services services={content.services} selected={selected} setSelected={setSelected} />
        <Process />
        <Work portfolio={content.portfolio} />
        <Stats stats={content.stats} about={settings.about} />
        <Configurator services={content.services} selected={selected} setSelected={setSelected} settings={settings} />
        <Testimonials items={content.testimonials} />
        <Faq faqs={content.faqs} />
      </main>
      <Footer settings={settings} />
      {wa && (
        <a className="wa-fab" href={wa} target="_blank" rel="noopener noreferrer" aria-label="Escribir por WhatsApp">
          <FiMessageCircle />
        </a>
      )}
    </div>
  );
}
