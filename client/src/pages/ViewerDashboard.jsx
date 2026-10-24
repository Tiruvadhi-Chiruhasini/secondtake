import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine } from 'recharts';
import { useFetch, qs } from '../api';
import { useAuth } from '../auth';
import { PageHeader, Panel, Kpi, Slicer, Loading, ErrorBox, Empty } from '../components/ui';
import { OutcomeScatter, MovieRow } from '../components/viz';
import { SERIES, OUTCOME_COLOR, axis, grid, legend, cursor, Tip } from '../components/charts';
import { cr, dateOf } from '../format';

export default function ViewerDashboard() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [genre, setGenre] = useState('');
  const { data: d, error, loading } = useFetch('/analytics/viewer' + qs({ genre }));
  if (!d) return <>{error ? <ErrorBox error={error} /> : <Loading />}</>;

  return (
    <>
      <PageHeader title={`Welcome, ${user.name.split(' ')[0]}`} sub="Relive cinematic journeys — see how movies performed, which ones deserved a second look, and what other viewers think." />
      <ErrorBox error={error} />
      <div className={`grid lg:grid-cols-[1fr_230px] gap-5 transition-opacity ${loading ? 'opacity-60' : ''}`}>
        <div className="space-y-5 min-w-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Kpi value={d.kpis.movies} label="Movies in view" />
            <Kpi value={d.kpis.avg_audience} label="Average audience score" />
            <Kpi value={`${d.kpis.hit_rate}%`} label="Hit rate" />
            <Kpi value={d.kpis.total_reviews} label="Community reviews" />
          </div>
          <div className="grid xl:grid-cols-2 gap-5">
            <Panel title="Revenue by Budget" sub="Above the line = recovered its budget. Both axes log scale (₹ cr).">
              <OutcomeScatter data={d.revenueByBudget.map(r => ({ ...r }))} x="budget" y="revenue" xName="Budget" yName="Revenue" xLog yLog
                xTicks={[5, 10, 25, 50, 100, 250, 500]} yTicks={[10, 25, 50, 100, 250, 500, 1000, 2000]} xDomain={[3, 700]} yDomain={[8, 2500]} fmt={v => cr(v)}>
                <ReferenceLine segment={[{ x: 3, y: 3 }, { x: 700, y: 700 }]} stroke="#f0c040" strokeDasharray="5 4" />
              </OutcomeScatter>
            </Panel>
            <Panel title="Revenue by Genre" sub="Click a slice to filter the dashboard.">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={d.revenueByGenre} dataKey="revenue" nameKey="genre" innerRadius={55} outerRadius={100} paddingAngle={2} stroke="#111" onClick={e => setGenre(e.genre)} style={{ cursor: 'pointer' }}>
                    {d.revenueByGenre.map((g, i) => <Cell key={g.genre} fill={SERIES[i % SERIES.length]} />)}
                  </Pie>
                  <Tooltip content={<Tip titleKey="genre" fmt={(v, n, r) => `${cr(v)} · ${r.movies} films`} />} />
                  <Legend {...legend} layout="vertical" align="right" verticalAlign="middle" />
                </PieChart>
              </ResponsiveContainer>
            </Panel>
          </div>
          <div className="grid xl:grid-cols-2 gap-5">
            <Panel title="Top Rated by Audiences" sub="Click a bar to open the movie.">
              {d.topRated.length ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={d.topRated} layout="vertical" margin={{ left: 10, right: 16, top: 4 }}>
                    <CartesianGrid {...grid} horizontal={false} />
                    <XAxis type="number" domain={[0, 10]} {...axis} />
                    <YAxis type="category" dataKey="title" width={130} {...axis} tick={{ fill: '#ccc', fontSize: 11 }} />
                    <Tooltip content={<Tip titleKey="title" />} cursor={cursor} />
                    <Bar dataKey="score" name="Audience score" radius={[0, 4, 4, 0]} onClick={e => nav(`/app/movies/${e.id}`)} style={{ cursor: 'pointer' }}>
                      {d.topRated.map(m => <Cell key={m.id} fill={OUTCOME_COLOR[m.outcome]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <Empty>No movies for this filter.</Empty>}
            </Panel>
            <Panel title="Worth a Second Look" sub="Flops at the box office that audiences rate highly.">
              {d.hiddenGems.length ? <ul className="divide-y divide-[#262626]">{d.hiddenGems.map(m => <MovieRow key={m.id} m={{ ...m, outcome: null }} extra={<span className="text-gold">★ {m.score}</span>} />)}</ul>
                : <Empty>No hidden gems in this genre.</Empty>}
            </Panel>
          </div>
          <Panel title="Recent Community Reviews">
            <ul className="divide-y divide-[#262626]">
              {d.recentReviews.map(r => (
                <li key={r.id} className="py-3 text-sm">
                  <div className="flex justify-between gap-2"><Link to={`/app/movies/${r.movie_id}`} className="text-gold hover:underline">{r.title}</Link><span>★ {r.rating}/10</span></div>
                  <p className="text-[#ddd]">{r.body || <i className="text-muted">No comment</i>}</p>
                  <p className="text-xs text-muted">{r.name} · {dateOf(r.created_at)}</p>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
        <aside className="space-y-4 lg:sticky lg:top-24 self-start">
          <Slicer options={d.genres} value={genre} onChange={setGenre} />
          <div className="slicer text-xs text-muted">Showing <b className="text-gold">{genre || 'all genres'}</b>. {genre && <button className="underline text-gold" onClick={() => setGenre('')}>Clear</button>}</div>
        </aside>
      </div>
    </>
  );
}
