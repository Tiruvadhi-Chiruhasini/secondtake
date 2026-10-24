const { requireAuth, requireRole, HttpError } = require('./auth');
const s = require('./services');
const wrap = fn => (req, res, next) => { try { res.json(fn(req)); } catch (e) { next(e); } };

module.exports = function register(app) {
  const auth = [requireAuth];
  const maker = [requireAuth, requireRole('director', 'producer')];

  app.get('/api/health', wrap(() => ({ ok: true })));
  app.get('/api/public/stats', wrap(() => s.publicStats()));

  app.post('/api/auth/signup', wrap(r => s.signup(r.body || {})));
  app.post('/api/auth/login', wrap(r => s.login(r.body || {})));
  app.get('/api/auth/me', ...auth, wrap(r => s.me(r.auth.id)));
  app.put('/api/auth/profile', ...auth, wrap(r => s.updateProfile(r.auth.id, r.body || {})));
  app.put('/api/auth/password', ...auth, wrap(r => s.changePassword(r.auth.id, r.body || {})));
  app.get('/api/me/reviews', ...auth, wrap(r => s.myReviews(r.auth.id)));

  app.get('/api/filters', ...auth, wrap(() => s.filtersMeta()));
  app.get('/api/movies', ...auth, wrap(r => s.listMovies(r.query || {})));
  app.get('/api/movies/compare', ...auth, wrap(r => s.compare((r.query || {}).ids)));
  app.get('/api/movies/:id', ...auth, wrap(r => s.getMovie(r.params.id)));
  app.post('/api/movies', ...maker, wrap(r => s.addMovie(r.auth, r.body || {})));
  app.post('/api/movies/:id/reviews', ...auth, wrap(r => s.addReview(r.auth.id, r.params.id, r.body || {})));
  app.delete('/api/reviews/:id', ...auth, wrap(r => s.deleteReview(r.auth, r.params.id)));

  app.post('/api/risk/estimate', ...auth, wrap(r => s.estimate(r.body || {})));
  app.get('/api/projects', ...maker, wrap(r => s.listProjects(r.auth.id)));
  app.post('/api/projects', ...maker, wrap(r => s.saveProject(r.auth.id, r.body || {})));
  app.delete('/api/projects/:id', ...maker, wrap(r => s.deleteProject(r.auth.id, r.params.id)));

  app.get('/api/analytics/viewer', ...auth, wrap(r => s.viewerAnalytics(r.query || {})));
  app.get('/api/analytics/director', requireAuth, requireRole('director'), wrap(r => s.directorAnalytics(r.auth.id, r.query || {})));
  app.get('/api/analytics/producer', requireAuth, requireRole('producer'), wrap(r => s.producerAnalytics(r.auth.id, r.query || {})));
  app.get('/api/analytics/insights', ...auth, wrap(() => s.insights()));

  app.use('/api', (_req, _res, next) => next(new HttpError(404, 'Unknown API route')));
};
