import { useEffect, useRef, useState } from 'react';
import { FiMail, FiMessageCircle, FiSend } from 'react-icons/fi';
import { supabase } from '../lib/supabase';
import { hhmm } from '../site/Chat';
import { Badge, fmtDate } from './Crud';
import { LEAD_STATUS } from './resources';

const ago = (v: string) => {
  if (!v) return '';
  const d = new Date(v);
  return d.toDateString() === new Date().toDateString() ? hhmm(v) : fmtDate(v);
};

/** Bandeja de conversaciones con los visitantes del cotizador. */
export default function Conversations() {
  const [leads, setLeads] = useState<any[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const activeRef = useRef<string | null>(null);
  const notify = useRef<any>(null);
  const body = useRef<HTMLDivElement>(null);

  const loadList = async () => {
    const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
    if (error) setError(/chat_token|column/.test(error.message) ? 'Falta ejecutar el SQL del chat en Supabase.' : error.message);
    const list = (data || []).filter((l: any) => l.chat_token);
    list.sort((a: any, b: any) => String(b.last_message_at || b.created_at).localeCompare(String(a.last_message_at || a.created_at)));
    setLeads(list);
    setLoading(false);
    return list;
  };

  const loadThread = async (id: string) => {
    const { data, error } = await supabase.from('chat_messages').select('*').eq('lead_id', id).order('created_at', { ascending: true });
    if (error) return setError(error.message);
    if (activeRef.current === id) setMessages(data || []);
  };

  const markRead = async (id: string) => {
    await supabase.from('leads').update({ unread_admin: 0 }).eq('id', id);
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, unread_admin: 0 } : l)));
    window.dispatchEvent(new Event('engranet:chat-read'));
  };

  const refresh = async () => {
    const list = await loadList();
    const id = activeRef.current;
    if (!id) return;
    await loadThread(id);
    if (list.find((l: any) => l.id === id)?.unread_admin > 0 && !document.hidden) markRead(id);
  };

  useEffect(() => {
    refresh();
    // Aviso instantáneo de mensajes nuevos, con consulta periódica de respaldo.
    const timer = setInterval(() => !document.hidden && refresh(), 5000);
    let channel: any = null;
    try {
      channel = supabase
        .channel('panel-chat')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, () => refresh())
        .subscribe();
    } catch (e) {
      console.warn(e);
    }
    return () => {
      clearInterval(timer);
      try {
        if (channel) supabase.removeChannel(channel);
      } catch {
        /* nada que limpiar */
      }
    };
  }, []);

  const active = leads.find((l) => l.id === activeId);

  // Canal por el que se avisa al visitante de que hay una respuesta.
  useEffect(() => {
    if (!active?.chat_token) return;
    let channel: any = null;
    try {
      channel = supabase.channel(`chat-${active.chat_token}`).subscribe();
      notify.current = channel;
    } catch (e) {
      console.warn(e);
    }
    return () => {
      notify.current = null;
      try {
        if (channel) supabase.removeChannel(channel);
      } catch {
        /* nada que limpiar */
      }
    };
  }, [active?.chat_token]);

  useEffect(() => {
    const el = body.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, activeId]);

  const open = (lead: any) => {
    activeRef.current = lead.id;
    setActiveId(lead.id);
    setMessages([]);
    setText('');
    setError('');
    loadThread(lead.id);
    if (lead.unread_admin > 0) markRead(lead.id);
  };

  const send = async (e?: any) => {
    e?.preventDefault();
    const value = text.trim();
    if (!value || !active) return;
    setText('');
    setError('');
    const { error } = await supabase.from('chat_messages').insert({ lead_id: active.id, sender: 'agent', body: value });
    if (error) {
      setText(value);
      return setError('No se pudo enviar: ' + error.message);
    }
    await supabase.from('leads').update({
      last_message: 'Tú: ' + value.slice(0, 130), last_message_at: new Date().toISOString(), unread_admin: 0,
      ...(active.status === 'nuevo' ? { status: 'contactado' } : {}),
    }).eq('id', active.id);
    try {
      notify.current?.send({ type: 'broadcast', event: 'new', payload: {} });
    } catch (e) {
      console.warn(e);
    }
    refresh();
  };

  const digits = (active?.phone || '').replace(/\D/g, '');

  return (
    <div className="page page--inbox">
      <header className="page__head">
        <div>
          <h1>Conversaciones</h1>
          <p>Chatea en vivo con quienes escriben desde la web. Mantén esta pantalla abierta para ver los mensajes al instante.</p>
        </div>
      </header>
      {error && <p className="alert" role="alert">{error}</p>}

      <div className={`inbox ${active ? 'has-active' : ''}`}>
        <aside className="inbox__list" aria-label="Conversaciones">
          {leads.map((l) => (
            <button key={l.id} className={`inbox__item ${l.id === activeId ? 'is-on' : ''}`} onClick={() => open(l)}>
              <span className="inbox__avatar">{(l.name || '?').trim()[0]?.toUpperCase()}</span>
              <span className="inbox__text">
                <strong>{l.name}{l.company ? ` · ${l.company}` : ''}</strong>
                <small>{l.last_message || 'Sin mensajes'}</small>
              </span>
              <span className="inbox__meta">
                <time>{ago(l.last_message_at || l.created_at)}</time>
                {l.unread_admin > 0 && <b aria-label={`${l.unread_admin} sin leer`}>{l.unread_admin}</b>}
              </span>
            </button>
          ))}
          {!loading && !leads.length && <p className="inbox__empty">Cuando alguien inicie una conversación desde la web, aparecerá aquí.</p>}
        </aside>

        <section className="inbox__thread">
          {active ? (
            <>
              <header className="thread__head">
                <button className="thread__back" onClick={() => { activeRef.current = null; setActiveId(null); }}>Volver</button>
                <div className="thread__who">
                  <strong>{active.name}{active.company ? ` · ${active.company}` : ''}</strong>
                  <small>{[active.business_type, active.budget, active.timeline].filter(Boolean).join(' · ') || 'Sin detalles'}</small>
                </div>
                <Badge value={active.status} options={LEAD_STATUS} />
                {digits && <a className="icon-btn" href={`https://wa.me/${digits}`} target="_blank" rel="noopener noreferrer" title="Abrir WhatsApp" aria-label="Abrir WhatsApp"><FiMessageCircle /></a>}
                {active.email && <a className="icon-btn" href={`mailto:${active.email}`} title="Enviar correo" aria-label="Enviar correo"><FiMail /></a>}
              </header>
              {active.services?.length > 0 && (
                <div className="thread__tags">{active.services.map((s: string) => <span key={s}>{s}</span>)}</div>
              )}
              <div className="thread__body" ref={body} role="log" aria-live="polite">
                {messages.map((m) => (
                  <div key={m.id} className={`msg msg--${m.sender}`}>
                    <p>{m.body}</p>
                    <time>{hhmm(m.created_at)}</time>
                  </div>
                ))}
              </div>
              <form className="thread__form" onSubmit={send}>
                <textarea
                  rows={1}
                  className="input"
                  value={text}
                  maxLength={2000}
                  placeholder={`Responder a ${active.name.split(' ')[0]}`}
                  aria-label="Respuesta"
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) send(e);
                  }}
                />
                <button className="abtn abtn--primary" disabled={!text.trim()}><FiSend /> Enviar</button>
              </form>
            </>
          ) : (
            <div className="inbox__blank">
              <FiMessageCircle />
              <p>{leads.length ? 'Elige una conversación para responder.' : 'Aún no hay conversaciones.'}</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
