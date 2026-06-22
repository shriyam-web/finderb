import Link from 'next/link';

type RelatedCategoryLinksProps = {
  title: string;
  links: { name: string; href: string }[];
};

export default function RelatedCategoryLinks({ title, links }: RelatedCategoryLinksProps) {
  if (!links.length) return null;

  return (
    <nav aria-label={title} className="bg-white p-6 border border-gray-100">
      <h3 className="font-black text-gray-900 uppercase text-sm mb-4">{title}</h3>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
            >
              {link.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
