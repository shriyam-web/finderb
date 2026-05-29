import Image from 'next/image';
import * as LucideIcons from 'lucide-react';
import { isCategoryIconUrl } from '@/lib/categoryDisplay';

interface CategoryIconProps {
  icon: string | null | undefined;
  name: string;
  size?: number;
  className?: string;
  imageClassName?: string;
}

/** Renders a category `symbol` from the DB (image URL or Lucide name). No hardcoded fallback icons. */
export default function CategoryIcon({
  icon,
  name,
  size = 24,
  className = '',
  imageClassName = 'object-contain',
}: CategoryIconProps) {
  if (icon && isCategoryIconUrl(icon)) {
    return (
      <div className={`relative shrink-0 ${className}`} style={{ width: size, height: size }}>
        <Image src={icon} alt={name} fill className={imageClassName} sizes={`${size}px`} />
      </div>
    );
  }

  if (icon) {
    // @ts-ignore — dynamic Lucide icon name from DB
    const IconComponent = LucideIcons[icon];
    if (IconComponent) {
      return <IconComponent size={size} className={className} strokeWidth={1.5} />;
    }
  }

  return (
    <div
      className={`rounded-lg bg-slate-100 shrink-0 ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={name}
    />
  );
}
