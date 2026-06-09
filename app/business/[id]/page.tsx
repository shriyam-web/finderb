'use client';

import { use } from 'react';
import BusinessProfilePage from '@/components/business/BusinessProfilePage';

export default function BusinessDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <BusinessProfilePage id={id} />;
}
