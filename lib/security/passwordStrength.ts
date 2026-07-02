import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH_MERCHANT,
} from '@/lib/security/passwordPolicy';

export type PasswordStrengthLevel = 'empty' | 'weak' | 'fair' | 'good' | 'strong';

export type PasswordRequirement = {
  id: string;
  label: string;
  met: boolean;
  required: boolean;
};

const STRENGTH_LABELS: Record<Exclude<PasswordStrengthLevel, 'empty'>, string> = {
  weak: 'Weak',
  fair: 'Fair',
  good: 'Good',
  strong: 'Strong',
};

const STRENGTH_BAR_CLASS: Record<Exclude<PasswordStrengthLevel, 'empty'>, string> = {
  weak: 'bg-rose-500',
  fair: 'bg-amber-500',
  good: 'bg-sky-500',
  strong: 'bg-emerald-500',
};

export function getPasswordStrengthLabel(level: PasswordStrengthLevel): string {
  if (level === 'empty') return '';
  return STRENGTH_LABELS[level];
}

export function getPasswordStrengthBarClass(level: PasswordStrengthLevel): string {
  if (level === 'empty') return 'bg-[#dfe6ee]';
  return STRENGTH_BAR_CLASS[level];
}

export function analyzePasswordStrength(
  password: string,
  minLength = PASSWORD_MIN_LENGTH_MERCHANT,
): {
  level: PasswordStrengthLevel;
  score: number;
  requirements: PasswordRequirement[];
} {
  const requirements: PasswordRequirement[] = [
    {
      id: 'length',
      label: `At least ${minLength} characters`,
      met: password.length >= minLength,
      required: true,
    },
    {
      id: 'upper',
      label: 'One uppercase letter',
      met: /[A-Z]/.test(password),
      required: false,
    },
    {
      id: 'lower',
      label: 'One lowercase letter',
      met: /[a-z]/.test(password),
      required: false,
    },
    {
      id: 'number',
      label: 'One number',
      met: /\d/.test(password),
      required: false,
    },
    {
      id: 'special',
      label: 'One symbol (!@#$…)',
      met: /[^A-Za-z0-9]/.test(password),
      required: false,
    },
  ];

  if (!password) {
    return { level: 'empty', score: 0, requirements };
  }

  const lengthMet = password.length >= minLength;
  const optionalMet = requirements.filter((req) => !req.required && req.met).length;

  if (!lengthMet) {
    return {
      level: 'weak',
      score: Math.min(20, Math.round((password.length / minLength) * 20)),
      requirements,
    };
  }

  let level: PasswordStrengthLevel = 'weak';
  let score = 25 + optionalMet * 15;

  if (password.length >= 8) score += 10;
  if (password.length >= 12) score += 5;
  score = Math.min(100, score);

  if (optionalMet >= 3 && password.length >= 8) level = 'strong';
  else if (optionalMet >= 2) level = 'good';
  else if (optionalMet >= 1) level = 'fair';

  return { level, score, requirements };
}

export function validateRegistrationPassword(password: string): string | null {
  if (!password || typeof password !== 'string') {
    return 'Password is required.';
  }

  if (password.length < PASSWORD_MIN_LENGTH_MERCHANT) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH_MERCHANT} characters.`;
  }

  if (password.length > PASSWORD_MAX_LENGTH) {
    return `Password must be at most ${PASSWORD_MAX_LENGTH} characters.`;
  }

  const { level } = analyzePasswordStrength(password);
  if (level === 'weak') {
    return 'Add letters, numbers, or symbols for a stronger password.';
  }

  return null;
}
