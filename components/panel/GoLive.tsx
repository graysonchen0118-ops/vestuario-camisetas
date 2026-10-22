'use client';

import { useMemo, useState } from 'react';
import { Database, FileCode2, ArrowRight, Ban, Play, CheckCircle2, AlertTriangle, Plus, Pencil, Trash2, Link2, ShieldCheck, Clock, Circle } from 'lucide-react';
import { useStore, useLoading, wait } from '@/lib/store';
import { CHANGE_KIND, GO_LIVE_STEPS, type Change, type ChangeKind, type ChangeStatus } from '@/lib/mock/ops';
import { STAGING_COPY, toMin } from '@/lib/mock/sales';
import { PRODUCTS } from '@/lib/mock/catalog';
import { fmtDate } from '@/lib/logic';
import { Modal, SkRows, Spinner } from '@/components/ui';

const ST: Record<ChangeStatus, { t: string; tone: string }> = {
  pendiente: { t: 'Pendiente', tone: 'warn' },
  en_staging: { t: 'Hecho en staging', tone: 'info' },
  probado: { t: 'Probado', tone: 'ok' },
};
const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export function GoLive() {
  const { changes, orders, sinceCopy, newCustomers, rehearsals, checklist, saveChange, deleteChange, toggleCheck, logRehearsal, toast } = useStore();
  const loading = useLoading();
  const [filter, setFilter] = useState<'' | ChangeStatus>('');
  const [edit, setEdit] = useState<Partial<Change> | null>(null);
  const [run, setRun] = useState<{ step: number; log: string[]; error?: string } | null>(null);

  const heat = useMemo(() => {
    const grid = Array.from({ length: 7 }, () => Array(24).fill(0) as number[]);
    for (const o of orders) {
      const t = toMin(o.date);
      const d = new Date(t * 60000);
      const dow = (d.getUTCDay() + 6) % 7;
      grid[dow][d.getUTCHours()]++;
    }
    let best = { d: 0, h: 0, v: Infinity };
    grid.forEach((row, d) => row.forEach((v, h) => { if (v < best.v || (v === best.v && h >= 3 && h <= 6)) best = { d, h, v }; }));
    const max = Math.max(...grid.flat());
    return { grid, best, max };
  }, [orders]);

  const files = changes.filter((c) => c.kind !== 'ajuste').length;
  const manual = changes.filter((c) => c.kind === 'ajuste').length;
  const shown = changes.filter((c) => !filter || c.status === filter);
  const steps = [
    'Copia de producción de este momento, base y archivos',
    'Actualización de 1.7.8.11 a 8.2.8 con PHP 7.4',
    `Lista aplicada: ${files} cambios en archivos y ${manual} ajustes a mano`,
    'PHP sube a 8.1',
    'Compra de prueba con nombre, dorsal y gasto fijo',
    'URLs de producto y redirecciones comprobadas',
  ];

  const rehearse = async () => {
    const log: string[] = [];
    setRun({ step: 0, log });
    for (let i = 0; i < steps.length; i++) {
      setRun({ step: i, log: [...log] });
      await wait(650 + i * 120);
      if (i === 2) {
        const blocked = changes.find((c) => c.kind === 'modulo_propio' && c.status === 'pendiente');
        if (blocked) {
          const msg = `Para aquí: «${blocked.title}» sigue pendiente. Con un módulo propio sin adaptar no se sabe qué override falla en la 8.`;
          setRun({ step: i, log: [...log], error: msg });
          logRehearsal({ minutes: 18 + i * 4, issues: [msg], ok: false, ordersKept: sinceCopy.length });
          toast('Ensayo detenido, mira el motivo', 'bad');
          return;
        }
      }
      log.push(steps[i]);
    }
    const minutes = 14 + files + manual * 3;
    setRun({ step: steps.length, log });
    logRehearsal({ minutes, issues: [], ok: true, ordersKept: sinceCopy.length });
    toast(`Ensayo completo: ${minutes} minutos de cierre`);
  };

  return (
    <>
      <div className="main-head">
        <div><h1>Paso a producción</h1><div className="small muted">De 1.7.8.11 a 8.2.8 sin pisar ni un pedido de los que entren mientras tanto</div></div>
      </div>

      <div className="vs">
        <div className="db-card prod enter">
          <div className="row" style={{ gap: 8 }}><Database size={18} color="var(--ok)" /><b>Producción · 1.7.8.11</b></div>
          <div className="small muted" style={{ marginTop: 6 }}>Sigue vendiendo mientras se trabaja. Desde la copia del {fmtDate(STAGING_COPY)}:</div>
          <div className="row" style={{ gap: 24, marginTop: 10 }}>
            <div><b style={{ fontSize: 30, letterSpacing: '-0.02em' }} className="num">{sinceCopy.length}</b><div className="tiny muted">pedidos nuevos</div></div>
            <div><b style={{ fontSize: 30, letterSpacing: '-0.02em' }} className="num">{newCustomers}</b><div className="tiny muted">clientes nuevos</div></div>
          </div>
          <div className="notice ok" style={{ marginTop: 12 }}><ShieldCheck size={16} /><span>Se conservan todos: la base que se actualiza es esta, no la de staging.</span></div>
        </div>
        <div className="db-card stg enter" style={{ animationDelay: '80ms' }}>
          <div className="row" style={{ gap: 8 }}><FileCode2 size={18} color="var(--accent)" /><b>Staging · 8.2.5</b></div>
          <div className="small muted" style={{ marginTop: 6 }}>Aquí se hace y se prueba el trabajo. Lo que sube a producción:</div>
          <div className="stack" style={{ gap: 8, marginTop: 10 }}>
            <div className="row small" style={{ gap: 8 }}><CheckCircle2 size={16} color="var(--ok)" /> {files} cambios en archivos <ArrowRight size={14} className="muted" /> suben tal cual</div>
            <div className="row small" style={{ gap: 8 }}><CheckCircle2 size={16} color="var(--ok)" /> {manual} ajustes en la base <ArrowRight size={14} className="muted" /> se repiten a mano</div>
            <div className="row small" style={{ gap: 8, color: 'var(--bad)' }}><Ban size={16} /> La base de datos de staging <ArrowRight size={14} /> no sube nunca</div>
          </div>
        </div>
      </div>

      <div className="card card-pad" style={{ marginTop: 18 }}>
        <div className="row between wrapflex" style={{ gap: 10 }}>
          <div><b>Lista de cambios</b><div className="tiny muted">Todo lo que se toca queda aquí, con dónde vive y cómo viaja a producción</div></div>
          <div className="row">
            <select className="select" style={{ minHeight: 38 }} value={filter} onChange={(e) => setFilter(e.target.value as ChangeStatus)} aria-label="Filtrar">
              <option value="">Todos ({changes.length})</option>
              {(Object.keys(ST) as ChangeStatus[]).map((s) => <option key={s} value={s}>{ST[s].t} ({changes.filter((c) => c.status === s).length})</option>)}
            </select>
            <button className="btn btn-dark btn-sm" onClick={() => setEdit({ kind: 'tema', status: 'pendiente', title: '', where: '' })}><Plus size={15} /> Añadir</button>
          </div>
        </div>
        {loading ? <div style={{ marginTop: 12 }}><SkRows rows={6} /></div> : (
          <div className="table-wrap" style={{ marginTop: 10 }}>
            <table className="table">
              <thead><tr><th>Cambio</th><th>Tipo</th><th>Cómo viaja</th><th>Estado</th><th></th></tr></thead>
              <tbody>
                {shown.map((c) => (
                  <tr key={c.id} className="enter">
                    <td><div className="small strong">{c.title}</div><div className="tiny muted" style={{ fontFamily: c.kind === 'ajuste' ? undefined : 'ui-monospace, monospace' }}>{c.where}</div></td>
                    <td className="small">{CHANGE_KIND[c.kind].label}</td>
                    <td className="small muted">{CHANGE_KIND[c.kind].travels}</td>
                    <td>
                      <select className="select" style={{ minHeight: 34, padding: '4px 10px', fontSize: 13, width: 'auto' }} value={c.status} onChange={async (e) => { await saveChange({ ...c, status: e.target.value as ChangeStatus }); toast(`«${c.title}»: ${ST[e.target.value as ChangeStatus].t.toLowerCase()}`); }} aria-label="Estado">
                        {(Object.keys(ST) as ChangeStatus[]).map((s) => <option key={s} value={s}>{ST[s].t}</option>)}
                      </select>
                    </td>
                    <td>
                      <div className="row" style={{ gap: 2 }}>
                        <button className="icon-btn" style={{ width: 34, height: 34 }} onClick={() => setEdit(c)} aria-label="Editar"><Pencil size={15} /></button>
                        <button className="icon-btn" style={{ width: 34, height: 34 }} onClick={async () => { await deleteChange(c.id); toast('Cambio quitado de la lista', 'info'); }} aria-label="Quitar"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="cols" style={{ marginTop: 18, alignItems: 'start' }}>
        <div className="card card-pad">
          <div className="row between"><b>Ensayo sobre una copia de hoy</b>
            <button className="btn btn-primary btn-sm" onClick={rehearse} disabled={!!run && run.step < steps.length && !run.error}>
              {run && run.step < steps.length && !run.error ? <><Spinner /> Ensayando</> : <><Play size={15} /> Lanzar ensayo</>}
            </button>
          </div>
          <p className="tiny muted" style={{ marginTop: 4 }}>Mide cuánto tiene que estar cerrada la tienda el día real. Si un módulo propio está sin adaptar, el ensayo se para ahí.</p>
          {run && (
            <div className="timeline" style={{ marginTop: 12 }}>
              {steps.map((s, i) => {
                const done = i < run.step || run.step === steps.length;
                const now = i === run.step && !run.error && run.step < steps.length;
                const fail = run.error && i === run.step;
                return (
                  <div key={s} className={`tl ${done ? 'done' : now ? 'now' : ''}`}>
                    <i style={fail ? { background: 'var(--bad-soft)', color: 'var(--bad)' } : undefined}>{fail ? <AlertTriangle size={12} /> : done ? <CheckCircle2 size={13} /> : now ? <Spinner size={11} /> : <Circle size={10} />}</i>
                    <div className="small" style={{ fontWeight: done || now ? 700 : 500, color: fail ? 'var(--bad)' : undefined }}>{s}</div>
                  </div>
                );
              })}
            </div>
          )}
          {run?.error && <div className="notice bad enter"><AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} /><span>{run.error} Márcalo como probado en la lista y vuelve a ensayar.</span></div>}
          {rehearsals.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div className="label" style={{ marginBottom: 6 }}>Ensayos</div>
              {rehearsals.map((r) => (
                <div key={r.id} className="row between small enter" style={{ padding: '6px 0', borderBottom: '1px solid var(--line)', gap: 10 }}>
                  <span>Ensayo {r.id} · {fmtDate(r.at, true)}</span>
                  <span className={`badge ${r.ok ? 'ok' : 'bad'}`}>{r.ok ? `${r.minutes} min de cierre · ${r.ordersKept} pedidos conservados` : 'Detenido'}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card card-pad">
          <b className="row" style={{ gap: 8 }}><Clock size={16} /> La hora con menos pedidos</b>
          <p className="tiny muted" style={{ marginTop: 4 }}>Pedidos por día y hora de los últimos 75 días. El cierre se hace en la casilla más vacía.</p>
          <div style={{ marginTop: 12 }}>
            {heat.grid.map((row, d) => (
              <div key={d} className="row" style={{ gap: 6, marginBottom: 3 }}>
                <span className="tiny muted" style={{ width: 28 }}>{DAYS[d]}</span>
                <div className="heat" style={{ flex: 1 }}>
                  {row.map((v, h) => (
                    <div key={h} className={heat.best.d === d && heat.best.h === h ? 'pick' : ''} title={`${DAYS[d]} ${h}:00, ${v} pedidos`} style={{ background: `rgba(47, 91, 255, ${0.06 + (v / heat.max) * 0.9})` }} />
                  ))}
                </div>
              </div>
            ))}
            <div className="row tiny muted" style={{ marginLeft: 34, justifyContent: 'space-between' }}><span>0 h</span><span>6 h</span><span>12 h</span><span>18 h</span><span>23 h</span></div>
          </div>
          <div className="notice info" style={{ marginTop: 12 }}><Clock size={16} /><span>Recomendado: <b>{DAYS[heat.best.d].toLowerCase()} de {heat.best.h}:00 a {heat.best.h + 1}:00</b>, con {heat.best.v} pedidos en todo el periodo.</span></div>
        </div>
      </div>

      <div className="cols" style={{ marginTop: 18, alignItems: 'start' }}>
        <div className="card card-pad">
          <b>El día del cambio</b>
          <div className="stack" style={{ gap: 8, marginTop: 12 }}>
            {GO_LIVE_STEPS.map((s, i) => (
              <button key={s.id} className={`check-item ${checklist[s.id] ? 'on' : ''}`} onClick={() => toggleCheck(s.id)}>
                <span className="check-box">{checklist[s.id] && <CheckCircle2 size={15} />}</span>
                <span><b className="small">{i + 1}. {s.title}</b><br /><span className="tiny muted">{s.detail}</span></span>
              </button>
            ))}
          </div>
        </div>
        <div className="card card-pad">
          <b className="row" style={{ gap: 8 }}><Link2 size={16} /> URLs que Google ya conoce</b>
          <p className="small muted" style={{ marginTop: 6 }}>En PrestaShop el número del producto va dentro de la URL. Como lo que se actualiza es la base de producción, los números no cambian y no hace falta ninguna redirección.</p>
          <div className="stack" style={{ gap: 6, marginTop: 10 }}>
            {PRODUCTS.slice(0, 6).map((p) => (
              <div key={p.id} className="row tiny" style={{ gap: 8 }}>
                <CheckCircle2 size={14} color="var(--ok)" />
                <span style={{ fontFamily: 'ui-monospace, monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>/{p.slug}</span>
              </div>
            ))}
          </div>
          <div className="notice ok" style={{ marginTop: 10 }}><CheckCircle2 size={16} /><span>{PRODUCTS.length} de {PRODUCTS.length} URLs de producto iguales en 8.2.8, 0 redirecciones necesarias.</span></div>
        </div>
      </div>

      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Editar cambio' : 'Añadir cambio'}>
        {edit && (
          <form className="stack" style={{ gap: 12 }} onSubmit={async (e) => { e.preventDefault(); if (!edit.title?.trim()) return; await saveChange(edit as Change); setEdit(null); toast(edit.id ? 'Cambio actualizado' : 'Añadido a la lista'); }}>
            <div className="field"><label htmlFor="ch-t">Qué se cambia</label><input id="ch-t" className="input" value={edit.title ?? ''} onChange={(e) => setEdit({ ...edit, title: e.target.value })} required /></div>
            <div className="field"><label htmlFor="ch-w">Dónde vive</label><input id="ch-w" className="input" value={edit.where ?? ''} onChange={(e) => setEdit({ ...edit, where: e.target.value })} placeholder="Archivo, módulo o pantalla del back office" /></div>
            <div className="form-grid">
              <div className="field"><label htmlFor="ch-k">Tipo</label>
                <select id="ch-k" className="select" value={edit.kind} onChange={(e) => setEdit({ ...edit, kind: e.target.value as ChangeKind })}>
                  {(Object.keys(CHANGE_KIND) as ChangeKind[]).map((k) => <option key={k} value={k}>{CHANGE_KIND[k].label}</option>)}
                </select>
              </div>
              <div className="field"><label htmlFor="ch-s">Estado</label>
                <select id="ch-s" className="select" value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value as ChangeStatus })}>
                  {(Object.keys(ST) as ChangeStatus[]).map((s) => <option key={s} value={s}>{ST[s].t}</option>)}
                </select>
              </div>
            </div>
            <div className="hint">{edit.kind ? CHANGE_KIND[edit.kind as ChangeKind].travels : ''}</div>
            <div className="row" style={{ justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEdit(null)}>Cancelar</button>
              <button className="btn btn-primary btn-sm">Guardar</button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
