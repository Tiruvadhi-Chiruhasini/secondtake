import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { api, useFetch } from '../api';
import { useAuth } from '../auth';
import { PageHeader, Panel, Gauge, Loading, ErrorBox, OutcomeBadge, RiskBadge, Disclaimer, Btn } from '../components/ui';
import { RISK_COLOR, COLORS, axis, grid, cursor, Tip } from '../components/charts';
import { cr, MONTH_NAMES } from '../format';

const COMP = ['', 'Clear window', 'Light', 'Moderate', 'Heavy', 'Crowded clash'];
const DEFAULTS = { title: '', genre: 'Drama', language: 'Telugu', budget_cr: 150, marketing_cr: 20, release_month: 1, competition: 3, star_power: 6, trailer_sentiment: 60, audience_fit: 60 };

function Slider({ label, value, min, max, onChange, hint }) {
  return (
    <label className="text-xs text-muted block">
      <span className="flex justify-between"><span>{label}</span><b className="text-gold">{hint ? hint(value) : value}</b></span>
      <input type="range" min={min} max={max} value={value} onChange={e => onChange(+e.target.value)} />
    </label>
  );
}

export default function RiskExplorer() {
  const { user } = useAuth();
  const canSave = user.role !== 'viewer';
  const [f, setF] = useState(DEFAULTS);
  const [res, setRes] = useState(null);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [showAll, setShowAll] = useState(false);
  const { data: meta } = useFetch('/filters');
  const { data: movies } = useFetch('/movies?sort=risk');
  const set = k => v => setF(p => ({ ...p, [k]: v }));

  useEffect(() => {
    let off = false;
    const t = setTimeout(() => api('/risk/estimate', { method: 'POST', body: f }).then(r => { if (!off) { setRes(r); setErr(''); } }).catch(e => !off && setErr(e.message)), 250);
    return () => { off = true; clearTimeout(t); };
  }, [f]);

  const save = () => { setMsg(''); api('/projects', { method: 'POST', body: f }).then(() => setMsg('Saved to your dashboard.')).catch(e => setMsg(e.message)); };
  const load = m => { setF({ title: m.title, genre: m.genre, language: m.language, budget_cr: m.budget_cr, marketing_cr: m.marketing_cr, release_month: m.release_month, competition: m.competition, star_power: m.star_power, trailer_sentiment: m.trailer_sentiment, audience_fit: Math.round(m.audience_score * 10) }); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const num = (k, label) => <label className="text-xs text-muted flex flex-col gap-1">{label}<input className="field field-sm" type="number" min="0" value={f[k]} onChange={e => set(k)(e.target.value)} /></label>;

  return (
    <>
      <PageHeader title="Movie Risk Explorer" sub="Input movie details, budget, timing, competition and audience signals. Get a Low / Medium / High risk reading and the factors behind it." />
      <ErrorBox error={err} />
      <div className="grid lg:grid-cols-[340px_1fr] gap-5">
        <Panel title="Movie Inputs">
          <div className="space-y-3">
            <label className="text-xs text-muted flex flex-col gap-1">Project title<input className="field field-sm" placeholder="Untitled project" value={f.title} onChange={e => set('title')(e.target.value)} /></label>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs text-muted flex flex-col gap-1">Genre<select className="field field-sm" value={f.genre} onChange={e => set('genre')(e.target.value)}>{(meta?.genres || [f.genre]).map(g => <option key={g}>{g}</option>)}</select></label>
              <label className="text-xs text-muted flex flex-col gap-1">Language<select className="field field-sm" value={f.language} onChange={e => set('language')(e.target.value)}>{(meta?.languages || [f.language]).map(g => <option key={g}>{g}</option>)}</select></label>
              {num('budget_cr', 'Budget (₹ cr)')}{num('marketing_cr', 'Marketing (₹ cr)')}
            </div>
            <label className="text-xs text-muted flex flex-col gap-1">Release month<select className="field field-sm" value={f.release_month} onChange={e => set('release_month')(+e.target.value)}>{MONTH_NAMES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}</select></label>
            <Slider label="Release competition" value={f.competition} min={1} max={5} onChange={set('competition')} hint={v => `${v} · ${COMP[v]}`} />
            <Slider label="Star power" value={f.star_power} min={1} max={10} onChange={set('star_power')} />
            <Slider label="Trailer / early sentiment" value={f.trailer_sentiment} min={0} max={100} onChange={set('trailer_sentiment')} />
            <Slider label="Audience–movie fit" value={f.audience_fit} min={0} max={100} onChange={set('audience_fit')} />
            <div className="flex gap-2 flex-wrap pt-2">
              <button className="btn-ghost" onClick={() => setF(DEFAULTS)}>Reset</button>
              {canSave && <Btn onClick={save} disabled={!f.title.trim()}>SAVE PROJECT</Btn>}
            </div>
            {canSave && !f.title.trim() && <p className="text-xs text-muted">Give the project a title to save it.</p>}
            {!canSave && <p className="text-xs text-muted">Directors and producers can save projects to their dashboards.</p>}
            {msg && <p className="text-xs text-gold" role="status">{msg} {msg.startsWith('Saved') && <Link to={`/app/${user.role}`} className="underline">View</Link>}</p>}
          </div>
        </Panel>

        {!res ? <Loading /> : (
          <div className="space-y-5 min-w-0">
            <div className="grid xl:grid-cols-[280px_1fr] gap-5">
              <Panel title="Risk Reading">
                <Gauge score={res.score} level={res.level} />
                <p className="text-sm mt-2">Main drivers: <span className="text-gold">{res.drivers.join(', ')}</span></p>
                <div className="mt-3"><Disclaimer /></div>
              </Panel>
              <Panel title="What Is Driving the Score" sub="Points each factor adds to the 0–100 score.">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={res.factors} layout="vertical" margin={{ left: 6, right: 16 }}>
                    <CartesianGrid {...grid} horizontal={false} />
                    <XAxis type="number" {...axis} /><YAxis type="category" dataKey="label" width={140} {...axis} tick={{ fill: '#ccc', fontSize: 11 }} />
                    <Tooltip content={<Tip titleKey="label" fmt={(v, n, r) => `${v} pts (factor risk ${r.risk}/100)`} />} cursor={cursor} />
                    <Bar dataKey="contribution" name="Contribution" radius={[0, 4, 4, 0]}>{res.factors.map(x => <Cell key={x.key} fill={x.risk >= 60 ? COLORS.brick : x.risk >= 35 ? COLORS.gold : COLORS.lav} />)}</Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Panel>
            </div>
            <div className="grid xl:grid-cols-2 gap-5">
              <Panel title="Release Timing Sensitivity" sub="Same movie, different release month. Selected month outlined.">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={res.months} margin={{ top: 8, right: 8, bottom: 4 }} onClick={e => e?.activePayload && set('release_month')(e.activePayload[0].payload.n)}>
                    <CartesianGrid {...grid} vertical={false} /><XAxis dataKey="month" {...axis} /><YAxis domain={[0, 100]} width={28} {...axis} />
                    <Tooltip content={<Tip titleKey="month" fmt={(v, n, r) => `${v} · ${r.level}`} />} cursor={cursor} />
                    <Bar dataKey="score" name="Risk score" radius={[3, 3, 0, 0]} style={{ cursor: 'pointer' }}>
                      {res.months.map(m => <Cell key={m.n} fill={RISK_COLOR[m.level]} stroke={m.n === f.release_month ? '#fff' : 'none'} strokeWidth={2} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <p className="text-xs text-muted">Timing uses a simple festival/holiday heuristic. Click a bar to try that month.</p>
              </Panel>
              <Panel title="Options to Consider" sub="Prompts for people to weigh — not instructions.">
                <ul className="space-y-3 text-sm">{res.options.map(o => <li key={o.idea} className="card !p-3"><b className="text-gold">{o.idea}</b><p className="text-[#ddd]">{o.why}</p></li>)}</ul>
              </Panel>
            </div>
          </div>
        )}
      </div>

      <Panel className="mt-5" title="Every Movie, Ranked by Risk" sub="Load any movie into the inputs above to see what moves its score.">
        {!movies ? <Loading /> : (
          <div className="overflow-x-auto scroll-thin">
            <table className="tbl">
              <thead><tr><th>Movie</th><th>Budget</th><th>Audience</th><th>Risk</th><th>Actual outcome</th><th /></tr></thead>
              <tbody>{(showAll ? movies : movies.slice(0, 10)).map(m => (
                <tr key={m.id}>
                  <td><Link to={`/app/movies/${m.id}`} className="hover:text-gold">{m.title}</Link></td><td>{cr(m.budget_cr)}</td><td>★ {m.audience_score}</td>
                  <td><RiskBadge level={m.risk_level} score={m.risk_score} /></td><td><OutcomeBadge outcome={m.outcome} /></td>
                  <td><button className="text-gold text-xs underline" onClick={() => load(m)}>Load</button></td>
                </tr>))}</tbody>
            </table>
            {movies.length > 10 && <button className="btn-ghost mt-3" onClick={() => setShowAll(s => !s)}>{showAll ? 'Show fewer' : `Show all ${movies.length}`}</button>}
          </div>
        )}
      </Panel>
    </>
  );
}
