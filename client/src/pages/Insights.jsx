import { Link } from 'react-router-dom';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine } from 'recharts';
import { useFetch } from '../api';
import { PageHeader, Panel, Loading, ErrorBox, Disclaimer } from '../components/ui';
import { OutcomeScatter, MovieRow } from '../components/viz';
import { OUTCOME_COLOR, COLORS, axis, grid, legend, cursor, Tip } from '../components/charts';
import { x2 } from '../format';

const BOTTLENECKS = [
  ['Data', 'Limited, fragmented information about audience expectations and behaviour. Box-office transparency is patchy.', 'Observation: the system may lack one shared view of what audiences want.'],
  ['Process', 'Marketing, release and distribution decisions are made stage by stage and may not respond to changing audience signals.', 'Observation: decisions are optimised per stakeholder, not continuously adjusted.'],
  ['Human', 'Producers prioritise recovery, distributors release economics, exhibitors occupancy, audiences experience and value.', 'Observation: different priorities create fragmented decision-making.'],
];
const STAKE = [['Producer', 'Investment + returns', 'Risk visibility'], ['Distributor', 'Market + release', 'Reach visibility'], ['Audience', 'Expectation + experience', 'Reliable signals']];

export default function Insights() {
  const { data: d, error } = useFetch('/analytics/insights');
  if (!d) return <>{error ? <ErrorBox error={error} /> : <Loading />}</>;
  const bt = d.backtest;

  return (
    <>
      <PageHeader title="SecondTake Insights" sub="One flop is an event. Repeated flops are a pattern. Three recurring patterns from the research, shown with the data in this prototype." />
      <div className="space-y-5">
        <div className="grid xl:grid-cols-2 gap-5">
          <Panel title="Pattern 1 · Investment ≠ Outcome" sub="Budget vs recovery (log scales). Big budgets sit on both sides of break-even.">
            <OutcomeScatter data={d.investmentVsOutcome.map(r => ({ ...r }))} x="budget" y="recovery" xName="Budget ₹ cr" yName="Recovery ×" xLog yLog xTicks={[5, 10, 25, 50, 100, 250, 500]} yTicks={[0.25, 0.5, 1, 2, 5, 10, 25]} xDomain={[3, 700]} yDomain={[0.2, 30]} fmt={(v, n) => (n === 'Recovery ×' ? `${v}×` : `₹${v} cr`)}>
              <ReferenceLine y={1} stroke={COLORS.gold} strokeDasharray="5 4" label={{ value: 'Break-even', fill: '#f0c040', fontSize: 11, position: 'insideTopLeft' }} />
            </OutcomeScatter>
          </Panel>
          <Panel title="Pattern 2 · Expectation ↔ Experience" sub="Star-power expectation vs audience experience. Below the diagonal, the film under-delivered on its promise.">
            <OutcomeScatter data={d.expectationVsExperience.map(r => ({ ...r }))} x="expectation" y="experience" xName="Expectation (star power ×10)" yName="Experience (audience ×10)" xDomain={[30, 100]} yDomain={[20, 100]}>
              <ReferenceLine segment={[{ x: 30, y: 30 }, { x: 100, y: 100 }]} stroke="#888" strokeDasharray="4 4" />
            </OutcomeScatter>
          </Panel>
        </div>

        <div className="grid xl:grid-cols-2 gap-5">
          <Panel title="Pattern 3 · Early Release ↔ Late Success" sub="Flops that audiences now rate highly. Opening performance is not the whole story.">
            <ul className="divide-y divide-[#262626]">{d.lateSuccess.map(m => <MovieRow key={m.id} m={{ ...m, outcome: 'Flop' }} extra={<span className="text-gold">★ {m.score} · {x2(m.recovery)}</span>} />)}</ul>
          </Panel>
          <Panel title="Front-Loaded Releases" sub="Films earning 20%+ of lifetime on opening day, ranked by word-of-mouth drop.">
            <ul className="divide-y divide-[#262626]">{d.frontLoaded.map(m => <MovieRow key={m.id} m={m} extra={<span className="text-muted">{m.opening_share}% opening · −{m.drop}%</span>} />)}</ul>
          </Panel>
        </div>

        <div className="grid xl:grid-cols-2 gap-5">
          <Panel title="Outcome by Genre" sub="Hit ≥ 1.5× budget · Average 1–1.5× · Flop < 1×.">
            <ResponsiveContainer width="100%" height={290}>
              <BarChart data={d.genreOutcome} margin={{ top: 8, right: 12, bottom: 4 }}>
                <CartesianGrid {...grid} vertical={false} /><XAxis dataKey="genre" {...axis} interval={0} /><YAxis allowDecimals={false} width={28} {...axis} />
                <Tooltip content={<Tip hideZero />} cursor={cursor} /><Legend {...legend} />
                {['Hit', 'Average', 'Flop'].map(o => <Bar key={o} dataKey={o} stackId="o" fill={OUTCOME_COLOR[o]} />)}
              </BarChart>
            </ResponsiveContainer>
          </Panel>
          <Panel title="How Did the Risk Levels Line Up With Reality?" sub={`Back-test on the ${d.total} movies in this prototype.`}>
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={bt.rows} margin={{ top: 8, right: 12, bottom: 4 }}>
                <CartesianGrid {...grid} vertical={false} /><XAxis dataKey="level" {...axis} tickFormatter={l => `${l} risk`} /><YAxis allowDecimals={false} width={28} {...axis} />
                <Tooltip content={<Tip hideZero titleKey="level" />} cursor={cursor} /><Legend {...legend} />
                {['Hit', 'Average', 'Flop'].map(o => <Bar key={o} dataKey={o} stackId="o" fill={OUTCOME_COLOR[o]} />)}
              </BarChart>
            </ResponsiveContainer>
            <p className="text-sm mt-2">{bt.flopsFlaggedHigh} of {bt.flops} flops were rated High risk; {bt.hitsFlaggedHigh} hits were. The Low-rated flops are mostly the late-success cases above.</p>
            <p className="text-xs text-muted mt-1">This is a transparent weighted heuristic scored on prototype data, not a trained or validated model. It is meant to start a conversation, not to forecast.</p>
          </Panel>
        </div>

        <Panel title="What Gets Lost Between Stakeholders" sub="Three bottlenecks from the system analysis.">
          <div className="grid md:grid-cols-3 gap-4">{BOTTLENECKS.map(([t, a, b]) => (
            <div key={t} className="card"><h3>{t} bottleneck</h3><p className="text-sm">{a}</p><p className="text-xs text-tan italic mt-2">{b}</p></div>))}</div>
        </Panel>

        <div className="grid xl:grid-cols-2 gap-5">
          <Panel title="Feedback Loops" sub="Hypotheses from the causal loop analysis — to be tested, not proven.">
            <div className="space-y-3 text-sm">
              <div className="card"><b className="text-lav">Reinforcing upward</b><p>Higher audience interest → stronger opening → more visibility and word of mouth → more audience interest.</p></div>
              <div className="card"><b className="text-brick">Reinforcing downward</b><p>Negative early reception → negative word of mouth → lower occupancy → exhibitors cut shows → less reach → lower revenue.</p></div>
              <div className="card"><b className="text-gold">Shifting the burden</b><p>Quick fix: more promotion. Long-term: understand audience–movie fit and improve decisions earlier.</p></div>
            </div>
          </Panel>
          <Panel title="Who Sees What, and What They Need">
            <table className="tbl"><thead><tr><th>Stakeholder</th><th>Sees</th><th>Needs</th></tr></thead>
              <tbody>{STAKE.map(r => <tr key={r[0]}>{r.map((c, i) => <td key={i} className={i === 0 ? 'text-gold font-bold' : ''}>{c}</td>)}</tr>)}</tbody></table>
            <p className="text-sm mt-4">Leverage point: a small improvement in understanding audience–movie fit could improve release, marketing and distribution decisions.</p>
            <div className="mt-4 flex items-center justify-between gap-3 flex-wrap"><Disclaimer /><Link to="/app/risk" className="btn-ghost">Try the Risk Explorer</Link></div>
          </Panel>
        </div>
      </div>
    </>
  );
}
