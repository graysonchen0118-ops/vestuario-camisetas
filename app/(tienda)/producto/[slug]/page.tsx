import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PRODUCTS, productBySlug, productImage } from '@/lib/mock/catalog';
import { REVIEWS } from '@/lib/mock/sales';
import { ProductView } from '@/components/store/ProductView';

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = productBySlug(slug);
  return { title: p?.name ?? 'Producto', description: p?.description };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = productBySlug(slug);
  if (!p) notFound();
  const published = REVIEWS.filter((r) => r.productId === p.id && r.status === 'publicada');
  // One structured data block per product page: the stars Google shows come from here, and only from here.
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    sku: String(p.id),
    image: productImage(p, 'f'),
    description: p.description,
    offers: { '@type': 'Offer', priceCurrency: 'EUR', price: p.price.toFixed(2), availability: 'https://schema.org/InStock' },
  };
  if (published.length) {
    jsonLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: (published.reduce((a, r) => a + r.rating, 0) / published.length).toFixed(1),
      reviewCount: published.length,
    };
  }
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ProductView productId={p.id} />
    </>
  );
}
