import { useMemo, useState } from 'react';
import { ChartCard, SectionHeader, StatCard } from '../ui';
import { PlotlyChart } from '../PlotlyChart';
import { ItalyData } from '../../types/dataset';
import { formatNumber, formatPct, niceTicks } from '../../utils/analytics';
import { COLORS } from '../../utils/chartTheme';
import {
  Search,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface ItalySectionProps {
  italy: ItalyData;
}

type ItalyDistView = 'purpose' | 'operator' | 'site';

export function ItalySection({ italy }: ItalySectionProps) {
  const [distView, setDistView] = useState<ItalyDistView>('purpose');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'reentered'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const { stats, records } = italy;

  // Timeline dei lanci italiani
  const timelineTicks = niceTicks(Math.max(...stats.timeline.map((p) => p.count), 1), 4);
  const timelineData: Plotly.Data[] = [
    {
      type: 'bar',
      x: stats.timeline.map((p) => p.year),
      y: stats.timeline.map((p) => p.count),
      marker: {
        color: stats.timeline.map((p) => {
          if (p.year >= 2020) return '#007AFF'; // New Space boom
          if (p.year >= 1990) return '#00A6A6'; // Programmi ASI
          return '#FF9500'; // Era San Marco
        }),
        line: { width: 0 },
      },
      hovertemplate: '<b>%{x}</b><br>%{y} lanci/oggetti registrati<extra></extra>',
    },
  ];

  const timelineLayout: Partial<Plotly.Layout> = {
    height: 300,
    bargap: 0.25,
    margin: { l: 40, r: 12, t: 16, b: 32 },
    xaxis: {
      tickmode: 'array',
      tickvals: [1964, 1970, 1977, 1988, 1992, 2000, 2007, 2012, 2017, 2021, 2023],
      tickfont: { color: COLORS.muted, size: 10.5 },
      showgrid: false,
    },
    yaxis: {
      rangemode: 'tozero',
      tickvals: timelineTicks.vals,
      ticktext: timelineTicks.text,
      title: {
        text: 'Lanci registrati',
        font: { size: 11, color: COLORS.muted },
        standoff: 8,
      },
    },
  };

  // Grafico di distribuzione (Scopo / Operatore / Luogo di Lancio)
  const currentDistData = useMemo(() => {
    if (distView === 'purpose') return stats.byPurpose;
    if (distView === 'operator') return stats.byOperatorCategory;
    return stats.byLaunchSite;
  }, [distView, stats]);

  const maxDist = Math.max(...currentDistData.map((d) => d.value), 1);
  const distTicks = niceTicks(maxDist, 4);

  const distColors = [
    '#007AFF',
    '#00A6A6',
    '#7A5AF8',
    '#FF9500',
    '#34C759',
    '#FF2D55',
    '#8E8E93',
    '#C7C7CC',
    '#5AC8FA',
    '#AF52DE',
  ];

  const distributionPlotData: Plotly.Data[] = [
    {
      type: 'bar',
      orientation: 'h',
      x: [...currentDistData].reverse().map((d) => d.value),
      y: [...currentDistData].reverse().map((d) => d.label),
      text: [...currentDistData].reverse().map((d) => String(d.value)),
      textposition: 'outside',
      cliponaxis: false,
      marker: {
        color: [...currentDistData]
          .reverse()
          .map((_, i) => distColors[i % distColors.length]),
        line: { width: 0 },
      },
      hovertemplate: '<b>%{y}</b>: %{x} oggetti<extra></extra>',
    },
  ];

  const distributionLayout: Partial<Plotly.Layout> = {
    height: 300,
    bargap: 0.35,
    margin: { l: 8, r: 40, t: 12, b: 12 },
    xaxis: {
      range: [0, maxDist * 1.25],
      showgrid: true,
      gridcolor: COLORS.grid,
      tickvals: distTicks.vals,
      ticktext: distTicks.text,
      tickfont: { size: 10.5, color: COLORS.muted },
    },
    yaxis: {
      showgrid: false,
      automargin: true,
      tickfont: { size: 11, color: COLORS.text },
    },
  };

  // Filtraggio e ricerca tabella record ASI
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (statusFilter === 'active' && !r.active) return false;
      if (statusFilter === 'reentered' && r.status !== 'Rientrato') return false;

      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return (
        r.name.toLowerCase().includes(q) ||
        r.operator.toLowerCase().includes(q) ||
        r.purpose.toLowerCase().includes(q) ||
        r.cospar.toLowerCase().includes(q) ||
        r.launchSiteClean.toLowerCase().includes(q)
      );
    });
  }, [records, statusFilter, searchTerm]);

  return (
    <section id="italia" className="scroll-mt-24">
      <SectionHeader
        number="05"
        title="L'Italia nello Spazio"
        description="Dalla storica piattaforma marina equatoriale San Marco in Kenya (1964) fino ai radar di precisione COSMO-SkyMed e ai vettori logistici orbitali ION. Analisi del Registro Nazionale degli Oggetti Spaziali (ASI)."
        badge="Registro ASI (/datasets/asi.csv) & SATCAT"
      />

      {/* KPI Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Oggetti nel Registro ASI"
          value={formatNumber(stats.totalObjects)}
          hint="dal San Marco 1 (1964) a oggi"
        />
        <StatCard
          label="In orbita (operativi)"
          value={formatNumber(stats.activeCount)}
          hint={`${formatPct((stats.activeCount / stats.totalObjects) * 100, 1)} delle missioni registrate`}
          accent
        />
        <StatCard
          label="Operatori censiti"
          value={formatNumber(stats.operatorsCount)}
          hint="ASI, Difesa, D-Orbit, Università"
        />
        <StatCard
          label="Banderuola IT nel SATCAT"
          value={formatNumber(stats.satcatItalianCount)}
          hint="oggetti italiani nel catalogo globale"
        />
      </div>

      {/* Grafici: Timeline e Ripartizione */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* Timeline */}
        <ChartCard
          title="Evoluzione temporale dei lanci italiani (1964–2024)"
          subtitle="In arancione i primi San Marco, in verde-blu i programmi ASI/Difesa, in blu il boom recente"
        >
          <PlotlyChart data={timelineData} layout={timelineLayout} height={300} />
          <div className="mt-3 flex items-center justify-between text-[11px] text-[#8E8E93]">
            <span>1964: San Marco 1</span>
            <span>2007: COSMO-SkyMed 1</span>
            <span>2020+: Boom D-Orbit ION & CubeSat</span>
          </div>
        </ChartCard>

        {/* Distribuzione con toggle */}
        <ChartCard
          title="Composizione della flotta spaziale italiana"
          subtitle="Ripartizione degli oggetti del registro per dominio, ente operatore o base di lancio"
          badge={
            <div className="flex items-center gap-1 rounded-full border border-black/[0.08] bg-[#F5F5F7] p-1 text-[11px] font-medium text-[#6E6E73]">
              <button
                type="button"
                onClick={() => setDistView('purpose')}
                className={`rounded-full px-2.5 py-1 transition-colors ${
                  distView === 'purpose'
                    ? 'bg-white text-[#1D1D1F] shadow-xs font-semibold'
                    : 'hover:text-[#1D1D1F]'
                }`}
              >
                Missione
              </button>
              <button
                type="button"
                onClick={() => setDistView('operator')}
                className={`rounded-full px-2.5 py-1 transition-colors ${
                  distView === 'operator'
                    ? 'bg-white text-[#1D1D1F] shadow-xs font-semibold'
                    : 'hover:text-[#1D1D1F]'
                }`}
              >
                Operatore
              </button>
              <button
                type="button"
                onClick={() => setDistView('site')}
                className={`rounded-full px-2.5 py-1 transition-colors ${
                  distView === 'site'
                    ? 'bg-white text-[#1D1D1F] shadow-xs font-semibold'
                    : 'hover:text-[#1D1D1F]'
                }`}
              >
                Luogo Lancio
              </button>
            </div>
          }
        >
          <PlotlyChart data={distributionPlotData} layout={distributionLayout} height={300} />
        </ChartCard>
      </div>

      {/* Tabella interattiva dei record del Registro ASI */}
      <div className="mt-4 rounded-2xl border border-black/[0.06] bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-[15px] font-semibold text-[#1D1D1F]">
              Catalogo completo delle missioni italiane (Registro ASI)
            </h3>
            <p className="mt-0.5 text-[12px] text-[#8E8E93]">
              Mostrati {filteredRecords.length} di {records.length} oggetti censiti
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Ricerca */}
            <div className="relative">
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8E8E93]"
              />
              <input
                type="text"
                placeholder="Cerca satellite o ente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8.5 rounded-full border border-black/[0.08] bg-[#F5F5F7] pl-8 pr-3 text-[12px] text-[#1D1D1F] placeholder-[#8E8E93] focus:border-[#007AFF] focus:bg-white focus:outline-hidden"
              />
            </div>

            {/* Filtri pillole stato */}
            <div className="flex items-center gap-1 rounded-full border border-black/[0.08] bg-[#F5F5F7] p-1 text-[11.5px]">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`rounded-full px-2.5 py-1 transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-white text-[#1D1D1F] shadow-xs font-semibold'
                    : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                }`}
              >
                Tutti ({records.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('active')}
                className={`rounded-full px-2.5 py-1 transition-colors ${
                  statusFilter === 'active'
                    ? 'bg-white text-[#007AFF] shadow-xs font-semibold'
                    : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                }`}
              >
                Attivi ({stats.activeCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('reentered')}
                className={`rounded-full px-2.5 py-1 transition-colors ${
                  statusFilter === 'reentered'
                    ? 'bg-white text-[#1D1D1F] shadow-xs font-semibold'
                    : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                }`}
              >
                Rientrati ({stats.reenteredCount})
              </button>
            </div>
          </div>
        </div>

        {/* Tabella con scroll orizzontale/verticale */}
        <div className="mt-4 max-h-[460px] overflow-auto rounded-xl border border-black/[0.06] text-[12.5px]">
          <table className="w-full border-collapse text-left">
            <thead className="sticky top-0 z-10 border-b border-black/[0.06] bg-[#F9F9FA] text-[11px] font-semibold text-[#8E8E93]">
              <tr>
                <th className="px-3.5 py-2.5">Oggetto / Missione</th>
                <th className="px-3 py-2.5">Data Lancio</th>
                <th className="px-3 py-2.5">Operatore</th>
                <th className="px-3 py-2.5">Funzione</th>
                <th className="px-3 py-2.5">Orbita (km)</th>
                <th className="px-3 py-2.5">Base di lancio</th>
                <th className="px-3 py-2.5 text-center">Stato</th>
                <th className="px-3 py-2.5 text-center">Registro ONU</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-[#8E8E93]">
                    Nessun satellite trovato per i criteri specificati.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => (
                  <tr
                    key={r.id}
                    className="transition-colors hover:bg-black/[0.02]"
                  >
                    <td className="px-3.5 py-2.5 font-medium text-[#1D1D1F]">
                      <div className="flex flex-col">
                        <span>{r.name}</span>
                        <span className="font-mono text-[10px] text-[#8E8E93]">
                          COSPAR: {r.cospar || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-[#52525B]">
                      {r.launchDate ? r.launchDate : r.launchYear ?? 'N/A'}
                    </td>
                    <td className="px-3 py-2.5 text-[#1D1D1F]">
                      <div className="flex flex-col">
                        <span className="font-medium">{r.operator}</span>
                        <span className="text-[10.5px] text-[#8E8E93]">
                          {r.operatorCategory}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-[#52525B]">{r.purpose}</td>
                    <td className="px-3 py-2.5 font-mono text-[11px] text-[#52525B]">
                      {r.orbitAlt && r.orbitAlt !== 'N/A' ? r.orbitAlt : 'N/D'}
                    </td>
                    <td className="px-3 py-2.5 text-[#6E6E73]">{r.launchSiteClean}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-medium ${
                          r.active
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : r.status === 'Rientrato'
                              ? 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {r.active ? (
                          <CheckCircle2 size={11} strokeWidth={2.4} />
                        ) : (
                          <AlertCircle size={11} strokeWidth={2.4} />
                        )}
                        {r.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span
                        className={`inline-block rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
                          r.unRegistered
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-zinc-100 text-zinc-500'
                        }`}
                      >
                        {r.unRegistered ? 'Sì' : 'No'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-3 text-[11.5px] text-[#8E8E93]">
          Fonte: <code>/datasets/asi.csv</code> (Registro Nazionale degli Oggetti Spaziali, Agenzia Spaziale Italiana).
        </div>
      </div>
    </section>
  );
}
