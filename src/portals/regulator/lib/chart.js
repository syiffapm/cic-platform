/**
 * Chart theme for the Regulator portal. Navy / warm amber / teal / slate, validated for
 * lightness band and CVD separation (brand navy kept deliberately). Text never wears series colour.
 */
export const C = {
  navy: '#2f5d9a',
  navyDark: '#1f3551',
  amber: '#d97f06',
  teal: '#16917f',
  slate: '#64748b',
  violet: '#7a5ea8',
  grid: '#e2e8f0',
  red: '#dc2626',
  green: '#059669',
};

export const axis = { tick: { fontSize: 11, fill: '#64748b' }, axisLine: false, tickLine: false };

export const axisLabel = (value, vertical = false) => (vertical
  ? { value, angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: 11, fill: '#64748b', textAnchor: 'middle' } }
  : { value, position: 'insideBottom', offset: -4, style: { fontSize: 11, fill: '#64748b' } });

export const tooltip = {
  contentStyle: { borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12, boxShadow: '0 4px 12px rgba(15,27,45,0.08)' },
  labelStyle: { fontWeight: 600, color: '#0f172a' },
  itemStyle: { color: '#334155' },
  cursor: { fill: 'rgba(47,93,154,0.06)' },
};

export const legend = { iconType: 'circle', iconSize: 8, wrapperStyle: { fontSize: 11, color: '#475569' } };

/** Sequential single-hue scale for PAR30 heat tiles (light → dark amber/red). */
export function par30Tone(v) {
  if (v >= 8) return { bg: '#9a3412', fg: '#fff', label: 'Critical' };
  if (v >= 6) return { bg: '#c2410c', fg: '#fff', label: 'High' };
  if (v >= 4.5) return { bg: '#f59e0b', fg: '#1f2937', label: 'Elevated' };
  if (v >= 3) return { bg: '#fcd34d', fg: '#1f2937', label: 'Watch' };
  return { bg: '#fef3c7', fg: '#1f2937', label: 'Normal' };
}

export const PAR30_LEGEND = [
  { label: '< 3%', v: 2 }, { label: '3–4.5%', v: 3.5 }, { label: '4.5–6%', v: 5 }, { label: '6–8%', v: 7 }, { label: '≥ 8%', v: 9 },
];
