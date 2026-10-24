import { useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ComposedChart, Line } from 'recharts';
import { useFetch, qs } from '../api';
import { PageHeader, Panel, Kpi, Slicer, Loading, ErrorBox, Empty } from '../components/ui';
import { OutcomeScatter, ProjectList, PlanCta, MovieRow } from '../components/viz';
import { RISK_COLOR, COLORS, axis, grid, legend, cursor, Tip } from '../components/charts';
import { cr } from '../format';

export default function ProducerDashboard() {
  const [genre, setGenre] = useState('');
  const [tick, setTick] = useState(0);
  const { data: d, error, loading } = useFetch('/analytics/producer' + qs({ genre, _: tick }));
  if (!d) return <>{error ? <ErrorBox error={error} /> : <Loading />}</>;
  const k = d.kpis;

  return (
    <>
      <PageHeader title="Producer Dashboard" sub="Invest with insight — risk visibility across budget, timing, audience fit and promotion, in one picture." />
      <ErrorBox error={error} />
      <div className={`grid lg:grid-cols-[1fr_230px] gap-5 transition-opacity ${loading ? 'opacity-60' : ''}`}>
        <div className="space-y-5 min-w-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Kpi value={cr(k.invested_cr)} label="Budgets invested" />
            <Kpi value={cr(k.returned_cr)} label="Box office returned" />
            <Kpi value={`${k.recovery}×`} label="Portfolio recovery" />
            <Kpi value={`${k.flop_rate}%`} label="Flop rate" />
          </div>
          <div className="grid xl:grid-cols-2 gap-5">
            <Panel title="Risk Distribution" sub="Movies by assessed risk level (budget shown on hover).">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={d.riskDistribution} dataKey="count" nameKey="level" innerRadius={55} outerRadius={95} paddingAngle={3} stroke="#111" label={({ level, count }) => `${level} ${count}`} labelLine={false}>
                    {d.riskDistribution.map(r => <Cell key={r.level} fill={RISK_COLOR[r.level]} />)}
                  </Pie>
                  <Tooltip content={<Tip titleKey="level" fmt={(v, n, r) => `${v} films · ${cr(r.invested)}`} />} />
                  <Legend {...legend} />
                </PieChart>
              </ResponsiveContainer>
            </Panel>
            <Panel title="Recovery by Budget Tier" sub="Box office ÷ budget. Below 1× = not recovered.">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={d.recoveryByTier} margin={{ top: 16, right: 12, bottom: 4 }}>
                  <CartesianGrid {...grid} vertical={false} />
                  <XAxis dataKey="tier" {...axis} /><YAxis width={34} unit="×" {...axis} />
                  <Tooltip content={<Tip titleKey="tier" fmt={(v, n, r) => `${v}× across ${r.films} films`} />} cursor={cursor} />
                  <ReferenceLine y={1} stroke={COLORS.gold} strokeDasharray="5 4" label={{ value: 'Break-even', fill: '#f0c040', fontSize: 11, position: 'insideTopRight' }} />
                  <Bar dataKey="recovery" name="Recovery" fill={COLORS.lav} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Panel>
          </div>
          <Panel title="Front-Loading Watch" sub="Share of lifetime box office earned on opening day vs second-week word-of-mouth drop. A strong opening is a temporary response, not a lasting solution.">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={d.frontLoading} layout="vertical" margin={{ left: 10, right: 16 }}>
                <CartesianGrid {...grid} horizontal={false} />
                <XAxis type="number" unit="%" domain={[0, 100]} {...axis} />
                <YAxis type="category" dataKey="title" width={130} {...axis} tick={{ fill: '#ccc', fontSize: 11 }} />
                <Tooltip content={<Tip titleKey="title" fmt={v => `${v}%`} />} cursor={cursor} /><Legend {...legend} verticalAlign="top" height={26} />
                <Bar dataKey="opening_share" name="Opening share of lifetime" fill={COLORS.gold} radius={[0, 4, 4, 0]} />
                <Bar dataKey="drop" name="Word-of-mouth drop" fill={COLORS.plum} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
          <div className="grid xl:grid-cols-2 gap-5">
            <Panel title="Does More Promotion Fix It?" sub="Marketing as % of budget vs recovery (log). Promotion alone has not rescued weak audience fit.">
              <OutcomeScatter data={d.marketingVsRecovery.map(r => ({ ...r }))} x="marketing" y="recovery" xName="Marketing % of budget" yName="Recovery ×" yLog
                yTicks={[0.25, 0.5, 1, 2, 5, 10, 25]} yDomain={[0.2, 30]} xDomain={[0, 'auto']} height={290} fmt={(v, n) => (n === 'Recovery ×' ? `${v}×` : `${v}%`)}>
                <ReferenceLine y={1} stroke={COLORS.gold} strokeDasharray="5 4" />
              </OutcomeScatter>
            </Panel>
            <Panel title="Release Month: Risk & Recovery" sub="Average assessed risk (bars) and recovery (line) by release month.">
              <ResponsiveContainer width="100%" height={290}>
                <ComposedChart data={d.monthRisk} margin={{ top: 8, right: 8, bottom: 4 }}>
                  <CartesianGrid {...grid} vertical={false} />
                  <XAxis dataKey="month" {...axis} />
                  <YAxis yAxisId="l" width={30} domain={[0, 100]} {...axis} /><YAxis yAxisId="r" orientation="right" width={34} unit="×" {...axis} />
                  <Tooltip content={<Tip titleKey="month" fmt={(v, n, r) => (n === 'Avg recovery' ? `${v}×` : `${v}`)} />} cursor={cursor} /><Legend {...legend} />
                  <Bar yAxisId="l" dataKey="avg_risk" name="Avg risk" fill={COLORS.khaki} radius={[4, 4, 0, 0]} />
                  <Line yAxisId="r" dataKey="avg_recovery" name="Avg recovery" stroke={COLORS.gold} strokeWidth={2} dot={{ r: 3, fill: COLORS.gold }} connectNulls />
                </ComposedChart>
              </ResponsiveContainer>
            </Panel>
          </div>
          <div className="grid xl:grid-cols-2 gap-5">
            <Panel title="High-Risk Watchlist" sub="Highest assessed risk in this view.">
              {d.watchlist.length ? <ul className="divide-y divide-[#262626]">{d.watchlist.map(m => <MovieRow key={m.id} m={m} extra={<span className="text-muted">{m.score}/100 · {cr(m.budget)}</span>} />)}</ul> : <Empty>Nothing flagged in this view.</Empty>}
            </Panel>
            <Panel title="Your Portfolio" sub="Projects saved from the Risk Explorer.">
              <ProjectList projects={d.projects} onChanged={() => setTick(t => t + 1)} />
              <div className="mt-4 pt-4 border-t border-[#262626]"><PlanCta text="Assess a new investment against budget, competition and audience-fit signals." /></div>
            </Panel>
          </div>
        </div>
        <aside className="space-y-4 lg:sticky lg:top-24 self-start"><Slicer options={d.genres} value={genre} onChange={setGenre} /></aside>
      </div>
    </>
  );
}
