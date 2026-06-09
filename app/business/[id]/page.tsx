import { cache } from 'react';
import type { Metadata } from 'next';
import { getBusiness } from '@/app/actions/business';
import BusinessProfilePage from '@/components/business/BusinessProfilePage';
import { buildBusinessJsonLd, buildBusinessMetadata } from '@/lib/businessSeo';

type PageProps = {
  params: Promise<{ id: string }>;
};

const getBusinessCached = cache((id: string) => getBusiness(id));

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await getBusinessCached(id);
  return buildBusinessMetadata(id, result.success && result.business ? result.business : null);
}

export default async function BusinessDetailPage({ params }: PageProps) {
  const { id } = await params;
  const result = await getBusinessCached(id);
  const jsonLd =
    result.success && result.business ? buildBusinessJsonLd(id, result.business) : null;

  return (
    <>
      {jsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      ) : null}
      <BusinessProfilePage id={id} />
    </>
  );
}
