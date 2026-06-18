'use client';

import {
  HiOutlineCheckBadge,
  HiOutlineClock,
  HiOutlineCreditCard,
  HiOutlineDocumentCheck,
  HiOutlineExclamationTriangle,
  HiOutlineShieldCheck,
  HiOutlineSparkles,
} from 'react-icons/hi2';

type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'premium';

const toneStyles: Record<
  BadgeTone,
  { shell: string; dot: string; icon: string }
> = {
  success: {
    shell: 'bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200',
    dot: 'bg-emerald-600',
    icon: 'text-emerald-700',
  },
  warning: {
    shell: 'bg-amber-100 text-amber-950 ring-1 ring-amber-200',
    dot: 'bg-amber-600',
    icon: 'text-amber-800',
  },
  danger: {
    shell: 'bg-rose-100 text-rose-900 ring-1 ring-rose-200',
    dot: 'bg-rose-600',
    icon: 'text-rose-700',
  },
  info: {
    shell: 'bg-sky-100 text-sky-900 ring-1 ring-sky-200',
    dot: 'bg-sky-600',
    icon: 'text-sky-700',
  },
  neutral: {
    shell: 'bg-slate-100 text-slate-800 ring-1 ring-slate-200',
    dot: 'bg-slate-500',
    icon: 'text-slate-600',
  },
  premium: {
    shell: 'bg-violet-100 text-violet-900 ring-1 ring-violet-200',
    dot: 'bg-violet-600',
    icon: 'text-violet-700',
  },
};

type StatusBadgeProps = {
  label: string;
  tone?: BadgeTone;
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  className?: string;
};

export function StatusBadge({
  label,
  tone = 'neutral',
  icon,
  size = 'md',
  pulse = false,
  className = '',
}: StatusBadgeProps) {
  const styles = toneStyles[tone];
  const sizeClass =
    size === 'sm'
      ? 'gap-1 px-2 py-0.5 text-[11px]'
      : size === 'lg'
        ? 'gap-1.5 px-3 py-1 text-xs'
        : 'gap-1.5 px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex max-w-full items-center rounded-md font-semibold ${sizeClass} ${styles.shell} ${className}`}
    >
      <span className="relative flex h-1.5 w-1.5 shrink-0 items-center justify-center">
        <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
        {pulse && <span className={`absolute inset-0 animate-ping rounded-full opacity-50 ${styles.dot}`} />}
      </span>
      {icon && <span className={`shrink-0 ${styles.icon}`}>{icon}</span>}
      <span className="truncate">{label}</span>
    </span>
  );
}

export function PaymentStatusBadge({
  status,
  size = 'md',
  className = '',
}: {
  status?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const isActive = status === 'completed';

  return (
    <StatusBadge
      label={isActive ? 'Plan active' : 'Payment due'}
      tone={isActive ? 'success' : 'warning'}
      icon={isActive ? <HiOutlineSparkles size={12} /> : <HiOutlineCreditCard size={12} />}
      size={size}
      pulse={!isActive}
      className={className}
    />
  );
}

export function KycStatusBadge({
  status,
  size = 'md',
  className = '',
}: {
  status?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const normalized = (status || 'pending').toLowerCase();

  if (normalized === 'approved' || normalized === 'verified') {
    return (
      <StatusBadge
        label="KYC verified"
        tone="premium"
        icon={<HiOutlineShieldCheck size={12} />}
        size={size}
        className={className}
      />
    );
  }

  if (normalized === 'submitted') {
    return (
      <StatusBadge
        label="Under review"
        tone="info"
        icon={<HiOutlineClock size={12} />}
        size={size}
        pulse
        className={className}
      />
    );
  }

  return (
    <StatusBadge
      label="KYC incomplete"
      tone="danger"
      icon={<HiOutlineExclamationTriangle size={12} />}
      size={size}
      pulse
      className={className}
    />
  );
}

export function VerifiedBadge({
  size = 'md',
  className = '',
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  return (
    <StatusBadge
      label="Verified"
      tone="success"
      icon={<HiOutlineCheckBadge size={12} />}
      size={size}
      className={className}
    />
  );
}

export function PlanBadge({
  plan = 'Growth Pro',
  size = 'sm',
  className = '',
}: {
  plan?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  return (
    <StatusBadge
      label={plan}
      tone="premium"
      icon={<HiOutlineDocumentCheck size={12} />}
      size={size}
      className={className}
    />
  );
}
