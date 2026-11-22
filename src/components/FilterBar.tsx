import { ChevronDown, RotateCcw } from 'lucide-react';
import { CountItem, Filters, PERIOD_OPTIONS, PeriodKey } from '../types/dataset';
import { formatNumber } from '../utils/analytics';

interface FilterBarProps {
  filters: Filters;
  onChange: (next: Filters) => void;
  onReset: () => void;
  purposeOptions: CountItem[];
  userOptions: CountItem[];
  orbitOptions: CountItem[];
  resultCount: number;
}

interface SelectFieldProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

function SelectField({ label, value, options, onChange }: SelectFieldProps) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-[#8E8E93]">
        {label}
      </span>
      <span className="relative block">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-full appearance-none rounded-xl border border-black/[0.08] bg-[#F9F9FB] pl-3 pr-9 text-[13px] font-medium text-[#1D1D1F] outline-none transition-colors hover:border-black/[0.14] focus:border-[#007AFF] focus:bg-white focus:ring-2 focus:ring-[#007AFF]/15"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={15}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8E8E93]"
        />
      </span>
    </label>
  );
}

export function FilterBar({
  filters,
  onChange,
  onReset,
  purposeOptions,
  userOptions,
  orbitOptions,
  resultCount,
}: FilterBarProps) {
  const activeCount = [
    filters.period !== 'all',
    filters.purpose !== 'all',
    filters.users !== 'all',
    filters.orbit !== 'all',
  ].filter(Boolean).length;

  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
        <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
          <SelectField
            label="Periodo"
            value={filters.period}
            options={PERIOD_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
            onChange={(value) => onChange({ ...filters, period: value as PeriodKey })}
          />
          <SelectField
            label="Scopo"
            value={filters.purpose}
            options={[
              { value: 'all', label: 'Tutti gli scopi' },
              ...purposeOptions.map((item) => ({ value: item.label, label: item.label })),
            ]}
            onChange={(value) => onChange({ ...filters, purpose: value })}
          />
          <SelectField
            label="Utenza"
            value={filters.users}
            options={[
              { value: 'all', label: 'Tutte le utenze' },
              ...userOptions.map((item) => ({ value: item.label, label: item.label })),
            ]}
            onChange={(value) => onChange({ ...filters, users: value })}
          />
          <SelectField
            label="Orbita"
            value={filters.orbit}
            options={[
              { value: 'all', label: 'Tutte le orbite' },
              ...orbitOptions.map((item) => ({ value: item.label, label: item.label })),
            ]}
            onChange={(value) => onChange({ ...filters, orbit: value })}
          />
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-black/[0.06] pt-3 lg:border-0 lg:pt-0">
          <span className="text-[12.5px] text-[#6E6E73]">
            <strong className="font-semibold text-[#1D1D1F]">
              {formatNumber(resultCount)}
            </strong>{' '}
            satelliti
          </span>
          <button
            type="button"
            onClick={onReset}
            disabled={activeCount === 0}
            className="flex items-center gap-1.5 rounded-xl border border-black/[0.08] bg-white px-3 py-2 text-[12.5px] font-medium text-[#1D1D1F] transition-colors hover:bg-[#F5F5F7] disabled:cursor-not-allowed disabled:opacity-35"
          >
            <RotateCcw size={13} />
            Azzera
            {activeCount > 0 ? (
              <span className="ml-0.5 rounded-full bg-[#007AFF] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
                {activeCount}
              </span>
            ) : null}
          </button>
        </div>
      </div>
      <p className="mt-3 text-[11.5px] leading-relaxed text-[#8E8E93]">
        I filtri aggiornano le sezioni 01–03 e la tabella. La sezione Detriti usa il catalogo
        completo, senza filtri.
      </p>
    </div>
  );
}
