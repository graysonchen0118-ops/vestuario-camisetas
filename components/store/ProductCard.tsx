'use client';

import Link from 'next/link';
import { productImage, type Product } from '@/lib/mock/catalog';
import { useStore } from '@/lib/store';
import { avgRating, eur } from '@/lib/logic';
import { Stars, Tilt } from '@/components/ui';
import { toMin, NOW } from '@/lib/mock/sales';

export function ProductCard({ p, index = 0 }: { p: Product; index?: number }) {
  const { reviews, stock } = useStore();
  const r = avgRating(p.id, reviews);
  const isNew = toMin(NOW) - toMin(`${p.createdAt} 00:00`) < 45 * 1440;
  const left = Object.values(stock[p.id] ?? {}).reduce((a, b) => a + b, 0);
  const shirt = p.kind === 'shirt';
  return (
    <Tilt className="pcard enter" style={{ animationDelay: `${Math.min(index, 10) * 50}ms` }}>
      <Link href={`/producto/${p.slug}`} aria-label={p.name} style={{ display: 'contents' }}>
        <div className="pcard-media">
          <div className="pcard-tags">
            {p.compareAt && <span className="badge bad">-{Math.round((1 - p.price / p.compareAt) * 100)} %</span>}
            {isNew && <span className="badge dark">Nueva</span>}
            {p.personalizable && <span className="badge volt">Personalizable</span>}
          </div>
          <img className={`front ${shirt ? 'render has-back' : ''}`} src={productImage(p, 'f')} alt={p.name} width={480} height={480} loading="lazy" />
          {shirt && <img className="back render" src={productImage(p, 'b')} alt="" width={480} height={480} loading="lazy" />}
        </div>
        <div className="pcard-body">
          <div className="pcard-name">{p.name}</div>
          <div className="row small muted" style={{ gap: 6, minHeight: 20 }}>
            {r.count > 0 ? (
              <>
                <Stars value={r.avg} size={13} /> <span>{r.avg.toFixed(1).replace('.', ',')} ({r.count})</span>
              </>
            ) : (
              <span>Sin opiniones todavía</span>
            )}
          </div>
          <div className="row between" style={{ marginTop: 'auto' }}>
            <span className="price">
              {eur(p.price)}
              {p.compareAt && <s>{eur(p.compareAt)}</s>}
            </span>
            {left < 12 && <span className="tiny" style={{ color: 'var(--warn)', fontWeight: 700 }}>Últimas tallas</span>}
          </div>
        </div>
      </Link>
    </Tilt>
  );
}

export function ProductGridSkeleton({ n = 8 }: { n?: number }) {
  return (
    <div className="products">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="pcard">
          <div className="pcard-media sk" style={{ borderRadius: 0 }} />
          <div className="pcard-body">
            <div className="sk" style={{ height: 14, width: '90%' }} />
            <div className="sk" style={{ height: 12, width: '50%' }} />
            <div className="sk" style={{ height: 16, width: '30%', marginTop: 8 }} />
          </div>
        </div>
      ))}
    </div>
  );
}
