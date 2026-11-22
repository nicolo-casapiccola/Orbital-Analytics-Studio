export type PeriodKey = 'all' | '2020-2023' | '2010-2019' | '2000-2009' | 'pre-2000';

export interface SatelliteRecord {
  id: number;
  name: string;
  operator: string;
  country: string;
  purpose: string;
  users: string;
  orbit: string;
  year: number | null;
  status: string;
  inOrbit: boolean;
  massKg: number | null;
}

export interface CountItem {
  label: string;
  value: number;
}

export interface SatcatYearPoint {
  year: number;
  payloads: number;
  total: number;
}

export interface SatcatInsights {
  post2020PayloadsInOrbit: number;
  post2020Share: number;
  payloadsInOrbit: number;
  payloadsShare: number;
  debrisFragmentsInOrbit: number;
  spentHardwareInOrbit: number;
  totalJunkInOrbit: number;
  totalJunkShare: number;
  totalReentered: number;
  reenteredShare: number;
}

export interface CatalogStats {
  totalObjects: number;
  inOrbit: number;
  reentered: number;
  debrisInOrbit: number;
  debrisShare: number;
  payloadsInOrbit: number;
  payloadsShare: number;
  byType: CountItem[];
  byEra: CountItem[];
  timeline: SatcatYearPoint[];
  insights: SatcatInsights;
}

export interface ItalyRecord {
  id: number;
  name: string;
  categoryState: string;
  category: string;
  active: boolean;
  status: string;
  cospar: string;
  orbitAlt: string;
  perigeeKm: number | null;
  apogeeKm: number | null;
  launchDate: string;
  launchYear: number | null;
  reentryDate: string | null;
  inclinationDeg: number | null;
  periodMin: number | null;
  purpose: string;
  purposeRaw: string;
  operator: string;
  operatorCategory: string;
  launchSite: string;
  launchSiteClean: string;
  unRegistered: boolean;
}

export interface ItalyStats {
  totalObjects: number;
  activeCount: number;
  reenteredCount: number;
  satcatItalianCount: number;
  operatorsCount: number;
  firstLaunchYear: number;
  byPurpose: CountItem[];
  byOperatorCategory: CountItem[];
  byLaunchSite: CountItem[];
  timeline: { year: number; count: number }[];
}

export interface ItalyData {
  stats: ItalyStats;
  records: ItalyRecord[];
}

export interface DatasetMeta {
  generatedAt: string;
  ucsSnapshot: string;
  timelineStart: number;
  timelineEnd: number;
  satelliteCount: number;
  inOrbitCount: number;
  operatorCount: number;
  countryCount: number;
  catalog: CatalogStats;
}

export interface DatasetFile {
  meta: DatasetMeta;
  satellites: SatelliteRecord[];
  italy: ItalyData;
}

export interface Filters {
  period: PeriodKey;
  purpose: string;
  users: string;
  orbit: string;
}

export interface PeriodOption {
  value: PeriodKey;
  label: string;
  min: number;
  max: number;
}

export const PERIOD_OPTIONS: PeriodOption[] = [
  { value: 'all', label: 'Tutti gli anni', min: 0, max: 9999 },
  { value: '2020-2023', label: '2020–2023', min: 2020, max: 2023 },
  { value: '2010-2019', label: '2010–2019', min: 2010, max: 2019 },
  { value: '2000-2009', label: '2000–2009', min: 2000, max: 2009 },
  { value: 'pre-2000', label: 'Prima del 2000', min: 0, max: 1999 },
];

export const DEFAULT_FILTERS: Filters = {
  period: 'all',
  purpose: 'all',
  users: 'all',
  orbit: 'all',
};

export const NAV_ITEMS = [
  { id: 'satcat', label: 'SATCAT' },
  { id: 'ucs', label: 'UCS' },
  { id: 'scopi', label: 'Scopi' },
  { id: 'operatori', label: 'Operatori' },
  { id: 'italia', label: 'Italia' },
  { id: 'dati', label: 'Dati' },
] as const;

export type SectionId = (typeof NAV_ITEMS)[number]['id'];
