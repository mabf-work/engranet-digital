import { useEffect, useState } from 'react';
import { FiBriefcase, FiClock, FiDollarSign, FiInbox, FiUsers } from 'react-icons/fi';
import { supabase } from '../lib/supabase';
import { Link } from '../lib/router';
import { Badge, fmtDate, fmtMoney } from './Crud';
import { LEAD_STATUS } from './resources';

const sumBy = (rows: any[]) => {
  const t: Record<string, number> = {};
  rows.forEach((r) => (t[r.currency || 'USD'] = (t[r.currency || 'USD'] || 0) + Number(r.amount || 0)));
  const parts = Object.entries(t).map(([c, v]) => fmtMoney(v, c));
  return parts.length ? parts.join(' + ') : fmtMoney(0);
};

export default function Dashboard() {
  const [d, setD] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const [leads, clients, projects, payments] = await Promise.all(
        ['leads', 'clients', 'projects', 'payments'].map((t) => supabase.from(t).select('*').order('created_at', { ascending: false }))
      );
      const err = [leads, clients, projects, payments].find((r) => r.error)?.error;
      if (err) setError(err.message);
      setD({ leads: leads.data || [], clients: clients.data || [], projects: projects.data || [], payments: payments.data || [] });
    })();
  }, []);

  if (!d) return <div className="page"><p className="muted">Cargando resumen…</p></div>;

  const month = new Date().toISOString().slice(0, 7);
  const today = new Date().toISOString().slice(0, 10);
  const paid = d.payments.filter((p: any) => p.status === 'pagado');
  const pending = d.payments.filter((p: any) => p.status !== 'pagado');
  const overdue = pending.filter((p: any) => p.due_date && p.due_date < today);
  const active = d.projects.filter((p: any) => p.status === 'en_curso');
  const projName = (id: string) => d.projects.find((p: any) => p.id === id)?.name || '—';
  const clientName = (id: string) => d.clients.find((c: any) => c.id === id)?.name || '—';

  // Cobros en USD de los últimos seis meses
  const months = Array.from({ length: 6 }, (_, i) => {
    const dt = new Date();
    dt.setDate(1);
    dt.setMonth(dt.getMonth() - (5 - i));
    const key = dt.toISOString().slice(0, 7);
    const total = paid.filter((p: any) => (p.currency || 'USD') === 'USD' && String(p.paid_at || '').startsWith(key)).reduce((a: number, p: any) => a + Number(p.amount || 0), 0);
    return { key, label: dt.toLocaleDateString('es-VE', { month: 'short' }), total };
  });
  const max = Math.max(1, ...months.map((m) => m.total));

  const kpis = [
    { icon: FiInbox, label: 'Solicitudes nuevas', value: d.leads.filter((l: any) => l.status === 'nuevo').length, to: '/admin/solicitudes', tone: 'violet' },
    { icon: FiUsers, label: 'Clientes activos', value: d.clients.filter((c: any) => c.status === 'activo').length, to: '/admin/clientes', tone: 'cyan' },
    { icon: FiBriefcase, label: 'Proyectos en curso', value: active.length, to: '/admin/proyectos', tone: 'amber' },
    { icon: FiDollarSign, label: 'Cobrado este mes', value: sumBy(paid.filter((p: any) => String(p.paid_at || '').startsWith(month))), to: '/admin/pagos', tone: 'green' },
    { icon: FiClock, label: 'Por cobrar', value: sumBy(pending), to: '/admin/pagos', tone: 'red', note: overdue.length ? `${overdue.length} vencido${overdue.length > 1 ? 's' : ''}` : '' },
  ];

  return (
    <div className="page">
      <header className="page__head"><div><h1>Resumen</h1><p>Cómo va el negocio hoy.</p></div></header>
      {error && <p className="alert" role="alert">{error}</p>}

      <div className="kpis">
        {kpis.map((k) => (
          <Link to={k.to} className={`kpi kpi--${k.tone}`} key={k.label}>
            <span className="kpi__icon"><k.icon /></span>
            <span className="kpi__label">{k.label}</span>
            <strong>{k.value}</strong>
            {k.note && <small>{k.note}</small>}
          </Link>
        ))}
      </div>

      <div className="panels">
        <section className="panel">
          <h2>Cobros de los últimos seis meses (USD)</h2>
          <div className="chart" role="img" aria-label={months.map((m) => `${m.label}: ${fmtMoney(m.total)}`).join(', ')}>
            {months.map((m) => (
              <div className="chart__col" key={m.key}>
                <span className="chart__val">{m.total ? fmtMoney(m.total).replace(',00', '') : ''}</span>
                <i style={{ height: `${Math.max(3, (m.total / max) * 100)}%` }} className={m.total ? '' : 'is-empty'} />
                <span className="chart__lbl">{m.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>Proyectos en curso</h2>
          {active.length ? (
            <ul className="plist">
              {active.slice(0, 6).map((p: any) => (
                <li key={p.id}>
                  <div><strong>{p.name}</strong><small>{clientName(p.client_id)}{p.due_date ? ` · entrega ${fmtDate(p.due_date)}` : ''}</small></div>
                  <div className="bar"><i style={{ width: `${Math.min(100, p.progress || 0)}%` }} /><span>{p.progress || 0}%</span></div>
                </li>
              ))}
            </ul>
          ) : <p className="muted">No hay proyectos en curso. <Link to="/admin/proyectos">Crear un proyecto</Link></p>}
        </section>

        <section className="panel">
          <h2>Últimas solicitudes</h2>
          {d.leads.length ? (
            <ul className="plist">
              {d.leads.slice(0, 6).map((l: any) => (
                <li key={l.id}>
                  <div><strong>{l.name}</strong><small>{(l.services || []).join(', ') || 'Sin servicios marcados'} · {fmtDate(l.created_at)}</small></div>
                  <Badge value={l.status} options={LEAD_STATUS} />
                </li>
              ))}
            </ul>
          ) : <p className="muted">Cuando alguien complete el cotizador de la web, aparecerá aquí.</p>}
        </section>

        <section className="panel">
          <h2>Próximos cobros</h2>
          {pending.length ? (
            <ul className="plist">
              {[...pending].sort((a: any, b: any) => String(a.due_date || '9').localeCompare(String(b.due_date || '9'))).slice(0, 6).map((p: any) => (
                <li key={p.id}>
                  <div><strong>{p.concept}</strong><small>{projName(p.project_id)} · {p.due_date ? `vence ${fmtDate(p.due_date)}` : 'sin fecha'}</small></div>
                  <span className={`num ${p.due_date && p.due_date < today ? 'num--late' : ''}`}>{fmtMoney(p.amount, p.currency)}</span>
                </li>
              ))}
            </ul>
          ) : <p className="muted">No hay cobros pendientes.</p>}
        </section>
      </div>
    </div>
  );
}
