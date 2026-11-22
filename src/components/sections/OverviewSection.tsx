import { ChartCard, InsightBox, StatCard, StatRow } from '../ui';
import { PlotlyChart } from '../PlotlyChart';
import { DatasetMeta, PeriodKey, SatelliteRecord } from '../../types/dataset';
import {
  computeSummary,
  computeTimeline,
  formatNumber,
  formatPct,
  getPeriodRange,
  niceTicks,
} from '../../utils/analytics';
import { COLORS } from '../../utils/chartTheme';

interface OverviewSectionProps {
  records: SatelliteRecord[];
  timelineRecords: SatelliteRecord[];
  meta: DatasetMeta;
  period: PeriodKey;
}

export function OverviewSection({ records, timelineRecords, meta, period }: OverviewSectionProps) {
  const summary = computeSummary(records);
  const timeline = computeTimeline(timelineRecords, meta.timelineStart, meta.timelineEnd);
  const range = getPeriodRange(period);

  const highlightStart = period === 'all' ? 2020 : range.min;
  const highlightEnd = period === 'all' ? meta.timelineEnd : range.max;

  const peak = timeline.reduce(
    (best, point) => (point.value > best.value ? point : best),
    timeline[0] ?? { year: meta.timelineEnd, value: 0 }
  );

  const chartedTotal = timeline.reduce((sum, point) => sum + point.value, 0);
  const recentInChart = timeline
    .filter((point) => point.year >= 2020)
    .reduce((sum, point) => sum + point.value, 0);
  const recentShare = chartedTotal > 0 ? (recentInChart / chartedTotal) * 100 : 0;
  const yTicks = niceTicks(Math.max(...timeline.map((point) => point.value), 0), 5);

  const data: Plotly.Data[] = [
    {
      type: 'bar',
      x: timeline.map((point) => point.year),
      y: timeline.map((point) => point.value),
      marker: {
        color: timeline.map((point) =>
          point.year >= highlightStart && point.year <= highlightEnd
            ? COLORS.accent
            : COLORS.accentSoft
        ),
        line: { width: 0 },
      },
      hovertemplate: '%{x}: <b>%{y}</b> satelliti<extra></extra>',
    },
  ];

  const layout: Partial<Plotly.Layout> = {
    height: 320,
    bargap: 0.26,
    margin: { l: 48, r: 8, t: 8, b: 30 },
    xaxis: {
      tickmode: 'array',
      tickvals: [1975, 1980, 1985, 1990, 1995, 2000, 2005, 2010, 2015, 2020],
      tickfont: { color: COLORS.muted, size: 11 },
      showgrid: false,
    },
    yaxis: {
      rangemode: 'tozero',
      tickvals: yTicks.vals,
      ticktext: yTicks.text,
      title: {
        text: 'Satelliti lanciati',
        font: { size: 11, color: COLORS.muted },
        standoff: 10,
      },
    },
  };

  return (
    <div className="mt-6">
      <StatRow>
        <StatCard
          label="Satelliti nella selezione"
          value={formatNumber(summary.total)}
          hint={`su ${formatNumber(meta.satelliteCount)} censiti`}
          accent
        />
        <StatCard
          label="In orbita"
          value={formatNumber(summary.inOrbit)}
          hint={`${formatPct(summary.inOrbitPct)} della selezione`}
        />
        <StatCard
          label="Uso commerciale"
          value={formatPct(summary.commercialPct)}
          hint={`${formatNumber(summary.commercial)} satelliti`}
        />
      </StatRow>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <ChartCard
          className="lg:col-span-2"
          title="Lanci di satelliti per anno"
          subtitle={
            period === 'all'
              ? '1974–2022 · in blu i lanci dal 2020'
              : '1974–2022 · in blu il periodo selezionato'
          }
        >
          <PlotlyChart data={data} layout={layout} height={320} />
        </ChartCard>
        <InsightBox
          note="Il 2023 è escluso dal grafico: il censimento UCS si ferma al 27 aprile 2023."
          items={[
            `Il ${formatPct(recentShare)} dei satelliti lanciati tra il 1974 e il 2022 è partito dal 2020.`,
            `Il ${peak.year} è l'anno record: ${formatNumber(peak.value)} satelliti lanciati.`,
            `Il ${formatPct(summary.commercialPct)} dei satelliti selezionati è a uso commerciale.`,
          ]}
        />
      </div>
    </div>
  );
}
