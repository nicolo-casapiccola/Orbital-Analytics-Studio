import {
  CountItem,
  Filters,
  PERIOD_OPTIONS,
  SatelliteRecord,
} from '../types/dataset';

export const PURPOSE_ORDER = [
  'Comunicazioni',
  'Osservazione della Terra',
  'Navigazione',
  'Tecnologia',
  'Scienza',
  'Altro',
];

export const USERS_ORDER = ['Commerciale', 'Governativa', 'Militare', 'Civile', 'Altro'];

export const ORBIT_ORDER = ['LEO', 'GEO', 'MEO', 'Ellittica', 'Altro'];

const numberFormatter = new Intl.NumberFormat('it-IT', {
  maximumFractionDigits: 0,
  useGrouping: true,
});

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

export function formatPct(value: number, digits = 0): string {
  return `${new Intl.NumberFormat('it-IT', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)}%`;
}

export function formatShare(value: number): string {
  if (value > 0 && value < 1) return '<1%';
  return formatPct(value);
}

export interface TickSet {
  vals: number[];
  text: string[];
}

export function niceTicks(maxValue: number, count = 3): TickSet {
  if (!Number.isFinite(maxValue) || maxValue <= 0) {
    return { vals: [0], text: ['0'] };
  }

  const rawStep = maxValue / count;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const normalized = rawStep / magnitude;
  const nice = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  const step = nice * magnitude;

  const vals: number[] = [];
  let value = 0;
  while (value < maxValue) {
    vals.push(Math.round(value));
    value += step;
  }
  vals.push(Math.round(value));

  return { vals, text: vals.map((entry) => formatNumber(entry)) };
}

export function formatMass(kg: number | null): string {
  if (!kg) return '—';
  if (kg >= 1000) return `${formatNumber(Math.round(kg))} kg`;
  return `${new Intl.NumberFormat('it-IT', { maximumFractionDigits: 1 }).format(kg)} kg`;
}

export function truncateLabel(label: string, maxLength = 30): string {
  const value = label.trim();
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

export function getPeriodRange(period: Filters['period']) {
  return PERIOD_OPTIONS.find((option) => option.value === period) ?? PERIOD_OPTIONS[0];
}

export function applyFilters(records: SatelliteRecord[], filters: Filters): SatelliteRecord[] {
  const range = getPeriodRange(filters.period);

  return records.filter((record) => {
    if (filters.period !== 'all') {
      if (record.year === null || record.year < range.min || record.year > range.max) {
        return false;
      }
    }
    if (filters.purpose !== 'all' && record.purpose !== filters.purpose) return false;
    if (filters.users !== 'all' && record.users !== filters.users) return false;
    if (filters.orbit !== 'all' && record.orbit !== filters.orbit) return false;
    return true;
  });
}

export function countBy(
  records: SatelliteRecord[],
  getLabel: (record: SatelliteRecord) => string
): CountItem[] {
  const counts = new Map<string, number>();
  for (const record of records) {
    const label = getLabel(record) || 'Non indicato';
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label, 'it'));
}

export function orderedCountBy(
  records: SatelliteRecord[],
  getLabel: (record: SatelliteRecord) => string,
  order: string[]
): CountItem[] {
  const counts = countBy(records, getLabel);
  const position = (label: string) => {
    const index = order.indexOf(label);
    return index === -1 ? order.length : index;
  };
  return counts.sort(
    (a, b) => position(a.label) - position(b.label) || b.value - a.value
  );
}

export function topOperators(records: SatelliteRecord[], limit = 10): CountItem[] {
  return countBy(records, (record) => record.operator).slice(0, limit);
}

export function topCountries(records: SatelliteRecord[], limit = 8): CountItem[] {
  return countBy(records, (record) => record.country)
    .filter((item) => item.label !== 'Non indicato')
    .slice(0, limit);
}

export function computeTimeline(
  records: SatelliteRecord[],
  start: number,
  end: number
): { year: number; value: number }[] {
  const values = new Array<number>(end - start + 1).fill(0);
  for (const record of records) {
    if (record.year === null) continue;
    if (record.year < start || record.year > end) continue;
    values[record.year - start] += 1;
  }
  return values.map((value, index) => ({ year: start + index, value }));
}

export interface PurposeOrbitRow {
  orbit: string;
  total: number;
  segments: { purpose: string; count: number; pct: number }[];
}

export function computePurposeByOrbit(records: SatelliteRecord[]): {
  orbits: string[];
  purposes: string[];
  rows: PurposeOrbitRow[];
} {
  const orbitTotals = new Map<string, number>();
  const cells = new Map<string, number>();

  for (const record of records) {
    orbitTotals.set(record.orbit, (orbitTotals.get(record.orbit) ?? 0) + 1);
    const key = `${record.orbit}::${record.purpose}`;
    cells.set(key, (cells.get(key) ?? 0) + 1);
  }

  const orbits = [...orbitTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([orbit]) => orbit);
  const purposes = orderedCountBy(records, (record) => record.purpose, PURPOSE_ORDER).map(
    (item) => item.label
  );

  const rows = orbits.map((orbit) => {
    const total = orbitTotals.get(orbit) ?? 0;
    return {
      orbit,
      total,
      segments: purposes.map((purpose) => {
        const count = cells.get(`${orbit}::${purpose}`) ?? 0;
        return { purpose, count, pct: total > 0 ? (count / total) * 100 : 0 };
      }),
    };
  });

  return { orbits, purposes, rows };
}

export interface Summary {
  total: number;
  inOrbit: number;
  inOrbitPct: number;
  commercial: number;
  commercialPct: number;
  operatorCount: number;
  countryCount: number;
  purposeCounts: CountItem[];
  userCounts: CountItem[];
  orbitCounts: CountItem[];
  operators: CountItem[];
  countries: CountItem[];
  top3OperatorShare: number;
  leoShare: number;
  geoCommsShare: number | null;
  recentShare: number;
}

export function computeSummary(records: SatelliteRecord[]): Summary {
  const total = records.length;
  const inOrbit = records.filter((record) => record.inOrbit).length;
  const commercial = records.filter((record) => record.users === 'Commerciale').length;
  const purposeCounts = countBy(records, (record) => record.purpose);
  const userCounts = orderedCountBy(records, (record) => record.users, USERS_ORDER);
  const orbitCounts = orderedCountBy(records, (record) => record.orbit, ORBIT_ORDER);
  const operators = topOperators(records, 10);
  const countries = topCountries(records, 8);
  const allOperators = countBy(records, (record) => record.operator);

  const top3 = allOperators.slice(0, 3).reduce((sum, item) => sum + item.value, 0);
  const leo = orbitCounts.find((item) => item.label === 'LEO')?.value ?? 0;
  const geoRecords = records.filter((record) => record.orbit === 'GEO');
  const geoComms = geoRecords.filter((record) => record.purpose === 'Comunicazioni').length;
  const recent = records.filter((record) => record.year !== null && record.year >= 2020).length;

  return {
    total,
    inOrbit,
    inOrbitPct: total > 0 ? (inOrbit / total) * 100 : 0,
    commercial,
    commercialPct: total > 0 ? (commercial / total) * 100 : 0,
    operatorCount: new Set(records.map((record) => record.operator.toLowerCase())).size,
    countryCount: new Set(
      records.map((record) => record.country).filter((country) => country !== 'Non indicato')
    ).size,
    purposeCounts,
    userCounts,
    orbitCounts,
    operators,
    countries,
    top3OperatorShare: total > 0 ? (top3 / total) * 100 : 0,
    leoShare: total > 0 ? (leo / total) * 100 : 0,
    geoCommsShare: geoRecords.length > 0 ? (geoComms / geoRecords.length) * 100 : null,
    recentShare: total > 0 ? (recent / total) * 100 : 0,
  };
}
