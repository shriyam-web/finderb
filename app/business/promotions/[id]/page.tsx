import { notFound, redirect } from 'next/navigation';
import { getBusinessSession } from '@/app/actions/business';
import { promoteBusinessOnlineOrNull } from '@/lib/promoteBusiness';
import PromoteDesk from '@/components/promotions/PromoteDesk';

export const dynamic = 'force-dynamic';

export default async function PromotionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await promoteBusinessOnlineOrNull())) notFound();
  const session = await getBusinessSession();
  if (!session?.business) redirect('/business/login?next=/business/promotions');
  const { id } = await params;
  return <PromoteDesk mode="detail" orderId={id} />;
}
