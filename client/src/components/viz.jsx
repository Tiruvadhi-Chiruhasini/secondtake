import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Link } from 'react-router-dom';
import { axis, grid, legend, OUTCOME_COLOR, Tip } from './charts';
import { Btn, OutcomeBadge, RiskBadge, Empty } from './ui';
import { api } from '../api';

// Scatter plot with one series per outcome (Hit / Average / Flop). Children (e.g. ReferenceLine) render inside the chart.
export function OutcomeScatter({ data, x, y, xName, yName, xLog, yLog, xTicks, yTicks, xDomain, yDomain, height = 300, fmt, children }) {
  const ax = (log, ticks, domain) => ({ type: 'number', scale: log ? 'log' : 'auto', ticks, domain: domain || ['auto', 'auto'], allowDataOverflow: true, ...axis });
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart margin={{ top: 8, right: 16, left: 0, bottom: 22 }}>
        <CartesianGrid {...grid} />
        <XAxis dataKey={x} name={xName} {...ax(xLog, xTicks, xDomain)} label={{ value: xName, position: 'insideBottom', offset: -12, fill: '#888', fontSize: 11 }} />
        <YAxis dataKey={y} name={yName} width={44} {...ax(yLog, yTicks, yDomain)} />
        <Tooltip content={<Tip titleKey="title" fmt={fmt} />} cursor={{ strokeDasharray: '3 3', stroke: '#f0c04088' }} />
        <Legend {...legend} verticalAlign="top" height={24} />
        {children}
        {['Hit', 'Average', 'Flop'].map(o => <Scatter key={o} name={o} data={data.filter(d => d.outcome === o)} fill={OUTCOME_COLOR[o]} fillOpacity={0.85} />)}
      </ScatterChart>
    </ResponsiveContainer>
  );
}

export function ProjectList({ projects, onChanged }) {
  if (!projects?.length) return <Empty>No saved projects yet. Estimate one in the Risk Explorer and save it here.</Empty>;
  return (
    <ul className="divide-y divide-[#262626]">
      {projects.map(p => (
        <li key={p.id} className="py-2 flex items-center justify-between gap-2 text-sm">
          <div><div className="font-bold">{p.title}</div><div className="text-xs text-muted">{p.genre} · ₹{p.budget_cr} cr · {p.language}</div></div>
          <div className="flex items-center gap-2"><RiskBadge level={p.risk_level} score={p.risk_score} />
            <button className="text-muted hover:text-brick text-xs" onClick={() => api(`/projects/${p.id}`, { method: 'DELETE' }).then(onChanged)} aria-label={`Delete ${p.title}`}>Delete</button></div>
        </li>
      ))}
    </ul>
  );
}

export const MovieRow = ({ m, extra }) => (
  <li className="py-2 flex items-center justify-between gap-2 text-sm">
    <Link to={`/app/movies/${m.id}`} className="hover:text-gold">{m.title}{m.year ? <span className="text-muted"> · {m.year}</span> : null}</Link>
    <span className="flex items-center gap-2">{extra}{m.outcome && <OutcomeBadge outcome={m.outcome} />}</span>
  </li>
);

export const PlanCta = ({ text }) => (
  <div className="flex items-center justify-between gap-3 flex-wrap"><p className="text-sm text-muted max-w-md">{text}</p><Btn to="/app/risk">Open Risk Explorer</Btn></div>
);
