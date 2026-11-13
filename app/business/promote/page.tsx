import { notFound, redirect } from 'next/navigation';
import { getBusinessSession } from '@/app/actions/business';
import { promoteBusinessOnlineOrNull } from '@/lib/promoteBusiness';
import PromoteDesk from '@/components/promotions/PromoteDesk';

export const dynamic = 'force-dynamic';

export default async function PromotePage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  if (!(await promoteBusinessOnlineOrNull())) notFound();
  const query = await searchParams;
  const order = String(query.order || '').trim();
  const next = order ? `/business/promote?order=${encodeURIComponent(order)}` : '/business/promote';
  const session = await getBusinessSession();
  if (!session?.business) redirect(`/business/login?next=${encodeURIComponent(next)}`);
  return <PromoteDesk mode="promote" initialOrderId={order} />;
}
