import type { LucideIcon } from 'lucide-react';
import {
  Briefcase,
  Camera,
  Car,
  Dumbbell,
  Globe,
  GraduationCap,
  HeartPulse,
  Home,
  Scissors,
  Sparkles,
  Tag,
  Truck,
  UtensilsCrossed,
  Wrench,
  Zap,
} from 'lucide-react';

const SERVICE_ICON_RULES: Array<{ pattern: RegExp; icon: LucideIcon }> = [
  { pattern: /web|website|software|app|digital|seo|design|developer/i, icon: Globe },
  { pattern: /repair|maintain|fix|service center/i, icon: Wrench },
  { pattern: /deliver|courier|logistics|shipping/i, icon: Truck },
  { pattern: /food|cafe|restaurant|catering|bakery/i, icon: UtensilsCrossed },
  { pattern: /salon|hair|beauty|spa|groom/i, icon: Scissors },
  { pattern: /car|auto|vehicle|garage|tyre/i, icon: Car },
  { pattern: /home|interior|furniture|property|real estate/i, icon: Home },
  { pattern: /photo|video|film|shoot/i, icon: Camera },
  { pattern: /gym|fitness|yoga|sport/i, icon: Dumbbell },
  { pattern: /coach|tuition|education|training|class/i, icon: GraduationCap },
  { pattern: /health|medical|clinic|doctor|dental/i, icon: HeartPulse },
  { pattern: /clean|laundry|housekeep/i, icon: Sparkles },
  { pattern: /electric|wiring|solar|power/i, icon: Zap },
  { pattern: /consult|account|legal|ca|tax|business/i, icon: Briefcase },
];

export function getServicePillIcon(label: string): LucideIcon {
  const normalized = label.trim();
  if (!normalized) return Tag;

  const match = SERVICE_ICON_RULES.find((rule) => rule.pattern.test(normalized));
  return match?.icon ?? Tag;
}
