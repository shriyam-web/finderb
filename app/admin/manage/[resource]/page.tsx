import AdminManageResourcePage from '@/components/admin/AdminManageResourcePage';
import { getAdminResourceConfig } from '@/lib/admin/resources';
import { notFound } from 'next/navigation';

type PageProps = {
  params: Promise<{ resource: string }>;
};

export default async function AdminManageResourceRoute({ params }: PageProps) {
  const { resource } = await params;
  if (!getAdminResourceConfig(resource)) {
    notFound();
  }

  return <AdminManageResourcePage resourceKey={resource} />;
}
