'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Pin, PinOff, ArrowUp, ArrowDown, RefreshCw, Clock, Info, ExternalLink } from 'lucide-react';
import { useStore, useLoading } from '@/lib/store';
import { CATEGORIES, PRODUCTS, productImage, type CategorySlug } from '@/lib/mock/catalog';
import { sortCategory, fmtDate, soldIn } from '@/lib/logic';
import { SkRows, Spinner } from '@/components/ui';

export function CategoryOrder() {
  const { settings, setPins, setSortWindow, runSort, sortLog, toast } = useStore();
  const loading = useLoading();
  const [slug, setSlug] = useState<CategorySlug>('temporada-26-27');
  const [running, setRunning] = useState(false);
  const pins = settings.pins[slug] ?? [];
  const order = useMemo(() => sortCategory(slug, settings), [slug, settings]);
  const allTime = useMemo(() => sortCategory(slug, { ...settings, sortWindow: 0, pins: { ...settings.pins, [slug]: [] } }), [slug, settings]);
  const lastSeason = PRODUCTS.filter((p) => p.category === 'temporada-25-26').sort((a, b) => b.soldTotal - a.soldTotal)[0];

  const toggle = (id: number) => {
    const next = pins.includes(id) ? pins.filter((x) => x !== id) : [...pins, id];
    setPins(slug, next);
    toast(pins.includes(id) ? 'Desfijado, vuelve a ordenarse por ventas' : 'Fijado arriba');
  };
  const move = (id: number, dir: -1 | 1) => {
    const i = pins.indexOf(id);
    const j = i + dir;
    if (j < 0 || j >= pins.length) return;
    const next = [...pins];
    [next[i], next[j]] = [next[j], next[i]];
    setPins(slug, next);
  };
  const recalc = async () => {
    setRunning(true);
    const before = sortCategory(slug, settings).map((p) => p.id);
    const moved = before.filter((id, i) => order[i]?.id !== id).length + Math.floor(Math.random() * 2);
    await runSort(moved);
    setRunning(false);
    toast('Posiciones reescritas. Filtros, buscador y URLs siguen igual.');
  };

  return (
    <>
      <div className="main-head">
        <div>
          <h1>Orden de categorías</h1>
          <div className="small muted">Arriba los que fijes, en tu orden. Detrás, el resto por unidades vendidas.</div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={recalc} disabled={running}>{running ? <><Spinner /> Recalculando</> : <><RefreshCw size={15} /> Recalcular ahora</>}</button>
      </div>

      <div className="toolbar">
        <select className="select" value={slug} onChange={(e) => setSlug(e.target.value as CategorySlug)} aria-label="Categoría">
          {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </select>
        <div className="seg">
          <button className={settings.sortWindow === 90 ? 'on' : ''} onClick={() => setSortWindow(90)}>Ventas de 90 días</button>
          <button className={settings.sortWindow === 365 ? 'on' : ''} onClick={() => setSortWindow(365)}>De un año</button>
          <button className={settings.sortWindow === 0 ? 'on' : ''} onClick={() => setSortWindow(0)}>De siempre</button>
        </div>
        <Link href={`/categoria/${slug}`} target="_blank" className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }}>Ver la categoría <ExternalLink size={14} /></Link>
      </div>

      <div className="cols" style={{ alignItems: 'start' }}>
        <div className="card card-pad">
          <div className="row between" style={{ marginBottom: 12 }}>
            <b>Orden que ve el cliente</b>
            <span className="tiny muted">{pins.length} fijados · {order.length - pins.length} por ventas</span>
          </div>
          {loading ? <SkRows rows={7} h={66} /> : (
            <div className="stack" style={{ gap: 8 }}>
              {order.map((p, i) => {
                const pinned = pins.includes(p.id);
                return (
                  <div key={p.id} className={`pin-row ${pinned ? 'pinned' : ''}`}>
                    <span className="pos">{i + 1}</span>
                    <img src={productImage(p)} alt="" width={52} height={52} />
                    <div style={{ minWidth: 0 }}>
                      <div className="small strong" style={{ lineHeight: 1.3 }}>{p.name}</div>
                      <div className="tiny muted">{pinned ? 'Fijado a mano' : `${soldIn(p, settings.sortWindow)} uds. ${settings.sortWindow === 0 ? 'en total' : settings.sortWindow === 90 ? 'en 90 días' : 'en un año'}`}</div>
                    </div>
                    <div className="row pin-actions" style={{ gap: 4 }}>
                      {pinned && (
                        <>
                          <button className="icon-btn" style={{ width: 34, height: 34 }} onClick={() => move(p.id, -1)} aria-label="Subir"><ArrowUp size={15} /></button>
                          <button className="icon-btn" style={{ width: 34, height: 34 }} onClick={() => move(p.id, 1)} aria-label="Bajar"><ArrowDown size={15} /></button>
                        </>
                      )}
                      <button className={`btn btn-xs ${pinned ? 'btn-soft' : 'btn-ghost'}`} onClick={() => toggle(p.id)}>{pinned ? <><PinOff size={13} /> Desfijar</> : <><Pin size={13} /> Fijar</>}</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="stack" style={{ gap: 14 }}>
          <div className="card card-pad">
            <b className="row" style={{ gap: 8 }}><Info size={16} color="var(--accent)" /> Por qué 90 días y no de siempre</b>
            <p className="small muted" style={{ marginTop: 8 }}>
              Ordenada por ventas de siempre, la camiseta de la temporada pasada se queda arriba meses: la {lastSeason.name.replace('Camiseta ', '')} lleva {lastSeason.soldTotal} unidades en total y {lastSeason.sold90} en los últimos 90 días. Con la ventana de 90 días baja sola cuando deja de venderse, y la nueva sube sin tocar nada.
            </p>
            <p className="small muted" style={{ marginTop: 8 }}>PrestaShop ordena una categoría a mano o por un criterio automático, no por las dos cosas a la vez. Esto lo resuelve un módulo pequeño que cada noche reescribe la posición nativa, así que filtros, buscador y URLs no cambian.</p>
          </div>
          <div className="card card-pad">
            <b>Comparación en esta categoría</b>
            <div className="table-wrap" style={{ marginTop: 8 }}>
              <table className="table">
                <thead><tr><th>#</th><th>Con 90 días y fijados</th><th>Por ventas de siempre</th></tr></thead>
                <tbody>
                  {order.slice(0, 6).map((p, i) => (
                    <tr key={p.id}>
                      <td className="strong">{i + 1}</td>
                      <td className="small">{p.name.replace('Camiseta ', '').replace(' equipación', '')}</td>
                      <td className="small muted">{allTime[i]?.name.replace('Camiseta ', '').replace(' equipación', '')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="card card-pad">
            <b className="row" style={{ gap: 8 }}><Clock size={16} /> Tarea nocturna</b>
            <div className="small muted" style={{ marginTop: 4 }}>Se ejecuta cada noche a las 03:00. Última: {fmtDate(settings.lastSortRun, true)}.</div>
            <div className="stack" style={{ gap: 6, marginTop: 10 }}>
              {sortLog.map((l, i) => (
                <div key={i} className="row between tiny enter"><span>{fmtDate(l.at, true)}</span><span className="muted">{l.window ? `${l.window} días` : 'de siempre'} · {l.moved} {l.moved === 1 ? 'producto movido' : 'productos movidos'}</span></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
