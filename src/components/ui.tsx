import type { ReactNode } from 'react';
import { Lightbulb } from 'lucide-react';

interface SectionHeaderProps {
  number: string;
  title: string;
  description: string;
  badge?: string;
}

export function SectionHeader({ number, title, description, badge }: SectionHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-[#007AFF]/10 px-2.5 py-1 font-mono text-[11px] font-semibold tracking-[0.12em] text-[#007AFF]">
          {number}
        </span>
        {badge ? (
          <span className="rounded-full border border-black/[0.08] bg-white px-2.5 py-1 text-[11px] font-medium text-[#6E6E73]">
            {badge}
          </span>
        ) : null}
      </div>
      <h2 className="mt-3 text-[26px] font-semibold leading-tight tracking-tight text-[#1D1D1F] sm:text-[32px]">
        {title}
      </h2>
      <p className="mt-2 max-w-3xl text-[14.5px] leading-relaxed text-[#6E6E73] sm:text-[15px]">
        {description}
      </p>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}

export function StatCard({ label, value, hint, accent = false }: StatCardProps) {
  return (
    <div
      className={`rounded-2xl border bg-white p-4 sm:p-5 ${
        accent ? 'border-[#007AFF]/20' : 'border-black/[0.06]'
      }`}
    >
      <p className="text-[11.5px] font-semibold uppercase tracking-[0.08em] text-[#8E8E93]">
        {label}
      </p>
      <p
        className={`mt-2 text-[26px] font-semibold tracking-tight sm:text-[30px] ${
          accent ? 'text-[#007AFF]' : 'text-[#1D1D1F]'
        }`}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-[12.5px] leading-snug text-[#6E6E73]">{hint}</p> : null}
    </div>
  );
}

export function StatRow({ children }: { children: ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-3">{children}</div>;
}

interface ChartCardProps {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function ChartCard({ title, subtitle, badge, children, className = '' }: ChartCardProps) {
  return (
    <div className={`rounded-2xl border border-black/[0.06] bg-white p-4 sm:p-5 ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[14.5px] font-semibold text-[#1D1D1F]">{title}</h3>
          {subtitle ? (
            <p className="mt-0.5 text-[12px] leading-snug text-[#8E8E93]">{subtitle}</p>
          ) : null}
        </div>
        {badge}
      </div>
      {children}
    </div>
  );
}

export function InsightBox({ items, note }: { items: string[]; note?: string }) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-[#007AFF]/15 bg-[#F0F7FF] p-5">
      <div className="flex items-center gap-2 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-[#007AFF]">
        <Lightbulb size={14} strokeWidth={2.2} />
        In sintesi
      </div>
      <ul className="mt-3 space-y-2.5">
        {items.map((item, index) => (
          <li key={index} className="flex gap-2.5 text-[13px] leading-relaxed text-[#3A3A3C]">
            <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#007AFF]" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      {note ? (
        <p className="mt-auto pt-4 text-[11px] leading-relaxed text-[#007AFF]/75">{note}</p>
      ) : null}
    </div>
  );
}

export function NoteBox({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white/60 p-4 text-[12.5px] leading-relaxed text-[#6E6E73]">
      {children}
    </div>
  );
}
