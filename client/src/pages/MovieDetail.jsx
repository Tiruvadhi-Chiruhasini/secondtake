import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { useFetch, api } from '../api';
import { useAuth } from '../auth';
import { PageHeader, Panel, Kpi, Poster, OutcomeBadge, RiskBadge, SourceBadge, Gauge, Loading, ErrorBox, Empty, Btn, Disclaimer } from '../components/ui';
import { COLORS, axis, grid, cursor, Tip } from '../components/charts';
import { cr, x2, MONTH_NAMES, dateOf } from '../format';

export default function MovieDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [tick, setTick] = useState(0);
  const { data: m, error } = useFetch(`/movies/${id}?_=${tick}`);
  const [rv, setRv] = useState({ rating: 8, body: '' });
  const [msg, setMsg] = useState('');
  if (!m) return <>{error ? <><ErrorBox error={error} /><Link to="/app/movies" className="text-gold">← Back to Explorer</Link></> : <Loading />}</>;
  const mine = m.reviews.find(r => r.user_id === user.id);
  const send = e => { e.preventDefault(); setMsg(''); api(`/movies/${m.id}/reviews`, { method: 'POST', body: rv }).then(() => { setTick(t => t + 1); setMsg('Review saved.'); setRv({ rating: 8, body: '' }); }).catch(x => setMsg(x.message)); };
  const del = rid => api(`/reviews/${rid}`, { method: 'DELETE' }).then(() => setTick(t => t + 1));
  const a = m.assessment;

  return (
    <>
      <Link to="/app/movies" className="text-sm text-muted hover:text-gold">← Movie Explorer</Link>
      <div className="grid md:grid-cols-[220px_1fr] gap-6 mt-3 mb-6">
        <Poster title={m.title} year={m.year} className="h-72" />
        <div>
          <PageHeader title={m.title}><Btn to={`/app/compare?ids=${m.id}`} variant="ghost">Compare</Btn></PageHeader>
          <div className="flex flex-wrap gap-2 mb-3"><OutcomeBadge outcome={m.outcome} /><RiskBadge level={m.risk_level} score={m.risk_score} /><SourceBadge source={m.source} /></div>
          <p className="text-sm text-muted mb-3">{m.year} · {m.genre} · {m.language} · {m.runtime_min} min · Released {MONTH_NAMES[m.release_month - 1]}<br />Directed by {m.director} · Produced by {m.producer || '–'}</p>
          <p className="text-[#ddd] mb-4">{m.synopsis}</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Kpi value={cr(m.budget_cr)} label="Budget" /><Kpi value={cr(m.opening_cr)} label="Opening" />
            <Kpi value={cr(m.lifetime_cr)} label="Lifetime" /><Kpi value={x2(m.recovery)} label="Recovery" />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[320px_1fr] gap-5 mb-5">
        <Panel title="Risk Assessment" sub="Weighted heuristic from the film’s own signals.">
          <Gauge score={a.score} level={a.level} />
          <p className="text-sm mt-2">Biggest drivers: <span className="text-gold">{a.drivers.join(', ')}</span></p>
          <div className="mt-3"><Disclaimer /></div>
        </Panel>
        <Panel title="Risk by Factor" sub="0 = no risk, 100 = maximum risk. Weight in brackets.">
          <ResponsiveContainer width="100%" height={290}>
            <BarChart data={a.factors.map(f => ({ ...f, name: `${f.label} (${Math.round(f.weight * 100)}%)` }))} layout="vertical" margin={{ left: 10, right: 16 }}>
              <CartesianGrid {...grid} horizontal={false} />
              <XAxis type="number" domain={[0, 100]} {...axis} /><YAxis type="category" dataKey="name" width={185} {...axis} tick={{ fill: '#ccc', fontSize: 11 }} />
              <Tooltip content={<Tip titleKey="label" fmt={(v, n, r) => `${v}/100 · adds ${r.contribution} to score`} />} cursor={cursor} />
              <Bar dataKey="risk" name="Factor risk" radius={[0, 4, 4, 0]}>{a.factors.map(f => <Cell key={f.key} fill={f.risk >= 60 ? COLORS.brick : f.risk >= 35 ? COLORS.gold : COLORS.lav} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <div className="grid lg:grid-cols-[1fr_1fr] gap-5">
        <Panel title="Signals" sub="Inputs behind the assessment.">
          <table className="tbl"><tbody>
            {[['Competition (1–5)', m.competition], ['Star power (1–10)', m.star_power], ['Trailer sentiment', `${m.trailer_sentiment}/100`], ['Audience score', `${m.audience_score}/10`], ['Critic score', `${m.critic_score}/100`],
              ['Word-of-mouth drop', `${m.wom_drop_pct}%`], ['Opening share of lifetime', `${m.opening_share}%`], ['Marketing spend', cr(m.marketing_cr)], ['Community rating', m.user_rating ? `${m.user_rating}/10 (${m.reviews.length})` : 'No reviews yet']].map(([k, v]) => <tr key={k}><td className="text-muted">{k}</td><td className="text-right">{v}</td></tr>)}
          </tbody></table>
        </Panel>
        <Panel title="Reviews">
          <form onSubmit={send} className="mb-4 flex flex-col gap-2">
            <div className="flex gap-2 items-center">
              <label className="text-xs text-muted">Your rating</label>
              <select className="field field-sm !w-24" value={rv.rating} onChange={e => setRv({ ...rv, rating: +e.target.value })}>{[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n}/10</option>)}</select>
            </div>
            <textarea className="field field-sm" rows={2} maxLength={1000} placeholder={mine ? 'Update your review…' : 'What did you think?'} value={rv.body} onChange={e => setRv({ ...rv, body: e.target.value })} />
            <div className="flex items-center gap-3"><button className="btn-ghost" type="submit">{mine ? 'Update review' : 'Post review'}</button><span className="text-xs text-muted" role="status">{msg}</span></div>
          </form>
          {m.reviews.length ? <ul className="divide-y divide-[#262626] max-h-72 overflow-y-auto scroll-thin">{m.reviews.map(r => (
            <li key={r.id} className="py-2 text-sm">
              <div className="flex justify-between"><b>{r.name} <span className="text-xs text-muted font-normal">{r.role}</span></b><span className="text-gold">★ {r.rating}/10</span></div>
              {r.body && <p className="text-[#ddd]">{r.body}</p>}
              <div className="text-xs text-muted flex gap-3">{dateOf(r.created_at)}{r.user_id === user.id && <button className="hover:text-brick" onClick={() => del(r.id)}>Delete</button>}</div>
            </li>))}</ul> : <Empty>Be the first to review this movie.</Empty>}
        </Panel>
      </div>
    </>
  );
}
