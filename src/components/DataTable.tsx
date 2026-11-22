import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Search,
} from 'lucide-react';
import { SatelliteRecord } from '../types/dataset';
import { formatMass, formatNumber } from '../utils/analytics';
import { SectionHeader } from './ui';

interface DataTableProps {
  records: SatelliteRecord[];
}

type SortKey =
  | 'name'
  | 'operator'
  | 'country'
  | 'purpose'
  | 'users'
  | 'orbit'
  | 'year'
  | 'massKg'
  | 'status';

const COLUMNS: { key: SortKey; label: string; align?: 'right' }[] = [
  { key: 'name', label: 'Satellite' },
  { key: 'operator', label: 'Operatore' },
  { key: 'country', label: 'Paese' },
  { key: 'purpose', label: 'Scopo' },
  { key: 'users', label: 'Utenza' },
  { key: 'orbit', label: 'Orbita' },
  { key: 'year', label: 'Anno', align: 'right' },
  { key: 'massKg', label: 'Massa', align: 'right' },
  { key: 'status', label: 'Stato' },
];

const PAGE_SIZE = 20;

function compareValues(a: SatelliteRecord, b: SatelliteRecord, key: SortKey): number {
  if (key === 'year' || key === 'massKg') {
    return (a[key] ?? -1) - (b[key] ?? -1);
  }
  return String(a[key] ?? '').localeCompare(String(b[key] ?? ''), 'it');
}

function escapeCsv(value: string | number | null): string {
  const text = value === null || value === undefined ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export function DataTable({ records }: DataTableProps) {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('year');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return records;
    return records.filter((record) =>
      [record.name, record.operator, record.country, record.purpose]
        .join(' ')
        .toLowerCase()
        .includes(needle)
    );
  }, [records, query]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) => {
      const result = compareValues(a, b, sortKey);
      return sortDir === 'asc' ? result : -result;
    });
    return list;
  }, [filtered, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * PAGE_SIZE;
  const rows = sorted.slice(start, start + PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [records, query, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(key);
    setSortDir(key === 'year' || key === 'massKg' ? 'desc' : 'asc');
  }

  function exportCsv() {
    const header = [
      'Satellite',
      'Operatore',
      'Paese',
      'Scopo',
      'Utenza',
      'Orbita',
      'Anno',
      'Massa (kg)',
      'Stato',
    ];
    const lines = [
      header.map(escapeCsv).join(';'),
      ...sorted.map((record) =>
        [
          record.name,
          record.operator,
          record.country,
          record.purpose,
          record.users,
          record.orbit,
          record.year ?? '',
          record.massKg ?? '',
          record.status,
        ]
          .map(escapeCsv)
          .join(';')
      ),
    ];

    const blob = new Blob([`\uFEFF${lines.join('\n')}`], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'satelliti-filtrati.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section id="dati" className="scroll-mt-24">
      <SectionHeader
        number="06"
        title="Esplora i dati"
        description={
          <>
            La tabella contiene i satelliti del censimento UCS arricchiti con i dati orbitali del catalogo SATCAT.
            <br />
            Cerca, ordina ed esporta la selezione corrente.
          </>
        }
      />

      <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white">
        <div className="flex flex-col gap-3 border-b border-black/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[14px] font-semibold text-[#1D1D1F]">
              {formatNumber(sorted.length)} satelliti
            </p>
            <p className="text-[12px] text-[#8E8E93]">
              Cerca per nome, operatore, paese o scopo
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8E93]"
              />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cerca…"
                className="h-9 w-full rounded-xl border border-black/[0.08] bg-[#F9F9FB] pl-8 pr-3 text-[12.5px] outline-none transition-colors placeholder:text-[#AEAEB2] focus:border-[#007AFF] focus:bg-white focus:ring-2 focus:ring-[#007AFF]/15"
              />
            </div>
            <button
              type="button"
              onClick={exportCsv}
              className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-black/[0.08] bg-white px-3 text-[12.5px] font-medium text-[#1D1D1F] transition-colors hover:bg-[#F5F5F7]"
            >
              <Download size={14} />
              CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse text-left">
            <thead>
              <tr className="border-b border-black/[0.06] bg-[#FAFAFC]">
                {COLUMNS.map((column) => {
                  const active = sortKey === column.key;
                  const Icon = !active ? ArrowUpDown : sortDir === 'asc' ? ArrowUp : ArrowDown;
                  return (
                    <th
                      key={column.key}
                      className={`px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-[0.07em] text-[#8E8E93] ${
                        column.align === 'right' ? 'text-right' : ''
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleSort(column.key)}
                        className={`inline-flex items-center gap-1 transition-colors hover:text-[#1D1D1F] ${
                          column.align === 'right' ? 'flex-row-reverse' : ''
                        } ${active ? 'text-[#1D1D1F]' : ''}`}
                      >
                        {column.label}
                        <Icon size={11} className={active ? 'text-[#007AFF]' : 'text-[#C7C7CC]'} />
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map((record) => (
                <tr
                  key={record.id}
                  className="border-b border-black/[0.04] last:border-0 hover:bg-[#FAFAFC]"
                >
                  <td
                    className="max-w-[240px] truncate px-4 py-2.5 text-[13px] font-medium text-[#1D1D1F]"
                    title={record.name}
                  >
                    {record.name}
                  </td>
                  <td
                    className="max-w-[200px] truncate px-4 py-2.5 text-[13px] text-[#3A3A3C]"
                    title={record.operator}
                  >
                    {record.operator}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-[13px] text-[#3A3A3C]">
                    {record.country}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-[13px] text-[#3A3A3C]">
                    {record.purpose}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-[13px] text-[#3A3A3C]">
                    {record.users}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-[13px] text-[#3A3A3C]">
                    {record.orbit}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right text-[13px] tabular-nums text-[#3A3A3C]">
                    {record.year ?? '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right text-[13px] tabular-nums text-[#3A3A3C]">
                    {formatMass(record.massKg)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        record.inOrbit
                          ? 'bg-[#E9F9EE] text-[#1B7F3B]'
                          : 'bg-[#F2F2F5] text-[#6E6E73]'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          record.inOrbit ? 'bg-[#34C759]' : 'bg-[#C7C7CC]'
                        }`}
                      />
                      {record.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {rows.length === 0 ? (
          <div className="px-4 py-12 text-center text-[13px] text-[#8E8E93]">
            Nessun satellite corrisponde alla ricerca o ai filtri.
          </div>
        ) : null}

        <div className="flex flex-col gap-2 border-t border-black/[0.06] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12px] text-[#8E8E93]">
            {sorted.length === 0
              ? '0 risultati'
              : `${formatNumber(start + 1)}–${formatNumber(
                  Math.min(start + PAGE_SIZE, sorted.length)
                )} di ${formatNumber(sorted.length)}`}
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={currentPage === 1}
              aria-label="Pagina precedente"
              className="grid h-8 w-8 place-items-center rounded-lg border border-black/[0.08] text-[#1D1D1F] transition-colors hover:bg-[#F5F5F7] disabled:cursor-not-allowed disabled:opacity-35"
            >
              <ChevronLeft size={15} />
            </button>
            <span className="px-2 text-[12px] font-medium text-[#6E6E73]">
              Pagina {currentPage} di {pageCount}
            </span>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
              disabled={currentPage === pageCount}
              aria-label="Pagina successiva"
              className="grid h-8 w-8 place-items-center rounded-lg border border-black/[0.08] text-[#1D1D1F] transition-colors hover:bg-[#F5F5F7] disabled:cursor-not-allowed disabled:opacity-35"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
