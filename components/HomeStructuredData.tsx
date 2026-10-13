import { serializeJsonLd } from '@/components/JsonLd';
import { getHomeNavigationStructuredData } from '@/lib/siteSeo';

export default function HomeStructuredData() {
  const jsonLd = getHomeNavigationStructuredData();

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
    />
  );
}
