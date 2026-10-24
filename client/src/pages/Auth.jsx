import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth';
import { ROLE_HOME } from '../format';

const DEMOS = [['viewer', 'Movie Lover'], ['director', 'Director'], ['producer', 'Producer']];

export default function Auth({ mode }) {
  const signup = mode === 'signup';
  const { login, signup: doSignup } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [f, setF] = useState({ name: '', email: '', password: '', role: params.get('role') || '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = k => e => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      const u = await (signup ? doSignup(f) : login(f));
      nav(ROLE_HOME[u.role], { replace: true });
    } catch (x) { setErr(x.message); } finally { setBusy(false); }
  }
  const fill = role => setF({ ...f, email: `${role}@secondtake.demo`, password: 'demo123', role });

  return (
    <div className="auth-bg">
      <h1 className="auth-title text-3xl font-bold">JOIN THE CINEVERSE</h1>
      <div className="auth-card">
        <h1 className="auth-title text-2xl font-bold">{signup ? 'Create Your Account' : 'Enter the Platform'}</h1>
        <form onSubmit={submit} className="flex flex-col gap-4 text-left">
          {signup && <input className="field" placeholder="Your name" value={f.name} onChange={set('name')} required aria-label="Name" />}
          <input className="field" type="email" placeholder="Enter your email" value={f.email} onChange={set('email')} required aria-label="Email" />
          <input className="field" type="password" placeholder="Password" value={f.password} onChange={set('password')} required minLength={6} aria-label="Password" />
          <select className="field" value={f.role} onChange={set('role')} required aria-label="Role">
            <option value="" disabled>Select your role</option>
            <option value="viewer">I am a Movie Lover</option>
            <option value="director">I am a Director</option>
            <option value="producer">I am a Producer</option>
          </select>
          {err && <div role="alert" className="text-sm text-[#f0b0a8] bg-brick/10 border border-brick/50 rounded-md p-2">{err}</div>}
          <button type="submit" className="btn-glow mt-2 self-center" disabled={busy}>{busy ? 'PLEASE WAIT…' : signup ? 'CREATE ACCOUNT' : 'ENTER THE PLATFORM'}</button>
        </form>
        <p className="mt-5 text-sm text-muted">
          {signup ? <>Already have an account? <Link className="text-gold underline" to="/login">Log in</Link></> : <>New here? <Link className="text-gold underline" to="/signup">Sign up</Link></>}
        </p>
        {!signup && (
          <div className="mt-5 pt-4 border-t border-[#333]">
            <p className="text-xs text-muted mb-2">Demo accounts (password: demo123)</p>
            <div className="flex gap-2 justify-center flex-wrap">{DEMOS.map(([r, l]) => <button key={r} type="button" className="btn-ghost !py-1 !px-3 !text-xs" onClick={() => fill(r)}>{l}</button>)}</div>
          </div>
        )}
      </div>
      <Link to="/" className="mt-6 text-sm text-muted hover:text-gold">← Back to home</Link>
    </div>
  );
}
