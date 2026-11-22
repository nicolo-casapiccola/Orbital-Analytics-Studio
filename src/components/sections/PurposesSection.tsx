import { ChartCard, InsightBox, SectionHeader, StatCard, StatRow } from '../ui';
import { PlotlyChart } from '../PlotlyChart';
import { SatelliteRecord } from '../../types/dataset';
import {
  computePurposeByOrbit,
  computeSummary,
  formatNumber,
  formatPct,
  formatShare,
  niceTicks,
} from '../../utils/analytics';
import { COLORS, PURPOSE_COLORS } from '../../utils/chartTheme';

interface PurposesSectionProps {
  records: SatelliteRecord[];
}

export function PurposesSection({ records }: PurposesSectionProps) {
  const summary = computeSummary(records);
  const topPurpose = summary.purposeCounts[0];
  const secondPurpose = summary.purposeCounts[1];
  const leo = summary.orbitCounts.find((item) => item.label === 'LEO');

  const reversed = [...summary.purposeCounts].reverse();
  const maxPurpose = Math.max(...summary.purposeCounts.map((item) => item.value), 1);
  const purposeTicks = niceTicks(maxPurpose, 3);

  const purposesData: Plotly.Data[] = [
    {
      type: 'bar',
      orientation: 'h',
      x: reversed.map((item) => item.value),
      y: reversed.map((item) => item.label),
      customdata: reversed.map((item) => [
        formatNumber(item.value),
        formatPct(summary.total > 0 ? (item.value / summary.total) * 100 : 0, 1),
      ]),
      marker: {
        color: reversed.map((item) => PURPOSE_COLORS[item.label] ?? COLORS.gray),
        line: { width: 0 },
      },
      text: reversed.map((item) =>
        formatShare(summary.total > 0 ? (item.value / summary.total) * 100 : 0)
      ),
      textposition: 'outside',
      cliponaxis: false,
      textfont: { size: 11, color: COLORS.muted },
      hovertemplate:
        '<b>%{y}</b><br>%{customdata[0]} satelliti · %{customdata[1]}<extra></extra>',
    },
  ];

  const purposesLayout: Partial<Plotly.Layout> = {
    height: 300,
    bargap: 0.38,
    margin: { l: 8, r: 50, t: 4, b: 4 },
    xaxis: {
      range: [0, maxPurpose * 1.22],
      showgrid: true,
      gridcolor: COLORS.grid,
      tickvals: purposeTicks.vals,
      ticktext: purposeTicks.text,
      tickangle: 0,
      tickfont: { size: 10.5, color: COLORS.muted },
    },
    yaxis: {
      showgrid: false,
      automargin: true,
      tickfont: { size: 11.5, color: COLORS.text },
    },
  };

  const byOrbit = computePurposeByOrbit(records);
  const stackedData: Plotly.Data[] = byOrbit.purposes.map((purpose) => {
    const color = PURPOSE_COLORS[purpose] ?? COLORS.gray;
    return {
      type: 'bar',
      orientation: 'h',
      name: purpose,
      y: byOrbit.rows.map((row) => row.orbit),
      x: byOrbit.rows.map(
        (row) => row.segments.find((segment) => segment.purpose === purpose)?.pct ?? 0
      ),
      customdata: byOrbit.rows.map((row) => {
        const segment = row.segments.find((item) => item.purpose === purpose);
        return [segment?.count ?? 0, row.total];
      }),
      marker: { color, line: { width: 0 } },
      text: byOrbit.rows.map((row) => {
        const segment = row.segments.find((item) => item.purpose === purpose);
        return segment && segment.pct >= 10 ? `${Math.round(segment.pct)}%` : '';
      }),
      textposition: 'inside',
      insidetextanchor: 'middle',
      textfont: { size: 11, color: '#FFFFFF' },
      hovertemplate: `%{y} · <b>${purpose}</b><br>%{customdata[0]} satelliti su %{customdata[1]}<extra></extra>`,
    };
  });

  const stackedLayout: Partial<Plotly.Layout> = {
    height: 250,
    barmode: 'stack',
    bargap: 0.45,
    margin: { l: 8, r: 8, t: 4, b: 4 },
    xaxis: {
      range: [0, 100],
      autorange: false,
      ticksuffix: '%',
      tickvals: [0, 25, 50, 75, 100],
      showgrid: false,
      tickfont: { size: 10.5, color: COLORS.muted },
    },
    yaxis: {
      showgrid: false,
      automargin: true,
      tickfont: { size: 12, color: COLORS.text },
    },
    showlegend: false,
  };

  return (
    <section id="scopi" className="scroll-mt-24">
      <SectionHeader
        number="03"
        title="A cosa servono i satelliti"
        description="Quasi tutta la flotta serve a comunicare o a osservare la Terra. Lo scopo cambia molto anche in base all'orbita: più varietà in basso, più comunicazioni lassù."
      />

      <StatRow>
        <StatCard
          label="Scopo principale"
          value={topPurpose ? formatPct((topPurpose.value / Math.max(summary.total, 1)) * 100) : '—'}
          hint={topPurpose ? `${topPurpose.label} · ${formatNumber(topPurpose.value)} satelliti` : 'Nessun dato'}
          accent
        />
        <StatCard
          label="Secondo scopo"
          value={
            secondPurpose
              ? formatPct((secondPurpose.value / Math.max(summary.total, 1)) * 100)
              : '—'
          }
          hint={
            secondPurpose
              ? `${secondPurpose.label} · ${formatNumber(secondPurpose.value)} satelliti`
              : 'Nessun dato'
          }
        />
        <StatCard
          label="In orbita bassa (LEO)"
          value={leo ? formatPct(summary.leoShare) : '—'}
          hint={leo ? `${formatNumber(leo.value)} satelliti` : 'Nessun dato'}
        />
      </StatRow>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ChartCard title="Satelliti per scopo" subtitle="Numero di satelliti · % sul totale della selezione">
          <PlotlyChart data={purposesData} layout={purposesLayout} height={300} />
        </ChartCard>
        <ChartCard
          title="Scopi per orbita"
          subtitle="Ogni barra è il 100% dei satelliti in quell'orbita"
        >
          <PlotlyChart data={stackedData} layout={stackedLayout} height={250} />
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
            {byOrbit.purposes.map((purpose) => (
              <span
                key={purpose}
                className="flex items-center gap-1.5 text-[11px] text-[#6E6E73]"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: PURPOSE_COLORS[purpose] ?? COLORS.gray }}
                />
                {purpose}
              </span>
            ))}
          </div>
        </ChartCard>
      </div>

      <div className="mt-4">
        <InsightBox
          items={[
            topPurpose
              ? `Lo scopo più diffuso è ${topPurpose.label}, con il ${formatPct(
                  (topPurpose.value / Math.max(summary.total, 1)) * 100
                )} dei satelliti.`
              : 'Nessuno scopo corrisponde ai filtri.',
            secondPurpose
              ? `Al secondo posto c'è ${secondPurpose.label}, con il ${formatPct(
                  (secondPurpose.value / Math.max(summary.total, 1)) * 100
                )}.`
              : 'La selezione contiene un solo scopo.',
            summary.geoCommsShare !== null
              ? `In orbita GEO il ${formatPct(summary.geoCommsShare)} dei satelliti serve alle comunicazioni.`
              : `Il ${formatPct(summary.leoShare)} dei satelliti è in orbita bassa (LEO).`,
          ]}
        />
      </div>
    </section>
  );
}
