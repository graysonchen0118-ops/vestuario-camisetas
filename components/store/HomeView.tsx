'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowRight, PenLine, Rotate3d, Stamp, Truck, ReceiptText, ShieldCheck, MessageCircle, BadgeCheck } from 'lucide-react';
import { CATEGORIES, CLUBS, photo, PHOTOS, PRODUCTS, productById } from '@/lib/mock/catalog';
import { useStore } from '@/lib/store';
import { featured, eur, fmtDate } from '@/lib/logic';
import { HeroScene } from '@/components/three';
import { ProductCard } from './ProductCard';
import { Reveal, Stars, Tilt } from '@/components/ui';

const club = (id: string) => CLUBS.find((c) => c.id === id)!;
const HERO_SHIRTS = [
  { kit: club('marismas').home, name: 'NORA', number: '11' },
  { kit: club('costa-calma').home, name: 'ABUELO', number: '14' },
  { kit: club('valdemora').home, name: '', number: '' },
  { kit: club('galerna').home, name: 'LUCÍA', number: '7' },
  { kit: club('almendral').away, name: 'MARCOS', number: '9' },
];

const clean = (v: string) => v.toUpperCase().replace(/[^A-ZÁÉÍÓÚÜÑ .'-]/g, '').slice(0, 12);

export function HomeView() {
  const { settings, reviews } = useStore();
  const [name, setName] = useState('');
  const [num, setNum] = useState('');
  const [ready, setReady] = useState(false);
  const top = featured(settings);
  const published = reviews.filter((r) => r.status === 'publicada');
  const avg = published.reduce((a, r) => a + r.rating, 0) / Math.max(1, published.length);
  const latest = published.filter((r) => r.rating >= 4).slice(0, 4);
  const center = useMemo(() => ({ name, number: num }), [name, num]);
  const heroProduct = PRODUCTS.find((p) => p.clubId === 'valdemora' && p.category === 'temporada-26-27')!;
  const href = `/producto/${heroProduct.slug}?nombre=${encodeURIComponent(name)}&dorsal=${encodeURIComponent(num)}`;

  return (
    <>
      <section className="hero">
        <div className="wrap hero-grid">
          <div className="hero-copy enter">
            <span className="badge volt">Temporada 26/27 ya disponible</span>
            <h1 className="h-xl" style={{ marginTop: 18 }}>Tu nombre.<br />Tu dorsal.<br /><span style={{ background: 'linear-gradient(90deg,#9fb3ff,#d6ff5c)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>Tu camiseta.</span></h1>
            <p className="lead-text">Escribe el nombre y el número y míralo en la camiseta antes de pagar. Se estampa tal cual en nuestro taller y sale en dos días laborables.</p>
            <form className="hero-form" onSubmit={(e) => e.preventDefault()}>
              <input className="input" placeholder="Nombre en la espalda" value={name} onChange={(e) => setName(clean(e.target.value))} aria-label="Nombre" maxLength={12} />
              <input className="input" placeholder="Dorsal" inputMode="numeric" value={num} onChange={(e) => setNum(e.target.value.replace(/\D/g, '').slice(0, 2))} aria-label="Dorsal" />
              <Link href={href} className="btn btn-primary" style={{ gridColumn: '1 / -1' }}>Llevarlo a la camiseta del Valdemora <ArrowRight size={17} /></Link>
            </form>
            <div className="hero-stats">
              <div><b>Desde 2012</b><span>vendiendo camisetas online</span></div>
              <div><b className="row" style={{ gap: 6 }}>{avg.toFixed(1).replace('.', ',')} <Stars value={avg} size={15} /></b><span>{published.length} opiniones verificadas</span></div>
              <div><b>24 a 48 h</b><span>con SEUR en península</span></div>
            </div>
          </div>
          <div className="hero-stage">
            {!ready && (
              <div className="hero-fallback">
                <img src={`/productos/${heroProduct.id}-b.webp`} alt="" width={420} height={420} />
              </div>
            )}
            <HeroScene shirts={HERO_SHIRTS} center={center} onReady={() => setReady(true)} />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <Reveal>
            <div className="section-head">
              <div>
                <div className="eyebrow">Categorías</div>
                <h2 className="h-lg" style={{ marginTop: 6 }}>Encuentra la tuya</h2>
              </div>
              <Link href="/categoria/temporada-26-27" className="btn btn-ghost btn-sm">Toda la temporada <ArrowRight size={15} /></Link>
            </div>
          </Reveal>
          <div className="cats">
            {CATEGORIES.map((c, i) => (
              <Reveal key={c.slug} delay={i * 70}>
                <Tilt className="cat" max={6}>
                  <Link href={`/categoria/${c.slug}`} style={{ display: 'contents' }}>
                    <img src={photo(c.photo, 720, 520)} alt={c.name} width={720} height={520} loading="lazy" />
                    <div className="cat-body">
                      <div className="h-md">{c.name}</div>
                      <div className="small" style={{ color: '#d5dbec', marginTop: 4, maxWidth: 320 }}>{c.intro}</div>
                    </div>
                  </Link>
                </Tilt>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 8 }}>
        <div className="wrap">
          <Reveal>
            <div className="section-head">
              <div>
                <div className="eyebrow">Destacados</div>
                <h2 className="h-lg" style={{ marginTop: 6 }}>Lo que más se lleva estas semanas</h2>
              </div>
              <Link href="/categoria/temporada-26-27" className="btn btn-ghost btn-sm">Ver todo <ArrowRight size={15} /></Link>
            </div>
          </Reveal>
          <div className="products">
            {top.map((p, i) => <ProductCard key={p.id} p={p} index={i} />)}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap split">
          <Reveal>
            <div className="photo-stack">
              <img src={photo(PHOTOS.dorsal16, 640, 760)} alt="Camiseta naranja con el dorsal 16" width={340} height={420} style={{ left: 0, top: 0, width: '62%', height: 380, transform: 'rotateY(10deg) rotateZ(-2deg)' }} />
              <img src={photo(PHOTOS.planchaEstampado, 640, 560)} alt="Estampando una camiseta en la plancha del taller" width={320} height={280} style={{ right: 0, bottom: 0, width: '56%', height: 280, transform: 'rotateY(-12deg) translateZ(40px)' }} />
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="eyebrow">Personalización</div>
            <h2 className="h-lg" style={{ margin: '6px 0 14px' }}>Lo que escribes es lo que llega</h2>
            <p className="lead-text">Una camiseta con tu nombre no se puede devolver, así que te la enseñamos exactamente como va a salir del taller, letra a letra.</p>
            <div className="stack" style={{ gap: 14, marginTop: 22 }}>
              {[
                [PenLine, 'Escribe nombre y dorsal', 'Hasta 12 caracteres, con tildes y Ñ. El dorsal del 0 al 99.'],
                [Rotate3d, 'Míralo en la camiseta', 'Gira la camiseta en 3D y comprueba la espalda antes de pagar.'],
                [Stamp, 'Estampado tal cual', 'El mismo texto llega al carrito, al correo y a la hoja del taller.'],
              ].map(([Icon, t, d], i) => {
                const I = Icon as typeof PenLine;
                return (
                  <div key={i} className="row" style={{ alignItems: 'flex-start', gap: 14 }}>
                    <span className="band-icon"><I size={20} /></span>
                    <div><div className="strong">{t as string}</div><div className="small muted">{d as string}</div></div>
                  </div>
                );
              })}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 8 }}>
        <div className="wrap">
          <Reveal>
            <div className="section-head">
              <div>
                <div className="eyebrow">Opiniones</div>
                <h2 className="h-lg" style={{ marginTop: 6 }}>Lo que dicen al recibirla</h2>
              </div>
              <span className="row small muted" style={{ gap: 6 }}><BadgeCheck size={16} color="var(--ok)" /> Solo de compras verificadas</span>
            </div>
          </Reveal>
          <div className="band">
            {latest.map((r, i) => {
              const p = productById(r.productId);
              return (
                <Reveal key={r.id} delay={i * 80}>
                  <Tilt className="card card-pad" max={5} style={{ height: '100%' }}>
                    <Stars value={r.rating} />
                    <div className="strong" style={{ marginTop: 8 }}>{r.title}</div>
                    <p className="small muted" style={{ marginTop: 6 }}>{r.body}</p>
                    <div className="tiny muted" style={{ marginTop: 10 }}>{r.author}, {r.city} · {fmtDate(r.date)}{r.size ? ` · talla ${r.size}` : ''}</div>
                    {p && <Link href={`/producto/${p.slug}`} className="tiny strong" style={{ color: 'var(--accent-ink)', marginTop: 6, display: 'block' }}>{p.name}</Link>}
                  </Tilt>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 8 }}>
        <div className="wrap">
          <div className="band">
            {[
              [Truck, 'Envío a toda Europa', 'Correos 3 a 5 días, SEUR 24 a 48 h, GLS al resto de Europa.'],
              [ReceiptText, 'El total, desde el carrito', `La ${settings.fee.label.toLowerCase()} de ${eur(settings.fee.amount)} aparece antes de pagar, nunca al final.`],
              [ShieldCheck, 'Pago seguro', 'Tarjeta, Bizum o PayPal. Lo que ves es lo que se cobra.'],
              [MessageCircle, 'Respuesta al momento', 'El asistente te dice la talla, el plazo o dónde está tu pedido.'],
            ].map(([Icon, t, d], i) => {
              const I = Icon as typeof Truck;
              return (
                <Reveal key={i} delay={i * 60}>
                  <div className="band-item">
                    <span className="band-icon"><I size={20} /></span>
                    <div><div className="strong">{t as string}</div><div className="small muted">{d as string}</div></div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 8 }}>
        <div className="wrap">
          <Reveal>
            <Tilt className="cat" max={3} style={{ minHeight: 340 }}>
              <img src={photo(PHOTOS.aficionBufanda, 1400, 700)} alt="Aficionado con la bufanda en alto en la grada" width={1400} height={700} loading="lazy" />
              <div className="cat-body" style={{ padding: 32 }}>
                <div className="eyebrow" style={{ color: 'var(--volt)' }}>Retro</div>
                <div className="h-lg" style={{ marginTop: 6 }}>Las camisetas que se recuerdan</div>
                <p style={{ color: '#d5dbec', margin: '8px 0 16px', maxWidth: 460 }}>Reediciones con el cuello y el tejido de su época, personalizadas con la tipografía de entonces.</p>
                <Link href="/categoria/retro" className="btn btn-primary">Ver retro <ArrowRight size={16} /></Link>
              </div>
            </Tilt>
          </Reveal>
        </div>
      </section>
    </>
  );
}
