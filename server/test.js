// Backend smoke test — runs every route handler through a tiny fake Express (no network or HTTP server needed).
process.env.DB_FILE = ':memory:';
const assert = require('assert');
const register = require('./routes');

const routes = [];
const fake = {};
for (const m of ['get', 'post', 'put', 'delete']) fake[m] = (p, ...h) => routes.push({ m: m.toUpperCase(), p, h });
fake.use = (p, ...h) => routes.push({ m: 'USE', p, h });
register(fake);

function match(pattern, url) {
  const a = pattern.split('/'), b = url.split('/');
  if (a.length !== b.length) return null;
  const params = {};
  for (let i = 0; i < a.length; i++) { if (a[i].startsWith(':')) params[a[i].slice(1)] = b[i]; else if (a[i] !== b[i]) return null; }
  return params;
}
async function call(method, full, { body, token } = {}) {
  const [url, qs] = full.split('?');
  const query = Object.fromEntries(new URLSearchParams(qs || ''));
  const r = routes.find(x => x.m === method && match(x.p, url)) || routes.find(x => x.m === 'USE');
  const req = { body, query, params: match(r.p, url) || {}, headers: token ? { authorization: `Bearer ${token}` } : {} };
  return new Promise(resolve => {
    const res = { json: d => resolve({ status: 200, data: d }) };
    let i = 0;
    const next = err => {
      if (err) return resolve({ status: err.status || 500, data: { error: err.message } });
      const h = r.h[i++]; if (h) h(req, res, next);
    };
    next();
  });
}
const login = (email, role) => call('POST', '/api/auth/login', { body: { email, password: 'demo123', role } }).then(r => r.data.token);

(async () => {
  let n = 0; const ok = (c, msg) => { assert(c, msg); n++; };

  // auth
  ok((await call('GET', '/api/movies')).status === 401, 'movies need auth');
  ok((await call('POST', '/api/auth/login', { body: { email: 'viewer@secondtake.demo', password: 'nope' } })).status === 401, 'bad password rejected');
  ok((await call('POST', '/api/auth/login', { body: { email: 'viewer@secondtake.demo', password: 'demo123', role: 'producer' } })).status === 403, 'wrong role rejected');
  const su = await call('POST', '/api/auth/signup', { body: { name: 'Test User', email: 'T@x.com', password: 'secret1', role: 'director' } });
  ok(su.status === 200 && su.data.user.email === 't@x.com', 'signup works');
  ok((await call('POST', '/api/auth/signup', { body: { name: 'Dup', email: 't@x.com', password: 'secret1', role: 'viewer' } })).status === 409, 'duplicate email');
  ok((await call('POST', '/api/auth/signup', { body: { name: 'X', email: 'bad', password: 'secret1', role: 'viewer' } })).status === 400, 'invalid email');

  const viewer = await login('viewer@secondtake.demo', 'viewer');
  const director = await login('director@secondtake.demo', 'director');
  const producer = await login('producer@secondtake.demo', 'producer');
  ok(viewer && director && producer, 'demo logins');
  ok((await call('GET', '/api/auth/me', { token: viewer })).data.role === 'viewer', 'me');

  // role-based access
  ok((await call('GET', '/api/analytics/director', { token: viewer })).status === 403, 'viewer blocked from director analytics');
  ok((await call('GET', '/api/analytics/producer', { token: director })).status === 403, 'director blocked from producer analytics');
  ok((await call('GET', '/api/analytics/producer', { token: producer })).status === 200, 'producer allowed');
  ok((await call('POST', '/api/projects', { token: viewer, body: { title: 'x' } })).status === 403, 'viewer cannot save projects');
  ok((await call('POST', '/api/movies', { token: viewer, body: { title: 'x', budget_cr: 5 } })).status === 403, 'viewer cannot add movies');

  // movies
  const all = (await call('GET', '/api/movies', { token: viewer })).data;
  ok(all.length === 27 && all[0].risk_level && all[0].outcome, 'movies seeded + enriched');
  ok((await call('GET', '/api/movies?genre=Fantasy', { token: viewer })).data.every(m => m.genre === 'Fantasy'), 'genre filter');
  ok((await call('GET', '/api/movies?outcome=Flop&sort=risk', { token: viewer })).data.every(m => m.outcome === 'Flop'), 'outcome filter');
  ok((await call('GET', '/api/movies?q=rajamouli', { token: viewer })).data.length === 4, 'search by director');
  const gc = all.find(m => m.title === 'Game Changer');
  const det = (await call('GET', `/api/movies/${gc.id}`, { token: viewer })).data;
  ok(det.assessment.factors.length === 7 && det.reviews.length >= 1, 'movie detail + assessment');
  ok((await call('GET', '/api/movies/9999', { token: viewer })).status === 404, '404 movie');
  const cmp = (await call('GET', `/api/movies/compare?ids=${all[0].id},${all[1].id}`, { token: viewer }));
  ok(cmp.status === 200 && cmp.data.length === 2, 'compare route not shadowed by :id');
  ok((await call('GET', '/api/movies/compare?ids=1', { token: viewer })).status === 400, 'compare needs 2+');

  // reviews (upsert + ownership)
  const m1 = all.find(m => m.title === 'Eega').id;
  const r1 = (await call('POST', `/api/movies/${m1}/reviews`, { token: viewer, body: { rating: 8, body: 'Great' } })).data;
  ok(r1.reviews.length === 1, 'review added');
  const r2 = (await call('POST', `/api/movies/${m1}/reviews`, { token: viewer, body: { rating: 6, body: 'Updated' } })).data;
  ok(r2.reviews.length === 1 && r2.reviews[0].rating === 6, 'review upserted, not duplicated');
  ok((await call('POST', `/api/movies/${m1}/reviews`, { token: viewer, body: { rating: 11 } })).status === 400, 'rating bounds');
  ok((await call('DELETE', `/api/reviews/${r2.reviews[0].id}`, { token: director })).status === 403, 'cannot delete others review');
  ok((await call('DELETE', `/api/reviews/${r2.reviews[0].id}`, { token: viewer })).status === 200, 'delete own review');

  // add movie + projects + risk
  const added = await call('POST', '/api/movies', { token: director, body: { title: 'My Test Film', budget_cr: 80, lifetime_cr: 200, genre: 'Drama' } });
  ok(added.status === 200 && added.data.outcome === 'Hit', 'director adds a movie');
  ok((await call('POST', '/api/movies', { token: director, body: { title: '', budget_cr: 80 } })).status === 400, 'movie validation');
  const est = (await call('POST', '/api/risk/estimate', { token: viewer, body: { budget_cr: 450, competition: 5, star_power: 9, audience_fit: 30, trailer_sentiment: 30, marketing_cr: 90, release_month: 3 } })).data;
  ok(est.level === 'High' && est.months.length === 12 && est.options.length >= 3, 'risk estimate high-risk case');
  const low = (await call('POST', '/api/risk/estimate', { token: viewer, body: { budget_cr: 20, competition: 1, star_power: 4, audience_fit: 85, trailer_sentiment: 85, marketing_cr: 1, release_month: 10 } })).data;
  ok(low.level === 'Low', 'risk estimate low-risk case');
  let projs = (await call('POST', '/api/projects', { token: producer, body: { title: 'Project Alpha', budget_cr: 120, audience_fit: 60 } })).data;
  ok(projs.length === 1 && projs[0].risk_level, 'project saved');
  ok((await call('GET', '/api/projects', { token: director })).data.length === 0, 'projects are per-user');
  projs = (await call('DELETE', `/api/projects/${projs[0].id}`, { token: producer })).data;
  ok(projs.length === 0, 'project deleted');

  // analytics
  const va = (await call('GET', '/api/analytics/viewer?genre=Action', { token: viewer })).data;
  ok(va.kpis.movies > 0 && va.revenueByGenre.length === 1 && va.genres.length > 3, 'viewer analytics + genre slicer');
  const da = (await call('GET', '/api/analytics/director', { token: director })).data;
  ok(da.directorGenre.length > 0 && da.budgetTier.length === 4, 'director analytics');
  const pa = (await call('GET', '/api/analytics/producer', { token: producer })).data;
  ok(pa.riskDistribution.length === 3 && pa.monthRisk.length === 12 && pa.kpis.recovery > 0, 'producer analytics');
  const ins = (await call('GET', '/api/analytics/insights', { token: viewer })).data;
  ok(ins.lateSuccess.length >= 3 && ins.backtest.rows.length === 3, 'insights');
  const ps = (await call('GET', '/api/public/stats')).data;
  ok(ps.movies >= 27 && ps.invested_cr > 0, 'public stats');

  // profile
  ok((await call('PUT', '/api/auth/profile', { token: viewer, body: { name: 'Asha V', bio: 'hi' } })).data.name === 'Asha V', 'profile update');
  ok((await call('PUT', '/api/auth/password', { token: viewer, body: { current: 'wrong', next: 'abcdef' } })).status === 400, 'password check');
  ok((await call('PUT', '/api/auth/password', { token: viewer, body: { current: 'demo123', next: 'abcdef' } })).status === 200, 'password change');
  ok((await call('POST', '/api/auth/login', { body: { email: 'viewer@secondtake.demo', password: 'abcdef' } })).status === 200, 'login with new password');

  console.log(`All ${n} backend checks passed`);
})().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
