import type { LucideIcon } from 'lucide-react';
import {
  Banknote,
  CreditCard,
  FileText,
  Landmark,
  Smartphone,
  Wallet,
} from 'lucide-react';

const PAYMENT_MODE_ICONS: Record<string, LucideIcon> = {
  cash: Banknote,
  upi: Smartphone,
  'credit card': CreditCard,
  'debit card': CreditCard,
  'net banking': Landmark,
  wallet: Wallet,
  cheque: FileText,
};

export function getPaymentModeIcon(mode: string): LucideIcon {
  const key = mode.trim().toLowerCase();
  return PAYMENT_MODE_ICONS[key] ?? Banknote;
}
