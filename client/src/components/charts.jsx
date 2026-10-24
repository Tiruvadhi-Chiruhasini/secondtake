// Recharts styling that matches the SecondTake theme (dark panels, tan italic titles, gold glow tooltips).
export const COLORS = {
  gold: '#f0c040', lav: '#a090c0', plum: '#a060a0', tan: '#c0b080', khaki: '#908060', cream: '#e0d0b0', brick: '#c25b4e', paper: '#f5f4f3',
};
export const SERIES = [COLORS.gold, COLORS.lav, COLORS.plum, COLORS.tan, COLORS.khaki, COLORS.cream, COLORS.brick, '#807090', '#d0a0d0', '#b3b1a1'];
export const OUTCOME_COLOR = { Hit: COLORS.lav, Average: COLORS.gold, Flop: COLORS.brick };
export const RISK_COLOR = { Low: COLORS.lav, Medium: COLORS.gold, High: COLORS.brick };

export const axis = { tick: { fill: '#aaa', fontSize: 11 }, stroke: '#444', tickLine: false };
export const grid = { stroke: '#2f2f2f', strokeDasharray: '3 3' };
export const legend = { wrapperStyle: { color: '#ccc', fontSize: 12, fontFamily: 'Arial' } };
export const cursor = { fill: 'rgba(240,192,64,0.08)' };
export const margin = { top: 8, right: 12, left: 0, bottom: 4 };

// Custom tooltip: same card look as the login container (dark, rounded, gold glow).
export function Tip({ active, payload, label, fmt, titleKey, hideZero }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload || {};
  const title = titleKey ? row[titleKey] : label;
  return (
    <div style={{ background: 'rgba(17,17,17,0.97)', border: '1px solid #f0c04066', borderRadius: 8, padding: '8px 12px', boxShadow: '0 0 14px rgba(240,192,64,0.35)', fontSize: 12, maxWidth: 260 }}>
      {title != null && <div style={{ color: '#f0c040', fontFamily: 'Cambria, serif', fontStyle: 'italic', marginBottom: 4, fontSize: 13 }}>{title}</div>}
      {payload.filter(p => p.value != null && !(hideZero && p.value === 0)).map((p, i) => (
        <div key={i} style={{ color: '#eee', display: 'flex', gap: 8, justifyContent: 'space-between' }}>
          <span style={{ color: p.color || p.fill || '#aaa' }}>{p.name}</span>
          <b>{fmt ? fmt(p.value, p.name, row) : typeof p.value === 'number' ? +p.value.toFixed(2) : p.value}</b>
        </div>
      ))}
      {row.outcome && <div style={{ color: OUTCOME_COLOR[row.outcome], marginTop: 2 }}>{row.outcome}</div>}
    </div>
  );
}
