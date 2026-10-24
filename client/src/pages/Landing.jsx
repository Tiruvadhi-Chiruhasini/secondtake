import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { useFetch } from '../api';
import { ROLE_HOME } from '../format';

const PATHS = [
  { role: 'viewer', title: 'Movie Lovers', text: 'Relive cinematic journeys' },
  { role: 'director', title: 'Directors', text: 'Plan your next masterpiece' },
  { role: 'producer', title: 'Producers', text: 'Invest with insight' },
];
const BOTTLENECKS = [
  { t: 'Data', d: 'The signals exist. They don’t arrive as one picture.' },
  { t: 'Process', d: 'Decisions happen stage by stage. The consequences appear later.' },
  { t: 'Human', d: 'Different stakeholders optimise for different priorities.' },
];

export default function Landing() {
  const nav = useNavigate();
  const { user } = useAuth();
  const { data: s } = useFetch('/public/stats');
  const enter = () => nav(user ? ROLE_HOME[user.role] : '/login');
  const metrics = s && [[s.movies, 'Movies tracked'], [`₹${s.invested_cr.toLocaleString('en-IN')} cr`, 'Budgets analysed'], [`${s.flop_rate}%`, 'Underperformed their budget'], [s.cult, 'Flops later loved']];

  return (
    <div>
      <header className="hero">
        <div className="overlay">
          <div className="absolute top-4 right-5 flex gap-4 text-sm">
            {user ? <Link to={ROLE_HOME[user.role]} className="text-gold hover:text-white">Open dashboard</Link> : <>
              <Link to="/login" className="text-gold hover:text-white">Log in</Link>
              <Link to="/signup" className="text-gold hover:text-white">Sign up</Link></>}
          </div>
          <h2>The outcome is visible. The system isn’t.</h2>
          <h1>Second<span className="Rj">Take</span></h1>
          <p>A smarter look before the final decision — Where data meets storytelling</p>
          <button onClick={enter} className="btn mt-5"><span>ENTER THE PLATFORM</span></button>
        </div>
      </header>

      <section className="section-dark">
        <h2 className="mb-8 text-2xl font-serif">Choose Your Path</h2>
        <div className="flex flex-wrap justify-center gap-5">
          {PATHS.map(p => (
            <Link key={p.role} to={user ? ROLE_HOME[user.role] : `/login?role=${p.role}`} className="card w-52 transition hover:-translate-y-1 hover:shadow-glow">
              <h3>{p.title}</h3><p>{p.text}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="section-black">
        <h2 className="mb-3 text-2xl font-serif">Data Powered Box Office</h2>
        <p className="max-w-2xl mx-auto">Look at movie failure as a system, not a single number. Budget, timing, competition, audience fit and word of mouth — in one picture.</p>
        {metrics && (
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            {metrics.map(([v, l]) => <div key={l} className="kpi min-w-[170px]"><b className="!text-gold">{v}</b><small>{l}</small></div>)}
          </div>
        )}
        <span className="block mt-4 text-gold font-bold">LIVE METRICS AVAILABLE</span>
      </section>

      <section className="section-dark">
        <h2 className="mb-2 text-2xl font-serif">What gets lost between stakeholders</h2>
        <p className="mb-8 text-muted">Three bottlenecks SecondTake is built to make visible.</p>
        <div className="flex flex-wrap justify-center gap-5">
          {BOTTLENECKS.map(b => <div key={b.t} className="card w-60"><h3>{b.t} bottleneck</h3><p className="text-sm">{b.d}</p></div>)}
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3 font-serif italic text-tan">
          <span>Movie details</span><span className="text-gold">→</span><span>Audience &amp; market signals</span><span className="text-gold">→</span>
          <span>Low · Medium · High risk</span><span className="text-gold">→</span><span>Human decision</span>
        </div>
      </section>

      <section className="py-10 px-5 bg-ink text-center italic">
        <blockquote>“SecondTake supports decisions. It does not guarantee a movie’s success or failure.”</blockquote>
      </section>

      <footer className="bg-ink py-8 px-5 text-center border-t border-[#222]">
        <h3 className="text-gold font-bold mb-2">Platform</h3>
        <ul className="list-none mb-5">{['Analytics', 'Risk Explorer', 'Community', 'Showcase'].map(i => <li key={i} className="my-1">{i}</li>)}</ul>
        <p className="text-sm text-muted">© 2026 SecondTake · Team 03 · Flop Movies sub-system</p>
      </footer>
    </div>
  );
}
