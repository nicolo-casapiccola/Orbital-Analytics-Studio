import { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';
import { PLOTLY_CONFIG, baseLayout } from '../utils/chartTheme';

interface PlotlyChartProps {
  data: Plotly.Data[];
  layout: Partial<Plotly.Layout>;
  config?: Partial<Plotly.Config>;
  className?: string;
  height?: number;
  testId?: string;
}

export function PlotlyChart({
  data,
  layout,
  config,
  className = '',
  height = 360,
  testId,
}: PlotlyChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const revisionRef = useRef<number>(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    revisionRef.current += 1;

    const theme = baseLayout();
    const clonedData = data.map((trace) => ({ ...trace }));
    const mergedLayout: Partial<Plotly.Layout> = {
      ...theme,
      autosize: true,
      height,
      datarevision: revisionRef.current,
      ...layout,
      xaxis: { ...theme.xaxis, ...layout.xaxis },
      yaxis: { ...theme.yaxis, ...layout.yaxis },
    };

    const mergedConfig: Partial<Plotly.Config> = {
      ...PLOTLY_CONFIG,
      ...config,
    };

    void Plotly.react(el, clonedData, mergedLayout, mergedConfig);

    const observer = new ResizeObserver(() => {
      if (el) {
        void Plotly.Plots.resize(el);
      }
    });
    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [data, layout, config, height]);

  useEffect(() => {
    const el = containerRef.current;
    return () => {
      if (el) {
        Plotly.purge(el);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      data-testid={testId}
      className={`w-full ${className}`}
      style={{ minHeight: `${height}px` }}
    />
  );
}
