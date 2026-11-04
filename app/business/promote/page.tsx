import { notFound, redirect } from 'next/navigation';
import { getBusinessSession } from '@/app/actions/business';
import { promoteBusinessOnlineOrNull } from '@/lib/promoteBusiness';
import PromoteDesk from '@/components/promotions/PromoteDesk';

export const dynamic = 'force-dynamic';

export default async function PromotePage() {
  if (!(await promoteBusinessOnlineOrNull())) notFound();
  const session = await getBusinessSession();
  if (!session?.business) redirect('/business/login?next=/business/promote');
  return <PromoteDesk mode="promote" />;
}
