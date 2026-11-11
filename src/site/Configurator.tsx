import { useState } from 'react';
import { FiArrowLeft, FiArrowRight, FiCheck, FiMessageCircle, FiSend } from 'react-icons/fi';
import { Icon, Reveal } from '../lib/fx';
import { sendLead, whatsappLink } from '../lib/content';
import { supabase } from '../lib/supabase';

const BUSINESS = ['Comercio o tienda', 'Restaurante o comida', 'Salud o farmacia', 'Servicios profesionales', 'Distribución o mayorista', 'Otro'];
const BUDGET = ['Menos de $300', '$300 a $1.000', '$1.000 a $3.000', 'Más de $3.000', 'Aún no lo sé'];
const TIMELINE = ['Lo antes posible', 'En un mes', 'En dos o tres meses', 'Solo estoy explorando'];
const STEPS = ['Qué necesitas', 'Tu negocio', 'Tus datos'];

function Chips({ options, value, onChange, label }: any) {
  return (
    <fieldset className="chips">
      <legend>{label}</legend>
      <div className="chips__row">
        {options.map((o: string) => (
          <button type="button" key={o} className={`chip ${value === o ? 'is-on' : ''}`} aria-pressed={value === o} onClick={() => onChange(value === o ? '' : o)}>
            {o}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export default function Configurator({ services, selected, setSelected, settings }: any) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ business_type: '', budget: '', timeline: '', name: '', company: '', phone: '', email: '', message: '' });
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle');
  const [error, setError] = useState('');

  const set = (k: string) => (v: any) => setForm((f) => ({ ...f, [k]: v?.target ? v.target.value : v }));
  const toggle = (id: string) => setSelected((s: string[]) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const chosen = services.filter((s: any) => selected.includes(s.id));
  const titles = chosen.map((s: any) => s.title);

  const summaryText = () =>
    [
      `Hola, soy ${form.name}${form.company ? ` de ${form.company}` : ''}.`,
      `Me interesa: ${titles.join(', ')}.`,
      form.business_type && `Negocio: ${form.business_type}.`,
      form.budget && `Presupuesto: ${form.budget}.`,
      form.timeline && `Plazo: ${form.timeline}.`,
      form.message,
    ]
      .filter(Boolean)
      .join('\n');

  const wa = whatsappLink(settings.whatsapp, summaryText());

  const next = () => {
    setError('');
    if (step === 0 && !selected.length) return setError('Elige al menos un servicio para continuar.');
    setStep((s) => s + 1);
  };

  const submit = async (e: any) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) return setError('Escribe tu nombre.');
    if (!form.phone.trim() && !form.email.trim()) return setError('Déjanos un WhatsApp o un correo para responderte.');
    setState('sending');
    try {
      await sendLead({
        name: form.name.trim(), company: form.company.trim() || null, phone: form.phone.trim() || null,
        email: form.email.trim() || null, message: form.message.trim() || null, services: titles,
        business_type: form.business_type || null, budget: form.budget || null, timeline: form.timeline || null, source: 'web',
      });
      setState('done');
    } catch (err) {
      console.warn(err);
      if (wa) {
        // Sin conexión a la base de datos: la solicitud sale por WhatsApp.
        setState('done');
        window.open(wa, '_blank', 'noopener');
      } else {
        setState('idle');
        setError(
          supabase
            ? 'No se pudo enviar la solicitud. Revisa tu conexión e inténtalo de nuevo.'
            : 'El formulario aún no está conectado. Escríbenos por nuestras redes mientras lo activamos.'
        );
      }
    }
  };

  return (
    <section className="section config" id="cotizar">
      <div className="wrap config__grid">
        <Reveal className="config__intro">
          <h2 className="h2">Arma tu proyecto en un minuto</h2>
          <p className="lead">Marca lo que necesitas y te respondemos con una propuesta a tu medida. Sin llamadas de venta ni compromiso.</p>
          <div className="config__build" aria-live="polite">
            <p className="config__build-title">{chosen.length ? 'Tu proyecto lleva' : 'Tu proyecto está vacío'}</p>
            <div className="config__pieces">
              {chosen.length ? (
                chosen.map((s: any) => (
                  <span className="piece" key={s.id}>
                    <Icon name={s.icon} /> {s.title}
                  </span>
                ))
              ) : (
                <span className="piece piece--ghost">Elige servicios y aparecerán aquí</span>
              )}
            </div>
          </div>
        </Reveal>

        <Reveal className="config__panel" delay={120}>
          {state === 'done' ? (
            <div className="config__done">
              <span className="config__check"><FiCheck /></span>
              <h3 className="h3">Solicitud enviada</h3>
              <p>Gracias, {form.name.split(' ')[0]}. Revisamos lo que necesitas y te escribimos pronto con una propuesta.</p>
              {wa && (
                <a className="btn btn--primary" href={wa} target="_blank" rel="noopener noreferrer">
                  <FiMessageCircle /> Seguir por WhatsApp
                </a>
              )}
            </div>
          ) : (
            <form onSubmit={submit} noValidate>
              <ol className="stepper" aria-label="Pasos de la solicitud">
                {STEPS.map((s, i) => (
                  <li key={s} className={i === step ? 'is-current' : i < step ? 'is-done' : ''} aria-current={i === step ? 'step' : undefined}>
                    <span>{i < step ? <FiCheck /> : i + 1}</span>
                    {s}
                  </li>
                ))}
              </ol>

              <div className="config__step" key={step}>
                {step === 0 && (
                  <div className="pick" role="group" aria-label="Servicios">
                    {services.map((s: any) => {
                      const on = selected.includes(s.id);
                      return (
                        <button type="button" key={s.id} className={`pick__item ${on ? 'is-on' : ''}`} aria-pressed={on} onClick={() => toggle(s.id)}>
                          <span className="pick__icon"><Icon name={s.icon} /></span>
                          <span className="pick__title">{s.title}</span>
                          <span className="pick__mark">{on && <FiCheck />}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
                {step === 1 && (
                  <>
                    <Chips label="¿Qué tipo de negocio tienes?" options={BUSINESS} value={form.business_type} onChange={set('business_type')} />
                    <Chips label="¿Con qué presupuesto cuentas?" options={BUDGET} value={form.budget} onChange={set('budget')} />
                    <Chips label="¿Para cuándo lo necesitas?" options={TIMELINE} value={form.timeline} onChange={set('timeline')} />
                  </>
                )}
                {step === 2 && (
                  <div className="fields">
                    <label className="field"><span>Nombre</span><input value={form.name} onChange={set('name')} autoComplete="name" required /></label>
                    <label className="field"><span>Empresa o negocio</span><input value={form.company} onChange={set('company')} autoComplete="organization" /></label>
                    <label className="field"><span>WhatsApp</span><input value={form.phone} onChange={set('phone')} type="tel" autoComplete="tel" placeholder="+58 412 000 0000" /></label>
                    <label className="field"><span>Correo</span><input value={form.email} onChange={set('email')} type="email" autoComplete="email" /></label>
                    <label className="field field--full"><span>Cuéntanos más (opcional)</span><textarea rows={3} value={form.message} onChange={set('message')} placeholder="Qué problema quieres resolver, qué usas hoy, ideas que tengas…" /></label>
                  </div>
                )}
              </div>

              {error && <p className="form-error" role="alert">{error}</p>}

              <div className="config__actions">
                {step > 0 ? (
                  <button type="button" className="btn btn--ghost" onClick={() => { setError(''); setStep(step - 1); }}>
                    <FiArrowLeft /> Atrás
                  </button>
                ) : <span />}
                {step < 2 ? (
                  <button type="button" className="btn btn--primary" onClick={next}>Continuar <FiArrowRight /></button>
                ) : (
                  <button type="submit" className="btn btn--primary" disabled={state === 'sending'}>
                    <FiSend /> {state === 'sending' ? 'Enviando…' : 'Enviar solicitud'}
                  </button>
                )}
              </div>
            </form>
          )}
        </Reveal>
      </div>
    </section>
  );
}
