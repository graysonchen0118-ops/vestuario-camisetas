'use client';

import { useMemo, useState } from 'react';
import { Search, MonitorCog, FolderOpen, Wrench, SearchX } from 'lucide-react';
import { GUIDE, type GuideRow } from '@/lib/mock/ops';
import { plain } from '@/lib/logic';
import { Empty } from '@/components/ui';

const META: Record<GuideRow['where'], { icon: typeof MonitorCog; tone: string; text: string }> = {
  'Back office': { icon: MonitorCog, tone: 'ok', text: 'Lo cambias tú desde el panel' },
  FTP: { icon: FolderOpen, tone: 'warn', text: 'Archivo, mejor con copia antes' },
  Técnico: { icon: Wrench, tone: 'bad', text: 'Pide intervención técnica' },
};

export function Guide() {
  const [q, setQ] = useState('');
  const [where, setWhere] = useState<'' | GuideRow['where']>('');
  const rows = useMemo(() => GUIDE.filter((r) => (!where || r.where === where) && (!q || plain(`${r.what} ${r.how}`).includes(plain(q)))), [q, where]);
  return (
    <>
      <div className="main-head">
        <div><h1>Qué puedes cambiar tú</h1><div className="small muted">La guía que queda al terminar: qué se toca desde el back office, qué por FTP y qué pide a alguien técnico</div></div>
      </div>
      <div className="kpis" style={{ marginBottom: 16 }}>
        {(Object.keys(META) as GuideRow['where'][]).map((w) => {
          const M = META[w];
          return (
            <button key={w} className={`card kpi row ${where === w ? '' : ''}`} style={{ gap: 12, textAlign: 'left', borderColor: where === w ? 'var(--accent)' : undefined }} onClick={() => setWhere(where === w ? '' : w)}>
              <span className="band-icon"><M.icon size={19} /></span>
              <span><b style={{ fontSize: 22, margin: 0 }}>{GUIDE.filter((r) => r.where === w).length}</b><span className="small muted">{w} · {M.text}</span></span>
            </button>
          );
        })}
      </div>
      <div className="toolbar">
        <div style={{ position: 'relative', flex: '1 1 260px' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} className="muted" />
          <input className="input" style={{ paddingLeft: 36, width: '100%' }} placeholder="Correos, tasa, menú..." value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar en la guía" />
        </div>
        {where && <button className="btn btn-ghost btn-sm" onClick={() => setWhere('')}>Ver todo</button>}
      </div>
      <div className="card" style={{ padding: 6 }}>
        {rows.length === 0 ? <Empty icon={<SearchX size={22} />} title="Nada con esa búsqueda" /> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Qué</th><th>Dónde</th><th>Cómo</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.what} className="enter">
                    <td className="small strong">{r.what}</td>
                    <td><span className={`badge ${META[r.where].tone}`}>{r.where}</span></td>
                    <td className="small muted">{r.how}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
