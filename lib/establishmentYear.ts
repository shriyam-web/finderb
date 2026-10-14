const MAX_YEARS_IN_BUSINESS = 500;

function currentYear() {
  return new Date().getFullYear();
}

export function minEstablishmentYear() {
  return currentYear() - MAX_YEARS_IN_BUSINESS;
}

export function isValidEstablishmentYear(value: number | null | undefined): value is number {
  if (value == null || value <= 0) return false;
  const year = Math.floor(value);
  return year >= minEstablishmentYear() && year <= currentYear();
}

/** Years trading, from a stored establishment year. Caps at 500. */
export function yearsInBusinessFromEstablishment(value: number | null | undefined): number | null {
  if (isValidEstablishmentYear(value)) {
    return Math.min(MAX_YEARS_IN_BUSINESS, Math.max(0, currentYear() - value));
  }
  // Older rows stored “years in business” (18) instead of a year (2008).
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

/** Map stored year to a date input value (Jan 1 of that year). */
export function establishmentYearToDateValue(year: number | null | undefined): string {
  if (!isValidEstablishmentYear(year)) return '';
  return `${year}-01-01`;
}

export function parseEstablishmentYearFromDate(value: string): number {
  if (!value) return 0;
  const year = new Date(`${value}T12:00:00`).getFullYear();
  return Number.isNaN(year) ? 0 : year;
}

export function formatEstablishmentYearDisplay(year: number | null | undefined): string | null {
  if (!isValidEstablishmentYear(year)) return null;
  return `Est. ${year}`;
}

export function formatEstablishmentYearsLabel(year: number | null | undefined): string | null {
  if (isValidEstablishmentYear(year)) {
    const years = yearsInBusinessFromEstablishment(year);
    if (years == null || years <= 0) return `Est. ${year}`;
    return `Est. ${year} · ${years} yr${years === 1 ? '' : 's'} in business`;
  }
  const years = yearsInBusinessFromEstablishment(year);
  if (years == null) return null;
  return `${years} yr${years === 1 ? '' : 's'} in business`;
}

export function getEstablishmentDateBounds() {
  const now = currentYear();
  return {
    min: `${minEstablishmentYear()}-01-01`,
    max: `${now}-12-31`,
  };
}
