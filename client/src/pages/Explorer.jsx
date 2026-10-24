import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFetch, qs, api } from '../api';
import { useAuth } from '../auth';
import { PageHeader, FilterSelect, Poster, OutcomeBadge, RiskBadge, Loading, ErrorBox, Empty, Btn } from '../components/ui';
import { cr } from '../format';

const useDebounced = (v, ms = 250) => { const [x, setX] = useState(v); useEffect(() => { const t = setTimeout(() => setX(v), ms); return () => clearTimeout(t); }, [v, ms]); return x; };
const SORTS = [['year', 'Newest'], ['title', 'Title'], ['budget', 'Budget'], ['lifetime', 'Box office'], ['recovery', 'Recovery ×'], ['audience', 'Audience score'], ['risk', 'Risk (high first)']];

export default function Explorer() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ q: '', genre: '', language: '', outcome: '', risk: '', sort: 'year' });
  const [picked, setPicked] = useState([]);
  const [adding, setAdding] = useState(false);
  const [tick, setTick] = useState(0);
  const dq = useDebounced(f.q);
  const { data: meta } = useFetch('/filters');
  const { data: list, error, loading } = useFetch('/movies' + qs({ ...f, q: dq, _: tick }));
  const set = k => v => setF(p => ({ ...p, [k]: v }));
  const toggle = id => setPicked(p => (p.includes(id) ? p.filter(x => x !== id) : p.length < 3 ? [...p, id] : p));

  return (
    <>
      <PageHeader title="Movie Explorer" sub="Browse the database. Open a movie for its risk breakdown and reviews, or tick up to three to compare.">
        {user.role !== 'viewer' && <Btn onClick={() => setAdding(true)}>ADD A MOVIE</Btn>}
      </PageHeader>
      <div className="panel mb-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
        <label className="text-xs text-muted flex flex-col gap-1 col-span-2 md:col-span-1">Search
          <input className="field field-sm" placeholder="Title, director, producer" value={f.q} onChange={e => set('q')(e.target.value)} /></label>
        <FilterSelect label="Genre" value={f.genre} onChange={set('genre')} options={meta?.genres || []} />
        <FilterSelect label="Language" value={f.language} onChange={set('language')} options={meta?.languages || []} />
        <FilterSelect label="Outcome" value={f.outcome} onChange={set('outcome')} options={['Hit', 'Average', 'Flop']} />
        <FilterSelect label="Risk level" value={f.risk} onChange={set('risk')} options={['Low', 'Medium', 'High']} />
        <label className="text-xs text-muted flex flex-col gap-1">Sort by
          <select className="field field-sm" value={f.sort} onChange={e => set('sort')(e.target.value)}>{SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
      </div>
      <ErrorBox error={error} />
      {!list ? <Loading /> : !list.length ? <Empty>No movies match these filters.</Empty> : (
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 transition-opacity ${loading ? 'opacity-60' : ''}`}>
          {list.map(m => (
            <article key={m.id} className="card !p-3 flex flex-col gap-2 transition hover:shadow-glow">
              <Link to={`/app/movies/${m.id}`}><Poster title={m.title} year={m.year} className="h-40" /></Link>
              <div className="flex flex-wrap gap-1"><OutcomeBadge outcome={m.outcome} /><RiskBadge level={m.risk_level} score={m.risk_score} /></div>
              <div className="text-xs text-muted">{m.genre} · {m.language} · {m.director}</div>
              <div className="text-xs flex justify-between"><span>{cr(m.budget_cr)} → {cr(m.lifetime_cr)}</span><span className="text-gold">★ {m.audience_score}</span></div>
              <label className="text-xs text-muted flex items-center gap-2 mt-auto cursor-pointer"><input type="checkbox" className="accent-[#f0c040]" checked={picked.includes(m.id)} onChange={() => toggle(m.id)} />Compare</label>
            </article>
          ))}
        </div>
      )}
      {picked.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-coal border border-gold/60 shadow-glow rounded-lg px-4 py-3 flex items-center gap-4">
          <span className="text-sm">{picked.length} selected {picked.length < 2 && <span className="text-muted">(pick one more)</span>}</span>
          <Btn disabled={picked.length < 2} onClick={() => nav(`/app/compare?ids=${picked.join(',')}`)}>COMPARE</Btn>
          <button className="text-xs text-muted hover:text-gold" onClick={() => setPicked([])}>Clear</button>
        </div>
      )}
      {adding && <AddMovie meta={meta} onClose={() => setAdding(false)} onDone={id => { setTick(t => t + 1); nav(`/app/movies/${id}`); }} />}
    </>
  );
}

function AddMovie({ meta, onClose, onDone }) {
  const [f, setF] = useState({ title: '', year: new Date().getFullYear(), language: 'Telugu', genre: 'Drama', budget_cr: '', opening_cr: '', lifetime_cr: '', release_month: 1, competition: 3, star_power: 5, trailer_sentiment: 50, audience_score: 6, marketing_cr: '', synopsis: '' });
  const [err, setErr] = useState('');
  const set = k => e => setF({ ...f, [k]: e.target.value });
  const num = (k, label, extra = {}) => <label className="text-xs text-muted flex flex-col gap-1">{label}<input className="field field-sm" type="number" step="any" value={f[k]} onChange={set(k)} {...extra} /></label>;
  const submit = e => { e.preventDefault(); setErr(''); api('/movies', { method: 'POST', body: f }).then(m => onDone(m.id)).catch(x => setErr(x.message)); };
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Add a movie">
      <form onSubmit={submit} className="auth-card !text-left !w-[640px] max-h-[90vh] overflow-y-auto scroll-thin">
        <h2 className="viz-title !text-xl">Add a movie</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <label className="text-xs text-muted flex flex-col gap-1 col-span-2 sm:col-span-3">Title<input className="field field-sm" value={f.title} onChange={set('title')} required /></label>
          {num('year', 'Year')}
          <label className="text-xs text-muted flex flex-col gap-1">Language<select className="field field-sm" value={f.language} onChange={set('language')}>{(meta?.languages || ['Telugu']).map(x => <option key={x}>{x}</option>)}</select></label>
          <label className="text-xs text-muted flex flex-col gap-1">Genre<select className="field field-sm" value={f.genre} onChange={set('genre')}>{(meta?.genres || ['Drama']).map(x => <option key={x}>{x}</option>)}</select></label>
          {num('budget_cr', 'Budget (₹ cr)', { required: true, min: 0.1 })}{num('opening_cr', 'Opening (₹ cr)', { min: 0 })}{num('lifetime_cr', 'Lifetime (₹ cr)', { min: 0 })}
          {num('marketing_cr', 'Marketing (₹ cr)', { min: 0 })}{num('release_month', 'Release month (1–12)', { min: 1, max: 12 })}{num('competition', 'Competition (1–5)', { min: 1, max: 5 })}
          {num('star_power', 'Star power (1–10)', { min: 1, max: 10 })}{num('trailer_sentiment', 'Trailer sentiment (0–100)', { min: 0, max: 100 })}{num('audience_score', 'Audience score (0–10)', { min: 0, max: 10 })}
          <label className="text-xs text-muted flex flex-col gap-1 col-span-2 sm:col-span-3">Synopsis<textarea className="field field-sm" rows={2} value={f.synopsis} onChange={set('synopsis')} /></label>
        </div>
        {err && <div role="alert" className="text-sm text-[#f0b0a8] mt-3">{err}</div>}
        <div className="flex gap-3 justify-end mt-5"><button type="button" className="btn-ghost" onClick={onClose}>Cancel</button><button className="btn-glow !py-2" type="submit">SAVE MOVIE</button></div>
      </form>
    </div>
  );
}
