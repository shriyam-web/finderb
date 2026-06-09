import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import {
  buildLocationBreadcrumbHref,
  getBusinessLocationLabel,
} from '@/lib/businessBreadcrumb';
import type { CategoryBreadcrumb } from '@/app/actions/category';
import type { Business } from '@/lib/mockData';

type BusinessProfileBreadcrumbProps = {
  business: Business;
  categoryBreadcrumb: CategoryBreadcrumb | null;
};

function CrumbSeparator() {
  return <ChevronRight size={10} className="mx-1 inline shrink-0 text-[#d6d3d1]" aria-hidden />;
}

export default function BusinessProfileBreadcrumb({
  business,
  categoryBreadcrumb,
}: BusinessProfileBreadcrumbProps) {
  const categoryName = categoryBreadcrumb?.name || business.category?.trim() || null;
  const categoryHref = categoryBreadcrumb?.href || '/categories';
  const locationLabel = getBusinessLocationLabel(business);
  const locationHref =
    categoryName && locationLabel
      ? buildLocationBreadcrumbHref(categoryName, locationLabel)
      : locationLabel
        ? `/categories?search=${encodeURIComponent(locationLabel)}`
        : null;

  return (
    <nav aria-label="Breadcrumb" className="pt-4">
      <ol className="flex flex-wrap items-center text-xs text-[#a8a29e]">
        <li className="inline-flex items-center">
          <Link href="/" className="hover:text-[#215481]">
            Home
          </Link>
        </li>

        {categoryName ? (
          <li className="inline-flex max-w-full items-center">
            <CrumbSeparator />
            <Link href={categoryHref} className="truncate hover:text-[#215481]">
              {categoryName}
            </Link>
          </li>
        ) : null}

        {locationLabel && locationHref ? (
          <li className="inline-flex max-w-full items-center">
            <CrumbSeparator />
            <Link href={locationHref} className="truncate hover:text-[#215481]">
              {locationLabel}
            </Link>
          </li>
        ) : null}

        <li className="inline-flex max-w-full items-center">
          <CrumbSeparator />
          <span className="truncate font-medium text-[#57534e]" aria-current="page">
            {business.name}
          </span>
        </li>
      </ol>
    </nav>
  );
}
