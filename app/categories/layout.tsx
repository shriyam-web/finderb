import { plusJakarta } from '@/lib/fonts';

export default function CategoriesLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${plusJakarta.variable} min-h-0 flex-1`}>{children}</div>;
}
