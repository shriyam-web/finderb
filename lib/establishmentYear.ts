const MIN_ESTABLISHMENT_YEAR = 1900;

export function isValidEstablishmentYear(value: number | null | undefined): value is number {
  if (value == null || value <= 0) return false;
  const currentYear = new Date().getFullYear();
  return value >= MIN_ESTABLISHMENT_YEAR && value <= currentYear;
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
  if (!isValidEstablishmentYear(year)) return null;
  const years = new Date().getFullYear() - year;
  if (years <= 0) return `Est. ${year}`;
  return `Est. ${year} · ${years} yr${years === 1 ? '' : 's'} in business`;
}

export function getEstablishmentDateBounds() {
  const currentYear = new Date().getFullYear();
  return {
    min: `${MIN_ESTABLISHMENT_YEAR}-01-01`,
    max: `${currentYear}-12-31`,
  };
}
