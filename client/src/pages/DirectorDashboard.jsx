import { useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';
import { useFetch, qs } from '../api';
import { PageHeader, Panel, Kpi, Slicer, Loading, ErrorBox, Empty } from '../components/ui';
import { OutcomeScatter, ProjectList, PlanCta } from '../components/viz';
import { SERIES, OUTCOME_COLOR, COLORS, axis, grid, legend, cursor, Tip } from '../components/charts';

export default function DirectorDashboard() {
  const [genre, setGenre] = useState('');
  const [tick, setTick] = useState(0);
  const { data: d, error, loading } = useFetch('/analytics/director' + qs({ genre, _: tick }));
  if (!d) return <>{error ? <ErrorBox error={error} /> : <Loading />}</>;
  const rot = { ...axis, interval: 0, angle: -35, textAnchor: 'end', height: 80 };

  return (
    <>
      <PageHeader title="Director Dashboard" sub="Plan your next masterpiece — see which genres, budgets and audience responses have worked, then test your own idea." />
      <ErrorBox error={error} />
      <div className={`grid lg:grid-cols-[1fr_230px] gap-5 transition-opacity ${loading ? 'opacity-60' : ''}`}>
        <div className="space-y-5 min-w-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Kpi value={d.kpis.films} label="Films in view" />
            <Kpi value={d.kpis.directors} label="Directors" />
            <Kpi value={d.kpis.avg_audience} label="Average audience score" />
            <Kpi value={d.kpis.best_recovery} label="Best average recovery" />
          </div>
          <Panel title="Director vs Genre" sub="Films per director, stacked by genre.">
            {d.directorGenre.length ? (
              <ResponsiveContainer width="100%" height={330}>
                <BarChart data={d.directorGenre} margin={{ top: 8, right: 12, bottom: 4 }}>
                  <CartesianGrid {...grid} vertical={false} />
                  <XAxis dataKey="director" {...rot} /><YAxis allowDecimals={false} width={30} {...axis} />
                  <Tooltip content={<Tip hideZero />} cursor={cursor} /><Legend {...legend} verticalAlign="top" height={30} />
                  {d.genreList.map((g, i) => <Bar key={g} dataKey={g} stackId="g" fill={SERIES[i % SERIES.length]} />)}
                </BarChart>
              </ResponsiveContainer>
            ) : <Empty>No data.</Empty>}
          </Panel>
          <div className="grid xl:grid-cols-2 gap-5">
            <Panel title="Director vs Popularity" sub="Average audience score (0–10).">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={d.directorPopularity} margin={{ top: 8, right: 12, bottom: 4 }}>
                  <CartesianGrid {...grid} vertical={false} />
                  <XAxis dataKey="director" {...rot} /><YAxis domain={[0, 10]} width={30} {...axis} />
                  <Tooltip content={<Tip titleKey="director" fmt={(v, n, r) => `${v} (${r.films} films, ${r.recovery}× recovery)`} />} cursor={cursor} />
                  <Bar dataKey="popularity" name="Audience score" fill={COLORS.plum} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Panel>
            <Panel title="Flop Rate by Genre" sub="Share of films that did not recover their budget. Click a bar to filter.">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={d.genreFlopRate} margin={{ top: 8, right: 12, bottom: 4 }}>
                  <CartesianGrid {...grid} vertical={false} />
                  <XAxis dataKey="genre" {...rot} /><YAxis unit="%" domain={[0, 100]} width={38} {...axis} />
                  <Tooltip content={<Tip titleKey="genre" fmt={(v, n, r) => `${v}% of ${r.films} films`} />} cursor={cursor} />
                  <Bar dataKey="flop" name="Flop rate" radius={[4, 4, 0, 0]} onClick={e => setGenre(e.genre)} style={{ cursor: 'pointer' }}>
                    {d.genreFlopRate.map(g => <Cell key={g.genre} fill={g.flop >= 50 ? COLORS.brick : COLORS.khaki} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Panel>
          </div>
          <div className="grid xl:grid-cols-2 gap-5">
            <Panel title="Outcome by Budget Tier" sub="Hit ≥ 1.5× budget · Average 1–1.5× · Flop < 1×.">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={d.budgetTier} margin={{ top: 8, right: 12, bottom: 4 }}>
                  <CartesianGrid {...grid} vertical={false} />
                  <XAxis dataKey="tier" {...axis} /><YAxis allowDecimals={false} width={30} {...axis} />
                  <Tooltip content={<Tip hideZero />} cursor={cursor} /><Legend {...legend} />
                  {['Hit', 'Average', 'Flop'].map(o => <Bar key={o} dataKey={o} stackId="o" fill={OUTCOME_COLOR[o]} />)}
                </BarChart>
              </ResponsiveContainer>
            </Panel>
            <Panel title="Audience Experience vs Word-of-Mouth Drop" sub="Higher audience scores tend to hold up after opening.">
              <OutcomeScatter data={d.fitVsOpening.map(r => ({ ...r }))} x="fit" y="drop" xName="Audience score" yName="Drop %" xDomain={[2, 10]} yDomain={[0, 100]} height={280} />
            </Panel>
          </div>
          <Panel title="Your Projects" sub="Saved from the Risk Explorer.">
            <ProjectList projects={d.projects} onChanged={() => setTick(t => t + 1)} />
            <div className="mt-4 pt-4 border-t border-[#262626]"><PlanCta text="Test budget, release window and audience-fit assumptions for your next film before you commit." /></div>
          </Panel>
        </div>
        <aside className="space-y-4 lg:sticky lg:top-24 self-start">
          <Slicer options={d.genres} value={genre} onChange={setGenre} />
        </aside>
      </div>
    </>
  );
}
