export const COLORS = {
  accent: '#007AFF',
  accentSoft: '#CFE5FF',
  teal: '#00A6A6',
  orange: '#FF9500',
  purple: '#7A5AF8',
  pink: '#FF2D55',
  red: '#FF3B30',
  green: '#34C759',
  gray: '#C7C7CC',
  grayLight: '#E5E5EA',
  text: '#1D1D1F',
  muted: '#6E6E73',
  axis: 'rgba(0, 0, 0, 0.12)',
  grid: 'rgba(0, 0, 0, 0.06)',
};

export const FONT_FAMILY =
  "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

export const PURPOSE_COLORS: Record<string, string> = {
  Comunicazioni: COLORS.accent,
  'Osservazione della Terra': COLORS.teal,
  Navigazione: COLORS.purple,
  Tecnologia: COLORS.orange,
  Scienza: COLORS.pink,
  Altro: COLORS.gray,
};

export const ORBIT_COLORS: Record<string, string> = {
  LEO: COLORS.accent,
  GEO: COLORS.green,
  MEO: COLORS.purple,
  Ellittica: COLORS.orange,
  Altro: COLORS.gray,
};

export const TYPE_COLORS: Record<string, string> = {
  'Satelliti (payload)': COLORS.accent,
  Detriti: COLORS.red,
  'Stadi di razzo': COLORS.orange,
  Componenti: COLORS.purple,
  'Non classificati': COLORS.gray,
};

export const PLOTLY_CONFIG: Partial<Plotly.Config> = {
  displayModeBar: false,
  responsive: true,
  displaylogo: false,
  scrollZoom: false,
};

export function baseLayout(): Partial<Plotly.Layout> {
  return {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: {
      family: FONT_FAMILY,
      size: 12,
      color: COLORS.text,
    },
    margin: { l: 8, r: 8, t: 8, b: 8 },
    hoverlabel: {
      bgcolor: '#FFFFFF',
      bordercolor: COLORS.grayLight,
      font: { family: FONT_FAMILY, size: 12, color: COLORS.text },
      align: 'left',
    },
    showlegend: false,
    xaxis: {
      showgrid: false,
      zeroline: false,
      linecolor: COLORS.axis,
      tickcolor: COLORS.axis,
      tickfont: { color: COLORS.muted, size: 11 },
      automargin: true,
    },
    yaxis: {
      showgrid: true,
      gridcolor: COLORS.grid,
      zeroline: false,
      linecolor: 'rgba(0,0,0,0)',
      tickcolor: 'rgba(0,0,0,0)',
      tickfont: { color: COLORS.muted, size: 11 },
      automargin: true,
    },
  };
}
