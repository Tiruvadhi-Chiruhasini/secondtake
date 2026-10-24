import { Link } from 'react-router-dom';
import { OUTCOME_COLOR, RISK_COLOR, COLORS } from './charts';

export const Btn = ({ children, to, onClick, type = 'button', disabled, className = '', variant = 'wipe' }) => {
  const cls = variant === 'ghost' ? 'btn-ghost' : variant === 'glow' ? 'btn-glow' : 'btn';
  const inner = variant === 'wipe' ? <span>{children}</span> : children;
  if (to) return <Link to={to} className={`${cls} ${className}`}>{inner}</Link>;
  return <button type={type} onClick={onClick} disabled={disabled} className={`${cls} ${className}`}>{inner}</button>;
};

export const PageHeader = ({ title, sub, children }) => (
  <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
    <div>
      <h1 className="page-title">{title}</h1>
      {sub && <p className="text-muted text-sm mt-1 max-w-3xl">{sub}</p>}
    </div>
    {children && <div className="flex gap-2 flex-wrap">{children}</div>}
  </div>
);

export const Panel = ({ title, sub, children, className = '', right }) => (
  <section className={`panel ${className}`}>
    {(title || right) && (
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>{title && <h3 className="viz-title !mb-0">{title}</h3>}{sub && <p className="text-xs text-muted">{sub}</p>}</div>
        {right}
      </div>
    )}
    {children}
  </section>
);

export const Kpi = ({ value, label }) => (<div className="kpi"><b>{value}</b><small>{label}</small></div>);

// Power BI-style "Select By Genre" radio slicer from the demo video.
export function Slicer({ title = 'Select By Genre', options, value, onChange, all = 'All' }) {
  const items = [all, ...options];
  return (
    <div className="slicer" role="radiogroup" aria-label={title}>
      <div className="viz-title !text-base text-center border-b border-[#333] pb-1 mb-2">{title}</div>
      <div className="max-h-56 overflow-y-auto scroll-thin">
        {items.map(o => (
          <button key={o} role="radio" aria-checked={value === o || (o === all && !value)} className="slicer-item" onClick={() => onChange(o === all ? '' : o)}>
            <span className="dot" />{o}
          </button>
        ))}
      </div>
    </div>
  );
}

export const FilterSelect = ({ label, value, onChange, options, all = 'All' }) => (
  <label className="text-xs text-muted flex flex-col gap-1">{label}
    <select className="field field-sm" value={value} onChange={e => onChange(e.target.value)}>
      <option value="">{all}</option>
      {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
    </select>
  </label>
);

const chip = (text, color) => <span className="chip" style={{ background: color + '26', color, border: `1px solid ${color}66` }}>{text}</span>;
export const OutcomeBadge = ({ outcome }) => chip(outcome, OUTCOME_COLOR[outcome]);
export const RiskBadge = ({ level, score }) => chip(`${level} risk${score != null ? ` · ${score}` : ''}`, RISK_COLOR[level]);
export const SourceBadge = ({ source }) => chip(source === 'PPT' ? 'From PPT' : source === 'User-added' ? 'User added' : 'Illustrative data', source === 'PPT' ? COLORS.gold : COLORS.khaki);

export const Loading = ({ text = 'Loading…' }) => <div className="text-muted italic font-serif py-10 text-center">{text}</div>;
export const ErrorBox = ({ error }) => error ? <div className="border border-brick/60 bg-brick/10 text-[#f0b0a8] rounded-md p-3 text-sm my-3">{error}</div> : null;
export const Empty = ({ children }) => <div className="text-muted text-sm italic py-6 text-center">{children}</div>;

// Poster placeholder (no remote images needed): deterministic gradient from the title.
const PALETTES = [['#a060a0', '#1a0f1f'], ['#908060', '#1b1710'], ['#a090c0', '#17141f'], ['#c0b080', '#1c1810'], ['#807090', '#15111a'], ['#f0c040', '#1f1a08']];
export function Poster({ title, year, className = '' }) {
  const h = [...title].reduce((s, c) => s + c.charCodeAt(0), 0);
  const [a, b] = PALETTES[h % PALETTES.length];
  return (
    <div className={`relative overflow-hidden rounded-md border border-gold/40 flex flex-col justify-end p-3 ${className}`} style={{ background: `linear-gradient(160deg, ${a}cc 0%, ${b} 70%)` }}>
      <div className="absolute inset-x-0 top-0 h-1 bg-gold/70" />
      <div className="font-serif italic text-paper leading-tight text-lg drop-shadow">{title}</div>
      {year && <div className="text-xs text-gold mt-1 tracking-widest">{year}</div>}
    </div>
  );
}

// Semicircular risk gauge.
export function Gauge({ score, level }) {
  const r = 80, c = Math.PI * r, color = RISK_COLOR[level] || COLORS.gold;
  return (
    <svg viewBox="0 0 200 120" className="w-full max-w-[260px] mx-auto" role="img" aria-label={`Risk score ${score} out of 100, ${level}`}>
      <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="#2c2c2c" strokeWidth="16" strokeLinecap="round" />
      <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke={color} strokeWidth="16" strokeLinecap="round"
        strokeDasharray={`${(c * score) / 100} ${c}`} style={{ transition: 'stroke-dasharray .6s ease', filter: `drop-shadow(0 0 5px ${color})` }} />
      <text x="100" y="92" textAnchor="middle" fill="#fff" fontFamily="Cambria, serif" fontSize="38" fontWeight="bold">{score}</text>
      <text x="100" y="112" textAnchor="middle" fill={color} fontFamily="Cambria, serif" fontStyle="italic" fontSize="14">{level} risk</text>
    </svg>
  );
}

export const Disclaimer = () => (
  <p className="text-xs text-muted italic">SecondTake supports decisions. It does not guarantee a movie’s success or failure.</p>
);
