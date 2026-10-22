'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Ruler, AlertTriangle, Truck, Minus, Plus, ShoppingBag, BadgeCheck, Check, MessageSquareQuote, Store } from 'lucide-react';
import { CATEGORIES, PRODUCTS, clubById, productById, productImage, photo, PHOTOS, PRINT_PRICE, PATCH_PRICE, SIZE_GUIDE, recommendSize, type Product } from '@/lib/mock/catalog';
import { lineUnit } from '@/lib/mock/sales';
import { useStore } from '@/lib/store';
import { eur, fmtDate, deliveryWindow, avgRating } from '@/lib/logic';
import { Configurator } from '@/components/three';
import { Modal, Stars, Spinner, Reveal } from '@/components/ui';
import { ProductCard } from './ProductCard';

const clean = (v: string) => v.toUpperCase().replace(/[^A-ZÁÉÍÓÚÜÑ .'-]/g, '').replace(/\s{2,}/g, ' ').slice(0, 12);

export function SizeGuide({ open, onClose, kids, onPick }: { open: boolean; onClose: () => void; kids: boolean; onPick?: (s: string) => void }) {
  const [h, setH] = useState(kids ? 128 : 176);
  const [w, setW] = useState(kids ? 28 : 74);
  const [fit, setFit] = useState<'ajustada' | 'holgada'>('ajustada');
  const rows = kids ? SIZE_GUIDE.kids : SIZE_GUIDE.adult;
  const rec = recommendSize(h, w, fit, kids);
  return (
    <Modal open={open} onClose={onClose} title="Guía de tallas" wide>
      <div className="cols" style={{ gap: 22 }}>
        <div>
          <div className="label" style={{ marginBottom: 8 }}>Medidas de la prenda, en centímetros</div>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Talla</th><th>Ancho de pecho</th><th>Largo</th><th>Altura</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.size} style={r.size === rec ? { background: 'var(--accent-soft)' } : undefined}>
                    <td className="strong">{r.size}</td><td>{r.chest}</td><td>{r.length}</td><td className="small">{r.height}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="tiny muted" style={{ marginTop: 8 }}>El ancho se mide de axila a axila con la camiseta en plano. El corte de esta temporada es ajustado.</p>
        </div>
        <div className="card card-pad" style={{ background: '#f6f8ff', borderColor: '#d8e0ff' }}>
          <div className="strong">Tu talla en diez segundos</div>
          <div className="form-grid" style={{ marginTop: 12 }}>
            <div className="field"><label htmlFor="g-h">Altura, cm</label><input id="g-h" className="input" type="number" value={h} onChange={(e) => setH(Number(e.target.value))} /></div>
            {!kids && <div className="field"><label htmlFor="g-w">Peso, kg</label><input id="g-w" className="input" type="number" value={w} onChange={(e) => setW(Number(e.target.value))} /></div>}
          </div>
          <div className="seg" style={{ marginTop: 12 }}>
            <button className={fit === 'ajustada' ? 'on' : ''} onClick={() => setFit('ajustada')}>Como el jugador</button>
            <button className={fit === 'holgada' ? 'on' : ''} onClick={() => setFit('holgada')}>Más holgada</button>
          </div>
          <div className="row" style={{ marginTop: 16, gap: 14 }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: 'var(--grad)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 22, fontWeight: 800 }} key={rec}>{rec}</div>
            <div className="small">Te recomendamos la <b>{rec}</b>. Quien duda entre dos tallas suele acertar con la mayor, y con una personalizada no hay cambio.</div>
          </div>
          {onPick && <button className="btn btn-dark btn-block" style={{ marginTop: 14 }} onClick={() => { onPick(rec); onClose(); }}>Elegir la {rec}</button>}
        </div>
      </div>
    </Modal>
  );
}

export function ProductView({ productId }: { productId: number }) {
  const p = productById(productId)!;
  const club = clubById(p.clubId);
  const cat = CATEGORIES.find((c) => c.slug === p.category)!;
  const { stock, addToCart, reviews, toast } = useStore();
  const kids = p.category === 'infantil';
  const [size, setSize] = useState('');
  const [qty, setQty] = useState(1);
  const [wantPrint, setWantPrint] = useState(p.personalizable);
  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [patch, setPatch] = useState(false);
  const [checked, setChecked] = useState(false);
  const [view, setView] = useState<'front' | 'back'>('front');
  const [spin, setSpin] = useState(0);
  const [ready, setReady] = useState(false);
  const [adding, setAdding] = useState(false);
  const [guide, setGuide] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [img, setImg] = useState<'3d' | 'f' | 'b' | 'foto'>('3d');

  useEffect(() => {
    const qs = new URLSearchParams(window.location.search);
    const n = qs.get('nombre');
    const d = qs.get('dorsal');
    if (n || d) {
      setName(clean(n ?? ''));
      setNumber((d ?? '').replace(/\D/g, '').slice(0, 2));
      setView('back');
    }
    if (window.location.hash === '#tallas') setGuide(true);
  }, []);

  const printing = p.personalizable && wantPrint && (name.trim() !== '' || number !== '');
  const print = useMemo(() => (p.personalizable && wantPrint ? { name, number, patch } : null), [p.personalizable, wantPrint, name, number, patch]);
  const unit = lineUnit(p, printing ? { name, number, patch } : undefined);
  const win = deliveryWindow(printing ? [{ productId: p.id, size: 'M', qty: 1, unit, print: { name, number, patch } }] : [], 'Correos');
  const r = avgRating(p.id, reviews);
  const productReviews = reviews.filter((x) => x.productId === p.id && x.status === 'publicada');
  const [rFilter, setRFilter] = useState(0);
  const [rShown, setRShown] = useState(4);
  const filtered = productReviews.filter((x) => !rFilter || x.rating === rFilter);
  const related = PRODUCTS.filter((x) => x.id !== p.id && (x.clubId === p.clubId || x.category === p.category)).slice(0, 4);

  const add = async () => {
    const e: Record<string, string> = {};
    if (!size) e.size = 'Elige una talla.';
    if (printing && name.trim().length === 1) e.name = 'El nombre necesita al menos dos letras.';
    if (printing && !checked) e.checked = 'Confirma que has revisado el texto: se estampa tal cual y no admite devolución.';
    setErrors(e);
    if (Object.keys(e).length) {
      toast(Object.values(e)[0], 'bad');
      return;
    }
    setAdding(true);
    setSpin((s) => s + 1);
    await addToCart({ productId: p.id, size, qty, unit, print: printing ? { name: name.trim(), number, patch } : undefined });
    setAdding(false);
    toast(printing ? `Añadida con ${name || 'el dorsal'} ${number}` : 'Añadida al carrito');
  };

  return (
    <div className="wrap">
      <nav className="row small muted" style={{ gap: 6, paddingTop: 20, flexWrap: 'wrap' }} aria-label="Ruta">
        <Link href="/">Inicio</Link><ChevronRight size={14} /><Link href={`/categoria/${cat.slug}`}>{cat.name}</Link><ChevronRight size={14} /><span style={{ color: 'var(--ink)' }}>{p.name}</span>
      </nav>
      <div className="pdp">
        <div>
          <div className="pdp-stage">
            {p.kind === 'shirt' ? (
              <>
                {img === '3d' ? (
                  <>
                    {!ready && <div className="fallback"><img src={productImage(p, view === 'back' ? 'b' : 'f')} alt={p.name} width={520} height={520} /></div>}
                    <Configurator kit={p.kit!} print={print} view={view} spin={spin} onReady={() => setReady(true)} onDragView={setView} />
                  </>
                ) : (
                  <div className="fallback"><img src={img === 'foto' ? photo(kids ? PHOTOS.ninoDorsal11 : PHOTOS.dorsal16, 900, 900) : productImage(p, img)} alt={p.name} width={520} height={520} style={img === 'foto' ? { width: '100%', height: '100%', objectFit: 'cover' } : undefined} /></div>
                )}
                {img === '3d' && (
                  <div className="stage-tools">
                    <div className="seg" role="tablist" aria-label="Lado">
                      <button className={view === 'front' ? 'on' : ''} onClick={() => setView('front')}>Delante</button>
                      <button className={view === 'back' ? 'on' : ''} onClick={() => setView('back')}>Espalda</button>
                    </div>
                    <span className="badge" style={{ background: 'rgba(255,255,255,.9)', color: 'var(--ink-2)' }}>Arrastra para girarla</span>
                  </div>
                )}
              </>
            ) : (
              <div className="fallback"><img src={productImage(p)} alt={p.name} width={720} height={720} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
            )}
          </div>
          {p.kind === 'shirt' && (
            <div className="thumbs">
              {(['3d', 'f', 'b', 'foto'] as const).map((k) => (
                <button key={k} className={img === k ? 'on' : ''} onClick={() => setImg(k)} aria-label={k === '3d' ? 'Vista 3D' : k === 'f' ? 'Delante' : k === 'b' ? 'Espalda' : 'Foto'}>
                  {k === '3d' ? <span className="strong small" style={{ display: 'grid', placeItems: 'center', height: '100%', background: 'var(--grad)', color: '#fff' }}>3D</span>
                    : <img src={k === 'foto' ? photo(kids ? PHOTOS.ninoDorsal11 : PHOTOS.dorsal16, 160, 160) : productImage(p, k)} alt="" width={74} height={74} style={k === 'foto' ? { objectFit: 'cover' } : undefined} />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="stack" style={{ gap: 18 }}>
          <div>
            {club && <div className="eyebrow">{club.name}</div>}
            <h1 className="h-lg" style={{ marginTop: 6, fontSize: 'clamp(24px, 3vw, 32px)' }}>{p.name}</h1>
            <a href="#opiniones" className="row small" style={{ gap: 8, marginTop: 8 }}>
              {r.count ? <><Stars value={r.avg} /> <span className="muted">{r.avg.toFixed(1).replace('.', ',')} · {r.count} opiniones</span></> : <span className="muted">Aún sin opiniones</span>}
            </a>
          </div>
          <div className="row" style={{ alignItems: 'baseline', gap: 10 }}>
            <span className="price" style={{ fontSize: 28 }}>{eur(unit)}</span>
            {p.compareAt && <s className="muted">{eur(p.compareAt + (unit - p.price))}</s>}
            {printing && <span className="small muted">incluye la personalización</span>}
          </div>
          <p className="muted">{p.description}</p>

          <div>
            <div className="row between" style={{ marginBottom: 8 }}>
              <span className="label">Talla {size && <b style={{ color: 'var(--ink)' }}>{size}</b>}</span>
              <button className="btn btn-xs btn-soft" onClick={() => setGuide(true)}><Ruler size={14} /> Guía de tallas</button>
            </div>
            <div className="size-grid">
              {p.sizes.map((s) => {
                const left = stock[p.id]?.[s] ?? 0;
                return (
                  <button key={s} className={`chip ${size === s ? 'on' : ''} ${left === 0 ? 'disabled' : ''}`} disabled={left === 0} onClick={() => { setSize(s); setErrors((e) => ({ ...e, size: '' })); }} title={left === 0 ? 'Agotada' : left < 4 ? `Quedan ${left}` : undefined}>
                    {s}
                  </button>
                );
              })}
            </div>
            {errors.size && <div className="err" style={{ marginTop: 6 }}>{errors.size}</div>}
            {size && (stock[p.id]?.[size] ?? 0) < 4 && <div className="tiny" style={{ color: 'var(--warn)', marginTop: 6, fontWeight: 700 }}>Quedan {stock[p.id]?.[size]} en talla {size}</div>}
          </div>

          {p.personalizable && (
            <div className="personal">
              <label className="row between" style={{ cursor: 'pointer' }}>
                <span className="strong">Personalizar con nombre y dorsal <span className="muted small">+{eur(PRINT_PRICE)}</span></span>
                <input type="checkbox" checked={wantPrint} onChange={(e) => { setWantPrint(e.target.checked); if (e.target.checked) setView('back'); }} />
              </label>
              {wantPrint && (
                <div className="stack enter" style={{ gap: 12, marginTop: 12 }}>
                  <div className="personal-grid">
                    <div className="field">
                      <label htmlFor="pr-n">Nombre</label>
                      <input id="pr-n" className={`input ${errors.name ? 'invalid' : ''}`} value={name} placeholder="Por ejemplo LUCÍA" onFocus={() => setView('back')} onChange={(e) => { setName(clean(e.target.value)); setChecked(false); }} />
                      <span className="hint">{name.length}/12 · mayúsculas, tildes y Ñ</span>
                    </div>
                    <div className="field">
                      <label htmlFor="pr-d">Dorsal</label>
                      <input id="pr-d" className="input" inputMode="numeric" value={number} placeholder="10" onFocus={() => setView('back')} onChange={(e) => { setNumber(e.target.value.replace(/\D/g, '').slice(0, 2)); setChecked(false); }} />
                      <span className="hint">0 a 99</span>
                    </div>
                  </div>
                  <label className="row small" style={{ gap: 8, cursor: 'pointer' }}>
                    <input type="checkbox" checked={patch} onChange={(e) => { setPatch(e.target.checked); setView('front'); }} /> Parche de liga en la manga <span className="muted">+{eur(PATCH_PRICE)}</span>
                  </label>
                  {printing && (
                    <div className={`notice ${errors.checked ? 'bad' : 'warn'}`}>
                      <AlertTriangle size={17} style={{ flexShrink: 0, marginTop: 1 }} />
                      <div>
                        Se estampa exactamente <b>«{name || '(sin nombre)'}{number ? ` ${number}` : ''}»</b>, con esas mayúsculas, tildes y espacios. Las camisetas personalizadas no admiten devolución.
                        <label className="row" style={{ gap: 8, marginTop: 8, cursor: 'pointer', fontWeight: 700 }}>
                          <input type="checkbox" checked={checked} onChange={(e) => { setChecked(e.target.checked); setErrors((x) => ({ ...x, checked: '' })); }} /> He revisado el nombre y el dorsal
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="row" style={{ gap: 12 }}>
            <div className="qty">
              <button aria-label="Menos" onClick={() => setQty(Math.max(1, qty - 1))}><Minus size={16} /></button>
              <span>{qty}</span>
              <button aria-label="Más" onClick={() => setQty(Math.min(9, qty + 1))}><Plus size={16} /></button>
            </div>
            <button className="btn btn-primary btn-wrap" style={{ flex: 1, minHeight: 50 }} onClick={add} disabled={adding}>
              {adding ? <><Spinner /> Añadiendo</> : <><ShoppingBag size={18} /> Añadir al carrito · {eur(unit * qty)}</>}
            </button>
          </div>
          <div className="notice info">
            <Truck size={17} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>Pidiendo hoy, con Correos la recibes entre el <b>{win.start}</b> y el <b>{win.end}</b>{win.printed ? ', contando los dos días del taller' : ''}. Con SEUR, uno o dos días antes.</span>
          </div>
          {p.details.length > 0 && (
            <ul className="small muted" style={{ margin: 0, paddingLeft: 18, lineHeight: 1.9 }}>
              {p.details.map((d) => <li key={d}>{d}</li>)}
            </ul>
          )}
          <div className="row small muted" style={{ gap: 8 }}><Store size={15} /> Referencia {p.id} · {p.season ? `Temporada ${p.season}` : 'Accesorio'}</div>
        </div>
      </div>

      <section id="opiniones" className="section" style={{ paddingTop: 12 }}>
        <Reveal>
          <div className="section-head">
            <div>
              <div className="eyebrow">Opiniones</div>
              <h2 className="h-lg" style={{ marginTop: 6 }}>Qué tal queda</h2>
            </div>
          </div>
        </Reveal>
        {productReviews.length === 0 ? (
          <div className="card card-pad row" style={{ gap: 14 }}>
            <MessageSquareQuote size={22} className="muted" />
            <span className="small muted">Todavía no hay opiniones de esta camiseta. Quien la compra recibe una invitación a opinar siete días después de la entrega.</span>
          </div>
        ) : (
          <div className="cols" style={{ alignItems: 'start' }}>
            <div className="card card-pad">
              <div className="row" style={{ gap: 14 }}>
                <b style={{ fontSize: 44, letterSpacing: '-0.03em' }}>{r.avg.toFixed(1).replace('.', ',')}</b>
                <div><Stars value={r.avg} size={18} /><div className="small muted">{r.count} opiniones de compras verificadas</div></div>
              </div>
              <div className="stack" style={{ gap: 8, marginTop: 16 }}>
                {[5, 4, 3, 2, 1].map((n) => {
                  const c = productReviews.filter((x) => x.rating === n).length;
                  return (
                    <button key={n} className="row" style={{ gap: 10, border: 0, background: 'none', padding: 0, opacity: rFilter && rFilter !== n ? 0.45 : 1 }} onClick={() => setRFilter(rFilter === n ? 0 : n)}>
                      <span className="small" style={{ width: 52, textAlign: 'left' }}>{n} estrellas</span>
                      <div className="bar" style={{ flex: 1 }}><span style={{ width: `${(c / productReviews.length) * 100}%` }} /></div>
                      <span className="small muted" style={{ width: 22, textAlign: 'right' }}>{c}</span>
                    </button>
                  );
                })}
              </div>
              {rFilter > 0 && <button className="btn btn-xs btn-ghost" style={{ marginTop: 12 }} onClick={() => setRFilter(0)}>Ver todas</button>}
            </div>
            <div>
              {filtered.slice(0, rShown).map((x) => (
                <div key={x.id} className="review enter">
                  <div className="row between"><Stars value={x.rating} /><span className="tiny muted">{fmtDate(x.date)}</span></div>
                  <div className="strong" style={{ marginTop: 6 }}>{x.title}</div>
                  <p className="small" style={{ marginTop: 4, color: 'var(--ink-2)' }}>{x.body}</p>
                  <div className="row tiny muted" style={{ gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
                    <span>{x.author}, {x.city}</span>
                    {x.size && <span>Talla comprada: {x.size}</span>}
                    {x.verified && <span className="row" style={{ gap: 4, color: 'var(--ok)', fontWeight: 700 }}><BadgeCheck size={13} /> Compra verificada</span>}
                  </div>
                  {x.reply && <div className="notice info" style={{ marginTop: 10 }}><Check size={15} /><span><b>Respuesta de la tienda:</b> {x.reply}</span></div>}
                </div>
              ))}
              {filtered.length > rShown && <button className="btn btn-ghost btn-sm" style={{ marginTop: 14 }} onClick={() => setRShown(rShown + 4)}>Ver más opiniones</button>}
              {filtered.length === 0 && <p className="small muted" style={{ padding: '18px 0' }}>Ninguna opinión con {rFilter} estrellas.</p>}
            </div>
          </div>
        )}
      </section>

      {related.length > 0 && (
        <section className="section" style={{ paddingTop: 8 }}>
          <div className="section-head"><h2 className="h-lg">También te puede gustar</h2></div>
          <div className="products">{related.map((x: Product, i) => <ProductCard key={x.id} p={x} index={i} />)}</div>
        </section>
      )}
      <SizeGuide open={guide} onClose={() => setGuide(false)} kids={kids} onPick={p.sizes.includes('M') || kids ? (s) => setSize(s) : undefined} />
    </div>
  );
}
