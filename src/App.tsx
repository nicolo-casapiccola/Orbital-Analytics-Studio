import { useEffect, useMemo, useState } from 'react';
import datasetJson from './data/dataset.json';
import {
  DatasetFile,
  DEFAULT_FILTERS,
  Filters,
  NAV_ITEMS,
} from './types/dataset';
import {
  ORBIT_ORDER,
  PURPOSE_ORDER,
  USERS_ORDER,
  applyFilters,
  orderedCountBy,
} from './utils/analytics';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { FilterBar } from './components/FilterBar';
import { OverviewSection } from './components/sections/OverviewSection';
import { OperatorsSection } from './components/sections/OperatorsSection';
import { PurposesSection } from './components/sections/PurposesSection';
import { DebrisSection } from './components/sections/DebrisSection';
import { DataTable } from './components/DataTable';

const dataset = datasetJson as unknown as DatasetFile;

export default function App() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [activeSection, setActiveSection] = useState<string>('panoramica');

  const records = useMemo(() => applyFilters(dataset.satellites, filters), [filters]);

  const timelineRecords = useMemo(
    () => applyFilters(dataset.satellites, { ...filters, period: 'all' }),
    [filters.purpose, filters.users, filters.orbit]
  );

  const purposeOptions = useMemo(
    () => orderedCountBy(dataset.satellites, (record) => record.purpose, PURPOSE_ORDER),
    []
  );
  const userOptions = useMemo(
    () => orderedCountBy(dataset.satellites, (record) => record.users, USERS_ORDER),
    []
  );
  const orbitOptions = useMemo(
    () => orderedCountBy(dataset.satellites, (record) => record.orbit, ORBIT_ORDER),
    []
  );

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveSection(visible[0].target.id);
        }
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
    );

    for (const item of NAV_ITEMS) {
      const element = document.getElementById(item.id);
      if (element) observer.observe(element);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen">
      <Header activeSection={activeSection} />

      <main className="mx-auto max-w-[1200px] px-4 pb-16 sm:px-6">
        <section id="panoramica" className="scroll-mt-24">
          <Hero meta={dataset.meta} />
          <FilterBar
            filters={filters}
            onChange={setFilters}
            onReset={() => setFilters(DEFAULT_FILTERS)}
            purposeOptions={purposeOptions}
            userOptions={userOptions}
            orbitOptions={orbitOptions}
            resultCount={records.length}
          />
          <OverviewSection
            records={records}
            timelineRecords={timelineRecords}
            meta={dataset.meta}
            period={filters.period}
          />
        </section>

        <div className="mt-14 space-y-14 sm:mt-16 sm:space-y-16">
          <OperatorsSection records={records} />
          <PurposesSection records={records} />
          <DebrisSection catalog={dataset.meta.catalog} />
          <DataTable records={records} />
        </div>
      </main>

      <footer className="border-t border-black/[0.06] bg-white/50">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-2 px-4 py-8 text-[12px] leading-relaxed text-[#8E8E93] sm:px-6">
          <p>
            <strong className="font-semibold text-[#6E6E73]">Fonti.</strong> Union of Concerned
            Scientists, Satellite Database (snapshot 27 aprile 2023) e SATCAT (68.140 oggetti
            tracciati).
          </p>
          <p>
            I dati sono precalcolati da <code>scripts/prepare-data.mjs</code> a partire dai CSV
            nella cartella <code>/datasets</code>.
          </p>
        </div>
      </footer>
    </div>
  );
}
