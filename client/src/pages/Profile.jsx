import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, useFetch } from '../api';
import { useAuth } from '../auth';
import { PageHeader, Panel, Kpi, Empty, Loading } from '../components/ui';
import { ROLE_LABEL, dateOf } from '../format';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [f, setF] = useState({ name: user.name, bio: user.bio });
  const [pw, setPw] = useState({ current: '', next: '' });
  const [m1, setM1] = useState(''); const [m2, setM2] = useState('');
  const [tick, setTick] = useState(0);
  const { data: reviews } = useFetch(`/me/reviews?_=${tick}`);
  const { data: projects } = useFetch(user.role !== 'viewer' ? `/projects?_=${tick}` : '');

  const save = e => { e.preventDefault(); setM1(''); updateProfile(f).then(() => setM1('Profile updated.')).catch(x => setM1(x.message)); };
  const change = e => { e.preventDefault(); setM2(''); api('/auth/password', { method: 'PUT', body: pw }).then(() => { setM2('Password changed.'); setPw({ current: '', next: '' }); }).catch(x => setM2(x.message)); };
  const del = id => api(`/reviews/${id}`, { method: 'DELETE' }).then(() => setTick(t => t + 1));

  return (
    <>
      <PageHeader title="Your Profile" sub={`${user.email} · ${ROLE_LABEL[user.role]} · member since ${dateOf(user.created_at)}`} />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5 max-w-2xl">
        <Kpi value={ROLE_LABEL[user.role]} label="Role" /><Kpi value={reviews ? reviews.length : '–'} label="Reviews written" />
        {user.role !== 'viewer' && <Kpi value={projects ? projects.length : '–'} label="Saved projects" />}
      </div>
      <div className="grid lg:grid-cols-2 gap-5">
        <Panel title="Edit Profile">
          <form onSubmit={save} className="space-y-3">
            <label className="text-xs text-muted flex flex-col gap-1">Name<input className="field field-sm" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} required /></label>
            <label className="text-xs text-muted flex flex-col gap-1">Bio<textarea className="field field-sm" rows={3} maxLength={300} value={f.bio} onChange={e => setF({ ...f, bio: e.target.value })} /></label>
            <div className="flex items-center gap-3"><button className="btn-ghost" type="submit">Save changes</button><span className="text-xs text-gold" role="status">{m1}</span></div>
          </form>
        </Panel>
        <Panel title="Change Password">
          <form onSubmit={change} className="space-y-3">
            <input className="field field-sm" type="password" placeholder="Current password" aria-label="Current password" value={pw.current} onChange={e => setPw({ ...pw, current: e.target.value })} required />
            <input className="field field-sm" type="password" placeholder="New password (6+ characters)" aria-label="New password" minLength={6} value={pw.next} onChange={e => setPw({ ...pw, next: e.target.value })} required />
            <div className="flex items-center gap-3"><button className="btn-ghost" type="submit">Update password</button><span className="text-xs text-gold" role="status">{m2}</span></div>
          </form>
        </Panel>
      </div>
      <Panel className="mt-5" title="My Reviews">
        {!reviews ? <Loading /> : !reviews.length ? <Empty>You haven’t reviewed anything yet. Open a movie in the <Link to="/app/movies" className="text-gold">Explorer</Link>.</Empty> : (
          <ul className="divide-y divide-[#262626]">{reviews.map(r => (
            <li key={r.id} className="py-3 text-sm">
              <div className="flex justify-between"><Link to={`/app/movies/${r.movie_id}`} className="text-gold hover:underline">{r.title}</Link><span>★ {r.rating}/10</span></div>
              {r.body && <p className="text-[#ddd]">{r.body}</p>}
              <div className="text-xs text-muted flex gap-3">{dateOf(r.created_at)}<button className="hover:text-brick" onClick={() => del(r.id)}>Delete</button></div>
            </li>))}</ul>
        )}
      </Panel>
    </>
  );
}
