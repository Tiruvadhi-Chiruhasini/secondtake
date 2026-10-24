const database = require('./db');
const { HttpError, hashPassword, verifyPassword, makeToken } = require('./auth');
const risk = require('./risk');

const q = () => database.db;
const round = (v, d = 1) => (v == null ? null : +Number(v).toFixed(d));
const avg = a => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);
const sum = a => a.reduce((s, x) => s + x, 0);
const publicUser = u => ({ id: u.id, name: u.name, email: u.email, role: u.role, bio: u.bio || '', created_at: u.created_at });

// ---------- movies ----------
function enrich(m) {
  const a = risk.assessMovie(m);
  return { ...m, recovery: round(risk.recovery(m), 2), outcome: risk.outcome(m), risk_score: a.score, risk_level: a.level,
    opening_share: m.lifetime_cr ? round((m.opening_cr / m.lifetime_cr) * 100, 0) : 0 };
}
function allMovies() {
  const stats = Object.fromEntries(q().prepare('SELECT movie_id, COUNT(*) n, AVG(rating) r FROM reviews GROUP BY movie_id').all().map(s => [s.movie_id, s]));
  return q().prepare('SELECT * FROM movies').all().map(m => ({ ...enrich(m), review_count: stats[m.id]?.n || 0, user_rating: stats[m.id] ? round(stats[m.id].r, 1) : null }));
}
function filterMovies(list, f = {}) {
  let r = list;
  if (f.genre && f.genre !== 'All') r = r.filter(m => m.genre === f.genre);
  if (f.language && f.language !== 'All') r = r.filter(m => m.language === f.language);
  if (f.outcome && f.outcome !== 'All') r = r.filter(m => m.outcome === f.outcome);
  if (f.risk && f.risk !== 'All') r = r.filter(m => m.risk_level === f.risk);
  if (f.q) { const s = String(f.q).toLowerCase(); r = r.filter(m => [m.title, m.director, m.producer].some(x => (x || '').toLowerCase().includes(s))); }
  if (f.year_min) r = r.filter(m => m.year >= +f.year_min);
  if (f.year_max) r = r.filter(m => m.year <= +f.year_max);
  return r;
}
const SORTS = { title: (a, b) => a.title.localeCompare(b.title), year: (a, b) => b.year - a.year, budget: (a, b) => b.budget_cr - a.budget_cr,
  lifetime: (a, b) => b.lifetime_cr - a.lifetime_cr, risk: (a, b) => b.risk_score - a.risk_score, audience: (a, b) => b.audience_score - a.audience_score,
  recovery: (a, b) => b.recovery - a.recovery };
function listMovies(f = {}) { return filterMovies(allMovies(), f).sort(SORTS[f.sort] || SORTS.year); }
function filtersMeta() {
  const m = q().prepare('SELECT genre, language, year FROM movies').all();
  return { genres: [...new Set(m.map(x => x.genre))].sort(), languages: [...new Set(m.map(x => x.language))].sort(),
    years: [Math.min(...m.map(x => x.year)), Math.max(...m.map(x => x.year))] };
}
function getMovie(id) {
  const m = q().prepare('SELECT * FROM movies WHERE id = ?').get(+id);
  if (!m) throw new HttpError(404, 'Movie not found');
  const reviews = q().prepare(`SELECT r.id, r.rating, r.body, r.created_at, r.user_id, u.name, u.role FROM reviews r JOIN users u ON u.id = r.user_id
    WHERE r.movie_id = ? ORDER BY r.id DESC`).all(m.id);
  return { ...enrich(m), assessment: risk.assessMovie(m), reviews, user_rating: reviews.length ? round(avg(reviews.map(r => r.rating)), 1) : null };
}
function compare(ids) {
  const list = String(ids || '').split(',').map(Number).filter(Boolean).slice(0, 3);
  if (list.length < 2) throw new HttpError(400, 'Pick at least two movies to compare');
  return list.map(getMovie);
}
function addMovie(user, b) {
  const t = String(b.title || '').trim();
  if (!t) throw new HttpError(400, 'Title is required');
  const num = (v, d) => (v === '' || v == null || Number.isNaN(+v) ? d : +v);
  const budget = num(b.budget_cr, 0);
  if (budget <= 0) throw new HttpError(400, 'Budget must be greater than zero');
  const r = q().prepare(`INSERT INTO movies(title,year,language,genre,director,producer,budget_cr,opening_cr,lifetime_cr,runtime_min,release_month,
    competition,star_power,trailer_sentiment,audience_score,critic_score,wom_drop_pct,marketing_cr,synopsis,source,created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(t, num(b.year, new Date().getFullYear()), b.language || 'Telugu', b.genre || 'Drama', b.director || me(user.id).name, b.producer || '', budget,
      num(b.opening_cr, 0), num(b.lifetime_cr, 0), num(b.runtime_min, 140), num(b.release_month, 1), num(b.competition, 3), num(b.star_power, 5),
      num(b.trailer_sentiment, 50), num(b.audience_score, 6), num(b.critic_score, 50), num(b.wom_drop_pct, 40), num(b.marketing_cr, 0),
      b.synopsis || '', 'User-added', user.id);
  return getMovie(r.lastInsertRowid);
}

// ---------- reviews ----------
function addReview(userId, movieId, b) {
  const rating = Math.round(+b.rating);
  if (!(rating >= 1 && rating <= 10)) throw new HttpError(400, 'Rating must be between 1 and 10');
  if (!q().prepare('SELECT id FROM movies WHERE id = ?').get(+movieId)) throw new HttpError(404, 'Movie not found');
  const body = String(b.body || '').trim().slice(0, 1000);
  const ex = q().prepare('SELECT id FROM reviews WHERE movie_id = ? AND user_id = ?').get(+movieId, userId);
  if (ex) q().prepare('UPDATE reviews SET rating = ?, body = ?, created_at = CURRENT_TIMESTAMP WHERE id = ?').run(rating, body, ex.id);
  else q().prepare('INSERT INTO reviews(movie_id,user_id,rating,body) VALUES (?,?,?,?)').run(+movieId, userId, rating, body);
  return getMovie(movieId);
}
function deleteReview(user, id) {
  const r = q().prepare('SELECT * FROM reviews WHERE id = ?').get(+id);
  if (!r) throw new HttpError(404, 'Review not found');
  if (r.user_id !== user.id) throw new HttpError(403, 'You can only delete your own reviews');
  q().prepare('DELETE FROM reviews WHERE id = ?').run(r.id);
  return { ok: true };
}
const myReviews = uid => q().prepare(`SELECT r.id, r.rating, r.body, r.created_at, m.id movie_id, m.title FROM reviews r JOIN movies m ON m.id = r.movie_id
  WHERE r.user_id = ? ORDER BY r.id DESC`).all(uid);

// ---------- auth / profile ----------
function signup(b) {
  const email = String(b.email || '').trim().toLowerCase(), name = String(b.name || '').trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new HttpError(400, 'Enter a valid email');
  if (!name) throw new HttpError(400, 'Name is required');
  if (String(b.password || '').length < 6) throw new HttpError(400, 'Password must be at least 6 characters');
  if (!['viewer', 'director', 'producer'].includes(b.role)) throw new HttpError(400, 'Select your role');
  if (q().prepare('SELECT id FROM users WHERE email = ?').get(email)) throw new HttpError(409, 'An account with this email already exists');
  const r = q().prepare('INSERT INTO users(name,email,password_hash,role) VALUES (?,?,?,?)').run(name, email, hashPassword(b.password), b.role);
  const u = q().prepare('SELECT * FROM users WHERE id = ?').get(Number(r.lastInsertRowid));
  return { token: makeToken(u), user: publicUser(u) };
}
function login(b) {
  const u = q().prepare('SELECT * FROM users WHERE email = ?').get(String(b.email || '').trim().toLowerCase());
  if (!u || !verifyPassword(String(b.password || ''), u.password_hash)) throw new HttpError(401, 'Incorrect email or password');
  if (b.role && b.role !== u.role) throw new HttpError(403, `This account is registered as a ${u.role}`);
  return { token: makeToken(u), user: publicUser(u) };
}
function me(id) {
  const u = q().prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!u) throw new HttpError(401, 'Account no longer exists');
  return publicUser(u);
}
function updateProfile(id, b) {
  const name = String(b.name || '').trim();
  if (!name) throw new HttpError(400, 'Name is required');
  q().prepare('UPDATE users SET name = ?, bio = ? WHERE id = ?').run(name, String(b.bio || '').slice(0, 300), id);
  return me(id);
}
function changePassword(id, b) {
  const u = q().prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!verifyPassword(String(b.current || ''), u.password_hash)) throw new HttpError(400, 'Current password is incorrect');
  if (String(b.next || '').length < 6) throw new HttpError(400, 'New password must be at least 6 characters');
  q().prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashPassword(b.next), id);
  return { ok: true };
}

// ---------- projects (director / producer) ----------
function estimate(b) { return risk.assess(b); }
function listProjects(uid) { return q().prepare('SELECT * FROM projects WHERE user_id = ? ORDER BY id DESC').all(uid); }
function saveProject(uid, b) {
  const title = String(b.title || '').trim();
  if (!title) throw new HttpError(400, 'Give the project a title');
  const a = risk.assess(b, { skipMonths: true }), x = a.inputs;
  q().prepare(`INSERT INTO projects(user_id,title,genre,language,budget_cr,marketing_cr,release_month,competition,star_power,trailer_sentiment,audience_fit,risk_score,risk_level)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(uid, title, b.genre || 'Drama', b.language || 'Telugu', x.budget_cr, x.marketing_cr, x.release_month, x.competition, x.star_power,
    x.trailer_sentiment, x.audience_fit, a.score, a.level);
  return listProjects(uid);
}
function deleteProject(uid, id) {
  const r = q().prepare('DELETE FROM projects WHERE id = ? AND user_id = ?').run(+id, uid);
  if (!r.changes) throw new HttpError(404, 'Project not found');
  return listProjects(uid);
}

// ---------- analytics ----------
function groupBy(list, key) { const g = {}; for (const x of list) (g[x[key]] ||= []).push(x); return g; }
const outcomeCounts = l => ({ Hit: l.filter(m => m.outcome === 'Hit').length, Average: l.filter(m => m.outcome === 'Average').length, Flop: l.filter(m => m.outcome === 'Flop').length });
const budgetTier = b => (b < 50 ? 'Under ₹50 cr' : b < 150 ? '₹50–150 cr' : b < 300 ? '₹150–300 cr' : '₹300 cr +');
const TIERS = ['Under ₹50 cr', '₹50–150 cr', '₹150–300 cr', '₹300 cr +'];

function publicStats() {
  const l = allMovies();
  return { movies: l.length, reviews: q().prepare('SELECT COUNT(*) n FROM reviews').get().n, invested_cr: Math.round(sum(l.map(m => m.budget_cr))),
    flop_rate: Math.round((l.filter(m => m.outcome === 'Flop').length / l.length) * 100), cult: l.filter(m => m.outcome === 'Flop' && m.audience_score >= 7.4).length };
}

function viewerAnalytics(f = {}) {
  const all = allMovies(), l = filterMovies(all, { genre: f.genre });
  const byGenre = groupBy(l, 'genre');
  return {
    genres: [...new Set(all.map(m => m.genre))].sort(),
    kpis: { movies: l.length, avg_audience: round(avg(l.map(m => m.audience_score)), 2), total_reviews: sum(l.map(m => m.review_count)), hit_rate: l.length ? Math.round((l.filter(m => m.outcome === 'Hit').length / l.length) * 100) : 0 },
    revenueByGenre: Object.entries(byGenre).map(([genre, v]) => ({ genre, revenue: Math.round(sum(v.map(m => m.lifetime_cr))), movies: v.length })).sort((a, b) => b.revenue - a.revenue),
    revenueByBudget: [...l].sort((a, b) => a.budget_cr - b.budget_cr).map(m => ({ title: m.title, budget: m.budget_cr, revenue: m.lifetime_cr, outcome: m.outcome })),
    topRated: [...l].sort((a, b) => b.audience_score - a.audience_score).slice(0, 8).map(m => ({ id: m.id, title: m.title, score: m.audience_score, outcome: m.outcome })),
    hiddenGems: l.filter(m => m.outcome === 'Flop' && m.audience_score >= 7.4).map(m => ({ id: m.id, title: m.title, year: m.year, score: m.audience_score, recovery: m.recovery })),
    recentReviews: q().prepare(`SELECT r.id, r.rating, r.body, r.created_at, u.name, m.id movie_id, m.title FROM reviews r JOIN users u ON u.id=r.user_id
      JOIN movies m ON m.id=r.movie_id ORDER BY r.id DESC LIMIT 5`).all(),
  };
}

function directorAnalytics(uid, f = {}) {
  const all = allMovies(), l = filterMovies(all, { genre: f.genre });
  const byDir = groupBy(l, 'director');
  const genres = [...new Set(all.map(m => m.genre))].sort();
  const dirs = Object.entries(byDir).map(([director, v]) => ({ director, films: v.length, popularity: round(avg(v.map(m => m.audience_score)), 2),
    recovery: round(avg(v.map(m => m.recovery)), 2), hits: v.filter(m => m.outcome === 'Hit').length }));
  const directorGenre = Object.entries(byDir).filter(([, v]) => v.length >= 1).map(([director, v]) => {
    const row = { director }; for (const g of genres) row[g] = v.filter(m => m.genre === g).length; return row;
  }).sort((a, b) => sum(genres.map(g => b[g])) - sum(genres.map(g => a[g]))).slice(0, 10);
  const byG = groupBy(l, 'genre');
  return {
    genres, genreList: genres,
    kpis: { directors: dirs.length, avg_audience: round(avg(l.map(m => m.audience_score)), 2), best_recovery: dirs.length ? [...dirs].sort((a, b) => b.recovery - a.recovery)[0].director : '-', films: l.length },
    directorGenre, directorPopularity: [...dirs].sort((a, b) => b.popularity - a.popularity).slice(0, 12),
    genreFlopRate: Object.entries(byG).map(([genre, v]) => ({ genre, flop: Math.round((v.filter(m => m.outcome === 'Flop').length / v.length) * 100), films: v.length })).sort((a, b) => b.flop - a.flop),
    budgetTier: TIERS.map(t => ({ tier: t, ...outcomeCounts(l.filter(m => budgetTier(m.budget_cr) === t)) })),
    fitVsOpening: l.map(m => ({ title: m.title, fit: m.audience_score, drop: m.wom_drop_pct, outcome: m.outcome })),
    projects: listProjects(uid),
  };
}

function producerAnalytics(uid, f = {}) {
  const all = allMovies(), l = filterMovies(all, { genre: f.genre });
  const invested = sum(l.map(m => m.budget_cr)), returned = sum(l.map(m => m.lifetime_cr));
  const byRisk = ['Low', 'Medium', 'High'].map(level => ({ level, count: l.filter(m => m.risk_level === level).length, invested: Math.round(sum(l.filter(m => m.risk_level === level).map(m => m.budget_cr))) }));
  return {
    genres: [...new Set(all.map(m => m.genre))].sort(),
    kpis: { invested_cr: Math.round(invested), returned_cr: Math.round(returned), recovery: invested ? round(returned / invested, 2) : 0, flop_rate: l.length ? Math.round((l.filter(m => m.outcome === 'Flop').length / l.length) * 100) : 0 },
    riskDistribution: byRisk,
    recoveryByTier: TIERS.map(t => { const v = l.filter(m => budgetTier(m.budget_cr) === t); return { tier: t, recovery: round(v.length ? sum(v.map(m => m.lifetime_cr)) / sum(v.map(m => m.budget_cr)) : 0, 2), films: v.length }; }),
    frontLoading: [...l].sort((a, b) => b.opening_share - a.opening_share).slice(0, 10).map(m => ({ title: m.title, opening_share: m.opening_share, drop: m.wom_drop_pct, outcome: m.outcome })),
    marketingVsRecovery: l.filter(m => m.marketing_cr > 0).map(m => ({ title: m.title, marketing: round((m.marketing_cr / m.budget_cr) * 100, 1), recovery: m.recovery, outcome: m.outcome })),
    monthRisk: risk.MONTHS.map((month, i) => { const v = l.filter(m => m.release_month === i + 1); return { month, avg_risk: v.length ? Math.round(avg(v.map(m => m.risk_score))) : null, avg_recovery: v.length ? round(avg(v.map(m => m.recovery)), 2) : null, films: v.length }; }),
    watchlist: [...l].filter(m => m.risk_level === 'High').sort((a, b) => b.risk_score - a.risk_score).slice(0, 6).map(m => ({ id: m.id, title: m.title, score: m.risk_score, budget: m.budget_cr, outcome: m.outcome })),
    projects: listProjects(uid),
  };
}

function insights() {
  const l = allMovies();
  const cross = ['Low', 'Medium', 'High'].map(level => ({ level, ...outcomeCounts(l.filter(m => m.risk_level === level)) }));
  const flopsHighRisk = l.filter(m => m.outcome === 'Flop' && m.risk_level === 'High').length, flops = l.filter(m => m.outcome === 'Flop').length;
  return {
    total: l.length,
    investmentVsOutcome: l.map(m => ({ title: m.title, budget: m.budget_cr, recovery: m.recovery, outcome: m.outcome, star: m.star_power })),
    expectationVsExperience: l.map(m => ({ title: m.title, expectation: m.star_power * 10, experience: Math.round(m.audience_score * 10), outcome: m.outcome })),
    lateSuccess: l.filter(m => m.outcome === 'Flop' && m.audience_score >= 7.4).map(m => ({ id: m.id, title: m.title, year: m.year, score: m.audience_score, recovery: m.recovery })),
    frontLoaded: [...l].filter(m => m.opening_share >= 20).sort((a, b) => b.wom_drop_pct - a.wom_drop_pct).slice(0, 6).map(m => ({ id: m.id, title: m.title, opening_share: m.opening_share, drop: m.wom_drop_pct, outcome: m.outcome })),
    backtest: { rows: cross, flops, flopsFlaggedHigh: flopsHighRisk, hitsFlaggedHigh: l.filter(m => m.outcome === 'Hit' && m.risk_level === 'High').length },
    genreOutcome: Object.entries(groupBy(l, 'genre')).map(([genre, v]) => ({ genre, ...outcomeCounts(v) })),
  };
}

module.exports = { publicStats, listMovies, filtersMeta, getMovie, compare, addMovie, addReview, deleteReview, myReviews, signup, login, me, updateProfile,
  changePassword, estimate, listProjects, saveProject, deleteProject, viewerAnalytics, directorAnalytics, producerAnalytics, insights };
