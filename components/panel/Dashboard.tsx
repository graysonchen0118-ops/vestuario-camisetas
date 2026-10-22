'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowRight, Shirt, ShoppingCart, MessageCircleQuestion, Star, Rocket, TrendingUp } from 'lucide-react';
import { useStore, useLoading } from '@/lib/store';
import { NOW, toMin, fromMin, STATUS, customerById } from '@/lib/mock/sales';
import { PRODUCTS, productImage } from '@/lib/mock/catalog';
import { eur, fmtDate, ago } from '@/lib/logic';
import { Sk, SkRows } from '@/components/ui';

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function Dashboard() {
  const { orders, carts, unanswered, reviews, changes, customers } = useStore();
  const loading = useLoading();
  const [range, setRange] = useState<14 | 30>(30);
  const nowMin = toMin(NOW);
  const data = useMemo(() => {
    const inRange = orders.filter((o) => o.status !== 'cancelado' && toMin(o.date) > nowMin - range * 1440 - 2000);
    const prev = orders.filter((o) => o.status !== 'cancelado' && toMin(o.date) <= nowMin - range * 1440 && toMin(o.date) > nowMin - 2 * range * 1440);
    const sales = inRange.reduce((a, o) => a + o.total, 0);
    const prevSales = prev.reduce((a, o) => a + o.total, 0);
    const lines = inRange.flatMap((o) => o.lines);
    const shirtLines = lines.filter((l) => PRODUCTS.find((p) => p.id === l.productId)?.kind === 'shirt');
    const printed = shirtLines.filter((l) => l.print).length;
    const days = Array.from({ length: range }, (_, i) => {
      const day = fromMin(nowMin - (range - 1 - i) * 1440).split(' ')[0];
      const os = inRange.filter((o) => o.date.startsWith(day));
      return { day, total: os.reduce((a, o) => a + o.total, 0), n: os.length };
    });
    const units = new Map<number, number>();
    for (const l of lines) units.set(l.productId, (units.get(l.productId) ?? 0) + l.qty);
    const top = [...units.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    return { sales, prevSales, count: inRange.length, avg: sales / Math.max(1, inRange.length), printedPct: (printed / Math.max(1, shirtLines.length)) * 100, days, top };
  }, [orders, range, nowMin]);
  const max = Math.max(...data.days.map((d) => d.total), 1);
  const recovered = carts.filter((c) => c.status === 'recuperado').length;
  const reminded = carts.filter((c) => c.reminders.length > 0).length;
  const delta = data.prevSales ? ((data.sales - data.prevSales) / data.prevSales) * 100 : 0;
  const recent = orders.slice(0, 6);

  return (
    <>
      <div className="main-head">
        <div>
          <h1>Resumen</h1>
          <div className="small muted">Hoy es {fmtDate(NOW)} · datos de la tienda en tiempo real</div>
        </div>
        <div className="seg">
          <button className={range === 14 ? 'on' : ''} onClick={() => setRange(14)}>14 días</button>
          <button className={range === 30 ? 'on' : ''} onClick={() => setRange(30)}>30 días</button>
        </div>
      </div>
      <div className="kpis">
        {loading ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="card kpi"><Sk w="60%" /><Sk h={28} w="80%" style={{ marginTop: 10 }} /></div>) : (
          <>
            <div className="card kpi enter"><span className="small muted">Ventas, {range} días</span><b>{eur(data.sales)}</b><span className="delta" style={{ color: delta >= 0 ? 'var(--ok)' : 'var(--bad)' }}><TrendingUp size={12} /> {delta >= 0 ? '+' : ''}{delta.toFixed(0)} % frente al periodo anterior</span></div>
            <div className="card kpi enter" style={{ animationDelay: '60ms' }}><span className="small muted">Pedidos</span><b>{data.count}</b><span className="tiny muted">Ticket medio {eur(data.avg)}</span></div>
            <div className="card kpi enter" style={{ animationDelay: '120ms' }}><span className="small muted">Camisetas personalizadas</span><b>{data.printedPct.toFixed(0)} %</b><span className="tiny muted">de las camisetas vendidas</span></div>
            <div className="card kpi enter" style={{ animationDelay: '180ms' }}><span className="small muted">Carritos recuperados</span><b>{recovered}</b><span className="tiny muted">de {reminded} con recordatorio</span></div>
            <div className="card kpi enter" style={{ animationDelay: '240ms' }}><span className="small muted">Preguntas sin respuesta</span><b>{unanswered.filter((q) => !q.answer).length}</b><span className="tiny muted">el asistente aprende al contestarlas</span></div>
          </>
        )}
      </div>

      <div className="cols" style={{ marginTop: 18 }}>
        <div className="card card-pad" style={{ gridColumn: 'span 1' }}>
          <div className="row between"><b>Ventas por día</b><span className="tiny muted">El último día es hoy</span></div>
          {loading ? <Sk h={190} style={{ marginTop: 10 }} /> : (
            <div className="chart" role="img" aria-label="Ventas por día">
              {data.days.map((d, i) => (
                <div key={d.day} className={i === data.days.length - 1 ? 'today' : ''} style={{ height: `${Math.max(3, (d.total / max) * 100)}%`, animationDelay: `${i * 15}ms` }} title={`${fmtDate(`${d.day} 00:00`)}: ${eur(d.total)}, ${d.n} pedidos`} />
              ))}
            </div>
          )}
        </div>
        <div className="card card-pad">
          <div className="row between"><b>Lo que más sale</b><span className="tiny muted">unidades, {range} días</span></div>
          {loading ? <SkRows rows={5} h={40} /> : (
            <div className="stack" style={{ gap: 8, marginTop: 10 }}>
              {data.top.map(([id, n]) => {
                const p = PRODUCTS.find((x) => x.id === id)!;
                return (
                  <Link key={id} href={`/producto/${p.slug}`} className="row" style={{ gap: 10 }}>
                    <img src={productImage(p)} alt="" width={40} height={40} style={{ width: 40, height: 40, objectFit: 'contain', borderRadius: 8, background: 'var(--surface-2)' }} />
                    <span className="small" style={{ flex: 1, lineHeight: 1.3 }}>{p.name}</span>
                    <b className="num">{n}</b>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="cols" style={{ marginTop: 18 }}>
        <div className="card card-pad">
          <div className="row between" style={{ marginBottom: 8 }}><b>Últimos pedidos</b><Link href="/panel/pedidos" className="btn btn-xs btn-ghost">Todos <ArrowRight size={13} /></Link></div>
          {loading ? <SkRows rows={6} h={36} /> : (
            <div className="table-wrap">
              <table className="table">
                <tbody>
                  {recent.map((o) => (
                    <tr key={o.ref}>
                      <td className="num strong">{o.ref}</td>
                      <td className="small">{customerById(o.customerId)?.name ?? customers.find((c) => c.id === o.customerId)?.name}</td>
                      <td><span className={`badge ${STATUS[o.status].tone}`}>{STATUS[o.status].label}</span></td>
                      <td className="small muted">{ago(o.date)}</td>
                      <td className="num strong" style={{ textAlign: 'right' }}>{eur(o.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="stack" style={{ gap: 12 }}>
          {[
            { href: '/panel/pedidos', icon: Shirt, t: plural(orders.filter((o) => o.status === 'pago_aceptado' || o.status === 'en_preparacion').length, 'pedido espera al taller', 'pedidos esperan al taller'), d: 'Cada uno con su hoja de taller y el texto exacto a estampar.' },
            { href: '/panel/carritos', icon: ShoppingCart, t: plural(carts.filter((c) => c.status === 'pendiente').length, 'carrito con correo sin recordar', 'carritos con correo sin recordar'), d: 'El primer aviso sale solo a las tres horas.' },
            { href: '/panel/opiniones', icon: Star, t: plural(reviews.filter((r) => r.status === 'pendiente').length, 'opinión por moderar', 'opiniones por moderar'), d: 'Las de 4 y 5 estrellas se pueden publicar solas.' },
            { href: '/panel/asistente', icon: MessageCircleQuestion, t: plural(unanswered.filter((q) => !q.answer).length, 'pregunta que el asistente no supo contestar', 'preguntas que el asistente no supo contestar'), d: 'La de Canarias se repite: contéstala una vez y la responde siempre.' },
            { href: '/panel/produccion', icon: Rocket, t: plural(changes.filter((c) => c.status !== 'probado').length, 'cambio por probar antes del paso a producción', 'cambios por probar antes del paso a producción'), d: 'Ningún pedido nuevo se pierde en el cambio.' },
          ].map((a, i) => (
            <Link key={a.href} href={a.href} className="card card-pad row enter" style={{ gap: 14, padding: 16, animationDelay: `${i * 60}ms` }}>
              <span className="band-icon"><a.icon size={19} /></span>
              <div style={{ flex: 1 }}><div className="strong small">{a.t}</div><div className="tiny muted">{a.d}</div></div>
              <ArrowRight size={16} className="muted" />
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
