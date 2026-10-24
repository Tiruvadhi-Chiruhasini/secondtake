import { useSearchParams, Link } from 'react-router-dom';
import { ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useFetch } from '../api';
import { PageHeader, Panel, Loading, ErrorBox, OutcomeBadge, RiskBadge, Empty } from '../components/ui';
import { SERIES, axis, grid, legend, cursor, Tip } from '../components/charts';
import { cr, x2, MONTH_NAMES } from '../format';

export default function Compare() {
  const [sp, setSp] = useSearchParams();
  const ids = (sp.get('ids') || '').split(',').filter(Boolean).slice(0, 3);
  const { data: all } = useFetch('/movies?sort=title');
  const { data: movies, error } = useFetch(ids.length >= 2 ? `/movies/compare?ids=${ids.join(',')}` : '');
  const setSlot = (i, v) => { const n = [...ids]; if (v) n[i] = v; else n.splice(i, 1); setSp({ ids: [...new Set(n.filter(Boolean))].join(',') }); };

  const rows = movies && [
    ['Year', m => m.year], ['Genre', m => m.genre], ['Language', m => m.language], ['Director', m => m.director], ['Release month', m => MONTH_NAMES[m.release_month - 1]],
    ['Budget', m => cr(m.budget_cr)], ['Opening', m => cr(m.opening_cr)], ['Lifetime', m => cr(m.lifetime_cr)], ['Recovery', m => x2(m.recovery)],
    ['Opening share of lifetime', m => `${m.opening_share}%`], ['Audience score', m => `${m.audience_score}/10`], ['Critic score', m => `${m.critic_score}/100`],
    ['Word-of-mouth drop', m => `${m.wom_drop_pct}%`], ['Outcome', m => <OutcomeBadge outcome={m.outcome} />], ['Risk', m => <RiskBadge level={m.risk_level} score={m.risk_score} />],
  ];
  const radar = movies && movies[0].assessment.factors.map((f, i) => ({ factor: f.label, ...Object.fromEntries(movies.map(m => [m.title, m.assessment.factors[i].risk])) }));
  const signals = movies && [['Audience (×10)', m => Math.round(m.audience_score * 10)], ['Critics', m => m.critic_score], ['Trailer sentiment', m => m.trailer_sentiment], ['Risk score', m => m.risk_score], ['WoM drop', m => m.wom_drop_pct]]
    .map(([name, fn]) => ({ name, ...Object.fromEntries(movies.map(m => [m.title, fn(m)])) }));

  return (
    <>
      <PageHeader title="Movie Comparison" sub="Pick two or three movies to see budget, response and risk side by side." />
      <div className="panel mb-5 grid sm:grid-cols-3 gap-3">
        {[0, 1, 2].map(i => (
          <label key={i} className="text-xs text-muted flex flex-col gap-1">Movie {i + 1}{i === 2 && ' (optional)'}
            <select className="field field-sm" value={ids[i] || ''} onChange={e => setSlot(i, e.target.value)}>
              <option value="">— select —</option>
              {(all || []).map(m => <option key={m.id} value={m.id}>{m.title} ({m.year})</option>)}
            </select>
          </label>
        ))}
      </div>
      <ErrorBox error={error} />
      {ids.length < 2 ? <Empty>Select at least two movies above. You can also tick movies in the <Link to="/app/movies" className="text-gold">Explorer</Link>.</Empty>
        : !movies ? <Loading /> : (
          <div className="space-y-5">
            <div className="grid xl:grid-cols-2 gap-5">
              <Panel title="Risk Profile by Factor" sub="Larger area = more risk on that factor.">
                <ResponsiveContainer width="100%" height={340}>
                  <RadarChart data={radar} outerRadius="70%">
                    <PolarGrid stroke="#333" /><PolarAngleAxis dataKey="factor" tick={{ fill: '#ccc', fontSize: 11 }} /><PolarRadiusAxis domain={[0, 100]} tick={{ fill: '#777', fontSize: 10 }} stroke="#333" />
                    {movies.map((m, i) => <Radar key={m.id} name={m.title} dataKey={m.title} stroke={SERIES[i]} fill={SERIES[i]} fillOpacity={0.2} />)}
                    <Tooltip content={<Tip titleKey="factor" />} /><Legend {...legend} />
                  </RadarChart>
                </ResponsiveContainer>
              </Panel>
              <Panel title="Response Signals" sub="All on a 0–100 scale.">
                <ResponsiveContainer width="100%" height={340}>
                  <BarChart data={signals} margin={{ top: 8, right: 12, bottom: 4 }}>
                    <CartesianGrid {...grid} vertical={false} /><XAxis dataKey="name" {...axis} /><YAxis domain={[0, 100]} width={30} {...axis} />
                    <Tooltip content={<Tip titleKey="name" />} cursor={cursor} /><Legend {...legend} />
                    {movies.map((m, i) => <Bar key={m.id} dataKey={m.title} fill={SERIES[i]} radius={[3, 3, 0, 0]} />)}
                  </BarChart>
                </ResponsiveContainer>
              </Panel>
            </div>
            <Panel title="Side by Side">
              <div className="overflow-x-auto scroll-thin">
                <table className="tbl">
                  <thead><tr><th />{movies.map((m, i) => <th key={m.id}><Link to={`/app/movies/${m.id}`} style={{ color: SERIES[i] }} className="hover:underline">{m.title}</Link></th>)}</tr></thead>
                  <tbody>{rows.map(([label, fn]) => <tr key={label}><td className="text-muted whitespace-nowrap">{label}</td>{movies.map(m => <td key={m.id}>{fn(m)}</td>)}</tr>)}</tbody>
                </table>
              </div>
            </Panel>
          </div>
        )}
    </>
  );
}
