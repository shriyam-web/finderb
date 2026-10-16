export type SalaryPeriod = 'month' | 'year';

export function formatInr(amount: number): string {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

/** A single public string so every listing shows salary the same way. */
export function formatSalaryRange(min: number, max: number, period: SalaryPeriod): string {
  const unit = period === 'year' ? 'year' : 'month';
  const low = min > 0 ? Math.round(min) : 0;
  const high = max > 0 ? Math.round(max) : 0;
  if (low > 0 && high > 0) {
    const start = Math.min(low, high);
    const end = Math.max(low, high);
    if (start === end) return `${formatInr(start)} / ${unit}`;
    return `${formatInr(start)} – ${formatInr(end)} / ${unit}`;
  }
  if (low > 0) return `From ${formatInr(low)} / ${unit}`;
  if (high > 0) return `Up to ${formatInr(high)} / ${unit}`;
  return '';
}

export function parseSalaryRange(raw: string | null | undefined): {
  min: string;
  max: string;
  period: SalaryPeriod;
} {
  const text = String(raw || '');
  const period: SalaryPeriod = /year|annual|p\.?\s*a\.?/i.test(text) ? 'year' : 'month';
  const nums = [...text.replace(/,/g, '').matchAll(/(\d+(?:\.\d+)?)\s*(lakh|lac|l)?/gi)]
    .map((match) => {
      const value = Number(match[1]);
      if (!Number.isFinite(value) || value <= 0) return 0;
      return /lakh|lac|^l$/i.test(match[2] || '') ? Math.round(value * 100000) : Math.round(value);
    })
    .filter((value) => value >= 1000 && value <= 100_000_000);
  return {
    min: nums[0] ? String(nums[0]) : '',
    max: nums[1] ? String(nums[1]) : '',
    period,
  };
}

export function salaryFromInputs(minRaw: string, maxRaw: string, period: SalaryPeriod): string {
  const min = Number(String(minRaw).replace(/[^\d]/g, ''));
  const max = Number(String(maxRaw).replace(/[^\d]/g, ''));
  return formatSalaryRange(Number.isFinite(min) ? min : 0, Number.isFinite(max) ? max : 0, period);
}
