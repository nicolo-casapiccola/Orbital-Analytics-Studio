import { ChartCard, InsightBox, NoteBox, SectionHeader, StatCard, StatRow } from '../ui';
import { PlotlyChart } from '../PlotlyChart';
import { CatalogStats } from '../../types/dataset';
import { formatNumber, formatPct, niceTicks } from '../../utils/analytics';
import { COLORS, TYPE_COLORS } from '../../utils/chartTheme';

interface DebrisSectionProps {
  catalog: CatalogStats;
}

export function DebrisSection({ catalog }: DebrisSectionProps) {
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

  const payload = catalog.byType.find((item) => item.label === 'Satelliti (payload)');
  const recentEra = catalog.byEra[catalog.byEra.length - 1];
  const payloadShare =
    payload && catalog.inOrbit > 0 ? (payload.value / catalog.inOrbit) * 100 : 0;
  const recentEraShare =
    recentEra && catalog.inOrbit > 0 ? (recentEra.value / catalog.inOrbit) * 100 : 0;

  return (
    <section id="detriti" className="scroll-mt-24">
      <SectionHeader
        number="04"
        title="Il costo nascosto: i detriti"
        description="Il catalogo SATCAT traccia ogni oggetto in orbita, non solo i satelliti. Detriti, stadi di razzo e componenti sono la maggioranza della popolazione orbitale."
        badge="Catalogo completo · senza filtri"
      />

      <StatRow>
        <StatCard
          label="Oggetti tracciati"
          value={formatNumber(catalog.totalObjects)}
          hint="dal 1957 a oggi"
        />
        <StatCard
          label="Detriti in orbita"
          value={formatPct(catalog.debrisShare, 1)}
          hint={`${formatNumber(catalog.debrisInOrbit)} oggetti`}
          accent
        />
        <StatCard
          label="Già rientrati"
          value={formatNumber(catalog.reentered)}
          hint="bruciati nell'atmosfera o recuperati"
        />
      </StatRow>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Composizione dell'orbita"
          subtitle={`${formatNumber(catalog.inOrbit)} oggetti attualmente in orbita`}
        >
          <PlotlyChart data={compositionData} layout={compositionLayout} height={260} />
        </ChartCard>
        <ChartCard
          title="Quando sono stati lanciati"
          subtitle="Oggetti ancora in orbita, per anno di lancio"
        >
          <PlotlyChart data={eraData} layout={eraLayout} height={260} />
        </ChartCard>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <InsightBox
            items={[
              `Un oggetto su tre in orbita è un detrito: ${formatPct(catalog.debrisShare, 1)} del totale.`,
              `Il ${formatPct(recentEraShare)} degli oggetti in orbita è stato lanciato dal 2020.`,
              `Solo il ${formatPct(payloadShare)} degli oggetti in orbita è un satellite (payload).`,
            ]}
          />
        </div>
        <NoteBox>
          <strong className="font-semibold text-[#3A3A3C]">Come leggere i dati.</strong> Nel
          catalogo SATCAT l'anno di lancio di un detrito è quello dell'oggetto che lo ha generato.
          Per questo non mostriamo “quanti detriti all'anno”: la data racconterebbe il lancio del
          satellite padre, non la creazione del detrito.
        </NoteBox>
      </div>
    </section>
  );
}
