import { useState } from 'react';
import { ChartCard, SectionHeader, StatCard } from '../ui';
import { PlotlyChart } from '../PlotlyChart';
import { CatalogStats } from '../../types/dataset';
import { formatNumber, formatPct, niceTicks } from '../../utils/analytics';
import { COLORS, TYPE_COLORS } from '../../utils/chartTheme';
import {
  TrendingUp,
  RefreshCw,
  Trash2,
  Info,
  Layers,
} from 'lucide-react';

interface SatcatSectionProps {
  catalog: CatalogStats;
}

type TimelineViewMode = 'all' | 'payloads' | 'total';

export function SatcatSection({ catalog }: SatcatSectionProps) {
  const [viewMode, setViewMode] = useState<TimelineViewMode>('all');

  const timeline = catalog.timeline || [];
  const insights = catalog.insights;

  // Massimo per la scala Y del grafico storico
  const maxPayload = Math.max(...timeline.map((p) => p.payloads), 1);
  const maxTotal = Math.max(...timeline.map((p) => p.total), 1);
  const maxY = viewMode === 'payloads' ? maxPayload : maxTotal;
  const historyTicks = niceTicks(maxY, 5);

  const historyTraces: Plotly.Data[] = [];

  // Traccia 1: Totale oggetti tracciati (Payload + Stadi + Detriti generati dal lancio)
  if (viewMode === 'all' || viewMode === 'total') {
    historyTraces.push({
      type: 'bar',
      name: 'Totale oggetti immessi',
      x: timeline.map((p) => p.year),
      y: timeline.map((p) => p.total),
      marker: {
        color: timeline.map((p) => (p.year >= 2020 ? '#CBD5E1' : '#E2E8F0')),
        line: { width: 0 },
      },
      opacity: viewMode === 'all' ? 0.8 : 1,
      hovertemplate:
        '<b>Anno %{x}</b><br>Totale oggetti tracciati: <b>%{y:,}</b><extra></extra>',
    });
  }

  // Traccia 2: Satelliti (Payloads)
  if (viewMode === 'all' || viewMode === 'payloads') {
    historyTraces.push({
      type: 'bar',
      name: 'Satelliti operativi (payload)',
      x: timeline.map((p) => p.year),
      y: timeline.map((p) => p.payloads),
      marker: {
        color: timeline.map((p) => (p.year >= 2020 ? '#007AFF' : '#60A5FA')),
        line: { width: 0 },
      },
      hovertemplate:
        '<b>Anno %{x}</b><br>Satelliti (payload): <b>%{y:,}</b><extra></extra>',
    });
  }

  const historyLayout: Partial<Plotly.Layout> = {
    height: 380,
    barmode: viewMode === 'all' ? 'overlay' : 'group',
    bargap: 0.18,
    margin: { l: 52, r: 16, t: 28, b: 36 },
    showlegend: viewMode === 'all',
    legend: {
      orientation: 'h',
      x: 0,
      y: 1.12,
      font: { size: 11, color: COLORS.muted },
    },
    xaxis: {
      tickmode: 'array',
      tickvals: [1957, 1965, 1975, 1985, 1995, 2005, 2015, 2020, 2025],
      tickfont: { color: COLORS.muted, size: 10.5 },
      showgrid: false,
    },
    yaxis: {
      rangemode: 'tozero',
      tickvals: historyTicks.vals,
      ticktext: historyTicks.text,
      showgrid: true,
      gridcolor: COLORS.grid,
      title: {
        text:
          viewMode === 'payloads'
            ? 'Satelliti lanciati per anno'
            : viewMode === 'total'
              ? 'Totale oggetti immessi per anno'
              : 'Satelliti e oggetti tracciati',
        font: { size: 11, color: COLORS.muted },
        standoff: 10,
      },
    },
  };

  // Grafico composizione orbita
  const reversed = [...catalog.byType].reverse();
  const maxType = Math.max(...catalog.byType.map((item) => item.value), 1);
  const compTicks = niceTicks(maxType, 3);

  const compositionData: Plotly.Data[] = [
    {
      type: 'bar',
      orientation: 'h',
      x: reversed.map((item) => item.value),
      y: reversed.map((item) => item.label),
      customdata: reversed.map((item) => [
        formatNumber(item.value),
        formatPct(catalog.inOrbit > 0 ? (item.value / catalog.inOrbit) * 100 : 0, 1),
      ]),
      marker: {
        color: reversed.map((item) => TYPE_COLORS[item.label] ?? COLORS.gray),
        line: { width: 0 },
      },
      text: reversed.map((item) =>
        formatPct(catalog.inOrbit > 0 ? (item.value / catalog.inOrbit) * 100 : 0)
      ),
      textposition: 'outside',
      cliponaxis: false,
      textfont: { size: 11, color: COLORS.muted },
      hovertemplate:
        '<b>%{y}</b><br>%{customdata[0]} oggetti · %{customdata[1]}<extra></extra>',
    },
  ];

  const compositionLayout: Partial<Plotly.Layout> = {
    height: 260,
    bargap: 0.38,
    margin: { l: 8, r: 50, t: 4, b: 4 },
    xaxis: {
      range: [0, maxType * 1.22],
      showgrid: true,
      gridcolor: COLORS.grid,
      tickvals: compTicks.vals,
      ticktext: compTicks.text,
      tickangle: 0,
      tickfont: { size: 10.5, color: COLORS.muted },
    },
    yaxis: {
      showgrid: false,
      automargin: true,
      tickfont: { size: 11.5, color: COLORS.text },
    },
  };

  const maxEra = Math.max(...catalog.byEra.map((item) => item.value), 1);
  const eraTicks = niceTicks(maxEra, 3);

  const eraData: Plotly.Data[] = [
    {
      type: 'bar',
      x: catalog.byEra.map((item) => item.label),
      y: catalog.byEra.map((item) => item.value),
      marker: {
        color: catalog.byEra.map((_, index) =>
          index === catalog.byEra.length - 1 ? COLORS.accent : COLORS.accentSoft
        ),
        line: { width: 0 },
      },
      text: catalog.byEra.map((item) => formatNumber(item.value)),
      textposition: 'outside',
      cliponaxis: false,
      textfont: { size: 11, color: COLORS.muted },
      hovertemplate: '%{x}: <b>%{y}</b> oggetti in orbita<extra></extra>',
    },
  ];

  const eraLayout: Partial<Plotly.Layout> = {
    height: 260,
    bargap: 0.4,
    margin: { l: 48, r: 8, t: 22, b: 4 },
    xaxis: {
      showgrid: false,
      tickfont: { size: 10.5, color: COLORS.muted },
    },
    yaxis: {
      range: [0, maxEra * 1.18],
      rangemode: 'tozero',
      tickvals: eraTicks.vals,
      ticktext: eraTicks.text,
      title: {
        text: 'Oggetti in orbita',
        font: { size: 11, color: COLORS.muted },
        standoff: 10,
      },
    },
  };

  return (
    <section id="satcat" className="scroll-mt-24">
      <SectionHeader
        number="04"
        title="Catalogo SATCAT: 70 anni di evoluzione orbitale"
        description="Il catalogo SATCAT traccia ogni singolo oggetto entrato nello spazio dal 1957 a oggi: satelliti, stadi di razzi vettori e frammenti di detriti. Ecco l'analisi quantitativa della popolazione orbitale."
        badge="Catalogo SATCAT completo · 1957–2026 · senza filtri"
      />

      {/* KPI Cards con chiarimento esplicito delle definizioni */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Tutti gli oggetti in orbita oggi"
          value={formatNumber(catalog.inOrbit)}
          hint="Popolazione totale attualmente nello spazio (satelliti + relitti/detriti)"
          accent
        />
        <StatCard
          label="Satelliti in orbita (payload)"
          value={formatNumber(insights?.payloadsInOrbit ?? catalog.payloadsInOrbit)}
          hint={`${formatPct(insights?.payloadsShare ?? catalog.payloadsShare, 1)} del totale in orbita (il 75,8% è partito dal 2020)`}
        />
        <StatCard
          label="Frammenti di detriti in orbita"
          value={formatNumber(insights?.debrisFragmentsInOrbit ?? catalog.debrisInOrbit)}
          hint={`${formatPct(catalog.debrisShare, 1)} dell'orbita: schegge da esplosioni, test e impatti`}
        />
        <StatCard
          label="Totale storico censito (dal 1957)"
          value={formatNumber(catalog.totalObjects)}
          hint={`di cui ${formatNumber(catalog.reentered)} già rientrati nell'atmosfera (${formatPct(insights?.reenteredShare ?? 49.9, 1)}%)`}
        />
      </div>

      {/* Box Chiarimento Anatomia dell'Orbita */}
      <div className="mt-3.5 rounded-2xl border border-black/[0.06] bg-[#F5F5F7]/80 p-4 sm:p-4.5">
        <div className="flex items-start gap-2.5">
          <Info size={16} className="mt-0.5 shrink-0 text-[#007AFF]" />
          <div className="text-[12.5px] leading-relaxed text-[#52525B]">
            <p className="mt-1">
              Dei <strong>{formatNumber(catalog.inOrbit)} oggetti attualmente in orbita</strong>:
            </p>
            <div className="mt-2.5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-blue-200/80 bg-white p-2.5 shadow-2xs">
                <div className="flex items-center gap-1.5 font-semibold text-[#007AFF]">
                  <span className="h-2 w-2 rounded-full bg-[#007AFF]" />
                  Satelliti (Payload)
                </div>
                <div className="mt-1 text-[15px] font-bold text-[#1D1D1F]">
                  {formatNumber(insights?.payloadsInOrbit ?? 18128)}{' '}
                  <span className="text-[11.5px] font-normal text-[#8E8E93]">(55,1%)</span>
                </div>
                <p className="mt-0.5 text-[11px] text-[#6E6E73]">
                  Satelliti completi (funzionanti e spenti).
                </p>
              </div>

              <div className="rounded-xl border border-red-200/80 bg-white p-2.5 shadow-2xs">
                <div className="flex items-center gap-1.5 font-semibold text-[#FF3B30]">
                  <span className="h-2 w-2 rounded-full bg-[#FF3B30]" />
                  Frammenti di detriti
                </div>
                <div className="mt-1 text-[15px] font-bold text-[#1D1D1F]">
                  {formatNumber(catalog.debrisInOrbit)}{' '}
                  <span className="text-[11.5px] font-normal text-[#8E8E93]">(34,6%)</span>
                </div>
                <p className="mt-0.5 text-[11px] text-[#6E6E73]">
                  Schegge e frammenti da esplosioni o collisioni.
                </p>
              </div>

              <div className="rounded-xl border border-amber-200/80 bg-white p-2.5 shadow-2xs">
                <div className="flex items-center gap-1.5 font-semibold text-[#FF9500]">
                  <span className="h-2 w-2 rounded-full bg-[#FF9500]" />
                  Stadi di razzo
                </div>
                <div className="mt-1 text-[15px] font-bold text-[#1D1D1F]">
                  2.008 <span className="text-[11.5px] font-normal text-[#8E8E93]">(6,1%)</span>
                </div>
                <p className="mt-0.5 text-[11px] text-[#6E6E73]">
                  Ultimi stadi propulsivi abbandonati dopo il lancio.
                </p>
              </div>

              <div className="rounded-xl border border-purple-200/80 bg-white p-2.5 shadow-2xs">
                <div className="flex items-center gap-1.5 font-semibold text-[#7A5AF8]">
                  <span className="h-2 w-2 rounded-full bg-[#7A5AF8]" />
                  Componenti
                </div>
                <div className="mt-1 text-[15px] font-bold text-[#1D1D1F]">
                  1.389 <span className="text-[11.5px] font-normal text-[#8E8E93]">(4,2%)</span>
                </div>
                <p className="mt-0.5 text-[11px] text-[#6E6E73]">
                  Adattatori, coperture e meccanismi di rilascio.
                </p>
              </div>
            </div>
            <p className="mt-2 text-[11.5px] text-[#8E8E93]">
              Sommando i frammenti di detriti (11.390), gli stadi di razzo (2.008) e i componenti (1.389),
              i <strong>relitti non funzionali in orbita sono 14.787</strong> (il <strong>44,9%</strong> di tutto ciò che fluttua nello spazio).
            </p>
          </div>
        </div>
      </div>

      {/* Grafico temporale storico */}
      <div className="mt-4">
        <ChartCard
          title="Timeline storica dei lanci (1957–2026)"
          subtitle="Confronto temporale tra satelliti operativi (payload) e totale oggetti immessi in catalogo per anno"
          badge={
            <div className="flex items-center gap-1 rounded-full border border-black/[0.08] bg-[#F5F5F7] p-1 text-[11px] font-medium text-[#6E6E73]">
              <button
                type="button"
                onClick={() => setViewMode('all')}
                className={`rounded-full px-2.5 py-1 transition-colors ${
                  viewMode === 'all'
                    ? 'bg-white text-[#1D1D1F] shadow-xs font-semibold'
                    : 'hover:text-[#1D1D1F]'
                }`}
              >
                Tutti (Satelliti + Totale)
              </button>
              <button
                type="button"
                onClick={() => setViewMode('payloads')}
                className={`rounded-full px-2.5 py-1 transition-colors ${
                  viewMode === 'payloads'
                    ? 'bg-white text-[#1D1D1F] shadow-xs font-semibold'
                    : 'hover:text-[#1D1D1F]'
                }`}
              >
                Solo Satelliti
              </button>
              <button
                type="button"
                onClick={() => setViewMode('total')}
                className={`rounded-full px-2.5 py-1 transition-colors ${
                  viewMode === 'total'
                    ? 'bg-white text-[#1D1D1F] shadow-xs font-semibold'
                    : 'hover:text-[#1D1D1F]'
                }`}
              >
                Solo Totale
              </button>
            </div>
          }
        >
          <PlotlyChart data={historyTraces} layout={historyLayout} height={380} />

          {/* 3 Conclusioni analitiche tratte dai dati aggregati */}
          <div className="mt-5 grid gap-3.5 sm:grid-cols-3">
            {/* Conclusione 1: Impennata 2020+ */}
            <div className="rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-50/70 to-white p-4.5">
              <div className="flex items-center gap-2 text-[12px] font-semibold text-[#007AFF]">
                <TrendingUp size={16} strokeWidth={2.2} />
                La svolta esponenziale (2020–oggi)
              </div>
              <div className="mt-2 text-[22px] font-bold text-[#1D1D1F]">
                75,8%
                <span className="ml-1 text-[12px] font-normal text-[#6E6E73]">
                  dei satelliti in orbita
                </span>
              </div>
              <p className="mt-2 text-[12.5px] leading-relaxed text-[#52525B]">
                Su 18.128 satelliti presenti oggi nello spazio, ben <strong>13.738</strong> sono
                stati lanciati dal 2020 in avanti. In soli 7 anni (2019–2026) sono stati messi in
                orbita più satelliti che nei primi 60 anni di astronautica messi insieme.
              </p>
            </div>

            {/* Conclusione 2: Inversione Satelliti vs Rifiuti */}
            <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/60 to-white p-4.5">
              <div className="flex items-center gap-2 text-[12px] font-semibold text-amber-700">
                <Trash2 size={16} strokeWidth={2.2} />
                Inversione tra Rifiuti e Satelliti
              </div>
              <div className="mt-2 text-[22px] font-bold text-[#1D1D1F]">
                &gt;85%
                <span className="ml-1 text-[12px] font-normal text-[#6E6E73]">
                  satelliti utili nei lanci odierni
                </span>
              </div>
              <p className="mt-2 text-[12.5px] leading-relaxed text-[#52525B]">
                Per decenni (fino al 2018), ogni anno la maggioranza degli oggetti immessi nello spazio
                era composta da frammenti di detriti e stadi esausti. Oggi, grazie a dispenser compatti e
                regole anti-detrito, la quasi totalità degli oggetti immessi sono payload operativi.
              </p>
            </div>

            {/* Conclusione 3: Il bilancio di rientro */}
            <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/60 to-white p-4.5">
              <div className="flex items-center gap-2 text-[12px] font-semibold text-emerald-700">
                <RefreshCw size={16} strokeWidth={2.2} />
                Il ciclo di rientro atmosferico
              </div>
              <div className="mt-2 text-[22px] font-bold text-[#1D1D1F]">
                49,9%
                <span className="ml-1 text-[12px] font-normal text-[#6E6E73]">
                  degli oggetti già rientrati
                </span>
              </div>
              <p className="mt-2 text-[12.5px] leading-relaxed text-[#52525B]">
                Su 68.140 oggetti catalogati dal 1957, esattamente la metà (<strong>33.969</strong>)
                è già decaduta e bruciata nell&apos;atmosfera terrestre. La popolazione orbitale è un equilibrio
                dinamico tra nuovi inserimenti e rientri naturali o pilotati.
              </p>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Grafici di composizione e detriti */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Composizione dettagliata della popolazione orbitale"
          subtitle={`${formatNumber(catalog.inOrbit)} oggetti attualmente nello spazio`}
        >
          <PlotlyChart data={compositionData} layout={compositionLayout} height={260} />
        </ChartCard>
        <ChartCard
          title="Età degli oggetti attualmente in orbita"
          subtitle="Distribuzione degli oggetti ancora nello spazio per decennio di immissione"
        >
          <PlotlyChart data={eraData} layout={eraLayout} height={260} />
        </ChartCard>
      </div>
    </section>
  );
}

// Esporta anche come DebrisSection per retrocompatibilità
export { SatcatSection as DebrisSection };
