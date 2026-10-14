const MAX_YEARS_IN_BUSINESS = 500;

function currentYear() {
  return new Date().getFullYear();
}

export function isValidEstablishmentYear(value: number | null | undefined): value is number {
  if (value == null || value <= 0) return false;
  const year = Math.floor(value);
  return year >= currentYear() - MAX_YEARS_IN_BUSINESS && year <= currentYear();
}

export function yearsInBusinessFromEstablishment(value: number | null | undefined): number | null {
  if (isValidEstablishmentYear(value)) {
    return Math.min(MAX_YEARS_IN_BUSINESS, Math.max(0, currentYear() - value));
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    const years = Math.floor(value);
    if (years > 0 && years <= MAX_YEARS_IN_BUSINESS) return years;
  }
  return null;
}

export function formatYearsInBusinessShort(value: number | null | undefined): string | null {
  const years = yearsInBusinessFromEstablishment(value);
  if (years == null) return null;
  if (years <= 0) return 'New';
  return `${years} yr${years === 1 ? '' : 's'}`;
}

export function formatEstablishmentYearsLabel(value: number | null | undefined): string | null {
  if (isValidEstablishmentYear(value)) {
    const years = yearsInBusinessFromEstablishment(value);
    if (years == null || years <= 0) return `Est. ${value}`;
    return `Est. ${value} · ${years} yr${years === 1 ? '' : 's'}`;
  }
  return formatYearsInBusinessShort(value);
}
