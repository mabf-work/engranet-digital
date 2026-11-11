import { useEffect, useMemo, useState } from 'react';
import { FiCheck, FiDownload, FiEdit2, FiPlus, FiSearch, FiTrash2, FiUpload, FiUserPlus, FiX } from 'react-icons/fi';
import { MEDIA_BUCKET, supabase } from '../lib/supabase';
import { Resource, TONES } from './resources';

export const fmtDate = (v: any) => {
  if (!v) return '—';
  const d = new Date(String(v).length === 10 ? v + 'T12:00:00' : v);
  return isNaN(+d) ? '—' : d.toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });
};
export const fmtMoney = (n: any, cur = 'USD') =>
  `${cur === 'VES' ? 'Bs' : cur === 'EUR' ? '€' : '$'} ${Number(n || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const labelOf = (options: any[] = [], v: any) => options.find((o) => o.value === v)?.label ?? v ?? '—';

export function Badge({ value, options }: any) {
  return <span className={`badge badge--${TONES[value] || 'gray'}`}>{labelOf(options, value)}</span>;
}

export function Modal({ title, onClose, children, footer, narrow }: any) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal__box ${narrow ? 'modal__box--narrow' : ''}`}>
        <header className="modal__head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Cerrar"><FiX /></button>
        </header>
        <div className="modal__body">{children}</div>
        {footer && <footer className="modal__foot">{footer}</footer>}
      </div>
    </div>
  );
}

function ImageInput({ value, onChange }: any) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const upload = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setErr('');
    const path = `${Date.now()}-${file.name.replace(/[^\w.-]+/g, '_')}`;
    const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, { upsert: false });
    if (error) setErr('No se pudo subir la imagen: ' + error.message);
    else onChange(supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl);
    setBusy(false);
    e.target.value = '';
  };
  return (
    <div className="image-input">
      {value ? <img src={value} alt="" /> : <div className="image-input__empty">Sin imagen</div>}
      <div className="image-input__side">
        <label className="abtn abtn--soft">
          <FiUpload /> {busy ? 'Subiendo…' : 'Subir imagen'}
          <input type="file" accept="image/*" hidden onChange={upload} disabled={busy} />
        </label>
        <input className="input" placeholder="o pega el enlace de la imagen" value={value || ''} onChange={(e) => onChange(e.target.value)} />
        {err && <small className="err">{err}</small>}
      </div>
    </div>
  );
}

export function FieldInput({ field, value, onChange, lookups }: any) {
  const common = { id: 'f-' + field.key, className: 'input', required: field.required };
  switch (field.type) {
    case 'textarea':
      return <textarea {...common} rows={4} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
    case 'number':
      return <input {...common} type="number" step="any" min={field.min} max={field.max} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
    case 'date':
      return <input {...common} type="date" value={value ? String(value).slice(0, 10) : ''} onChange={(e) => onChange(e.target.value)} />;
    case 'select':
      return (
        <select {...common} value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
          {field.empty && <option value="">{field.empty}</option>}
          {field.options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      );
    case 'relation':
      return (
        <select {...common} value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
          <option value="">Selecciona…</option>
          {(lookups[field.table] || []).map((o: any) => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
      );
    case 'bool':
      return (
        <label className="switch">
          <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
          <span /> {value ? 'Sí' : 'No'}
        </label>
      );
    case 'list':
      return <textarea {...common} rows={3} placeholder="Un elemento por línea" value={Array.isArray(value) ? value.join('\n') : value ?? ''} onChange={(e) => onChange(e.target.value)} />;
    case 'image':
      return <ImageInput value={value} onChange={onChange} />;
    default:
      return <input {...common} type="text" value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
  }
}

/** Normaliza el formulario antes de guardarlo: vacíos a null, números y listas. */
export function clean(fields: any[], form: any) {
  const out: any = {};
  for (const f of fields) {
    let v = form[f.key];
    if (f.type === 'number') v = v === '' || v == null ? null : Number(v);
    else if (f.type === 'list') v = (Array.isArray(v) ? v : String(v || '').split(/\n|,/)).map((s: string) => s.trim()).filter(Boolean);
    else if (f.type === 'bool') v = !!v;
    else if (typeof v === 'string') v = v.trim() === '' ? null : v.trim();
    else if (v === undefined) v = null;
    out[f.key] = v;
  }
  return out;
}

function Cell({ col, row, lookups }: any) {
  const v = row[col.key];
  switch (col.type) {
    case 'date': return <>{fmtDate(v)}</>;
    case 'money': return <span className="num">{v == null ? '—' : fmtMoney(v, row.currency)}</span>;
    case 'badge': return <Badge value={v} options={col.options} />;
    case 'bool': return v ? <span className="dot dot--on">Sí</span> : <span className="dot">No</span>;
    case 'list': return <div className="mini-tags">{(v || []).map((t: string) => <span key={t}>{t}</span>)}</div>;
    case 'image': return v ? <img className="thumb" src={v} alt="" /> : <span className="muted">—</span>;
    case 'relation': return <>{(lookups[col.table] || []).find((o: any) => o.id === v)?.label || '—'}</>;
    case 'progress': return <div className="bar" title={`${v || 0}%`}><i style={{ width: `${Math.min(100, v || 0)}%` }} /><span>{v || 0}%</span></div>;
    case 'clip': return <span className="clip">{v}</span>;
    case 'strong':
      return (
        <div className="cell-main">
          <strong>{v ?? '—'}{col.key === 'value' && row.suffix ? row.suffix : ''}</strong>
          {col.sub && col.key !== 'value' && row[col.sub] && <small>{row[col.sub]}</small>}
        </div>
      );
    default:
      return (
        <div className="cell-main">
          <span>{v ?? '—'}</span>
          {col.sub && row[col.sub] && <small>{row[col.sub]}</small>}
        </div>
      );
  }
}

export default function Crud({ resource }: { resource: Resource }) {
  const [rows, setRows] = useState<any[]>([]);
  const [lookups, setLookups] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [editing, setEditing] = useState<any>(null);
  const [removing, setRemoving] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [toast, setToast] = useState('');

  const relTables = useMemo(
    () => Array.from(new Set([...resource.fields, ...resource.columns].filter((f) => f.type === 'relation').map((f) => f.table))) as string[],
    [resource]
  );

  const load = async () => {
    setLoading(true);
    setError('');
    const [main, ...rels] = await Promise.all([
      supabase.from(resource.table).select('*').order(resource.order[0], { ascending: resource.order[1] }),
      ...relTables.map((t) => supabase.from(t).select('*').order('name', { ascending: true })),
    ]);
    if (main.error) setError(main.error.message);
    setRows(main.data || []);
    const lk: any = {};
    relTables.forEach((t, i) => {
      lk[t] = (rels[i].data || []).map((r: any) => ({ id: r.id, label: r.company ? `${r.name} (${r.company})` : r.name, raw: r }));
    });
    setLookups(lk);
    setLoading(false);
  };

  useEffect(() => {
    setQuery('');
    setStatus('');
    setEditing(null);
    load();
  }, [resource.table]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const visible = rows.filter((r) => {
    if (status && r[resource.statusKey!] !== status) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return Object.values(r).some((v) => v != null && String(v).toLowerCase().includes(q));
  });

  const save = async (e: any) => {
    e.preventDefault();
    setFormError('');
    for (const f of resource.fields) {
      const v = editing[f.key];
      if (f.required && (v == null || String(v).trim() === '')) return setFormError(`Completa el campo «${f.label}».`);
    }
    setSaving(true);
    let payload = clean(resource.fields, editing);
    if (resource.beforeSave) payload = resource.beforeSave(payload);
    const res = editing.id
      ? await supabase.from(resource.table).update(payload).eq('id', editing.id)
      : await supabase.from(resource.table).insert({ ...payload, ...(resource.table === 'leads' ? { source: 'manual' } : {}) });
    setSaving(false);
    if (res.error) return setFormError('No se pudo guardar: ' + res.error.message);
    setEditing(null);
    setToast(editing.id ? 'Cambios guardados' : 'Registro creado');
    load();
  };

  const remove = async () => {
    const { error } = await supabase.from(resource.table).delete().eq('id', removing.id);
    setRemoving(null);
    if (error) return setError(error.code === '23503' ? 'No se puede eliminar porque tiene registros asociados (proyectos o pagos). Elimínalos primero.' : error.message);
    setToast('Eliminado');
    load();
  };

  const convert = async (lead: any) => {
    const { error } = await supabase.from('clients').insert({
      name: lead.name, company: lead.company, phone: lead.phone, email: lead.email, status: 'activo', lead_id: lead.id,
      notes: [lead.services?.length ? 'Pidió: ' + lead.services.join(', ') : '', lead.message || ''].filter(Boolean).join('\n') || null,
    });
    if (error) return setError(error.message);
    await supabase.from('leads').update({ status: 'ganado' }).eq('id', lead.id);
    setToast('Cliente creado a partir de la solicitud');
    load();
  };

  const exportCsv = () => {
    const cols = resource.fields.map((f) => f.key);
    const esc = (v: any) => `"${String(Array.isArray(v) ? v.join('; ') : v ?? '').replace(/"/g, '""')}"`;
    const csv = [resource.fields.map((f) => esc(f.label)).join(','), ...visible.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `${resource.table}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="page">
      <header className="page__head">
        <div>
          <h1>{resource.title}</h1>
          {resource.description && <p>{resource.description}</p>}
        </div>
        <div className="page__actions">
          <button className="abtn abtn--soft" onClick={exportCsv} disabled={!visible.length}><FiDownload /> Exportar</button>
          <button className="abtn abtn--primary" onClick={() => { setFormError(''); setEditing({ ...(resource.defaults || {}) }); }}><FiPlus /> {resource.newLabel}</button>
        </div>
      </header>

      <div className="toolbar">
        <label className="search">
          <FiSearch />
          <input placeholder={`Buscar en ${resource.title.toLowerCase()}`} value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        {resource.statusOptions && (
          <div className="tabs" role="group" aria-label="Filtrar por estado">
            <button className={!status ? 'is-on' : ''} onClick={() => setStatus('')}>Todos <b>{rows.length}</b></button>
            {resource.statusOptions.map((o) => (
              <button key={o.value} className={status === o.value ? 'is-on' : ''} onClick={() => setStatus(o.value)}>
                {o.label} <b>{rows.filter((r) => r[resource.statusKey!] === o.value).length}</b>
              </button>
            ))}
          </div>
        )}
      </div>

      {error && <p className="alert" role="alert">{error}</p>}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              {resource.columns.map((c) => <th key={c.key}>{c.label}</th>)}
              <th aria-label="Acciones" />
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={row.id} onDoubleClick={() => { setFormError(''); setEditing({ ...row }); }}>
                {resource.columns.map((c) => <td key={c.key} data-label={c.label}><Cell col={c} row={row} lookups={lookups} /></td>)}
                <td className="row-actions">
                  {resource.convert && row.status !== 'ganado' && (
                    <button className="icon-btn" title="Convertir en cliente" aria-label="Convertir en cliente" onClick={() => convert(row)}><FiUserPlus /></button>
                  )}
                  <button className="icon-btn" title="Editar" aria-label="Editar" onClick={() => { setFormError(''); setEditing({ ...row }); }}><FiEdit2 /></button>
                  <button className="icon-btn icon-btn--danger" title="Eliminar" aria-label="Eliminar" onClick={() => setRemoving(row)}><FiTrash2 /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && !visible.length && (
          <div className="empty">
            <p>{rows.length ? 'Nada coincide con la búsqueda o el filtro.' : `Aún no hay registros en ${resource.title.toLowerCase()}.`}</p>
            {!rows.length && <button className="abtn abtn--primary" onClick={() => setEditing({ ...(resource.defaults || {}) })}><FiPlus /> {resource.newLabel}</button>}
          </div>
        )}
        {loading && <div className="empty"><p>Cargando…</p></div>}
      </div>

      {editing && (
        <Modal title={editing.id ? `Editar ${resource.singular}` : resource.newLabel} onClose={() => setEditing(null)}>
          <form id="crud-form" className="form-grid" onSubmit={save} noValidate>
            {resource.fields.map((f) => (
              <div key={f.key} className={`fgroup ${f.full ? 'fgroup--full' : ''}`}>
                <label htmlFor={'f-' + f.key}>{f.label}{f.required && <i aria-hidden="true"> *</i>}</label>
                <FieldInput field={f} value={editing[f.key]} lookups={lookups} onChange={(v: any) => setEditing((s: any) => ({ ...s, [f.key]: v }))} />
                {f.hint && <small>{f.hint}</small>}
              </div>
            ))}
            {formError && <p className="alert fgroup--full" role="alert">{formError}</p>}
          </form>
          <div className="modal__foot">
            <button className="abtn abtn--soft" type="button" onClick={() => setEditing(null)}>Cancelar</button>
            <button className="abtn abtn--primary" type="submit" form="crud-form" disabled={saving}><FiCheck /> {saving ? 'Guardando…' : 'Guardar'}</button>
          </div>
        </Modal>
      )}

      {removing && (
        <Modal title={`Eliminar ${resource.singular}`} onClose={() => setRemoving(null)} narrow>
          <p>Vas a eliminar <strong>{removing.name || removing.title || removing.concept || removing.question || removing.author || removing.label || 'este registro'}</strong>. Esta acción no se puede deshacer.</p>
          <div className="modal__foot">
            <button className="abtn abtn--soft" onClick={() => setRemoving(null)}>Cancelar</button>
            <button className="abtn abtn--danger" onClick={remove}><FiTrash2 /> Eliminar</button>
          </div>
        </Modal>
      )}

      {toast && <div className="toast" role="status"><FiCheck /> {toast}</div>}
    </div>
  );
}
