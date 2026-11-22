import { ChartCard, InsightBox, SectionHeader, StatCard, StatRow } from '../ui';
import { PlotlyChart } from '../PlotlyChart';
import { SatelliteRecord } from '../../types/dataset';
import {
  computeSummary,
  formatNumber,
  formatPct,
  niceTicks,
  truncateLabel,
} from '../../utils/analytics';
import { COLORS } from '../../utils/chartTheme';

interface OperatorsSectionProps {
  records: SatelliteRecord[];
}

function buildBarChart(
  items: { label: string; value: number }[],
  total: number,
  maxLabelLength: number
): { data: Plotly.Data[]; layout: Partial<Plotly.Layout> } {
  const reversed = [...items].reverse();
  const maxValue = Math.max(...items.map((item) => item.value), 1);
  const ticks = niceTicks(maxValue, 3);

  const data: Plotly.Data[] = [
    {
      type: 'bar',
      orientation: 'h',
      x: reversed.map((item) => item.value),
      y: reversed.map((item) => truncateLabel(item.label, maxLabelLength)),
      customdata: reversed.map((item) => [
        item.label,
        formatNumber(item.value),
        formatPct(total > 0 ? (item.value / total) * 100 : 0, 1),
      ]),
      marker: {
        color: reversed.map((_, index) =>
          index === reversed.length - 1 ? COLORS.accent : COLORS.accentSoft
        ),
        line: { width: 0 },
      },
      text: reversed.map((item) =>
        formatPct(total > 0 ? (item.value / total) * 100 : 0, 1)
      ),
      textposition: 'outside',
      cliponaxis: false,
      textfont: { size: 11, color: COLORS.muted },
      hovertemplate:
        '<b>%{customdata[0]}</b><br>%{customdata[1]} satelliti · %{customdata[2]}<extra></extra>',
    },
  ];

  const layout: Partial<Plotly.Layout> = {
    height: 360,
    bargap: 0.35,
    margin: { l: 8, r: 54, t: 4, b: 4 },
    xaxis: {
      range: [0, maxValue * 1.22],
      showgrid: true,
      gridcolor: COLORS.grid,
      tickvals: ticks.vals,
      ticktext: ticks.text,
      tickangle: 0,
      tickfont: { size: 10.5, color: COLORS.muted },
    },
    yaxis: {
      showgrid: false,
      automargin: true,
      tickfont: { size: 11.5, color: COLORS.text },
    },
  };

  return { data, layout };
}

export function OperatorsSection({ records }: OperatorsSectionProps) {
  const summary = computeSummary(records);
  const topOperator = summary.operators[0];
  const topCountry = summary.countries[0];

  const operatorsChart = buildBarChart(summary.operators, summary.total, 27);
  const countriesChart = buildBarChart(summary.countries, summary.total, 22);
  countriesChart.layout.height = 300;

  const top3Names = summary.operators
    .slice(0, 3)
    .map((item) => item.label)
    .join(', ');

  return (
    <section id="operatori" className="scroll-mt-24">
      <SectionHeader
        number="02"
        title="Pochi operatori, molti satelliti"
        description="La flotta è concentrata nelle mani di poche aziende e pochi paesi. Le barre mostrano quanti satelliti gestisce ogni operatore e da dove opera."
      />

      <StatRow>
        <StatCard
          label="Operatori"
          value={formatNumber(summary.operatorCount)}
          hint="con almeno un satellite nella selezione"
        />
        <StatCard
          label="Primi 3 operatori"
          value={formatPct(summary.top3OperatorShare)}
          hint={top3Names || 'Nessun operatore'}
          accent
        />
        <StatCard
          label="Paese principale"
          value={topCountry?.label ?? '—'}
          hint={
            topCountry
              ? `${formatPct((topCountry.value / Math.max(summary.total, 1)) * 100)} dei satelliti`
              : 'Nessun dato'
          }
        />
      </StatRow>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="I 10 operatori più presenti"
          subtitle="Numero di satelliti · % sul totale della selezione"
        >
          <PlotlyChart data={operatorsChart.data} layout={operatorsChart.layout} height={360} />
        </ChartCard>
        <ChartCard
          title="I 8 paesi con più satelliti"
          subtitle="Paese dichiarato dall'operatore · % sul totale"
        >
          <PlotlyChart data={countriesChart.data} layout={countriesChart.layout} height={300} />
        </ChartCard>
      </div>

      <div className="mt-4">
        <InsightBox
          items={[
            topOperator
              ? `${topOperator.label} gestisce il ${formatPct(
                  (topOperator.value / Math.max(summary.total, 1)) * 100,
                  1
                )} dei satelliti della selezione.`
              : 'Nessun operatore corrisponde ai filtri.',
            `I primi 3 operatori coprono il ${formatPct(summary.top3OperatorShare)} del totale.`,
            topCountry
              ? `Il paese principale è ${topCountry.label}, con il ${formatPct(
                  (topCountry.value / Math.max(summary.total, 1)) * 100
                )} dei satelliti.`
              : 'Nessun paese corrisponde ai filtri.',
          ]}
        />
      </div>
    </section>
  );
}
