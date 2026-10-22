import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CATEGORIES, PRODUCTS, photo } from '@/lib/mock/catalog';
import { Listing } from '@/components/store/Listing';

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = CATEGORIES.find((x) => x.slug === slug);
  return { title: c ? c.name : 'Categoría', description: c?.intro };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = CATEGORIES.find((x) => x.slug === slug);
  if (!c) notFound();
  const items = PRODUCTS.filter((p) => p.category === c.slug);
  return (
    <>
      <section className="hero" style={{ minHeight: 260 }}>
        <img src={photo(c.photo, 1600, 520)} alt="" width={1600} height={520} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.38 }} />
        <div className="wrap" style={{ position: 'relative', zIndex: 2, padding: '56px 20px 48px' }}>
          <div className="eyebrow" style={{ color: 'var(--volt)' }}>{items.length} productos</div>
          <h1 className="h-xl" style={{ fontSize: 'clamp(30px, 4.6vw, 48px)', marginTop: 8 }}>{c.name}</h1>
          <p className="lead-text" style={{ color: '#d5dbec', marginTop: 10 }}>{c.intro}</p>
        </div>
      </section>
      <div className="wrap section" style={{ paddingTop: 24 }}>
        <Listing items={items} categorySlug={c.slug} />
      </div>
    </>
  );
}
