import { useEffect, useRef, useState } from 'react';
import { FiMessageCircle, FiSend } from 'react-icons/fi';
import { supabase } from '../lib/supabase';
import { GearMark } from './Gears';

export type ChatSession = { token: string; name: string };
const KEY = 'engranet_chat';

export function loadSession(): ChatSession | null {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null');
    return s?.token ? s : null;
  } catch {
    return null;
  }
}
export function saveSession(s: ChatSession | null) {
  try {
    if (s) localStorage.setItem(KEY, JSON.stringify(s));
    else localStorage.removeItem(KEY);
  } catch {
    /* sin almacenamiento: la conversación dura mientras la página siga abierta */
  }
}
export function newToken() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export const hhmm = (v: string) => new Date(v).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });

/** Chat del visitante con el equipo. Se actualiza solo, sin recargar la página. */
export default function Chat({ session, onReset }: { session: ChatSession; onReset: () => void }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [inView, setInView] = useState(true);
  const [seen, setSeen] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    const { data, error } = await supabase.rpc('chat_fetch', { p_token: session.token });
    if (!error && Array.isArray(data)) {
      setMessages((prev) => {
        const pending = prev.filter((m) => m.pending && !data.some((d: any) => d.sender === 'client' && d.body === m.body));
        return [...data, ...pending];
      });
    }
  };

  useEffect(() => {
    fetchMessages();
    // Respaldo: consulta cada pocos segundos por si el aviso instantáneo no llega.
    const timer = setInterval(() => !document.hidden && fetchMessages(), 3000);
    let channel: any = null;
    try {
      channel = supabase.channel(`chat-${session.token}`).on('broadcast', { event: 'new' }, () => fetchMessages()).subscribe();
    } catch (e) {
      console.warn('Chat sin avisos instantáneos; se usa la consulta periódica.', e);
    }
    return () => {
      clearInterval(timer);
      try {
        if (channel) supabase.removeChannel(channel);
      } catch {
        /* nada que limpiar */
      }
    };
  }, [session.token]);

  useEffect(() => {
    const el = box.current;
    if (!el || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const agentCount = messages.filter((m) => m.sender === 'agent').length;
  useEffect(() => {
    if (inView) setSeen(agentCount);
  }, [inView, agentCount]);

  useEffect(() => {
    const el = body.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const send = async (e?: any) => {
    e?.preventDefault();
    const value = text.trim();
    if (!value) return;
    setText('');
    setError('');
    setMessages((m) => [...m, { id: 'tmp-' + Date.now(), sender: 'client', body: value, created_at: new Date().toISOString(), pending: true }]);
    const { error } = await supabase.rpc('chat_send', { p_token: session.token, p_body: value });
    if (error) {
      setMessages((m) => m.filter((x) => !(x.pending && x.body === value)));
      setText(value);
      setError(/demasiados/.test(error.message) ? 'Vas muy rápido. Espera un momento y vuelve a enviar.' : 'No se pudo enviar el mensaje. Revisa tu conexión e inténtalo de nuevo.');
    } else fetchMessages();
  };

  const first = session.name.split(' ')[0];
  const unseen = agentCount - seen;

  return (
    <>
      <div className="chat" ref={box}>
        <header className="chat__head">
          <span className="chat__avatar"><GearMark size={26} /></span>
          <div>
            <strong>Engranet Digital</strong>
            <small><i className="chat__dot" /> Te respondemos por aquí</small>
          </div>
        </header>

        <div className="chat__body" ref={body} role="log" aria-live="polite" aria-label="Conversación">
          <div className="bubble bubble--agent">
            <p>¡Hola, {first}! Recibimos tu solicitud. Escríbenos lo que quieras contarnos del proyecto: un asesor te responde en este mismo chat.</p>
          </div>
          {messages.map((m) => (
            <div key={m.id} className={`bubble bubble--${m.sender} ${m.pending ? 'is-pending' : ''}`}>
              <p>{m.body}</p>
              <time>{m.pending ? 'Enviando…' : hhmm(m.created_at)}</time>
            </div>
          ))}
        </div>

        {error && <p className="form-error" role="alert">{error}</p>}

        <form className="chat__form" onSubmit={send}>
          <textarea
            rows={1}
            value={text}
            maxLength={2000}
            placeholder="Escribe tu mensaje"
            aria-label="Mensaje"
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) send(e);
            }}
          />
          <button className="chat__send" aria-label="Enviar mensaje" disabled={!text.trim()}><FiSend /></button>
        </form>

        <p className="chat__foot">
          La conversación queda guardada en este dispositivo.{' '}
          <button type="button" onClick={onReset}>Empezar otra solicitud</button>
        </p>
      </div>

      {!inView && (
        <a className={`chat-fab ${unseen > 0 ? 'has-new' : ''}`} href="#cotizar">
          <FiMessageCircle /> {unseen > 0 ? 'Tienes una respuesta nueva' : 'Tu conversación'}
        </a>
      )}
    </>
  );
}
